import { useMemo, useState } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { Link, Route, Router as WouterRouter, Switch as RouterSwitch, useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import {
  Activity, ArrowDownLeft, ArrowRight, ArrowUpRight, Banknote, Bell, Check, ChevronDown,
  CircleAlert, Clock3, Coffee, CreditCard, CupSoda, Gift, LayoutGrid, LogOut, Minus, Plus,
  Search, Settings2, ShieldCheck, ShoppingBag, ShoppingCart, SlidersHorizontal, Sparkles,
  Users, Wallet, Webhook, X, RotateCcw, Pencil, Package, UserRound, RefreshCw, CheckCircle2,
  ChevronRight, CircleDollarSign, LockKeyhole,
} from 'lucide-react';
import {
  useHealthCheck, useGetSetupStatus, useGetStaffOptions, useSetupAdministrator,
  useLoginEmployee, useGetCurrentSession, useLogoutEmployee, useListEmployees,
  useCreateEmployee, useUpdateEmployee, useListProducts, useCreateProduct,
  useUpdateProduct, useListModifiers, useCreateModifier, useUpdateModifier,
  useListCustomers, useCreateCustomer, useUpdateCustomer, useListOrders,
  useCreateOrder, useRefundOrder, useGetDashboard, useGetAutomationStatus,
  useListAutomationEvents, useRetryAutomationEvent, getGetSetupStatusQueryKey,
  getGetStaffOptionsQueryKey, getGetCurrentSessionQueryKey, getListEmployeesQueryKey,
  getListProductsQueryKey, getListModifiersQueryKey, getListCustomersQueryKey,
  getListOrdersQueryKey, getGetDashboardQueryKey, getGetAutomationStatusQueryKey,
  getListAutomationEventsQueryKey,
} from '@workspace/api-client-react';
import type {
  Employee, Product, Modifier, Customer, Order, ProductCategory, PaymentMethod,
} from '@workspace/api-client-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import NotFound from '@/pages/not-found';

const queryClient = new QueryClient();
const money = (value = 0) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
const shortDate = (value: string) => new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(value));
const initials = (name = '') => name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase();

