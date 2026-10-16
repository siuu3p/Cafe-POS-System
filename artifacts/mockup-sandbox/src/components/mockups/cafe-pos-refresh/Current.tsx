import { useMemo, useState } from "react";
import {
  Banknote,
  Clock3,
  Coffee,
  CreditCard,
  CupSoda,
  LogOut,
  Package,
  Plus,
  Search,
  ShoppingBag,
  ShoppingCart,
  Users,
  Wallet,
  Webhook,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import "./_group.css";

type Product = {
  id: string;
  name: string;
  category: "Beverage" | "Food" | "Retail";
  basePrice: number;
  isActive: boolean;
};

type CartLine = { key: string; product: Product; quantity: number };
type PaymentMethod = "Card" | "Cash" | "E-Wallet";

const products: Product[] = [
  { id: "p1", name: "Daybreak Oat Latte", category: "Beverage", basePrice: 5.25, isActive: true },
  { id: "p2", name: "Brown Sugar Cold Brew", category: "Beverage", basePrice: 5.75, isActive: true },
  { id: "p3", name: "Honey Cinnamon Flat White", category: "Beverage", basePrice: 5.5, isActive: true },
  { id: "p4", name: "Matcha Cloud", category: "Beverage", basePrice: 5.95, isActive: true },
  { id: "p5", name: "Butter Croissant", category: "Food", basePrice: 3.75, isActive: true },
  { id: "p6", name: "Cardamom Morning Bun", category: "Food", basePrice: 4.25, isActive: true },
  { id: "p7", name: "Seasonal Berry Tart", category: "Food", basePrice: 4.95, isActive: true },
  { id: "p8", name: "House Blend · 12 oz", category: "Retail", basePrice: 16, isActive: true },
];

const customers = [
  { id: "guest", name: "Walk-in guest", loyaltyPointsBalance: 0 },
  { id: "c1", name: "Jamie Rivera", loyaltyPointsBalance: 120 },
  { id: "c2", name: "Sam Chen", loyaltyPointsBalance: 45 },
];

const money = (value = 0) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);

function Brand() {
  return (
    <div className="flex items-center gap-3">
      <div className="grid h-10 w-10 place-items-center rounded-2xl bg-sidebar-primary text-sidebar-primary-foreground">
        <CupSoda className="h-5 w-5" />
      </div>
      <div>
        <div className="display text-xl font-semibold leading-none">Daybreak</div>
        <div className="mono mt-1 text-[9px] uppercase tracking-[.2em] opacity-60">Café counter</div>
      </div>
    </div>
  );
}

