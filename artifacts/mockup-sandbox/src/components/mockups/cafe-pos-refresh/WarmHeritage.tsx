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
      <div className="heritage-brand-mark grid h-10 w-10 place-items-center rounded-[14px]">
        <CupSoda className="h-5 w-5" />
      </div>
      <div>
        <div className="heritage-display text-xl font-semibold leading-none">Daybreak</div>
        <div className="heritage-mono mt-1 text-[9px] uppercase tracking-[.2em] opacity-65">Café counter</div>
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
    <div className="warm-heritage min-h-[100dvh] text-[var(--ink)]">
      <style>{`
        .warm-heritage {
          --paper: #f3eee3;
          --paper-deep: #e9e0d0;
          --surface: #fbf8f0;
          --surface-raised: #fffdf7;
          --ink: #2d3328;
          --ink-soft: #6d7164;
          --line: #d9cfbd;
          --line-strong: #c8baa2;
          --moss: #33463a;
          --moss-deep: #26392f;
          --moss-light: #42584a;
          --saffron: #c58a3b;
          --saffron-pale: #efe0c5;
          --clay: #a85f43;
          --display: 'Fraunces', Georgia, serif;
          --body: 'DM Sans', ui-sans-serif, sans-serif;
          --mono: 'DM Mono', ui-monospace, monospace;
          font-family: var(--body);
          background: var(--paper);
          color: var(--ink);
          -webkit-font-smoothing: antialiased;
        }
        .warm-heritage * { box-sizing: border-box; }
        .warm-heritage .heritage-display { font-family: var(--display); letter-spacing: -.04em; }
        .warm-heritage .heritage-mono { font-family: var(--mono); }
        .warm-heritage .heritage-paper {
          background:
            radial-gradient(ellipse at 78% 4%, rgba(197,138,59,.095), transparent 28rem),
            linear-gradient(135deg, rgba(255,255,255,.16), transparent 44%),
            var(--paper);
        }
        .warm-heritage .heritage-side {
          background:
            radial-gradient(ellipse at 100% 0%, rgba(197,138,59,.12), transparent 22rem),
            var(--moss-deep);
          color: #f5f0e4;
          border-color: rgba(246,238,220,.14);
        }
        .warm-heritage .heritage-brand-mark {
          color: #352f24;
          background: var(--saffron);
          box-shadow: inset 0 1px 0 rgba(255,255,255,.26), 0 3px 0 rgba(0,0,0,.1);
        }
        .warm-heritage .heritage-nav-active {
          color: #fff9eb;
          background: rgba(255,255,255,.09);
          box-shadow: inset 3px 0 0 var(--saffron);
        }
        .warm-heritage .heritage-rule { border-color: var(--line); }
        .warm-heritage .heritage-card {
          background: var(--surface);
          border: 1px solid var(--line);
          box-shadow: 0 9px 26px rgba(65,49,28,.055), 0 1px 2px rgba(65,49,28,.06);
        }
        .warm-heritage .heritage-subtle-card {
          background: rgba(251,248,240,.72);
          border: 1px solid var(--line);
        }
        .warm-heritage .heritage-input {
          color: var(--ink);
          background: var(--surface-raised);
          border: 1px solid var(--line-strong);
          box-shadow: inset 0 1px 2px rgba(68,51,29,.035);
        }
        .warm-heritage .heritage-input:focus {
          outline: 2px solid rgba(197,138,59,.38);
          outline-offset: 1px;
          border-color: var(--saffron);
        }
        .warm-heritage .heritage-filter {
          color: var(--ink-soft);
          transition: color .16s ease, background-color .16s ease, transform .16s ease;
        }
        .warm-heritage .heritage-filter:hover { color: var(--ink); }
        .warm-heritage .heritage-filter-active {
          color: var(--ink);
          background: var(--surface-raised);
          box-shadow: 0 1px 3px rgba(64,48,29,.12);
        }
        .warm-heritage .heritage-tile {
          position: relative;
          background: var(--surface);
          border: 1px solid var(--line);
          box-shadow: 0 2px 4px rgba(65,49,28,.035);
          transition: transform .18s ease, border-color .18s ease, box-shadow .18s ease;
        }
        .warm-heritage .heritage-tile:hover {
          transform: translateY(-2px);
          border-color: #bda985;
          box-shadow: 0 10px 22px rgba(65,49,28,.095);
        }
        .warm-heritage .heritage-tile::after {
          content: "";
          position: absolute;
          left: 16px;
          right: 16px;
          bottom: 0;
          height: 2px;
          background: var(--saffron);
          transform: scaleX(0);
          transform-origin: left;
          transition: transform .18s ease;
        }
        .warm-heritage .heritage-tile:hover::after { transform: scaleX(1); }
        .warm-heritage .heritage-tile-orbit {
          background: radial-gradient(circle, rgba(197,138,59,.16), rgba(197,138,59,0) 70%);
          transition: transform .18s ease;
        }
        .warm-heritage .heritage-tile:hover .heritage-tile-orbit { transform: scale(1.25); }
        .warm-heritage .heritage-icon-0 { background: #e4e9dc; color: #3d5b43; }
        .warm-heritage .heritage-icon-1 { background: #f1e1cd; color: #8b5735; }
        .warm-heritage .heritage-icon-2 { background: #e3e8e4; color: #52645b; }
        .warm-heritage .heritage-cta {
          color: #fff8e8;
          background: var(--moss);
          border: 1px solid var(--moss);
          box-shadow: 0 3px 0 #203128, 0 7px 14px rgba(45,62,48,.14);
          transition: transform .16s ease, background-color .16s ease, box-shadow .16s ease;
        }
        .warm-heritage .heritage-cta:hover:not(:disabled) {
          background: #405848;
          transform: translateY(-1px);
          box-shadow: 0 4px 0 #203128, 0 10px 17px rgba(45,62,48,.17);
        }
        .warm-heritage .heritage-cta:active:not(:disabled) {
          transform: translateY(1px);
          box-shadow: 0 1px 0 #203128;
        }
        .warm-heritage .heritage-cta:disabled {
          opacity: .43;
          cursor: not-allowed;
          box-shadow: none;
        }
        .warm-heritage .heritage-stepper {
          border: 1px solid var(--line-strong);
          background: var(--surface-raised);
          transition: background-color .15s ease, border-color .15s ease;
        }
        .warm-heritage .heritage-stepper:hover { background: var(--saffron-pale); border-color: var(--saffron); }
        .warm-heritage .heritage-payment {
          border-color: var(--line);
          color: var(--ink-soft);
          background: var(--surface-raised);
          transition: all .16s ease;
        }
        .warm-heritage .heritage-payment:hover { background: #f3eddf; color: var(--ink); }
        .warm-heritage .heritage-payment-active {
          color: var(--moss);
          background: #edf0e7;
          border-color: #82927e;
          box-shadow: inset 0 0 0 1px rgba(51,70,58,.12);
        }
        .warm-heritage .heritage-select { color: var(--ink); background: var(--surface-raised); border-color: var(--line-strong); }
        .warm-heritage .heritage-select:focus { outline: 2px solid rgba(197,138,59,.38); outline-offset: 1px; }
        .warm-heritage .heritage-muted { color: var(--ink-soft); }
        .warm-heritage .heritage-highlight { color: var(--moss); }
        .warm-heritage .heritage-header {
          background: rgba(243,238,227,.93);
          border-color: var(--line);
          backdrop-filter: blur(14px);
        }
        .warm-heritage .heritage-top-mark {
          height: 1px;
          width: 30px;
          background: var(--saffron);
        }
        .warm-heritage .heritage-empty-mark {
          color: #786947;
          background: var(--saffron-pale);
        }
        .warm-heritage .heritage-entry { animation: heritage-entry .32s cubic-bezier(.2,.7,.2,1) both; }
        @keyframes heritage-entry {
          from { opacity: 0; transform: translateY(7px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .warm-heritage *, .warm-heritage *::before, .warm-heritage *::after {
            animation-duration: .01ms !important;
            transition-duration: .01ms !important;
          }
        }
      `}</style>
      <aside className="heritage-side fixed inset-y-0 left-0 z-30 hidden w-[248px] flex-col border-r px-4 py-6 lg:flex">
        <div className="px-2"><Brand /></div>
        <div className="mb-3 mt-11 px-3 heritage-mono text-[10px] uppercase tracking-[.2em] text-[#e2d7c2]/45">Workspace</div>
        <nav className="space-y-1">
          {navItems.map(({ label, icon: Icon, active }) => (
            <div
              key={label}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${active ? "heritage-nav-active font-semibold" : "text-[#f5f0e4]/70 hover:bg-white/[.045] hover:text-[#fff9eb]"}`}
            >
              <Icon className="h-[17px] w-[17px]" />
              {label}
              {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#d39a4b]" />}
            </div>
          ))}
        </nav>
        <div className="mt-auto">
          <div className="mb-4 rounded-2xl border border-white/10 bg-white/[.045] p-4">
            <div className="flex items-center gap-2 text-xs font-semibold"><span className="h-2 w-2 rounded-full bg-[#a8bd88] shadow-[0_0_0_3px_rgba(168,189,136,.12)]" />System ready</div>
            <p className="mt-2 text-xs leading-5 text-[#e2d7c2]/60">Sales and team are in sync.</p>
          </div>
          <div className="flex items-center gap-3 rounded-2xl px-2 py-2">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-[#d39a4b]/20 text-xs font-semibold text-[#e3b66f]">AR</div>
            <div className="min-w-0 flex-1"><div className="truncate text-sm font-medium">Avery Rivera</div><div className="text-xs text-[#e2d7c2]/55">Barista</div></div>
            <LogOut className="h-4 w-4 text-[#e2d7c2]/60" />
          </div>
        </div>
      </aside>
      <div className="lg:pl-[248px]">
        <header className="heritage-header sticky top-0 z-20 flex h-[68px] items-center justify-between border-b px-4 sm:px-8">
          <div className="flex items-center gap-2 lg:hidden"><Brand /></div>
          <div className="hidden items-center gap-3 text-sm heritage-muted lg:flex"><span className="heritage-top-mark" />A good day to make someone’s day.</div>
          <div className="flex items-center gap-3">
            <span className="hidden items-center gap-2 rounded-full border border-[#c9c0ad] bg-[#fbf8f0] px-3 py-1.5 text-xs heritage-muted sm:flex"><span className="h-1.5 w-1.5 rounded-full bg-[#78916e]" />Service is live</span>
            <button className="hidden h-9 items-center rounded-lg border border-[#c8baa2] bg-[#fbf8f0] px-3 text-xs font-semibold text-[#39463a] transition-colors hover:bg-[#eee6d7] lg:inline-flex"><LogOut className="mr-2 h-4 w-4" />Sign out</button>
          </div>
        </header>
        <main className="heritage-paper mx-auto max-w-[1500px] px-4 py-6 sm:px-8 sm:py-9">
          {children}
        </main>
      </div>
    </div>
  );
}

export function WarmHeritage() {
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
      <div className="mb-4 flex gap-1 overflow-x-auto pb-2 lg:hidden">{["Checkout", "Orders", "Customers", "Catalog"].map((label, index) => <span key={label} className={`shrink-0 rounded-full px-3 py-2 text-xs ${index === 0 ? "bg-[#33463a] text-[#fff8e8]" : "bg-[#fbf8f0] text-[#6d7164]"}`}>{label}</span>)}</div>
      <div className="heritage-entry">
        <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="heritage-mono text-[10px] uppercase tracking-[.2em] heritage-muted">Counter · New sale</p>
            <h1 className="heritage-display mt-2 text-[2.4rem] font-semibold leading-none sm:text-5xl">Make it a good one.</h1>
            <p className="mt-3 max-w-xl text-sm heritage-muted">Tap a favorite, make it theirs, and send it on its way.</p>
          </div>
          <div className="heritage-card flex items-center gap-3 rounded-2xl px-4 py-3">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-[#efe0c5] text-[#76542a]"><Clock3 className="h-4 w-4" /></div>
            <div><span className="heritage-mono block text-[9px] uppercase tracking-wider heritage-muted">Today so far</span><strong className="text-sm">$1,286.50</strong></div>
          </div>
        </div>
        <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <section className="min-w-0">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-3 top-3 h-4 w-4 heritage-muted" />
                <input className="heritage-input h-10 w-full rounded-xl pl-9 pr-3 text-sm placeholder:text-[#8b8a7c]" placeholder="Find a drink, bite, or bean…" value={search} onChange={(event) => setSearch(event.target.value)} />
              </div>
              <div className="flex gap-1 rounded-xl border border-[#d9cfbd] bg-[#e9e0d0] p-1">{categories.map((label) => <button key={label} className={`heritage-filter rounded-lg px-3 py-2 text-xs font-medium ${category === label ? "heritage-filter-active" : ""}`} onClick={() => setCategory(label)}>{label}</button>)}</div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
              {filteredProducts.map((product, index) => (
                <button key={product.id} onClick={() => addToOrder(product)} className="heritage-tile group relative flex min-h-[150px] flex-col justify-between overflow-hidden rounded-2xl p-4 text-left">
                  <div className="heritage-tile-orbit absolute -right-8 -top-8 h-24 w-24 rounded-full" />
                  <div className="relative flex w-full items-start justify-between">
                    <span className={`grid h-9 w-9 place-items-center rounded-xl heritage-icon-${index % 3}`}>
                      {product.category === "Beverage" ? <Coffee className="h-4 w-4" /> : product.category === "Food" ? <CupSoda className="h-4 w-4" /> : <ShoppingBag className="h-4 w-4" />}
                    </span>
                    <Plus className="h-4 w-4 text-[#77796c] opacity-0 transition-opacity group-hover:opacity-100" />
                  </div>
                  <div className="relative mt-5"><span className="block text-sm font-semibold leading-tight">{product.name}</span><span className="heritage-mono mt-1.5 block text-xs heritage-muted">{money(product.basePrice)}</span></div>
                </button>
              ))}
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="heritage-subtle-card rounded-2xl p-4"><span className="heritage-mono text-[9px] uppercase tracking-wider heritage-muted">Orders today</span><div className="mt-1 text-xl font-semibold">32</div></div>
              <div className="heritage-subtle-card rounded-2xl p-4"><span className="heritage-mono text-[9px] uppercase tracking-wider heritage-muted">Average ticket</span><div className="mt-1 text-xl font-semibold">{money(12.42)}</div></div>
              <div className="heritage-subtle-card col-span-2 rounded-2xl p-4 sm:col-span-1"><span className="heritage-mono text-[9px] uppercase tracking-wider heritage-muted">Recently served</span><div className="mt-1 flex items-center gap-2 text-sm font-medium"><Clock3 className="h-4 w-4 heritage-muted" />8 orders today</div></div>
            </div>
          </section>
          <aside className="heritage-card overflow-hidden rounded-[1.5rem] xl:sticky xl:top-[88px]">
            <div className="flex items-center justify-between border-b heritage-rule px-5 py-4"><div><div className="flex items-center gap-2"><ShoppingCart className="h-4 w-4 text-[#52694f]" /><h2 className="font-semibold">Current order</h2></div><p className="mt-1 text-xs heritage-muted">{cart.reduce((sum, line) => sum + line.quantity, 0)} items · made fresh</p></div><span className="heritage-mono rounded-full bg-[#eee7d9] px-2.5 py-1 text-xs">{cart.length}</span></div>
            <div className="max-h-[34vh] min-h-[90px] space-y-3 overflow-auto px-5 py-4 xl:max-h-[360px]">
              {!cart.length ? <div className="flex h-24 flex-col items-center justify-center text-center"><div className="heritage-empty-mark grid h-9 w-9 place-items-center rounded-full"><ShoppingBag className="h-4 w-4" /></div><p className="mt-2 text-sm font-medium">A fresh start.</p><p className="text-xs heritage-muted">Choose something from the menu.</p></div> : cart.map((line) => (
                <div key={line.key} className="rounded-xl border border-[#e4dccd] bg-[#f6f1e7] p-3"><div className="flex items-start justify-between gap-2"><p className="text-sm font-semibold">{line.product.name}</p><span className="heritage-mono text-xs">{money(line.product.basePrice * line.quantity)}</span></div><div className="mt-2 flex items-center gap-2"><button className="heritage-stepper grid h-8 w-8 place-items-center rounded-lg" onClick={() => setQuantity(line.key, line.quantity - 1)} aria-label="Decrease quantity">−</button><span className="heritage-mono w-5 text-center text-xs">{line.quantity}</span><button className="heritage-stepper grid h-8 w-8 place-items-center rounded-lg" onClick={() => setQuantity(line.key, line.quantity + 1)} aria-label="Increase quantity">+</button><button className="ml-auto rounded-md px-2 py-1 text-xs heritage-muted transition-colors hover:bg-[#ebe2d3] hover:text-[#7b4837]" onClick={() => setQuantity(line.key, 0)}>Remove</button></div></div>
              ))}
            </div>
            <div className="space-y-4 border-t heritage-rule px-5 py-4">
              <div className="space-y-2"><label className="text-xs font-medium">Customer <span className="font-normal heritage-muted">· optional</span></label><select value={customerId} onChange={(event) => setCustomerId(event.target.value)} className="heritage-select h-10 w-full appearance-none rounded-xl border px-3 text-sm"><option value="">Walk-in guest</option>{customers.slice(1).map((customer) => <option key={customer.id} value={customer.id}>{customer.name} · {customer.loyaltyPointsBalance} pts</option>)}</select></div>
              <div className="space-y-2"><label className="text-xs font-medium">Payment method</label><div className="grid grid-cols-3 gap-2">{(["Card", "Cash", "E-Wallet"] as const).map((method) => { const Icon = method === "Card" ? CreditCard : method === "Cash" ? Banknote : Wallet; return <button key={method} onClick={() => setPayment(method)} className={`heritage-payment flex min-h-[58px] flex-col items-center justify-center gap-1 rounded-xl border px-2 py-2.5 text-[10px] ${payment === method ? "heritage-payment-active" : ""}`}><Icon className="h-4 w-4" />{method}</button>; })}</div></div>
              <div className="flex items-center justify-between border-t border-dashed border-[#cfc2ac] pt-3"><span className="text-sm heritage-muted">Total</span><strong className="heritage-display text-2xl">{money(cartTotal)}</strong></div>
              <button disabled={!cart.length} className="heritage-cta flex h-12 w-full items-center rounded-xl px-4 text-sm font-semibold">Complete sale <span className="ml-auto text-lg">→</span></button>
              <p className="text-center text-[10px] heritage-muted">A receipt will be ready as soon as the sale is complete.</p>
            </div>
          </aside>
        </div>
      </div>
    </CheckoutShell>
  );
}