function Notice({ children, tone = 'error' }: { children: string; tone?: 'error' | 'success' | 'info' }) {
  const styles = tone === 'error' ? 'border-rose-200 bg-rose-50 text-rose-800' : tone === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-border bg-card text-muted-foreground';
  return <div data-testid="status-notice" className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm ${styles}`}><CircleAlert className="h-4 w-4 shrink-0" />{children}</div>;
}

function LoadingRows({ count = 4 }: { count?: number }) {
  return <div className="space-y-3" aria-label="Loading"><div className="h-4 w-28 animate-pulse rounded bg-muted" />{Array.from({ length: count }, (_, i) => <div key={i} className="h-14 animate-pulse rounded-xl bg-muted/70" />)}</div>;
}

function EmptyState({ title, detail, icon: Icon = Coffee }: { title: string; detail: string; icon?: typeof Coffee }) {
  return <div data-testid="empty-state" className="flex min-h-48 flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 px-5 text-center"><div className="mb-3 grid h-11 w-11 place-items-center rounded-full bg-accent text-primary"><Icon className="h-5 w-5" /></div><p className="font-semibold">{title}</p><p className="mt-1 max-w-sm text-sm text-muted-foreground">{detail}</p></div>;
}

function Modal({ title, subtitle, onClose, children, wide = false }: { title: string; subtitle?: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  return <div className="fixed inset-0 z-[60] flex items-end justify-center bg-foreground/35 p-0 backdrop-blur-[3px] sm:items-center sm:p-5" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section role="dialog" aria-modal="true" className={`page-enter w-full ${wide ? 'max-w-2xl' : 'max-w-lg'} rounded-t-3xl border border-border bg-card p-5 shadow-2xl sm:rounded-3xl sm:p-7`}>
      <div className="mb-6 flex items-start justify-between gap-4"><div><h2 className="display text-2xl font-semibold">{title}</h2>{subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}</div><Button data-testid="button-close-dialog" variant="ghost" size="icon" onClick={onClose} aria-label="Close dialog"><X className="h-4 w-4" /></Button></div>
      {children}
    </section>
  </div>;
}

function FormInput({ id, label, type = 'text', placeholder, value, onChange, required = false, min, max, step }: {
  id: string; label: string; type?: string; placeholder?: string; value: string | number;
  onChange: (value: string) => void; required?: boolean; min?: string; max?: string; step?: string;
}) {
  return <div className="space-y-2"><Label htmlFor={id}>{label}</Label><Input id={id} data-testid={`input-${id}`} type={type} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} required={required} min={min} max={max} step={step} /></div>;
}

function AuthScreen({ needsSetup }: { needsSetup: boolean }) {
  const qc = useQueryClient();
  const staffQuery = useGetStaffOptions();
  const setup = useSetupAdministrator();
  const login = useLoginEmployee();
  const [staffId, setStaffId] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const form = useForm<{ fullName: string; posPin: string }>({ defaultValues: { fullName: '', posPin: '' } });
  const refreshSession = () => {
    qc.invalidateQueries({ queryKey: getGetCurrentSessionQueryKey() });
    qc.invalidateQueries({ queryKey: getGetSetupStatusQueryKey() });
    qc.invalidateQueries({ queryKey: getGetStaffOptionsQueryKey() });
  };
  const submitSetup = (values: { fullName: string; posPin: string }) => {
    setError('');
    setup.mutate({ data: values }, { onSuccess: refreshSession, onError: () => setError('We could not create the administrator. Check the details and try again.') });
  };
  const submitLogin = (event: React.FormEvent) => {
    event.preventDefault(); setError('');
    if (!staffId || pin.length !== 4) { setError('Choose your name and enter your four-digit PIN.'); return; }
    login.mutate({ data: { employeeId: staffId, posPin: pin } }, { onSuccess: refreshSession, onError: () => setError('That PIN did not match. Please try again.') });
  };
  return <main className="noise app-shell flex min-h-[100dvh] items-center justify-center px-4 py-10">
    <div className="grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-border bg-card shadow-xl md:grid-cols-[.92fr_1.08fr]">
      <aside className="relative hidden min-h-[560px] flex-col justify-between overflow-hidden bg-sidebar p-10 text-sidebar-foreground md:flex">
        <div className="absolute -right-20 -top-24 h-80 w-80 rounded-full border border-sidebar-foreground/10" /><div className="absolute -right-7 -top-12 h-56 w-56 rounded-full border border-sidebar-foreground/10" />
        <Brand compact />
        <div className="relative"><span className="mono text-xs uppercase tracking-[.22em] text-sidebar-primary">Good service starts here</span><h1 className="display mt-5 max-w-sm text-5xl leading-[1.05]">A calmer way to run the counter.</h1><p className="mt-5 max-w-xs text-sm leading-6 text-sidebar-foreground/70">Your neighborhood café, one thoughtful order at a time.</p></div>
        <div className="flex items-center gap-2 text-xs text-sidebar-foreground/60"><span className="h-2 w-2 rounded-full bg-sidebar-primary" /> A little ritual, made reliable.</div>
      </aside>
      <section className="flex min-h-[560px] flex-col justify-center p-6 sm:p-10 md:p-12">
        <div className="mb-8 md:hidden"><Brand compact /></div>
        <div className="mb-8"><p className="mono text-[11px] uppercase tracking-[.18em] text-muted-foreground">{needsSetup ? 'First things first' : 'Welcome back'}</p><h2 className="display mt-2 text-3xl font-semibold">{needsSetup ? 'Set up your café' : 'Clock in, and get brewing.'}</h2><p className="mt-2 text-sm text-muted-foreground">{needsSetup ? 'Create the first administrator account to get started.' : 'Select your name and enter your staff PIN.'}</p></div>
        {error && <div className="mb-5"><Notice>{error}</Notice></div>}
        {needsSetup ? <Form {...form}><form onSubmit={form.handleSubmit(submitSetup)} className="space-y-5">
          <FormField control={form.control} name="fullName" rules={{ required: 'Enter your name.' }} render={({ field }) => <FormItem><FormLabel>Your name</FormLabel><FormControl><Input data-testid="input-admin-name" placeholder="e.g. Morgan Lee" autoComplete="name" {...field} /></FormControl><FormMessage /></FormItem>} />
          <FormField control={form.control} name="posPin" rules={{ required: 'Choose a four-digit PIN.', pattern: { value: /^\d{4}$/, message: 'PIN must be exactly four digits.' } }} render={({ field }) => <FormItem><FormLabel>Administrator PIN</FormLabel><FormControl><Input data-testid="input-admin-pin" type="password" inputMode="numeric" maxLength={4} placeholder="••••" {...field} /></FormControl><FormMessage /></FormItem>} />
          <Button data-testid="button-create-admin" className="h-12 w-full" disabled={setup.isPending}>{setup.isPending ? 'Setting up…' : <>Create administrator <ArrowRight className="ml-2 h-4 w-4" /></>}</Button>
        </form></Form> : <form onSubmit={submitLogin} className="space-y-5">
          <div className="space-y-2"><Label htmlFor="employee">Team member</Label><div className="relative"><select id="employee" data-testid="select-employee" className="h-11 w-full appearance-none rounded-xl border border-input bg-background px-3 pr-9 text-sm outline-none focus:ring-2 focus:ring-ring" value={staffId} onChange={(e) => setStaffId(e.target.value)} required><option value="">Select your name</option>{(staffQuery.data ?? []).map((person) => <option key={person.id} value={person.id}>{person.fullName}</option>)}</select><ChevronDown className="pointer-events-none absolute right-3 top-3 h-4 w-4 text-muted-foreground" /></div>{staffQuery.isLoading && <span className="text-xs text-muted-foreground">Loading team…</span>}{staffQuery.isError && <span className="text-xs text-destructive">Unable to load the team. Refresh to try again.</span>}</div>
          <FormInput id="staff-pin" label="Four-digit PIN" type="password" placeholder="••••" value={pin} onChange={(value) => setPin(value.replace(/\D/g, '').slice(0, 4))} required />
          <Button data-testid="button-sign-in" className="h-12 w-full" type="submit" disabled={login.isPending || staffQuery.isLoading}>{login.isPending ? 'Signing in…' : <>Sign in to the counter <ArrowRight className="ml-2 h-4 w-4" /></>}</Button>
          {staffQuery.data?.length === 0 && !staffQuery.isLoading && <Notice tone="info">No active team members are available. Ask an administrator to check the team.</Notice>}
        </form>}
        <p className="mt-8 text-xs text-muted-foreground">Secure staff access · Café POS</p>
      </section>
    </div>
  </main>;
}

function Brand({ compact = false }: { compact?: boolean }) {
  return <div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-2xl bg-sidebar-primary text-sidebar-primary-foreground"><CupSoda className="h-5 w-5" /></div><div><div className={`display text-xl font-semibold leading-none ${compact ? '' : ''}`}>Daybreak</div><div className="mono mt-1 text-[9px] uppercase tracking-[.2em] opacity-60">Café counter</div></div></div>;
}

const navItems = [
  { href: '/', label: 'Checkout', icon: ShoppingCart },
  { href: '/orders', label: 'Orders', icon: ReceiptIcon },
  { href: '/customers', label: 'Customers', icon: Users },
  { href: '/catalog', label: 'Catalog', icon: Package },
  { href: '/team', label: 'Team', icon: UserRound, admin: true },
  { href: '/automation', label: 'Automation', icon: Webhook, admin: true },
];
function ReceiptIcon(props: React.ComponentProps<typeof ShoppingBag>) { return <ShoppingBag {...props} />; }

function Shell({ children, session }: { children: React.ReactNode; session: { id: string; fullName: string; role: string } }) {
  const [, setLocation] = useLocation();
  const qc = useQueryClient();
  const logout = useLogoutEmployee();
  const health = useHealthCheck();
  const logoutNow = () => logout.mutate(undefined, { onSuccess: () => { qc.setQueryData(getGetCurrentSessionQueryKey(), null); setLocation('/'); } });
  return <div className="noise app-shell min-h-[100dvh] text-foreground">
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[248px] flex-col border-r border-sidebar-border bg-sidebar px-4 py-6 text-sidebar-foreground lg:flex">
      <div className="px-2"><Brand /></div>
      <div className="mb-3 mt-11 px-3 mono text-[10px] uppercase tracking-[.2em] text-sidebar-foreground/45">Workspace</div>
      <nav className="space-y-1">{navItems.filter((item) => !item.admin || session.role === 'Admin').map(({ href, label, icon: Icon }) => <Link key={href} href={href} data-testid={`link-nav-${label.toLowerCase()}`} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${window.location.pathname === href ? 'bg-sidebar-accent text-sidebar-accent-foreground font-semibold' : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/80 hover:text-sidebar-foreground'}`}><Icon className="h-[17px] w-[17px]" />{label}{href === '/' && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-sidebar-primary" />}</Link>)}</nav>
      <div className="mt-auto">
        <div className="mb-4 rounded-2xl border border-sidebar-border bg-sidebar-accent/60 p-4"><div className="flex items-center gap-2 text-xs font-semibold"><span className={`h-2 w-2 rounded-full ${health.isError ? 'bg-rose-400' : 'bg-emerald-400'}`} />{health.isError ? 'Connection issue' : 'System ready'}</div><p className="mt-2 text-xs leading-5 text-sidebar-foreground/55">{health.isError ? 'Check your connection to keep serving.' : 'Sales and team are in sync.'}</p></div>
        <div className="flex items-center gap-3 rounded-2xl px-2 py-2"><div className="grid h-9 w-9 place-items-center rounded-full bg-sidebar-primary/20 text-xs font-semibold text-sidebar-primary">{initials(session.fullName)}</div><div className="min-w-0 flex-1"><div data-testid="text-current-employee" className="truncate text-sm font-medium">{session.fullName}</div><div className="text-xs text-sidebar-foreground/50">{session.role}</div></div><Button data-testid="button-sign-out" size="icon" variant="ghost" className="h-8 w-8 text-sidebar-foreground/60 hover:text-sidebar-foreground" onClick={logoutNow} disabled={logout.isPending} aria-label="Sign out"><LogOut className="h-4 w-4" /></Button></div>
      </div>
    </aside>
    <div className="lg:pl-[248px]">
      <header className="sticky top-0 z-20 flex h-[68px] items-center justify-between border-b border-border/80 bg-background/90 px-4 backdrop-blur-xl sm:px-8">
        <div className="flex items-center gap-2 lg:hidden"><Brand compact /></div><div className="hidden text-sm text-muted-foreground lg:block">A good day to make someone's day.</div>
        <div className="flex items-center gap-3"><span className="hidden items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground sm:flex"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />Service is live</span><div className="grid h-9 w-9 place-items-center rounded-full bg-accent text-xs font-semibold text-accent-foreground lg:hidden">{initials(session.fullName)}</div><Button className="hidden lg:inline-flex" variant="outline" size="sm" onClick={logoutNow} disabled={logout.isPending}><LogOut className="mr-2 h-4 w-4" />Sign out</Button></div>
      </header>
      <main className="mx-auto max-w-[1500px] px-4 py-6 sm:px-8 sm:py-9"><div className="mb-4 flex gap-1 overflow-x-auto pb-2 lg:hidden">{navItems.filter((item) => !item.admin || session.role === 'Admin').map(({ href, label, icon: Icon }) => <Link key={href} href={href} data-testid={`mobile-nav-${label.toLowerCase()}`} className={`flex shrink-0 items-center gap-2 rounded-full px-3 py-2 text-xs ${window.location.pathname === href ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground'}`}><Icon className="h-3.5 w-3.5" />{label}</Link>)}</div>{children}</main>
    </div>
  </div>;
}

function PageHeading({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: React.ReactNode }) {
  return <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="mono text-[10px] uppercase tracking-[.2em] text-muted-foreground">{eyebrow}</p><h1 className="display mt-2 text-[2.4rem] font-semibold leading-none sm:text-5xl">{title}</h1><p className="mt-3 max-w-xl text-sm text-muted-foreground">{description}</p></div>{action}</div>;
}

type CartLine = { key: string; product: Product; quantity: number; modifierIds: string[]; note: string };