function CheckoutShell({ children }: { children: React.ReactNode }) {
  const navItems = [
    { label: "Checkout", icon: ShoppingCart, active: true },
    { label: "Orders", icon: ShoppingBag },
    { label: "Customers", icon: Users },
    { label: "Catalog", icon: Package },
    { label: "Team", icon: Users },
    { label: "Automation", icon: Webhook },
  ];

  return (
    <div className="noise app-shell min-h-[100dvh] text-foreground">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[248px] flex-col border-r border-sidebar-border bg-sidebar px-4 py-6 text-sidebar-foreground lg:flex">
        <div className="px-2"><Brand /></div>
        <div className="mb-3 mt-11 px-3 mono text-[10px] uppercase tracking-[.2em] text-sidebar-foreground/45">Workspace</div>
        <nav className="space-y-1">
          {navItems.map(({ label, icon: Icon, active }) => (
            <div
              key={label}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm ${active ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold" : "text-sidebar-foreground/70"}`}
            >
              <Icon className="h-[17px] w-[17px]" />
              {label}
              {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-sidebar-primary" />}
            </div>
          ))}
        </nav>
        <div className="mt-auto">
          <div className="mb-4 rounded-2xl border border-sidebar-border bg-sidebar-accent/60 p-4">
            <div className="flex items-center gap-2 text-xs font-semibold"><span className="h-2 w-2 rounded-full bg-emerald-400" />System ready</div>
            <p className="mt-2 text-xs leading-5 text-sidebar-foreground/55">Sales and team are in sync.</p>
          </div>
          <div className="flex items-center gap-3 rounded-2xl px-2 py-2">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-sidebar-primary/20 text-xs font-semibold text-sidebar-primary">AR</div>
            <div className="min-w-0 flex-1"><div className="truncate text-sm font-medium">Avery Rivera</div><div className="text-xs text-sidebar-foreground/50">Barista</div></div>
            <LogOut className="h-4 w-4 text-sidebar-foreground/60" />
          </div>
        </div>
      </aside>
      <div className="lg:pl-[248px]">
        <header className="sticky top-0 z-20 flex h-[68px] items-center justify-between border-b border-border/80 bg-background/90 px-4 backdrop-blur-xl sm:px-8">
          <div className="flex items-center gap-2 lg:hidden"><Brand /></div>
          <div className="hidden text-sm text-muted-foreground lg:block">A good day to make someone’s day.</div>
          <div className="flex items-center gap-3">
            <span className="hidden items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground sm:flex"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />Service is live</span>
            <Button className="hidden lg:inline-flex" variant="outline" size="sm"><LogOut className="mr-2 h-4 w-4" />Sign out</Button>
          </div>
        </header>
        <main className="mx-auto max-w-[1500px] px-4 py-6 sm:px-8 sm:py-9">
          <div className="mb-4 flex gap-1 overflow-x-auto pb-2 lg:hidden">{navItems.slice(0, 4).map(({ label, active }) => <span key={label} className={`shrink-0 rounded-full px-3 py-2 text-xs ${active ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground"}`}>{label}</span>)}</div>
          {children}
        </main>
      </div>
    </div>
  );
}

export function Current() {
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [payment, setPayment] = useState<PaymentMethod>("Card");

  const categories = ["All", "Beverage", "Food", "Retail"];
  const filteredProducts = useMemo(
    () => products.filter((product) => product.isActive && (category === "All" || product.category === category) && product.name.toLowerCase().includes(search.toLowerCase())),
    [category, search],
  );
  const cartTotal = cart.reduce((sum, line) => sum + line.product.basePrice * line.quantity, 0);
  const addToOrder = (product: Product) =>
    setCart((current) => {
      const existing = current.find((line) => line.product.id === product.id);
      return existing
        ? current.map((line) => line.product.id === product.id ? { ...line, quantity: line.quantity + 1 } : line)
        : [...current, { key: product.id, product, quantity: 1 }];
    });
  const setQuantity = (key: string, quantity: number) =>
    setCart((current) => current.map((line) => line.key === key ? { ...line, quantity } : line).filter((line) => line.quantity > 0));

  return (
    <CheckoutShell>
      <div className="page-enter">
        <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="mono text-[10px] uppercase tracking-[.2em] text-muted-foreground">Counter · New sale</p>
            <h1 className="display mt-2 text-[2.4rem] font-semibold leading-none sm:text-5xl">Make it a good one.</h1>
            <p className="mt-3 max-w-xl text-sm text-muted-foreground">Tap a favorite, make it theirs, and send it on its way.</p>
          </div>
          <div className="flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-3">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-accent text-accent-foreground"><Clock3 className="h-4 w-4" /></div>
            <div><span className="mono block text-[9px] uppercase tracking-wider text-muted-foreground">Today so far</span><strong className="text-sm">$1,286.50</strong></div>
          </div>
        </div>

        <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <section className="min-w-0">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative w-full max-w-sm"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input className="pl-9" placeholder="Find a drink, bite, or bean…" value={search} onChange={(event) => setSearch(event.target.value)} /></div>
              <div className="flex gap-1 rounded-xl bg-muted p-1">{categories.map((label) => <button key={label} className={`rounded-lg px-3 py-2 text-xs font-medium transition-colors ${category === label ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`} onClick={() => setCategory(label)}>{label}</button>)}</div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
              {filteredProducts.map((product, index) => (
                <button key={product.id} onClick={() => addToOrder(product)} className="product-tile soft-shadow group relative flex min-h-[150px] flex-col justify-between overflow-hidden rounded-2xl border border-border bg-card p-4 text-left">
                  <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-accent/55 transition-transform group-hover:scale-125" />
                  <div className="relative flex w-full items-start justify-between">
                    <span className={`grid h-9 w-9 place-items-center rounded-xl ${index % 3 === 0 ? "bg-emerald-100 text-emerald-800" : index % 3 === 1 ? "bg-orange-100 text-orange-800" : "bg-sky-100 text-sky-800"}`}>
                      {product.category === "Beverage" ? <Coffee className="h-4 w-4" /> : product.category === "Food" ? <CupSoda className="h-4 w-4" /> : <ShoppingBag className="h-4 w-4" />}
                    </span>
                    <Plus className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                  </div>
                  <div className="relative mt-5"><span className="block text-sm font-semibold leading-tight">{product.name}</span><span className="mono mt-1.5 block text-xs text-muted-foreground">{money(product.basePrice)}</span></div>
                </button>
              ))}
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-border bg-card/70 p-4"><span className="mono text-[9px] uppercase tracking-wider text-muted-foreground">Orders today</span><div className="mt-1 text-xl font-semibold">32</div></div>
              <div className="rounded-2xl border border-border bg-card/70 p-4"><span className="mono text-[9px] uppercase tracking-wider text-muted-foreground">Average ticket</span><div className="mt-1 text-xl font-semibold">{money(12.42)}</div></div>
              <div className="col-span-2 rounded-2xl border border-border bg-card/70 p-4 sm:col-span-1"><span className="mono text-[9px] uppercase tracking-wider text-muted-foreground">Recently served</span><div className="mt-1 flex items-center gap-2 text-sm font-medium"><Clock3 className="h-4 w-4 text-muted-foreground" />8 orders today</div></div>
            </div>
          </section>

          <aside className="soft-shadow overflow-hidden rounded-[1.5rem] border border-border bg-card xl:sticky xl:top-[88px]">
            <div className="flex items-center justify-between border-b border-border px-5 py-4"><div><div className="flex items-center gap-2"><ShoppingCart className="h-4 w-4 text-primary" /><h2 className="font-semibold">Current order</h2></div><p className="mt-1 text-xs text-muted-foreground">{cart.reduce((sum, line) => sum + line.quantity, 0)} items · made fresh</p></div><span className="mono rounded-full bg-muted px-2.5 py-1 text-xs">{cart.length}</span></div>
            <div className="max-h-[34vh] min-h-[90px] space-y-3 overflow-auto px-5 py-4 xl:max-h-[360px]">
              {!cart.length ? <div className="flex h-24 flex-col items-center justify-center text-center"><div className="grid h-9 w-9 place-items-center rounded-full bg-muted"><ShoppingBag className="h-4 w-4 text-muted-foreground" /></div><p className="mt-2 text-sm font-medium">A fresh start.</p><p className="text-xs text-muted-foreground">Choose something from the menu.</p></div> : cart.map((line) => (
                <div key={line.key} className="rounded-xl bg-background/75 p-3"><div className="flex items-start justify-between gap-2"><p className="text-sm font-semibold">{line.product.name}</p><span className="mono text-xs">{money(line.product.basePrice * line.quantity)}</span></div><div className="mt-2 flex items-center gap-2"><button className="grid h-7 w-7 place-items-center rounded-lg border border-border" onClick={() => setQuantity(line.key, line.quantity - 1)} aria-label="Decrease quantity">−</button><span className="mono w-5 text-center text-xs">{line.quantity}</span><button className="grid h-7 w-7 place-items-center rounded-lg border border-border" onClick={() => setQuantity(line.key, line.quantity + 1)} aria-label="Increase quantity">+</button><button className="ml-auto text-xs text-muted-foreground" onClick={() => setQuantity(line.key, 0)}>Remove</button></div></div>
              ))}
            </div>
            <div className="space-y-4 border-t border-border px-5 py-4">
              <div className="space-y-2"><Label className="text-xs">Customer <span className="font-normal text-muted-foreground">· optional</span></Label><select value={customerId} onChange={(event) => setCustomerId(event.target.value)} className="h-10 w-full appearance-none rounded-xl border border-input bg-background px-3 text-sm"><option value="">Walk-in guest</option>{customers.slice(1).map((customer) => <option key={customer.id} value={customer.id}>{customer.name} · {customer.loyaltyPointsBalance} pts</option>)}</select></div>
              <div className="space-y-2"><Label className="text-xs">Payment method</Label><div className="grid grid-cols-3 gap-2">{(["Card", "Cash", "E-Wallet"] as const).map((method) => { const Icon = method === "Card" ? CreditCard : method === "Cash" ? Banknote : Wallet; return <button key={method} onClick={() => setPayment(method)} className={`flex flex-col items-center gap-1 rounded-xl border px-2 py-2.5 text-[10px] transition-colors ${payment === method ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground hover:bg-muted"}`}><Icon className="h-4 w-4" />{method}</button>; })}</div></div>
              <div className="flex items-center justify-between border-t border-dashed border-border pt-3"><span className="text-sm text-muted-foreground">Total</span><strong className="display text-2xl">{money(cartTotal)}</strong></div>
              <Button disabled={!cart.length} className="h-12 w-full text-sm">Complete sale <span className="ml-auto">→</span></Button>
              <p className="text-center text-[10px] text-muted-foreground">A receipt will be ready as soon as the sale is complete.</p>
            </div>
          </aside>
        </div>
      </div>
    </CheckoutShell>
  );
}
