import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

type Driver = {
  id: string;
  name: string;
  phone: string;
  additionalPhone: string;
  vehicleType: string;
  leaseAmount: string;
  notes: string;
};

type Payment = {
  id: string;
  driverId: string;
  driverName: string;
  date: string;
  downPayment: number;
  paidAmount: number;
  notes: string;
};

type LeaseSchedule = {
  id: string;
  driverId: string;
  driverName: string;
  month: string;
  year: string;
  amountPerPayment: number;
  payment1: string;
  payment2: string;
  payment3: string;
  payment4: string;
  payment5: string;
};

export default function Index() {
  const [activeSection, setActiveSection] = useState('overview');
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [schedules, setSchedules] = useState<LeaseSchedule[]>([]);
  const [isDriverDialogOpen, setIsDriverDialogOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [theme, setTheme] = useState('light');
  const [selectedDriver, setSelectedDriver] = useState('all');
  const [selectedPeriod, setSelectedPeriod] = useState('all');
  const { toast } = useToast();

  useEffect(() => {
    const savedDrivers = localStorage.getItem('drivers');
    const savedPayments = localStorage.getItem('payments');
    const savedSchedules = localStorage.getItem('schedules');
    if (savedDrivers) setDrivers(JSON.parse(savedDrivers));
    if (savedPayments) setPayments(JSON.parse(savedPayments));
    if (savedSchedules) setSchedules(JSON.parse(savedSchedules));
  }, []);

  const saveDrivers = (newDrivers: Driver[]) => {
    setDrivers(newDrivers);
    localStorage.setItem('drivers', JSON.stringify(newDrivers));
  };

  const savePayments = (newPayments: Payment[]) => {
    setPayments(newPayments);
    localStorage.setItem('payments', JSON.stringify(newPayments));
  };

  const saveSchedules = (newSchedules: LeaseSchedule[]) => {
    setSchedules(newSchedules);
    localStorage.setItem('schedules', JSON.stringify(newSchedules));
  };

  const handleAddDriver = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newDriver: Driver = {
      id: Date.now().toString(),
      name: formData.get('name') as string,
      phone: formData.get('phone') as string,
      additionalPhone: formData.get('additionalPhone') as string,
      vehicleType: formData.get('vehicleType') as string,
      leaseAmount: formData.get('leaseAmount') as string,
      notes: formData.get('notes') as string,
    };
    saveDrivers([...drivers, newDriver]);
    setIsDriverDialogOpen(false);
    toast({ title: 'Водитель добавлен' });
  };

  const handleAddPayment = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const driverId = formData.get('driverId') as string;
    const driver = drivers.find(d => d.id === driverId);
    const newPayment: Payment = {
      id: Date.now().toString(),
      driverId,
      driverName: driver?.name || '',
      date: formData.get('date') as string,
      downPayment: Number(formData.get('downPayment')) || 0,
      paidAmount: Number(formData.get('paidAmount')) || 0,
      notes: formData.get('notes') as string,
    };
    savePayments([...payments, newPayment]);
    setIsPaymentDialogOpen(false);
    toast({ title: 'Платёж добавлен' });
  };

  const handleAddSchedule = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const driverId = formData.get('driverId') as string;
    const driver = drivers.find(d => d.id === driverId);
    const newSchedule: LeaseSchedule = {
      id: Date.now().toString(),
      driverId,
      driverName: driver?.name || '',
      month: formData.get('month') as string,
      year: formData.get('year') as string,
      amountPerPayment: Number(formData.get('amountPerPayment')) || 0,
      payment1: formData.get('payment1') as string,
      payment2: formData.get('payment2') as string,
      payment3: formData.get('payment3') as string,
      payment4: formData.get('payment4') as string,
      payment5: formData.get('payment5') as string,
    };
    saveSchedules([...schedules, newSchedule]);
    setIsScheduleDialogOpen(false);
    toast({ title: 'График создан' });
  };

  const totalPaid = payments.reduce((sum, p) => sum + p.paidAmount, 0);
  const totalOverdue = 0;
  const totalPrepaid = 0;

  const statsData = [
    { label: 'К оплате', value: `${totalPaid.toLocaleString('ru')} ₽`, color: 'text-orange-500' },
    { label: 'Оплачено', value: `${totalPaid.toLocaleString('ru')} ₽`, color: 'text-green-500' },
    { label: 'Задолженность', value: `${totalOverdue.toLocaleString('ru')} ₽`, color: 'text-red-500' },
    { label: 'Переплата', value: `${totalPrepaid.toLocaleString('ru')} ₽`, color: 'text-green-500' },
  ];

  const chartData = useMemo(() => {
    const filteredPayments = payments.filter(p => 
      selectedDriver === 'all' || p.driverId === selectedDriver
    );

    const monthlyData: { [key: string]: { month: string; paid: number; due: number; overdue: number; prepaid: number } } = {};

    filteredPayments.forEach(payment => {
      const date = new Date(payment.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          month: monthKey,
          paid: 0,
          due: 0,
          overdue: 0,
          prepaid: 0,
        };
      }

      monthlyData[monthKey].paid += payment.paidAmount;
      monthlyData[monthKey].due += payment.downPayment;

      const diff = payment.paidAmount - payment.downPayment;
      if (diff < 0) {
        monthlyData[monthKey].overdue += Math.abs(diff);
      } else if (diff > 0) {
        monthlyData[monthKey].prepaid += diff;
      }
    });

    return Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month));
  }, [payments, selectedDriver]);

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'dark bg-background' : 'bg-gray-50'}`}>
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Icon name="Truck" className="text-orange-500" size={32} />
          <h1 className="text-xl font-semibold text-gray-900">ЛИЗИНГОВЫЙ УЧЁТ</h1>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          >
            <Icon name="Moon" size={20} />
          </Button>
          <Button variant="default" className="bg-blue-600 hover:bg-blue-700">
            <Icon name="Download" size={16} className="mr-2" />
            Экспорт
          </Button>
          <Button variant="default" className="bg-green-600 hover:bg-green-700">
            <Icon name="Upload" size={16} className="mr-2" />
            Импорт
          </Button>
          <span className="text-sm text-gray-700">Сергей</span>
          <Button variant="destructive">
            <Icon name="LogOut" size={16} className="mr-2" />
            Выход
          </Button>
        </div>
      </header>

      <div className="flex">
        <aside className="w-64 bg-white border-r border-gray-200 min-h-screen p-4">
          <nav className="space-y-2">
            {[
              { id: 'overview', label: 'Обзор', icon: 'LayoutGrid' },
              { id: 'drivers', label: 'Водители', icon: 'Users' },
              { id: 'payments', label: 'Платежи', icon: 'DollarSign' },
              { id: 'routes', label: 'Маршруты', icon: 'MapPin' },
              { id: 'schedule', label: 'График лизинга', icon: 'Calendar' },
              { id: 'stats', label: 'Статистика', icon: 'PieChart' },
              { id: 'trash', label: 'Корзина', icon: 'Trash2' },
              { id: 'archive', label: 'Архив', icon: 'Archive' },
            ].map(item => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  activeSection === item.id
                    ? 'bg-orange-500 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon name={item.icon as any} size={20} />
                <span className="text-sm font-medium">{item.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        <main className="flex-1 p-8">
          {activeSection === 'overview' && (
            <div>
              <h2 className="text-3xl font-semibold mb-8 text-gray-900">Обзор</h2>
              <div className="grid grid-cols-4 gap-6">
                {[
                  { icon: 'Users', color: 'text-orange-500', value: drivers.length, label: 'Водителей' },
                  { icon: 'DollarSign', color: 'text-green-500', value: totalPaid, label: 'Оплачено полностью', format: true },
                  { icon: 'AlertCircle', color: 'text-red-500', value: totalOverdue, label: 'Просрочено' },
                  { icon: 'MapPin', color: 'text-blue-500', value: 0, label: 'Маршрутов' },
                ].map((stat, idx) => (
                  <Card key={idx} className="p-6 bg-white">
                    <Icon name={stat.icon as any} className={stat.color} size={40} />
                    <div className="text-4xl font-bold mt-4 text-gray-900">
                      {stat.format ? `${stat.value.toLocaleString('ru')} ₽` : stat.value}
                    </div>
                    <div className="text-sm text-gray-600 mt-2">{stat.label}</div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {activeSection === 'drivers' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-semibold text-gray-900">Водители</h2>
                <Dialog open={isDriverDialogOpen} onOpenChange={setIsDriverDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-orange-500 hover:bg-orange-600">
                      <Icon name="Plus" size={16} className="mr-2" />
                      Добавить водителя
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Новый водитель</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAddDriver} className="space-y-4">
                      <div>
                        <Label>ФИО</Label>
                        <Input name="name" required />
                      </div>
                      <div>
                        <Label>Основной телефон</Label>
                        <Input name="phone" type="tel" />
                      </div>
                      <div>
                        <Label>Доп. телефон</Label>
                        <Input name="additionalPhone" type="tel" />
                      </div>
                      <div>
                        <Label>Тип ТС</Label>
                        <Select name="vehicleType">
                          <SelectTrigger>
                            <SelectValue placeholder="— Выберите —" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Тягач">Тягач</SelectItem>
                            <SelectItem value="Прицеп">Прицеп</SelectItem>
                            <SelectItem value="Сцепка">Сцепка</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Сумма договора лизинга</Label>
                        <Input name="leaseAmount" type="number" />
                      </div>
                      <div>
                        <Label>Примечания</Label>
                        <Textarea name="notes" rows={3} />
                      </div>
                      <div className="flex gap-3">
                        <Button type="button" variant="outline" onClick={() => setIsDriverDialogOpen(false)} className="flex-1">
                          Отмена
                        </Button>
                        <Button type="submit" className="flex-1 bg-orange-500 hover:bg-orange-600">
                          Сохранить
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
              <div className="grid gap-4">
                {drivers.map(driver => (
                  <Card key={driver.id} className="p-4 bg-white">
                    <div className="flex justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">{driver.name}</h3>
                        <p className="text-sm text-gray-600">{driver.phone}</p>
                        <p className="text-sm text-gray-600">{driver.vehicleType}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">{driver.leaseAmount} ₽</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {activeSection === 'payments' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-semibold text-gray-900">Платежи</h2>
                <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-orange-500 hover:bg-orange-600">
                      <Icon name="Plus" size={16} className="mr-2" />
                      Добавить платёж
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Новый платёж</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAddPayment} className="space-y-4">
                      <div>
                        <Label>Водитель</Label>
                        <Select name="driverId" required>
                          <SelectTrigger>
                            <SelectValue placeholder="— Выберите —" />
                          </SelectTrigger>
                          <SelectContent>
                            {drivers.map(driver => (
                              <SelectItem key={driver.id} value={driver.id}>
                                {driver.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Дата платежа</Label>
                        <Input name="date" type="date" required />
                      </div>
                      <div>
                        <Label>Сумма к оплате</Label>
                        <Input name="downPayment" type="number" defaultValue={0} />
                      </div>
                      <div>
                        <Label>Оплачено</Label>
                        <Input name="paidAmount" type="number" defaultValue={0} />
                      </div>
                      <div>
                        <Label>Примечания</Label>
                        <Textarea name="notes" rows={3} />
                      </div>
                      <div className="flex gap-3">
                        <Button type="button" variant="outline" onClick={() => setIsPaymentDialogOpen(false)} className="flex-1">
                          Отмена
                        </Button>
                        <Button type="submit" className="flex-1 bg-orange-500 hover:bg-orange-600">
                          Сохранить
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
              <div className="grid gap-4">
                {payments.map(payment => (
                  <Card key={payment.id} className="p-4 bg-white">
                    <div className="flex justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">{payment.driverName}</h3>
                        <p className="text-sm text-gray-600">{payment.date}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-green-600">{payment.paidAmount.toLocaleString('ru')} ₽</p>
                        <p className="text-sm text-gray-600">К оплате: {payment.downPayment.toLocaleString('ru')} ₽</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {activeSection === 'schedule' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-semibold text-gray-900">График лизинга</h2>
                <Dialog open={isScheduleDialogOpen} onOpenChange={setIsScheduleDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-orange-500 hover:bg-orange-600">
                      <Icon name="Plus" size={16} className="mr-2" />
                      Добавить график на месяц
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Новый график платежей</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAddSchedule} className="space-y-4">
                      <div>
                        <Label>Водитель</Label>
                        <Select name="driverId" required>
                          <SelectTrigger>
                            <SelectValue placeholder="— Выберите —" />
                          </SelectTrigger>
                          <SelectContent>
                            {drivers.map(driver => (
                              <SelectItem key={driver.id} value={driver.id}>
                                {driver.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Месяц (1-12)</Label>
                        <Input name="month" type="number" min="1" max="12" required />
                      </div>
                      <div>
                        <Label>Год</Label>
                        <Input name="year" type="number" defaultValue={2026} required />
                      </div>
                      <div>
                        <Label>Сумма на один платёж</Label>
                        <Input name="amountPerPayment" type="number" />
                      </div>
                      <div>
                        <Label>Дата платежа 1</Label>
                        <Input name="payment1" type="date" />
                      </div>
                      <div>
                        <Label>Дата платежа 2</Label>
                        <Input name="payment2" type="date" />
                      </div>
                      <div>
                        <Label>Дата платежа 3</Label>
                        <Input name="payment3" type="date" />
                      </div>
                      <div>
                        <Label>Дата платежа 4</Label>
                        <Input name="payment4" type="date" />
                      </div>
                      <div>
                        <Label>Дата платежа 5</Label>
                        <Input name="payment5" type="date" />
                      </div>
                      <div className="flex gap-3">
                        <Button type="button" variant="outline" onClick={() => setIsScheduleDialogOpen(false)} className="flex-1">
                          Отмена
                        </Button>
                        <Button type="submit" className="flex-1 bg-orange-500 hover:bg-orange-600">
                          Сохранить
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
              <div className="grid gap-4">
                {schedules.map(schedule => (
                  <Card key={schedule.id} className="p-4 bg-white">
                    <h3 className="font-semibold text-gray-900 mb-2">{schedule.driverName}</h3>
                    <p className="text-sm text-gray-600">Месяц {schedule.month}, {schedule.year}</p>
                    <p className="text-sm text-gray-600">Сумма платежа: {schedule.amountPerPayment.toLocaleString('ru')} ₽</p>
                    <div className="mt-2 text-xs text-gray-500 space-y-1">
                      {schedule.payment1 && <p>Платёж 1: {schedule.payment1}</p>}
                      {schedule.payment2 && <p>Платёж 2: {schedule.payment2}</p>}
                      {schedule.payment3 && <p>Платёж 3: {schedule.payment3}</p>}
                      {schedule.payment4 && <p>Платёж 4: {schedule.payment4}</p>}
                      {schedule.payment5 && <p>Платёж 5: {schedule.payment5}</p>}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {activeSection === 'stats' && (
            <div>
              <h2 className="text-3xl font-semibold mb-6 text-gray-900">Статистика</h2>
              <Card className="p-6 bg-white mb-6">
                <div className="flex gap-4 mb-6">
                  <div className="flex-1">
                    <Label>Водитель</Label>
                    <Select value={selectedDriver} onValueChange={setSelectedDriver}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Все водители</SelectItem>
                        {drivers.map(driver => (
                          <SelectItem key={driver.id} value={driver.id}>
                            {driver.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1">
                    <Label>Период</Label>
                    <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Все время</SelectItem>
                        <SelectItem value="month">Месяц</SelectItem>
                        <SelectItem value="quarter">Квартал</SelectItem>
                        <SelectItem value="year">Год</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <Button className="bg-orange-500 hover:bg-orange-600">Обновить</Button>
                  </div>
                </div>
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="month" stroke="#6b7280" />
                      <YAxis stroke="#6b7280" />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                        formatter={(value: number) => `${value.toLocaleString('ru')} ₽`}
                      />
                      <Legend />
                      <Bar dataKey="paid" name="Оплачено" fill="#10b981" />
                      <Bar dataKey="due" name="К оплате" fill="#f97316" />
                      <Bar dataKey="overdue" name="Задолженность" fill="#ef4444" />
                      <Bar dataKey="prepaid" name="Переплата" fill="#22c55e" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center border border-gray-200">
                    <p className="text-gray-400 text-sm">Нет данных для отображения. Добавьте платежи.</p>
                  </div>
                )}
              </Card>
              <div className="grid grid-cols-4 gap-6">
                {statsData.map((stat, idx) => (
                  <Card key={idx} className="p-6 bg-white">
                    <div className="text-sm text-gray-600 mb-2">{stat.label}</div>
                    <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {activeSection === 'routes' && (
            <div>
              <h2 className="text-3xl font-semibold mb-6 text-gray-900">Маршруты</h2>
              <Card className="p-8 bg-white text-center">
                <Icon name="MapPin" className="mx-auto text-gray-400 mb-4" size={48} />
                <p className="text-gray-600">Раздел в разработке</p>
              </Card>
            </div>
          )}

          {activeSection === 'trash' && (
            <div>
              <h2 className="text-3xl font-semibold mb-6 text-gray-900">Корзина</h2>
              <Card className="p-8 bg-white text-center">
                <Icon name="Trash2" className="mx-auto text-gray-400 mb-4" size={48} />
                <p className="text-gray-600">Корзина пуста</p>
              </Card>
            </div>
          )}

          {activeSection === 'archive' && (
            <div>
              <h2 className="text-3xl font-semibold mb-6 text-gray-900">Архив</h2>
              <Card className="p-8 bg-white text-center">
                <Icon name="Archive" className="mx-auto text-gray-400 mb-4" size={48} />
                <p className="text-gray-600">Архив пуст</p>
              </Card>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}