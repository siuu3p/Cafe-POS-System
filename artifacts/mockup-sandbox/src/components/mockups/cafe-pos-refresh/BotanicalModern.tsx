import { useMemo, useState, type CSSProperties } from "react";
import {
  Banknote,
  Clock3,
  Coffee,
  CreditCard,
  CupSoda,
  Leaf,
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

const navItems = [
  { label: "Checkout", icon: ShoppingCart, active: true },
  { label: "Orders", icon: ShoppingBag },
  { label: "Customers", icon: Users },
  { label: "Catalog", icon: Package },
  { label: "Team", icon: Users },
  { label: "Automation", icon: Webhook },
];

function Brand() {
  return (
    <div className="flex items-center gap-3">
      <div className="bm-brand-mark grid h-10 w-10 place-items-center rounded-[14px]">
        <CupSoda className="h-5 w-5" strokeWidth={1.8} />
      </div>
      <div>
        <div className="bm-display text-xl font-semibold leading-none">Daybreak</div>
        <div className="bm-mono mt-1 text-[9px] uppercase tracking-[.2em] opacity-65">Café counter</div>
      </div>
    </div>
  );
}

export function BotanicalModern() {
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [payment, setPayment] = useState<PaymentMethod>("Card");
  const categories = ["All", "Beverage", "Food", "Retail"];

  const filteredProducts = useMemo(
    () =>
      products.filter(
        (product) =>
          product.isActive &&
          (category === "All" || product.category === category) &&
          product.name.toLowerCase().includes(search.toLowerCase()),
      ),
    [category, search],
  );
  const cartTotal = cart.reduce((sum, line) => sum + line.product.basePrice * line.quantity, 0);
  const itemCount = cart.reduce((sum, line) => sum + line.quantity, 0);

  const addToOrder = (product: Product) =>
    setCart((current) => {
      const existing = current.find((line) => line.product.id === product.id);
      return existing
        ? current.map((line) =>
            line.product.id === product.id ? { ...line, quantity: line.quantity + 1 } : line,
          )
        : [...current, { key: product.id, product, quantity: 1 }];
    });

  const setQuantity = (key: string, quantity: number) =>
    setCart((current) =>
      current.map((line) => (line.key === key ? { ...line, quantity } : line)).filter((line) => line.quantity > 0),
    );

  return (
    <div
      className="botanical-modern min-h-[100dvh] text-[#213b32]"
      style={
        {
          "--bm-bg": "#f3f7ee",
          "--bm-paper": "#fffef9",
          "--bm-paper-soft": "#f8fbf4",
          "--bm-ink": "#213b32",
          "--bm-muted": "#74867a",
          "--bm-line": "#dce7d9",
          "--bm-green": "#2f7055",
          "--bm-green-dark": "#22543f",
          "--bm-mint": "#e4f1e4",
          "--bm-citrus": "#f2d778",
          "--bm-shadow": "38 74 53",
        } as CSSProperties
      }
    >
      <style>{`
        .botanical-modern {
          --bm-font-display: "Fraunces", "Georgia", serif;
          --bm-font-body: "DM Sans", "Trebuchet MS", sans-serif;
          --bm-font-mono: "DM Mono", monospace;
          font-family: var(--bm-font-body);
          background:
            radial-gradient(ellipse at 84% -4%, rgba(214, 235, 203, .64), transparent 31rem),
            var(--bm-bg);
        }
        .botanical-modern * { box-sizing: border-box; }
        .botanical-modern .bm-display { font-family: var(--bm-font-display); letter-spacing: -.04em; }
        .botanical-modern .bm-mono { font-family: var(--bm-font-mono); }
        .botanical-modern .bm-sidebar { background: #edf4e9; border-color: #d8e5d5; }
        .botanical-modern .bm-brand-mark { background: var(--bm-green); color: #f7f7df; }
        .botanical-modern .bm-main-nav { color: #667a6d; transition: background .18s ease, color .18s ease; }
        .botanical-modern .bm-main-nav:hover { background: rgba(255,255,255,.78); color: var(--bm-ink); }
        .botanical-modern .bm-main-nav-active { color: var(--bm-green-dark); background: #dcebdc; }
        .botanical-modern .bm-product { transition: transform .18s ease, border-color .18s ease, box-shadow .18s ease; }
        .botanical-modern .bm-product:hover { transform: translateY(-2px); border-color: #a9c9ab; box-shadow: 0 12px 25px rgba(var(--bm-shadow), .09); }
        .botanical-modern .bm-button { transition: background .16s ease, color .16s ease, border-color .16s ease, transform .16s ease; }
        .botanical-modern .bm-button:active { transform: translateY(1px); }
        .botanical-modern button:focus-visible, .botanical-modern input:focus-visible, .botanical-modern select:focus-visible {
          outline: 3px solid rgba(91, 146, 107, .36); outline-offset: 2px;
        }
        .botanical-modern .bm-enter { animation: bm-enter .36s cubic-bezier(.2,.7,.2,1) both; }
        @keyframes bm-enter { from { opacity: 0; transform: translateY(7px); } to { opacity: 1; transform: translateY(0); } }
        @media (prefers-reduced-motion: reduce) {
          .botanical-modern *, .botanical-modern *::before, .botanical-modern *::after { animation-duration: .01ms !important; transition-duration: .01ms !important; }
        }
      `}</style>

      <aside className="bm-sidebar fixed inset-y-0 left-0 z-30 hidden w-[232px] flex-col border-r px-4 py-6 text-[#294638] lg:flex">
        <div className="px-2"><Brand /></div>
        <div className="mb-3 mt-11 px-3 bm-mono text-[10px] uppercase tracking-[.2em] text-[#829487]">Workspace</div>
        <nav className="space-y-1">
          {navItems.map(({ label, icon: Icon, active }) => (
            <div
              key={label}
              className={`bm-main-nav flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm ${
                active ? "bm-main-nav-active font-semibold" : ""
              }`}
            >
              <Icon className="h-[17px] w-[17px]" strokeWidth={1.8} />
              {label}
              {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#4d8a62]" />}
            </div>
          ))}
        </nav>
        <div className="mt-auto">
          <div className="mb-4 rounded-2xl border border-[#d6e4d3] bg-[#f7faf2] p-4">
            <div className="flex items-center gap-2 text-xs font-semibold"><span className="h-2 w-2 rounded-full bg-[#59946a]" />System ready</div>
            <p className="mt-2 text-xs leading-5 text-[#718278]">Sales and team are in sync.</p>
          </div>
          <div className="flex items-center gap-3 rounded-2xl px-2 py-2">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-[#d9e9d7] text-xs font-semibold text-[#37674a]">AR</div>
            <div className="min-w-0 flex-1"><div className="truncate text-sm font-medium">Avery Rivera</div><div className="text-xs text-[#85948a]">Barista</div></div>
            <LogOut className="h-4 w-4 text-[#829187]" />
          </div>
        </div>
      </aside>

      <div className="lg:pl-[232px]">
        <header className="sticky top-0 z-20 flex h-[66px] items-center justify-between border-b border-[#dce7d9]/90 bg-[#f8faf4]/90 px-4 backdrop-blur-xl sm:px-8">
          <div className="flex items-center gap-2 lg:hidden"><Brand /></div>
          <div className="hidden text-sm text-[#718278] lg:block">A good day to make someone’s day.</div>
          <div className="flex items-center gap-3">
            <span className="hidden items-center gap-2 rounded-full border border-[#dce7d9] bg-[#fffef9] px-3 py-1.5 text-xs text-[#708276] sm:flex">
              <span className="h-1.5 w-1.5 rounded-full bg-[#57956b]" />Service is live
            </span>
            <button className="bm-button hidden items-center rounded-lg border border-[#d6e2d3] bg-[#fffef9] px-3 py-2 text-xs font-semibold text-[#45604f] hover:bg-[#eff5ec] lg:inline-flex">
              <LogOut className="mr-2 h-4 w-4" />Sign out
            </button>
          </div>
        </header>

        <main className="mx-auto max-w-[1500px] px-4 py-6 sm:px-8 sm:py-8">
          <div className="mb-4 flex gap-1 overflow-x-auto pb-2 lg:hidden">
            {navItems.slice(0, 4).map(({ label, active }) => (
              <span key={label} className={`shrink-0 rounded-full px-3 py-2 text-xs ${active ? "bg-[#2f7055] text-white" : "bg-[#fffef9] text-[#718278]"}`}>{label}</span>
            ))}
          </div>
          <div className="bm-enter">
            <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <p className="bm-mono text-[10px] uppercase tracking-[.2em] text-[#718278]">Counter · New sale</p>
                <h1 className="bm-display mt-2 text-[2.4rem] font-semibold leading-none text-[#264538] sm:text-5xl">Make it a good one.</h1>
                <p className="mt-3 max-w-xl text-sm text-[#74867a]">Tap a favorite, make it theirs, and send it on its way.</p>
              </div>
              <div className="flex items-center gap-3 rounded-2xl border border-[#dbe7d7] bg-[#fffef9] px-4 py-3 shadow-[0_4px_16px_rgba(38,69,56,.035)]">
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-[#edf3dc] text-[#52754b]"><Clock3 className="h-4 w-4" /></div>
                <div><span className="bm-mono block text-[9px] uppercase tracking-wider text-[#829187]">Today so far</span><strong className="text-sm text-[#294638]">$1,286.50</strong></div>
                <span className="ml-2 hidden h-8 w-px bg-[#e3eadf] sm:block" />
                <Leaf className="hidden h-4 w-4 text-[#8aa16b] sm:block" strokeWidth={1.7} />
              </div>
            </div>

            <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
              <section className="min-w-0">
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="relative w-full max-w-sm">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-[#87968a]" />
                    <input
                      className="h-10 w-full rounded-xl border border-[#d9e5d6] bg-[#fffef9] pl-9 pr-3 text-sm text-[#294638] placeholder:text-[#98a59b] focus:border-[#83ac88]"
                      placeholder="Find a drink, bite, or bean…"
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                    />
                  </div>
                  <div className="flex gap-1 overflow-x-auto rounded-xl border border-[#e2eade] bg-[#eaf1e6] p-1">
                    {categories.map((label) => (
                      <button
                        key={label}
                        className={`bm-button shrink-0 rounded-lg px-3 py-2 text-xs font-medium ${
                          category === label ? "bg-[#fffef9] text-[#2d5c43] shadow-[0_1px_4px_rgba(38,69,56,.1)]" : "text-[#718278] hover:text-[#294638]"
                        }`}
                        onClick={() => setCategory(label)}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                  {filteredProducts.map((product, index) => (
                    <button
                      key={product.id}
                      onClick={() => addToOrder(product)}
                      className="bm-product group relative flex min-h-[150px] flex-col justify-between overflow-hidden rounded-2xl border border-[#dce7d9] bg-[#fffef9] p-4 text-left shadow-[0_2px_8px_rgba(38,69,56,.025)]"
                    >
                      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[#e7f0dd]/90 transition-transform duration-200 group-hover:scale-125" />
                      <div className="relative flex w-full items-start justify-between">
                        <span className={`grid h-9 w-9 place-items-center rounded-xl ${
                          index % 3 === 0 ? "bg-[#e4f0de] text-[#46734d]" : index % 3 === 1 ? "bg-[#f8edcf] text-[#8b7132]" : "bg-[#e3eeec] text-[#416c67]"
                        }`}>
                          {product.category === "Beverage" ? <Coffee className="h-4 w-4" strokeWidth={1.8} /> : product.category === "Food" ? <CupSoda className="h-4 w-4" strokeWidth={1.8} /> : <ShoppingBag className="h-4 w-4" strokeWidth={1.8} />}
                        </span>
                        <Plus className="h-4 w-4 text-[#788c7d] opacity-0 transition-opacity group-hover:opacity-100" />
                      </div>
                      <div className="relative mt-5">
                        <span className="block text-sm font-semibold leading-tight text-[#294638]">{product.name}</span>
                        <span className="bm-mono mt-1.5 block text-xs text-[#74867a]">{money(product.basePrice)}</span>
                      </div>
                    </button>
                  ))}
                  {!filteredProducts.length && (
                    <div className="col-span-full flex min-h-[150px] flex-col items-center justify-center rounded-2xl border border-dashed border-[#cbdac9] bg-[#f8fbf4] text-center">
                      <Search className="h-5 w-5 text-[#90a494]" />
                      <p className="mt-2 text-sm font-medium text-[#45604f]">No matching favorites.</p>
                    </div>
                  )}
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-[#dce7d9] bg-[#fbfcf7] p-4">
                    <span className="bm-mono text-[9px] uppercase tracking-wider text-[#829187]">Orders today</span>
                    <div className="mt-1 text-xl font-semibold text-[#294638]">32</div>
                  </div>
                  <div className="rounded-2xl border border-[#dce7d9] bg-[#fbfcf7] p-4">
                    <span className="bm-mono text-[9px] uppercase tracking-wider text-[#829187]">Average ticket</span>
                    <div className="mt-1 text-xl font-semibold text-[#294638]">{money(12.42)}</div>
                  </div>
                  <div className="col-span-2 rounded-2xl border border-[#dce7d9] bg-[#fbfcf7] p-4 sm:col-span-1">
                    <span className="bm-mono text-[9px] uppercase tracking-wider text-[#829187]">Recently served</span>
                    <div className="mt-1 flex items-center gap-2 text-sm font-medium text-[#45604f]"><Clock3 className="h-4 w-4 text-[#79907e]" />8 orders today</div>
                  </div>
                </div>
              </section>

              <aside className="overflow-hidden rounded-[1.5rem] border border-[#d9e5d6] bg-[#fffef9] shadow-[0_14px_34px_rgba(38,69,56,.075)] xl:sticky xl:top-[86px]">
                <div className="flex items-center justify-between border-b border-[#e3eadf] px-5 py-4">
                  <div>
                    <div className="flex items-center gap-2"><ShoppingCart className="h-4 w-4 text-[#3b7857]" /><h2 className="font-semibold text-[#294638]">Current order</h2></div>
                    <p className="mt-1 text-xs text-[#7b8b7e]">{itemCount} items · made fresh</p>
                  </div>
                  <span className="bm-mono rounded-full bg-[#edf3e9] px-2.5 py-1 text-xs text-[#52715b]">{cart.length}</span>
                </div>
                <div className="max-h-[34vh] min-h-[90px] space-y-3 overflow-auto px-5 py-4 xl:max-h-[360px]">
                  {!cart.length ? (
                    <div className="flex h-24 flex-col items-center justify-center text-center">
                      <div className="grid h-9 w-9 place-items-center rounded-full bg-[#edf3e9]"><ShoppingBag className="h-4 w-4 text-[#7e9581]" /></div>
                      <p className="mt-2 text-sm font-medium text-[#45604f]">A fresh start.</p>
                      <p className="text-xs text-[#87958a]">Choose something from the menu.</p>
                    </div>
                  ) : cart.map((line) => (
                    <div key={line.key} className="rounded-xl border border-[#e6ede2] bg-[#f8faf5] p-3">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold text-[#294638]">{line.product.name}</p>
                        <span className="bm-mono shrink-0 text-xs text-[#47634f]">{money(line.product.basePrice * line.quantity)}</span>
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <button className="bm-button grid h-7 w-7 place-items-center rounded-lg border border-[#d8e4d5] bg-[#fffef9] text-[#47634f] hover:bg-[#eaf2e7]" onClick={() => setQuantity(line.key, line.quantity - 1)} aria-label="Decrease quantity">−</button>
                        <span className="bm-mono w-5 text-center text-xs text-[#45604f]">{line.quantity}</span>
                        <button className="bm-button grid h-7 w-7 place-items-center rounded-lg border border-[#d8e4d5] bg-[#fffef9] text-[#47634f] hover:bg-[#eaf2e7]" onClick={() => setQuantity(line.key, line.quantity + 1)} aria-label="Increase quantity">+</button>
                        <button className="bm-button ml-auto rounded px-1 py-1 text-xs text-[#7e8d82] hover:text-[#a34b3c]" onClick={() => setQuantity(line.key, 0)}>Remove</button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="space-y-4 border-t border-[#e3eadf] px-5 py-4">
                  <div className="space-y-2">
                    <label className="block text-xs font-medium text-[#45604f]">Customer <span className="font-normal text-[#89978d]">· optional</span></label>
                    <select value={customerId} onChange={(event) => setCustomerId(event.target.value)} className="h-10 w-full appearance-none rounded-xl border border-[#d9e5d6] bg-[#fffef9] px-3 text-sm text-[#365141]">
                      <option value="">Walk-in guest</option>
                      {customers.slice(1).map((customer) => <option key={customer.id} value={customer.id}>{customer.name} · {customer.loyaltyPointsBalance} pts</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <div className="text-xs font-medium text-[#45604f]">Payment method</div>
                    <div className="grid grid-cols-3 gap-2">
                      {(["Card", "Cash", "E-Wallet"] as const).map((method) => {
                        const Icon = method === "Card" ? CreditCard : method === "Cash" ? Banknote : Wallet;
                        return (
                          <button
                            key={method}
                            onClick={() => setPayment(method)}
                            className={`bm-button flex flex-col items-center gap-1 rounded-xl border px-2 py-2.5 text-[10px] ${
                              payment === method ? "border-[#6d9d76] bg-[#edf5e9] font-semibold text-[#326747]" : "border-[#dce7d9] text-[#7b8b7e] hover:bg-[#f4f7f0]"
                            }`}
                          >
                            <Icon className="h-4 w-4" />{method}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="flex items-center justify-between border-t border-dashed border-[#dce7d9] pt-3">
                    <span className="text-sm text-[#75867a]">Total</span>
                    <strong className="bm-display text-2xl text-[#294638]">{money(cartTotal)}</strong>
                  </div>
                  <button
                    disabled={!cart.length}
                    onClick={() => { if (cart.length) setCart([]); }}
                    className="bm-button flex h-12 w-full items-center rounded-xl bg-[#2f7055] px-4 text-sm font-semibold text-[#fffef5] shadow-[0_4px_12px_rgba(47,112,85,.18)] hover:bg-[#255d45] disabled:cursor-not-allowed disabled:bg-[#a8b9a9] disabled:shadow-none"
                  >
                    Complete sale <span className="ml-auto text-lg leading-none">→</span>
                  </button>
                  <p className="text-center text-[10px] text-[#87958a]">A receipt will be ready as soon as the sale is complete.</p>
                </div>
              </aside>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