function Checkout() {
  const qc = useQueryClient();
  const productsQ = useListProducts();
  const modifiersQ = useListModifiers();
  const customersQ = useListCustomers();
  const dashboardQ = useGetDashboard();
  const createOrder = useCreateOrder();
  const products = productsQ.data ?? [];
  const modifiers = modifiersQ.data ?? [];
  const customers = customersQ.data ?? [];
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartLine[]>([]);
  const [customizing, setCustomizing] = useState<Product | null>(null);
  const [pickedModifiers, setPickedModifiers] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [payment, setPayment] = useState<PaymentMethod>('Card');
  const [success, setSuccess] = useState('');
  const [failure, setFailure] = useState('');
  const availableCategories = ['All', 'Beverage', 'Food', 'Retail'];
  const filteredProducts = useMemo(() => products.filter((product) => product.isActive && (category === 'All' || product.category === category) && product.name.toLowerCase().includes(search.toLowerCase())), [products, category, search]);
  const cartTotal = cart.reduce((sum, line) => sum + (line.product.basePrice + line.modifierIds.reduce((m, id) => m + (modifiers.find((mod) => mod.id === id)?.additionalCost ?? 0), 0)) * line.quantity, 0);
  const addCustomized = () => {
    if (!customizing) return;
    setCart((current) => [...current, { key: `${Date.now()}-${Math.random()}`, product: customizing, quantity: 1, modifierIds: pickedModifiers, note: note.trim() }]);
    setCustomizing(null); setPickedModifiers([]); setNote('');
  };
  const changeQuantity = (key: string, delta: number) => setCart((current) => current.map((line) => line.key === key ? { ...line, quantity: line.quantity + delta } : line).filter((line) => line.quantity > 0));
  const completeSale = () => {
    if (!cart.length) return;
    setFailure(''); setSuccess('');
    createOrder.mutate({ data: { customerId: customerId || null, paymentMethod: payment, items: cart.map((line) => ({ productId: line.product.id, quantity: line.quantity, modifierIds: line.modifierIds, baristaNotes: line.note })) } }, {
      onSuccess: (order) => {
        setCart([]); setCustomerId(''); setSuccess(`Order ${order.id.slice(0, 7)} is complete. Nice work.`); qc.invalidateQueries({ queryKey: getListOrdersQueryKey() }); qc.invalidateQueries({ queryKey: getGetDashboardQueryKey() });
      }, onError: () => setFailure('That sale could not be completed. Your cart is still here—please try again.'),
    });
  };
  return <div className="page-enter">
    <PageHeading eyebrow="Counter · New sale" title="Make it a good one." description="Tap a favorite, make it theirs, and send it on its way." action={<div className="flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-3"><div className="grid h-9 w-9 place-items-center rounded-xl bg-accent text-accent-foreground"><CircleDollarSign className="h-4 w-4" /></div><div><span className="block mono text-[9px] uppercase tracking-wider text-muted-foreground">Today so far</span><strong data-testid="text-today-sales" className="text-sm">{dashboardQ.isLoading ? '—' : money(dashboardQ.data?.todaySales)}</strong></div></div>} />
    <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
      <section className="min-w-0">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full max-w-sm"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input data-testid="input-product-search" className="pl-9" placeholder="Find a drink, bite, or bean…" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
          <div className="flex gap-1 rounded-xl bg-muted p-1">{availableCategories.map((label) => <button key={label} data-testid={`filter-category-${label.toLowerCase()}`} className={`rounded-lg px-3 py-2 text-xs font-medium transition-colors ${category === label ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`} onClick={() => setCategory(label)}>{label}</button>)}</div>
        </div>
        {productsQ.isLoading ? <LoadingRows count={6} /> : productsQ.isError ? <div className="space-y-3"><Notice>Could not load the menu.</Notice><Button data-testid="button-retry-products" variant="outline" onClick={() => productsQ.refetch()}>Try again</Button></div> : filteredProducts.length ? <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">{filteredProducts.map((product, i) => <button key={product.id} data-testid={`card-product-${product.id}`} onClick={() => { setCustomizing(product); setPickedModifiers([]); setNote(''); }} className="product-tile soft-shadow group relative flex min-h-[150px] flex-col justify-between overflow-hidden rounded-2xl border border-border bg-card p-4 text-left">
          <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-accent/55 transition-transform group-hover:scale-125" /><div className="relative flex w-full items-start justify-between"><span className={`grid h-9 w-9 place-items-center rounded-xl ${i % 3 === 0 ? 'bg-emerald-100 text-emerald-800' : i % 3 === 1 ? 'bg-orange-100 text-orange-800' : 'bg-sky-100 text-sky-800'}`}>{product.category === 'Beverage' ? <Coffee className="h-4 w-4" /> : product.category === 'Food' ? <Sparkles className="h-4 w-4" /> : <ShoppingBag className="h-4 w-4" />}</span><Plus className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" /></div>
          <div className="relative mt-5"><span className="block text-sm font-semibold leading-tight">{product.name}</span><span className="mono mt-1.5 block text-xs text-muted-foreground">{money(product.basePrice)}</span></div>
        </button>)}</div> : <EmptyState title={search ? 'Nothing on the menu by that name.' : 'The menu is taking a breather.'} detail={search ? 'Try another search, or browse a different category.' : 'Active products will show here as soon as they are added.'} icon={CupSoda} />}
        {dashboardQ.data && <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3"><div className="rounded-2xl border border-border bg-card/70 p-4"><span className="mono text-[9px] uppercase tracking-wider text-muted-foreground">Orders today</span><div className="mt-1 text-xl font-semibold">{dashboardQ.data.todayOrders}</div></div><div className="rounded-2xl border border-border bg-card/70 p-4"><span className="mono text-[9px] uppercase tracking-wider text-muted-foreground">Average ticket</span><div className="mt-1 text-xl font-semibold">{money(dashboardQ.data.averageOrder)}</div></div><div className="col-span-2 rounded-2xl border border-border bg-card/70 p-4 sm:col-span-1"><span className="mono text-[9px] uppercase tracking-wider text-muted-foreground">Recently served</span><div className="mt-1 flex items-center gap-2 text-sm font-medium"><Clock3 className="h-4 w-4 text-muted-foreground" />{dashboardQ.data.recentOrders.length} orders today</div></div></div>}
      </section>
      <aside className="soft-shadow overflow-hidden rounded-[1.5rem] border border-border bg-card xl:sticky xl:top-[88px]">
        <div className="flex items-center justify-between border-b border-border px-5 py-4"><div><div className="flex items-center gap-2"><ShoppingCart className="h-4 w-4 text-primary" /><h2 className="font-semibold">Current order</h2></div><p className="mt-1 text-xs text-muted-foreground">{cart.reduce((sum, line) => sum + line.quantity, 0)} items · made fresh</p></div><span className="mono rounded-full bg-muted px-2.5 py-1 text-xs">{cart.length}</span></div>
        <div className="max-h-[34vh] min-h-[90px] space-y-3 overflow-auto px-5 py-4 xl:max-h-[360px]">
          {!cart.length ? <div className="flex h-24 flex-col items-center justify-center text-center"><div className="grid h-9 w-9 place-items-center rounded-full bg-muted"><ShoppingBag className="h-4 w-4 text-muted-foreground" /></div><p className="mt-2 text-sm font-medium">A fresh start.</p><p className="text-xs text-muted-foreground">Choose something from the menu.</p></div> : cart.map((line) => {
            const mods = line.modifierIds.map((id) => modifiers.find((item) => item.id === id)).filter(Boolean) as Modifier[];
            const linePrice = line.product.basePrice + mods.reduce((sum, item) => sum + item.additionalCost, 0);
            return <div key={line.key} data-testid={`cart-line-${line.product.id}`} className="rounded-xl bg-background/75 p-3"><div className="flex items-start justify-between gap-2"><div><p className="text-sm font-semibold">{line.product.name}</p>{mods.length > 0 && <p className="mt-1 text-xs text-muted-foreground">{mods.map((m) => m.name).join(', ')}</p>}{line.note && <p className="mt-1 text-xs italic text-muted-foreground">{line.note}</p>}</div><span className="mono text-xs">{money(linePrice * line.quantity)}</span></div><div className="mt-2 flex items-center gap-2"><button data-testid={`button-decrease-${line.key}`} className="grid h-7 w-7 place-items-center rounded-lg border border-border" onClick={() => changeQuantity(line.key, -1)} aria-label="Decrease quantity"><Minus className="h-3 w-3" /></button><span className="mono w-5 text-center text-xs">{line.quantity}</span><button data-testid={`button-increase-${line.key}`} className="grid h-7 w-7 place-items-center rounded-lg border border-border" onClick={() => changeQuantity(line.key, 1)} aria-label="Increase quantity"><Plus className="h-3 w-3" /></button><button data-testid={`button-remove-${line.key}`} className="ml-auto text-xs text-muted-foreground hover:text-destructive" onClick={() => setCart((current) => current.filter((item) => item.key !== line.key))}>Remove</button></div></div>;
          })}
        </div>
        <div className="space-y-4 border-t border-border px-5 py-4">
          <div className="space-y-2"><Label htmlFor="customer-select" className="text-xs">Customer <span className="font-normal text-muted-foreground">· optional</span></Label><div className="relative"><select id="customer-select" data-testid="select-customer" value={customerId} onChange={(e) => setCustomerId(e.target.value)} className="h-10 w-full appearance-none rounded-xl border border-input bg-background px-3 pr-8 text-sm"><option value="">Walk-in guest</option>{customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name} · {customer.loyaltyPointsBalance} pts</option>)}</select><ChevronDown className="pointer-events-none absolute right-3 top-3 h-4 w-4 text-muted-foreground" /></div>{customersQ.isError && <p className="text-xs text-destructive">Customer list unavailable.</p>}</div>
          <div className="space-y-2"><Label className="text-xs">Payment method</Label><div className="grid grid-cols-3 gap-2">{(['Card', 'Cash', 'E-Wallet'] as PaymentMethod[]).map((method) => { const Icon = method === 'Card' ? CreditCard : method === 'Cash' ? Banknote : Wallet; return <button key={method} data-testid={`payment-${method.toLowerCase().replace('-', '')}`} onClick={() => setPayment(method)} className={`flex flex-col items-center gap-1 rounded-xl border px-2 py-2.5 text-[10px] transition-colors ${payment === method ? 'border-primary bg-primary/5 text-primary' : 'border-border text-muted-foreground hover:bg-muted'}`}><Icon className="h-4 w-4" />{method}</button>; })}</div></div>
          {failure && <Notice>{failure}</Notice>}{success && <Notice tone="success">{success}</Notice>}
          <div className="flex items-center justify-between border-t border-dashed border-border pt-3"><span className="text-sm text-muted-foreground">Total</span><strong data-testid="text-cart-total" className="display text-2xl">{money(cartTotal)}</strong></div>
          <Button data-testid="button-complete-sale" onClick={completeSale} disabled={!cart.length || createOrder.isPending} className="h-12 w-full text-sm">{createOrder.isPending ? 'Completing sale…' : <>Complete sale <ArrowRight className="ml-auto h-4 w-4" /></>}</Button>
          <p className="text-center text-[10px] text-muted-foreground">A receipt will be ready as soon as the sale is complete.</p>
        </div>
      </aside>
    </div>
    {customizing && <Modal title={customizing.name} subtitle={`Start with ${money(customizing.basePrice)} · ${customizing.category.toLowerCase()}`} onClose={() => setCustomizing(null)}>
      <div className="space-y-5">{modifiersQ.isLoading ? <LoadingRows count={2} /> : modifiersQ.isError ? <Notice>Could not load drink additions. Try again from the catalog.</Notice> : <div><Label className="mb-2 block">Make it yours</Label><div className="space-y-2">{modifiers.filter((modifier) => modifier.isActive).map((modifier) => { const checked = pickedModifiers.includes(modifier.id); return <button key={modifier.id} data-testid={`modifier-option-${modifier.id}`} onClick={() => setPickedModifiers((current) => checked ? current.filter((id) => id !== modifier.id) : [...current, modifier.id])} className={`flex w-full items-center justify-between rounded-xl border p-3 text-left ${checked ? 'border-primary bg-accent/50' : 'border-border hover:bg-muted/60'}`}><span className="flex items-center gap-3"><span className={`grid h-5 w-5 place-items-center rounded-md border ${checked ? 'border-primary bg-primary text-primary-foreground' : 'border-input'}`}>{checked && <Check className="h-3 w-3" />}</span><span className="text-sm">{modifier.name}</span></span><span className="mono text-xs text-muted-foreground">{modifier.additionalCost ? `+${money(modifier.additionalCost)}` : 'Included'}</span></button>; })}{modifiers.filter((modifier) => modifier.isActive).length === 0 && <p className="rounded-xl bg-muted p-3 text-sm text-muted-foreground">No add-ons available for now.</p>}</div></div>}
        <div className="space-y-2"><Label htmlFor="barista-note">Barista note <span className="font-normal text-muted-foreground">· optional</span></Label><textarea id="barista-note" data-testid="input-barista-note" maxLength={500} placeholder="Decaf, oat milk, extra hot…" value={note} onChange={(e) => setNote(e.target.value)} className="min-h-20 w-full resize-y rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" /></div>
        <Button data-testid="button-add-to-order" className="h-12 w-full" onClick={addCustomized}>Add to order <span className="ml-auto">{money(customizing.basePrice + pickedModifiers.reduce((sum, id) => sum + (modifiers.find((m) => m.id === id)?.additionalCost ?? 0), 0))}</span></Button>
      </div>
    </Modal>}
  </div>;
}

function OrdersPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'All' | 'Completed' | 'Refunded'>('All');
  const [detail, setDetail] = useState<Order | null>(null);
  const refund = useRefundOrder();
  const params = { search: search || undefined, status: filter === 'All' ? undefined : filter, limit: 100 } as const;
  const ordersQ = useListOrders(params);
  const orders = ordersQ.data ?? [];
  const doRefund = (order: Order) => { if (!window.confirm(`Refund ${money(order.totalAmount)} for order ${order.id.slice(0, 8)}?`)) return; refund.mutate({ id: order.id }, { onSuccess: (updated) => { setDetail(updated); qc.invalidateQueries({ queryKey: getListOrdersQueryKey() }); qc.invalidateQueries({ queryKey: getGetDashboardQueryKey() }); } }); };
  return <div className="page-enter"><PageHeading eyebrow="Sales ledger" title="Orders" description="Every order, right where you left it." action={<div className="mono rounded-xl border border-border bg-card px-3 py-2 text-xs text-muted-foreground">{ordersQ.isLoading ? '…' : `${orders.length} records`}</div>} />
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div className="relative w-full max-w-sm"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input data-testid="input-orders-search" className="pl-9" placeholder="Search order or customer…" value={search} onChange={(e) => setSearch(e.target.value)} /></div><div className="flex gap-1 rounded-xl bg-muted p-1">{(['All', 'Completed', 'Refunded'] as const).map((item) => <button key={item} data-testid={`filter-orders-${item.toLowerCase()}`} onClick={() => setFilter(item)} className={`rounded-lg px-3 py-2 text-xs font-medium ${filter === item ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}>{item}</button>)}</div></div>
    {ordersQ.isLoading ? <LoadingRows count={7} /> : ordersQ.isError ? <div className="space-y-3"><Notice>We couldn't retrieve orders.</Notice><Button variant="outline" data-testid="button-retry-orders" onClick={() => ordersQ.refetch()}>Try again</Button></div> : orders.length === 0 ? <EmptyState title="No orders in this view." detail={search ? 'Try another name or order number.' : 'Completed sales will appear here.'} icon={ShoppingBag} /> :
      <div className="overflow-hidden rounded-2xl border border-border bg-card soft-shadow"><div className="hidden grid-cols-[1.3fr_1fr_1.2fr_.8fr_.8fr_auto] gap-4 border-b border-border bg-muted/60 px-5 py-3 mono text-[9px] uppercase tracking-wider text-muted-foreground md:grid"><span>Order</span><span>Guest</span><span>Time</span><span>Payment</span><span>Status</span><span>Total</span></div>{orders.map((order) => <button key={order.id} data-testid={`row-order-${order.id}`} onClick={() => setDetail(order)} className="grid w-full grid-cols-[1fr_auto] gap-1 border-b border-border px-4 py-4 text-left last:border-0 hover:bg-muted/40 md:grid-cols-[1.3fr_1fr_1.2fr_.8fr_.8fr_auto] md:items-center md:gap-4 md:px-5"><span><span className="block font-semibold">#{order.id.slice(0, 8)}</span><span className="mt-1 block text-xs text-muted-foreground">{order.items.length} {order.items.length === 1 ? 'item' : 'items'} · {order.employeeName}</span></span><span className="hidden text-sm md:block">{order.customerName || 'Walk-in guest'}</span><span className="hidden text-xs text-muted-foreground md:block">{shortDate(order.createdAt)}</span><span className="hidden text-sm md:block">{order.paymentMethod}</span><span><StatusBadge status={order.status} /></span><span className="mono text-right text-sm font-medium">{money(order.totalAmount)}</span><span className="col-span-2 flex items-center gap-1 text-xs text-muted-foreground md:hidden">{order.customerName || 'Walk-in'} · {shortDate(order.createdAt)} · {order.paymentMethod}</span></button>)}</div>}
    {detail && <Modal title={`Order #${detail.id.slice(0, 8)}`} subtitle={`${shortDate(detail.createdAt)} · served by ${detail.employeeName}`} onClose={() => setDetail(null)} wide>
      <div className="mb-5 grid grid-cols-2 gap-3"><div className="rounded-xl bg-muted/70 p-3"><span className="mono text-[9px] uppercase tracking-wider text-muted-foreground">Customer</span><p className="mt-1 text-sm font-medium">{detail.customerName || 'Walk-in guest'}</p></div><div className="rounded-xl bg-muted/70 p-3"><span className="mono text-[9px] uppercase tracking-wider text-muted-foreground">Payment</span><p className="mt-1 text-sm font-medium">{detail.paymentMethod}</p></div></div>
      <div className="space-y-3">{detail.items.map((line) => <div key={line.id} data-testid={`detail-line-${line.id}`} className="flex justify-between gap-4 border-b border-border pb-3"><div><p className="text-sm font-semibold">{line.quantity} × {line.productName}</p>{line.modifiers.length > 0 && <p className="mt-1 text-xs text-muted-foreground">{line.modifiers.map((mod) => mod.name).join(', ')}</p>}{line.baristaNotes && <p className="mt-1 text-xs italic text-muted-foreground">{line.baristaNotes}</p>}</div><span className="mono text-sm">{money(line.subtotal)}</span></div>)}</div>
      <div className="mt-5 flex items-center justify-between"><span className="font-medium">Total</span><span data-testid="text-order-total" className="display text-2xl">{money(detail.totalAmount)}</span></div>
      {detail.status === 'Completed' ? <Button data-testid="button-refund-order" variant="outline" className="mt-5 w-full border-rose-300 text-rose-700 hover:bg-rose-50" onClick={() => doRefund(detail)} disabled={refund.isPending}><RotateCcw className="mr-2 h-4 w-4" />{refund.isPending ? 'Processing refund…' : 'Refund this order'}</Button> : <div className="mt-5 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-800">This order has been refunded.</div>}
    </Modal>}
  </div>;
}
function StatusBadge({ status }: { status: string }) { return <Badge data-testid={`status-${status.toLowerCase()}`} variant="outline" className={status === 'Completed' || status === 'Processed' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : status === 'Refunded' ? 'border-rose-200 bg-rose-50 text-rose-800' : 'border-amber-200 bg-amber-50 text-amber-800'}>{status}</Badge>; }

function CustomersPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [dialog, setDialog] = useState(false);
  const [edit, setEdit] = useState<Customer | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [points, setPoints] = useState('0');
  const [error, setError] = useState('');
  const params = { search: search || undefined };
  const customersQ = useListCustomers(params);
  const create = useCreateCustomer(); const update = useUpdateCustomer();
  const openNew = () => { setEdit(null); setName(''); setPhone(''); setPoints('0'); setError(''); setDialog(true); };
  const openEdit = (customer: Customer) => { setEdit(customer); setName(customer.name); setPhone(customer.phoneNumber); setPoints(String(customer.loyaltyPointsBalance)); setError(''); setDialog(true); };
  const submit = (event: React.FormEvent) => {
    event.preventDefault(); setError('');
    if (edit) update.mutate({ id: edit.id, data: { name, phoneNumber: phone, loyaltyPointsBalance: Math.max(0, Number(points) || 0) } }, { onSuccess: () => { qc.invalidateQueries({ queryKey: getListCustomersQueryKey() }); setDialog(false); }, onError: () => setError('Could not update this customer.') });
    else create.mutate({ data: { name, phoneNumber: phone } }, { onSuccess: () => { qc.invalidateQueries({ queryKey: getListCustomersQueryKey() }); setDialog(false); }, onError: () => setError('Could not add this customer. Check their details.') });
  };
  return <div className="page-enter"><PageHeading eyebrow="Regulars & rewards" title="Customers" description="Know your regulars. Make their next visit feel familiar." action={<Button data-testid="button-add-customer" onClick={openNew}><Plus className="mr-2 h-4 w-4" />Add customer</Button>} />
    <div className="mb-5 grid grid-cols-2 gap-3 sm:max-w-lg"><div className="rounded-2xl border border-border bg-card p-4"><span className="mono text-[9px] uppercase tracking-wider text-muted-foreground">People in your book</span><p data-testid="text-customer-count" className="display mt-1 text-2xl">{customersQ.data?.length ?? '—'}</p></div><div className="rounded-2xl border border-border bg-card p-4"><span className="mono text-[9px] uppercase tracking-wider text-muted-foreground">Points on the counter</span><p className="display mt-1 text-2xl">{(customersQ.data ?? []).reduce((sum, customer) => sum + customer.loyaltyPointsBalance, 0).toLocaleString()}</p></div></div>
    <div className="relative mb-5 max-w-sm"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input data-testid="input-customers-search" className="pl-9" placeholder="Search name or phone…" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
    {customersQ.isLoading ? <LoadingRows /> : customersQ.isError ? <div className="space-y-3"><Notice>Could not load customers.</Notice><Button data-testid="button-retry-customers" variant="outline" onClick={() => customersQ.refetch()}>Try again</Button></div> : (customersQ.data ?? []).length === 0 ? <EmptyState title="Your regulars will show up here." detail={search ? 'No match yet. Try a different search.' : 'Add a customer to start tracking their visits and points.'} icon={Users} /> :
      <div className="overflow-hidden rounded-2xl border border-border bg-card soft-shadow"><div className="hidden grid-cols-[1.4fr_1fr_.8fr_auto] border-b border-border bg-muted/60 px-5 py-3 mono text-[9px] uppercase tracking-wider text-muted-foreground sm:grid"><span>Customer</span><span>Phone</span><span>Loyalty balance</span><span>Manage</span></div>{(customersQ.data ?? []).map((customer) => <div key={customer.id} data-testid={`row-customer-${customer.id}`} className="grid grid-cols-[1fr_auto] items-center gap-3 border-b border-border px-4 py-4 last:border-0 sm:grid-cols-[1.4fr_1fr_.8fr_auto] sm:px-5"><div className="flex min-w-0 items-center gap-3"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">{initials(customer.name)}</div><div className="min-w-0"><p className="truncate text-sm font-semibold">{customer.name}</p><p className="truncate text-xs text-muted-foreground sm:hidden">{customer.phoneNumber}</p></div></div><span className="hidden text-sm text-muted-foreground sm:block">{customer.phoneNumber}</span><span className="flex items-center gap-2 text-sm"><Gift className="h-4 w-4 text-primary" /><strong>{customer.loyaltyPointsBalance}</strong><span className="hidden text-muted-foreground md:inline">points</span></span><Button data-testid={`button-edit-customer-${customer.id}`} variant="outline" size="sm" onClick={() => openEdit(customer)}><Pencil className="mr-2 h-3.5 w-3.5" /><span className="hidden sm:inline">Edit</span></Button></div>)}</div>}
    {dialog && <Modal title={edit ? 'Update customer' : 'Add a customer'} subtitle={edit ? 'Keep their details and rewards balance current.' : 'A name and number is all you need to start.'} onClose={() => setDialog(false)}>
      <form onSubmit={submit} className="space-y-4"><FormInput id="customer-name" label="Full name" value={name} onChange={setName} required placeholder="First and last name" /><FormInput id="customer-phone" label="Phone number" type="tel" value={phone} onChange={setPhone} required placeholder="(555) 000-0000" />{edit && <FormInput id="customer-points" label="Loyalty points balance" type="number" min="0" value={points} onChange={setPoints} required />} {error && <Notice>{error}</Notice>}<Button data-testid="button-save-customer" className="w-full" disabled={create.isPending || update.isPending}>{create.isPending || update.isPending ? 'Saving…' : edit ? 'Save changes' : 'Add customer'}</Button></form>
    </Modal>}
  </div>;
}

function CatalogPage() {
  const qc = useQueryClient();
  const productsQ = useListProducts({ includeInactive: true });
  const modifiersQ = useListModifiers({ includeInactive: true });
  const createProduct = useCreateProduct(); const updateProduct = useUpdateProduct();
  const createModifier = useCreateModifier(); const updateModifier = useUpdateModifier();
  const [tab, setTab] = useState<'products' | 'modifiers'>('products');
  const [productDialog, setProductDialog] = useState(false);
  const [modifierDialog, setModifierDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [pName, setPName] = useState(''); const [pPrice, setPPrice] = useState(''); const [pCategory, setPCategory] = useState<ProductCategory>('Beverage'); const [track, setTrack] = useState(false);
  const [mName, setMName] = useState(''); const [mCost, setMCost] = useState(''); const [editingModifier, setEditingModifier] = useState<Modifier | null>(null); const [error, setError] = useState('');
  const openProduct = (product?: Product) => { setEditingProduct(product ?? null); setPName(product?.name ?? ''); setPPrice(String(product?.basePrice ?? '')); setPCategory(product?.category ?? 'Beverage'); setTrack(product?.trackInventory ?? false); setError(''); setProductDialog(true); };
  const submitProduct = (event: React.FormEvent) => {
    event.preventDefault(); const data = { name: pName, basePrice: Number(pPrice), category: pCategory, trackInventory: track };
    if (!pName.trim() || Number(pPrice) < 0) { setError('Enter a product name and a valid price.'); return; }
    const done = () => { qc.invalidateQueries({ queryKey: getListProductsQueryKey() }); qc.invalidateQueries({ queryKey: getListProductsQueryKey({ includeInactive: true }) }); setProductDialog(false); };
    if (editingProduct) updateProduct.mutate({ id: editingProduct.id, data }, { onSuccess: done, onError: () => setError('Could not save product changes.') });
    else createProduct.mutate({ data }, { onSuccess: done, onError: () => setError('Could not add this product.') });
  };
  const submitModifier = (event: React.FormEvent) => {
    event.preventDefault();
    const saved = () => { qc.invalidateQueries({ queryKey: getListModifiersQueryKey() }); qc.invalidateQueries({ queryKey: getListModifiersQueryKey({ includeInactive: true }) }); setModifierDialog(false); setEditingModifier(null); setMName(''); setMCost(''); };
    if (editingModifier) updateModifier.mutate({ id: editingModifier.id, data: { name: mName, additionalCost: Number(mCost) } }, { onSuccess: saved, onError: () => setError('Could not save modifier changes.') });
    else createModifier.mutate({ data: { name: mName, additionalCost: Number(mCost) } }, { onSuccess: saved, onError: () => setError('Could not add this modifier.') });
  };
  const toggleProduct = (product: Product) => updateProduct.mutate({ id: product.id, data: { isActive: !product.isActive } }, { onSuccess: () => { qc.invalidateQueries({ queryKey: getListProductsQueryKey() }); qc.invalidateQueries({ queryKey: getListProductsQueryKey({ includeInactive: true }) }); } });
  const toggleModifier = (modifier: Modifier) => updateModifier.mutate({ id: modifier.id, data: { isActive: !modifier.isActive } }, { onSuccess: () => { qc.invalidateQueries({ queryKey: getListModifiersQueryKey() }); qc.invalidateQueries({ queryKey: getListModifiersQueryKey({ includeInactive: true }) }); } });
  const products = productsQ.data ?? []; const modifiers = modifiersQ.data ?? [];
  return <div className="page-enter"><PageHeading eyebrow="Menu & extras" title="Catalog" description="Keep the menu crisp, current, and easy to ring in." action={tab === 'products' ? <Button data-testid="button-add-product" onClick={() => openProduct()}><Plus className="mr-2 h-4 w-4" />Add product</Button> : <Button data-testid="button-add-modifier" onClick={() => { setEditingModifier(null); setMName(''); setMCost(''); setError(''); setModifierDialog(true); }}><Plus className="mr-2 h-4 w-4" />Add modifier</Button>} />
    <div className="mb-5 inline-flex gap-1 rounded-xl bg-muted p-1"><button data-testid="tab-products" onClick={() => setTab('products')} className={`rounded-lg px-4 py-2 text-sm ${tab === 'products' ? 'bg-card font-semibold shadow-sm' : 'text-muted-foreground'}`}>Products <span className="ml-1 text-xs opacity-60">{products.length}</span></button><button data-testid="tab-modifiers" onClick={() => setTab('modifiers')} className={`rounded-lg px-4 py-2 text-sm ${tab === 'modifiers' ? 'bg-card font-semibold shadow-sm' : 'text-muted-foreground'}`}>Modifiers <span className="ml-1 text-xs opacity-60">{modifiers.length}</span></button></div>
    {tab === 'products' ? productsQ.isLoading ? <LoadingRows /> : productsQ.isError ? <div className="space-y-3"><Notice>Could not load the catalog.</Notice><Button variant="outline" onClick={() => productsQ.refetch()}>Try again</Button></div> : products.length === 0 ? <EmptyState title="A blank menu is a clean slate." detail="Add your first product to make it available at checkout." icon={Package} /> : <div className="overflow-hidden rounded-2xl border border-border bg-card soft-shadow"><div className="hidden grid-cols-[1.5fr_1fr_.8fr_.8fr_auto_auto] border-b border-border bg-muted/60 px-5 py-3 mono text-[9px] uppercase tracking-wider text-muted-foreground md:grid"><span>Product</span><span>Category</span><span>Price</span><span>Inventory</span><span>Status</span><span>Manage</span></div>{products.map((product) => <div data-testid={`row-product-${product.id}`} key={product.id} className="grid grid-cols-[1fr_auto] items-center gap-2 border-b border-border px-4 py-4 last:border-0 sm:px-5 md:grid-cols-[1.5fr_1fr_.8fr_.8fr_auto_auto]"><div><p className="text-sm font-semibold">{product.name}</p><p className="text-xs text-muted-foreground md:hidden">{product.category} · {money(product.basePrice)}</p></div><span className="hidden text-sm text-muted-foreground md:block">{product.category}</span><span className="hidden mono text-sm md:block">{money(product.basePrice)}</span><span className="hidden text-xs text-muted-foreground md:block">{product.trackInventory ? 'Tracked' : 'Not tracked'}</span><span><StatusBadge status={product.isActive ? 'Active' : 'Inactive'} /></span><div className="flex items-center justify-end gap-2"><Button data-testid={`button-edit-product-${product.id}`} size="icon" variant="ghost" className="h-8 w-8" onClick={() => openProduct(product)} aria-label={`Edit ${product.name}`}><Pencil className="h-4 w-4" /></Button><Switch data-testid={`switch-product-active-${product.id}`} checked={product.isActive} onCheckedChange={() => toggleProduct(product)} aria-label={`${product.isActive ? 'Deactivate' : 'Activate'} ${product.name}`} /></div></div>)}</div> :
      modifiersQ.isLoading ? <LoadingRows count={4} /> : modifiersQ.isError ? <div className="space-y-3"><Notice>Could not load modifiers.</Notice><Button variant="outline" onClick={() => modifiersQ.refetch()}>Try again</Button></div> : modifiers.length === 0 ? <EmptyState title="No extras on the menu yet." detail="Create a modifier such as oat milk, an extra shot, or a flavor." icon={SlidersHorizontal} /> : <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{modifiers.map((modifier) => <div key={modifier.id} data-testid={`card-modifier-${modifier.id}`} className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-card p-4 soft-shadow"><div className="min-w-0"><p className="font-semibold">{modifier.name}</p><p className="mono mt-1 text-xs text-muted-foreground">{modifier.additionalCost ? `+${money(modifier.additionalCost)}` : 'No added cost'}</p><div className="mt-2"><StatusBadge status={modifier.isActive ? 'Active' : 'Inactive'} /></div></div><div className="flex items-center gap-2"><Button data-testid={`button-edit-modifier-${modifier.id}`} size="icon" variant="ghost" className="h-8 w-8" aria-label={`Edit ${modifier.name}`} onClick={() => { setEditingModifier(modifier); setMName(modifier.name); setMCost(String(modifier.additionalCost)); setError(''); setModifierDialog(true); }}><Pencil className="h-4 w-4" /></Button><Switch data-testid={`switch-modifier-active-${modifier.id}`} checked={modifier.isActive} onCheckedChange={() => toggleModifier(modifier)} aria-label={`${modifier.isActive ? 'Deactivate' : 'Activate'} ${modifier.name}`} /></div></div>)}</div>}
    {productDialog && <Modal title={editingProduct ? 'Edit product' : 'Add a product'} subtitle="A clear name and price make the counter move faster." onClose={() => setProductDialog(false)}><form onSubmit={submitProduct} className="space-y-4"><FormInput id="product-name" label="Product name" value={pName} onChange={setPName} required placeholder="e.g. Honey oat latte" /><div className="grid grid-cols-2 gap-3"><FormInput id="product-price" label="Base price" type="number" min="0" step="0.01" value={pPrice} onChange={setPPrice} required placeholder="0.00" /><div className="space-y-2"><Label htmlFor="product-category">Category</Label><select id="product-category" data-testid="select-product-category" value={pCategory} onChange={(e) => setPCategory(e.target.value as ProductCategory)} className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"><option value="Beverage">Beverage</option><option value="Food">Food</option><option value="Retail">Retail</option></select></div></div><div className="flex items-center justify-between rounded-xl bg-muted/60 p-3"><div><p className="text-sm font-medium">Track inventory</p><p className="text-xs text-muted-foreground">Enable stock tracking for this product.</p></div><Switch data-testid="switch-track-inventory" checked={track} onCheckedChange={setTrack} /></div>{error && <Notice>{error}</Notice>}<Button data-testid="button-save-product" className="w-full" disabled={createProduct.isPending || updateProduct.isPending}>{createProduct.isPending || updateProduct.isPending ? 'Saving…' : editingProduct ? 'Save product' : 'Add product'}</Button></form></Modal>}
    {modifierDialog && <Modal title={editingModifier ? 'Edit modifier' : 'Add a modifier'} subtitle="Set a useful add-on for drink customization." onClose={() => setModifierDialog(false)}><form onSubmit={submitModifier} className="space-y-4"><FormInput id="modifier-name" label="Modifier name" value={mName} onChange={setMName} required placeholder="e.g. Oat milk" /><FormInput id="modifier-cost" label="Additional cost" type="number" min="0" step="0.01" value={mCost} onChange={setMCost} required placeholder="0.00" />{error && <Notice>{error}</Notice>}<Button data-testid="button-save-modifier" className="w-full" disabled={createModifier.isPending || updateModifier.isPending}>{createModifier.isPending || updateModifier.isPending ? 'Saving…' : editingModifier ? 'Save modifier' : 'Add modifier'}</Button></form></Modal>}
  </div>;
}

function TeamPage() {
  const qc = useQueryClient();
  const teamQ = useListEmployees();
  const create = useCreateEmployee(); const update = useUpdateEmployee();
  const [dialog, setDialog] = useState(false); const [name, setName] = useState(''); const [pin, setPin] = useState(''); const [role, setRole] = useState<'Admin' | 'Barista'>('Barista'); const [error, setError] = useState('');
  const [pinEmployee, setPinEmployee] = useState<Employee | null>(null); const [replacementPin, setReplacementPin] = useState('');
  const save = (event: React.FormEvent) => { event.preventDefault(); if (pin.length !== 4) { setError('PIN must contain exactly four digits.'); return; } create.mutate({ data: { fullName: name, role, posPin: pin } }, { onSuccess: () => { qc.invalidateQueries({ queryKey: getListEmployeesQueryKey() }); qc.invalidateQueries({ queryKey: getGetStaffOptionsQueryKey() }); setDialog(false); }, onError: () => setError('Could not add this team member.') }); };
  const toggleActive = (person: Employee) => update.mutate({ id: person.id, data: { isActive: !person.isActive } }, { onSuccess: () => { qc.invalidateQueries({ queryKey: getListEmployeesQueryKey() }); qc.invalidateQueries({ queryKey: getGetStaffOptionsQueryKey() }); } });
  const changeRole = (person: Employee, newRole: 'Admin' | 'Barista') => update.mutate({ id: person.id, data: { role: newRole } }, { onSuccess: () => qc.invalidateQueries({ queryKey: getListEmployeesQueryKey() }) });
  return <div className="page-enter"><PageHeading eyebrow="People behind the counter" title="Team" description="Manage who can sign in, and what they can do." action={<Button data-testid="button-add-employee" onClick={() => { setName(''); setPin(''); setRole('Barista'); setError(''); setDialog(true); }}><Plus className="mr-2 h-4 w-4" />Add teammate</Button>} />
    <div className="mb-5 flex items-center gap-3 rounded-2xl border border-border bg-card p-4"><div className="grid h-10 w-10 place-items-center rounded-xl bg-accent text-primary"><ShieldCheck className="h-5 w-5" /></div><p className="text-sm"><strong>Admin access is powerful.</strong><span className="ml-1 text-muted-foreground">Only share it with people who manage the café.</span></p></div>
    {teamQ.isLoading ? <LoadingRows /> : teamQ.isError ? <div className="space-y-3"><Notice>Could not load the team.</Notice><Button data-testid="button-retry-team" variant="outline" onClick={() => teamQ.refetch()}>Try again</Button></div> : (teamQ.data ?? []).length === 0 ? <EmptyState title="Your team starts here." detail="Add an administrator or barista to give them secure PIN access." icon={Users} /> : <div className="overflow-hidden rounded-2xl border border-border bg-card soft-shadow"><div className="hidden grid-cols-[1.4fr_.8fr_.8fr_auto] border-b border-border bg-muted/60 px-5 py-3 mono text-[9px] uppercase tracking-wider text-muted-foreground sm:grid"><span>Employee</span><span>Role</span><span>Joined</span><span>Access</span></div>{(teamQ.data ?? []).map((person) => <div key={person.id} data-testid={`row-employee-${person.id}`} className="grid grid-cols-[1fr_auto] items-center gap-3 border-b border-border px-4 py-4 last:border-0 sm:grid-cols-[1.4fr_.8fr_.8fr_auto] sm:px-5"><div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">{initials(person.fullName)}</div><div><p className="text-sm font-semibold">{person.fullName}</p><select data-testid={`select-role-mobile-${person.id}`} value={person.role} onChange={(e) => changeRole(person, e.target.value as 'Admin' | 'Barista')} className="mt-1 rounded-lg border border-input bg-background px-2 py-1 text-[11px] sm:hidden"><option value="Admin">Admin</option><option value="Barista">Barista</option></select></div></div><div className="hidden sm:block"><select data-testid={`select-role-${person.id}`} value={person.role} onChange={(e) => changeRole(person, e.target.value as 'Admin' | 'Barista')} className="rounded-lg border border-input bg-background px-2 py-1.5 text-xs"><option value="Admin">Admin</option><option value="Barista">Barista</option></select></div><span className="hidden text-xs text-muted-foreground sm:block">{new Date(person.createdAt).toLocaleDateString()}</span><div className="flex items-center justify-end gap-2"><span className="hidden text-xs text-muted-foreground md:block">{person.isActive ? 'Active' : 'Paused'}</span><Button data-testid={`button-reset-pin-${person.id}`} size="icon" variant="ghost" className="h-8 w-8" aria-label={`Reset PIN for ${person.fullName}`} onClick={() => { setPinEmployee(person); setReplacementPin(''); setError(''); }}><LockKeyhole className="h-4 w-4" /></Button><Switch data-testid={`switch-employee-active-${person.id}`} checked={person.isActive} onCheckedChange={() => toggleActive(person)} aria-label={`${person.isActive ? 'Deactivate' : 'Activate'} ${person.fullName}`} /></div></div>)}</div>}
    {dialog && <Modal title="Add a teammate" subtitle="Give your new team member a PIN for the counter." onClose={() => setDialog(false)}><form onSubmit={save} className="space-y-4"><FormInput id="employee-name" label="Full name" value={name} onChange={setName} required placeholder="e.g. Riley Chen" /><div className="space-y-2"><Label htmlFor="employee-role">Role</Label><select id="employee-role" data-testid="select-employee-role" value={role} onChange={(e) => setRole(e.target.value as 'Admin' | 'Barista')} className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"><option value="Barista">Barista</option><option value="Admin">Admin</option></select></div><FormInput id="employee-pin" label="Four-digit POS PIN" type="password" value={pin} onChange={(v) => setPin(v.replace(/\D/g, '').slice(0, 4))} required placeholder="••••" />{error && <Notice>{error}</Notice>}<Button data-testid="button-save-employee" className="w-full" disabled={create.isPending}>{create.isPending ? 'Adding…' : 'Add teammate'}</Button></form></Modal>}
    {pinEmployee && <Modal title="Reset staff PIN" subtitle={`Set a new four-digit counter PIN for ${pinEmployee.fullName}.`} onClose={() => setPinEmployee(null)}><form onSubmit={(event) => { event.preventDefault(); if (replacementPin.length !== 4) { setError('PIN must contain exactly four digits.'); return; } update.mutate({ id: pinEmployee.id, data: { posPin: replacementPin } }, { onSuccess: () => { qc.invalidateQueries({ queryKey: getListEmployeesQueryKey() }); setPinEmployee(null); }, onError: () => setError('Could not update this PIN.') }); }} className="space-y-4"><FormInput id="replacement-pin" label="New four-digit PIN" type="password" value={replacementPin} onChange={(value) => setReplacementPin(value.replace(/\D/g, '').slice(0, 4))} required placeholder="••••" />{error && <Notice>{error}</Notice>}<Button data-testid="button-save-pin" className="w-full" disabled={update.isPending}>{update.isPending ? 'Saving PIN…' : 'Save new PIN'}</Button></form></Modal>}
  </div>;
}

function AutomationPage() {
  const qc = useQueryClient();
  const statusQ = useGetAutomationStatus();
  const eventsQ = useListAutomationEvents({ limit: 100 });
  const retry = useRetryAutomationEvent();
  const retryEvent = (id: string) => retry.mutate({ id }, { onSuccess: () => { qc.invalidateQueries({ queryKey: getListAutomationEventsQueryKey({ limit: 100 }) }); qc.invalidateQueries({ queryKey: getGetAutomationStatusQueryKey() }); }, onError: () => window.alert('Delivery could not be retried. Please try again.') });
  const status = statusQ.data;
  return <div className="page-enter"><PageHeading eyebrow="Behind the scenes" title="Automation" description="Keep integrations connected and see what left the café." action={<Button data-testid="button-refresh-automation" variant="outline" onClick={() => { statusQ.refetch(); eventsQ.refetch(); }}><RefreshCw className="mr-2 h-4 w-4" />Refresh</Button>} />
    {statusQ.isError && <div className="mb-4"><Notice>Webhook status is unavailable.</Notice></div>}
    <section className="mb-6 rounded-3xl border border-border bg-sidebar p-5 text-sidebar-foreground sm:p-7"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><div className="flex items-center gap-2"><Webhook className="h-4 w-4 text-sidebar-primary" /><span className="mono text-[10px] uppercase tracking-[.17em] text-sidebar-foreground/60">Delivery endpoint</span></div><h2 data-testid="status-webhook-configured" className="display mt-3 text-3xl">{statusQ.isLoading ? 'Checking connection…' : status?.configured ? 'Connected and listening.' : 'Not configured yet.'}</h2><p className="mt-2 max-w-lg text-sm text-sidebar-foreground/65">{status?.configured ? 'New sales and updates will be sent to your configured webhook.' : 'An administrator can connect a webhook endpoint in the café service settings.'}</p></div><div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${status?.configured ? 'bg-sidebar-primary text-sidebar-primary-foreground' : 'bg-sidebar-accent text-sidebar-foreground/50'}`}>{status?.configured ? <CheckCircle2 className="h-6 w-6" /> : <Settings2 className="h-6 w-6" />}</div></div></section>
    <div className="mb-7 grid gap-3 sm:grid-cols-3"><StatCard label="Waiting to deliver" value={statusQ.isLoading ? '—' : status?.pendingCount ?? 0} detail="Pending events" icon={Clock3} /><StatCard label="Successfully delivered" value={statusQ.isLoading ? '—' : status?.processedCount ?? 0} detail="Processed events" icon={CheckCircle2} /><StatCard label="Recent activity" value={eventsQ.data?.length ?? (eventsQ.isLoading ? '—' : 0)} detail="Events in this log" icon={Activity} /></div>
    <div className="mb-4 flex items-end justify-between"><div><h2 className="display text-2xl font-semibold">Event log</h2><p className="mt-1 text-sm text-muted-foreground">Latest webhook deliveries and attempts.</p></div><span className="mono text-[10px] text-muted-foreground">NEWEST FIRST</span></div>
    {eventsQ.isLoading ? <LoadingRows count={5} /> : eventsQ.isError ? <div className="space-y-3"><Notice>Could not load the event log.</Notice><Button data-testid="button-retry-events" variant="outline" onClick={() => eventsQ.refetch()}>Try again</Button></div> : (eventsQ.data ?? []).length === 0 ? <EmptyState title="All quiet on the wire." detail="Webhook events will appear here as orders and updates are made." icon={Activity} /> :
      <div className="space-y-3">{(eventsQ.data ?? []).map((event) => <article key={event.id} data-testid={`event-${event.id}`} className="rounded-2xl border border-border bg-card p-4 soft-shadow sm:p-5"><div className="flex flex-col gap-4 sm:flex-row sm:items-start"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent text-primary"><Webhook className="h-4 w-4" /></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold">{event.eventType}</h3><StatusBadge status={event.syncStatus} /></div><p className="mt-1 text-xs text-muted-foreground">{shortDate(event.createdAt)} · {event.attempts} {event.attempts === 1 ? 'attempt' : 'attempts'}</p>{event.lastError && <p data-testid={`text-event-error-${event.id}`} className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-800">{event.lastError}</p>}<details className="mt-3"><summary data-testid={`button-event-payload-${event.id}`} className="flex cursor-pointer items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"><ChevronRight className="h-3 w-3" />View payload</summary><pre className="mt-2 max-h-52 overflow-auto rounded-xl bg-muted p-3 text-[10px] leading-5">{JSON.stringify(event.payload, null, 2)}</pre></details></div><div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end"><span className="mono text-[10px] text-muted-foreground">{event.processedAt ? shortDate(event.processedAt) : 'Awaiting delivery'}</span>{event.syncStatus !== 'Processed' && <Button data-testid={`button-retry-event-${event.id}`} variant="outline" size="sm" onClick={() => retryEvent(event.id)} disabled={retry.isPending}><RefreshCw className="mr-2 h-3.5 w-3.5" />Retry</Button>}</div></div></article>)}</div>}
  </div>;
}
function StatCard({ label, value, detail, icon: Icon }: { label: string; value: string | number; detail: string; icon: typeof Clock3 }) { return <div className="rounded-2xl border border-border bg-card p-4 soft-shadow"><div className="flex items-center justify-between"><span className="mono text-[9px] uppercase tracking-wider text-muted-foreground">{label}</span><Icon className="h-4 w-4 text-primary" /></div><p data-testid={`metric-${label.toLowerCase().replaceAll(' ', '-')}`} className="display mt-2 text-3xl">{value}</p><p className="mt-1 text-xs text-muted-foreground">{detail}</p></div>; }

function AuthenticatedApp() {
  const setupQ = useGetSetupStatus();
  const sessionQ = useGetCurrentSession({ query: { retry: false, enabled: !setupQ.isLoading && !setupQ.data?.needsSetup, queryKey: getGetCurrentSessionQueryKey() } });
  if (setupQ.isLoading || sessionQ.isLoading) return <main className="app-shell min-h-[100dvh] p-6"><div className="mx-auto mt-24 max-w-4xl animate-pulse"><div className="h-5 w-28 rounded bg-muted" /><div className="mt-6 h-12 w-72 rounded bg-muted" /><div className="mt-8 grid gap-4 md:grid-cols-3">{[1, 2, 3].map((n) => <div key={n} className="h-44 rounded-2xl bg-muted" />)}</div></div></main>;
  if (setupQ.isError) return <main className="app-shell flex min-h-[100dvh] items-center justify-center p-6"><div className="w-full max-w-md space-y-4"><Brand compact /><Notice>We couldn't check the café setup. Check your connection and reload this page.</Notice><Button data-testid="button-retry-setup-status" variant="outline" onClick={() => setupQ.refetch()}>Try again</Button></div></main>;
  if (setupQ.data?.needsSetup) return <AuthScreen needsSetup />;
  if (sessionQ.isError || !sessionQ.data) return <AuthScreen needsSetup={false} />;
  const session = sessionQ.data;
  return <Shell session={session}><RouterSwitch><Route path="/" component={Checkout} /><Route path="/orders" component={OrdersPage} /><Route path="/customers" component={CustomersPage} /><Route path="/catalog" component={CatalogPage} /><Route path="/team">{session.role === 'Admin' ? <TeamPage /> : <RestrictedPage />}</Route><Route path="/automation">{session.role === 'Admin' ? <AutomationPage /> : <RestrictedPage />}</Route><Route component={NotFound} /></RouterSwitch></Shell>;
}
function RestrictedPage() { return <div className="mx-auto max-w-lg py-20 text-center"><div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-accent text-primary"><LockKeyhole className="h-6 w-6" /></div><h1 className="display mt-5 text-3xl">Admin access only.</h1><p className="mt-2 text-sm text-muted-foreground">This part of the café is reserved for an administrator.</p></div>; }
function App() { return <QueryClientProvider client={queryClient}><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><AuthenticatedApp /></WouterRouter></QueryClientProvider>; }

export default App;
