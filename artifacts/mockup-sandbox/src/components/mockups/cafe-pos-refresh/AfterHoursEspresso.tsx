import { useMemo, useState, type ReactNode } from "react";
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
      <div className="grid h-10 w-10 place-items-center rounded-[14px] bg-[#c99655] text-[#241a14] shadow-[0_5px_22px_rgba(201,150,85,.22)]">
        <CupSoda className="h-5 w-5" />
      </div>
      <div>
        <div className="font-['Fraunces'] text-xl font-semibold leading-none tracking-[-.04em] text-[#f3e7d5]">Daybreak</div>
        <div className="mt-1 font-['DM_Mono'] text-[9px] uppercase tracking-[.2em] text-[#b2a394]">Café counter</div>
      </div>
    </div>
  );
}

function CheckoutShell({ children }: { children: ReactNode }) {
  const navItems = [
    { label: "Checkout", icon: ShoppingCart, active: true },
    { label: "Orders", icon: ShoppingBag },
    { label: "Customers", icon: Users },
    { label: "Catalog", icon: Package },
    { label: "Team", icon: Users },
    { label: "Automation", icon: Webhook },
  ];

  return (
    <div
      id="after-hours-espresso"
      className="ah-shell min-h-[100dvh] bg-[#171310] font-['DM_Sans'] text-[#f0e8de] selection:bg-[#c99655] selection:text-[#211810]"
    >
      <style>{`
        #after-hours-espresso {
          --ah-bg: #171310;
          --ah-panel: #211b17;
          --ah-panel-raised: #29221c;
          --ah-line: #40352c;
          --ah-text: #f0e8de;
          --ah-muted: #b3a79a;
          --ah-dim: #897c70;
          --ah-amber: #d2a265;
        }
        #after-hours-espresso .ah-shell { position: relative; overflow: clip; }
        #after-hours-espresso.ah-shell {
          background:
            radial-gradient(ellipse at 76% -8%, rgba(201,150,85,.14), transparent 31rem),
            radial-gradient(ellipse at 12% 83%, rgba(106,67,43,.12), transparent 34rem),
            #171310;
        }
        #after-hours-espresso .ah-side {
          background: linear-gradient(165deg, #211a15 0%, #1a1512 65%, #171310 100%);
          box-shadow: 14px 0 42px rgba(0,0,0,.14);
        }
        #after-hours-espresso .ah-header { background: rgba(23,19,16,.91); }
        #after-hours-espresso .ah-tile {
          background: linear-gradient(145deg, rgba(43,35,28,.96), rgba(34,28,23,.96));
          box-shadow: 0 8px 20px rgba(0,0,0,.12), inset 0 1px 0 rgba(255,244,227,.035);
          transition: transform .18s ease, border-color .18s ease, background .18s ease;
        }
        #after-hours-espresso .ah-tile:hover { transform: translateY(-2px); border-color: #806444; }
        #after-hours-espresso .ah-card {
          background: linear-gradient(155deg, rgba(39,32,26,.99), rgba(31,26,22,.99));
          box-shadow: 0 17px 45px rgba(0,0,0,.2), inset 0 1px 0 rgba(255,244,227,.035);
        }
        #after-hours-espresso .ah-control {
          background-color: #1b1714 !important;
          color: #f0e8de !important;
          border-color: #504237 !important;
        }
        #after-hours-espresso .ah-control::placeholder { color: #948679; }
        #after-hours-espresso select option { background: #211b17; color: #f0e8de; }
        #after-hours-espresso .ah-scroll::-webkit-scrollbar { width: 6px; }
        #after-hours-espresso .ah-scroll::-webkit-scrollbar-thumb { background: #59493b; border-radius: 8px; }
        @keyframes ah-rise { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        #after-hours-espresso .ah-enter { animation: ah-rise .36s cubic-bezier(.2,.7,.2,1) both; }
        @media (prefers-reduced-motion: reduce) {
          #after-hours-espresso *, #after-hours-espresso *::before, #after-hours-espresso *::after {
            animation-duration: .01ms !important; transition-duration: .01ms !important;
          }
        }
      `}</style>
      <aside className="ah-side fixed inset-y-0 left-0 z-30 hidden w-[248px] flex-col border-r border-[#40352c] px-4 py-6 text-[#eee1d2] lg:flex">
        <div className="px-2"><Brand /></div>
        <div className="mb-3 mt-11 px-3 font-['DM_Mono'] text-[10px] uppercase tracking-[.2em] text-[#88796c]">Workspace</div>
        <nav className="space-y-1">
          {navItems.map(({ label, icon: Icon, active }) => (
            <div
              key={label}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${active ? "border border-[#72563a] bg-[#35291e] font-semibold text-[#f2d5aa]" : "text-[#b2a394] hover:bg-[#2a221c] hover:text-[#f0e8de]"}`}
            >
              <Icon className="h-[17px] w-[17px]" />
              {label}
              {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#d2a265]" />}
            </div>
          ))}
        </nav>
        <div className="mt-auto">
          <div className="mb-4 rounded-2xl border border-[#493a2d] bg-[#292119] p-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#eadcc9]"><span className="h-2 w-2 rounded-full bg-[#91a27b]" />System ready</div>
            <p className="mt-2 text-xs leading-5 text-[#a99b8e]">Sales and team are in sync.</p>
          </div>
          <div className="flex items-center gap-3 rounded-2xl px-2 py-2">
            <div className="grid h-9 w-9 place-items-center rounded-full border border-[#705538] bg-[#3a2d22] text-xs font-semibold text-[#e0b779]">AR</div>
            <div className="min-w-0 flex-1"><div className="truncate text-sm font-medium text-[#f1e8de]">Avery Rivera</div><div className="text-xs text-[#a99b8e]">Barista</div></div>
            <LogOut className="h-4 w-4 text-[#a99b8e]" />
          </div>
        </div>
      </aside>
      <div className="lg:pl-[248px]">
        <header className="ah-header sticky top-0 z-20 flex h-[68px] items-center justify-between border-b border-[#3a3028] px-4 backdrop-blur-xl sm:px-8">
          <div className="flex items-center gap-2 lg:hidden"><Brand /></div>
          <div className="hidden text-sm text-[#b3a79a] lg:block">A good day to make someone’s day.</div>
          <div className="flex items-center gap-3">
            <span className="hidden items-center gap-2 rounded-full border border-[#4a3d31] bg-[#211b17] px-3 py-1.5 text-xs text-[#c5b9ac] sm:flex"><span className="h-1.5 w-1.5 rounded-full bg-[#91a27b]" />Service is live</span>
            <Button className="hidden border-[#594a3b] bg-[#211b17] text-[#e8ded2] hover:bg-[#30261e] lg:inline-flex" variant="outline" size="sm"><LogOut className="mr-2 h-4 w-4" />Sign out</Button>
          </div>
        </header>
        <main className="mx-auto max-w-[1500px] px-4 py-6 sm:px-8 sm:py-9">
          <div className="mb-4 flex gap-1 overflow-x-auto pb-2 lg:hidden">{navItems.slice(0, 4).map(({ label, active }) => <span key={label} className={`shrink-0 rounded-full px-3 py-2 text-xs ${active ? "bg-[#c99655] font-semibold text-[#241a14]" : "bg-[#29221c] text-[#b3a79a]"}`}>{label}</span>)}</div>
          {children}
        </main>
      </div>
    </div>
  );
}

export function AfterHoursEspresso() {
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
      <div className="ah-enter">
        <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="font-['DM_Mono'] text-[10px] uppercase tracking-[.2em] text-[#b3a79a]">Counter · New sale</p>
            <h1 className="mt-2 font-['Fraunces'] text-[2.4rem] font-semibold leading-none tracking-[-.045em] text-[#f2e7d9] sm:text-5xl">Make it a good one.</h1>
            <p className="mt-3 max-w-xl text-sm text-[#b3a79a]">Tap a favorite, make it theirs, and send it on its way.</p>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-[#493b2e] bg-[#241d17] px-4 py-3 shadow-[0_8px_24px_rgba(0,0,0,.14)]">
            <div className="grid h-9 w-9 place-items-center rounded-xl border border-[#654a2e] bg-[#38291c] text-[#e0b779]"><Clock3 className="h-4 w-4" /></div>
            <div><span className="block font-['DM_Mono'] text-[9px] uppercase tracking-wider text-[#a99b8e]">Today so far</span><strong className="text-sm text-[#f2e6d7]">$1,286.50</strong></div>
          </div>
        </div>

        <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <section className="min-w-0">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-3 top-3 h-4 w-4 text-[#b3a79a]" />
                <Input className="ah-control h-10 rounded-xl pl-9 text-sm shadow-none focus-visible:ring-[#d2a265]" placeholder="Find a drink, bite, or bean…" value={search} onChange={(event) => setSearch(event.target.value)} />
              </div>
              <div className="flex gap-1 rounded-xl border border-[#342b24] bg-[#1d1916] p-1">
                {categories.map((label) => <button key={label} className={`min-h-9 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${category === label ? "bg-[#d2a265] text-[#241a14] shadow-[0_2px_10px_rgba(210,162,101,.14)]" : "text-[#b3a79a] hover:bg-[#30261e] hover:text-[#f0e8de]"}`} onClick={() => setCategory(label)}>{label}</button>)}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
              {filteredProducts.map((product, index) => (
                <button key={product.id} onClick={() => addToOrder(product)} className="ah-tile group relative flex min-h-[150px] flex-col justify-between overflow-hidden rounded-2xl border border-[#44372c] p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d2a265]">
                  <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[#c99655]/[.09] transition-transform group-hover:scale-125" />
                  <div className="relative flex w-full items-start justify-between">
                    <span className={`grid h-9 w-9 place-items-center rounded-xl border ${index % 3 === 0 ? "border-[#65513c] bg-[#382d22] text-[#e2b876]" : index % 3 === 1 ? "border-[#61443a] bg-[#35251f] text-[#df9b78]" : "border-[#485044] bg-[#273027] text-[#aec19e]"}`}>
                      {product.category === "Beverage" ? <Coffee className="h-4 w-4" /> : product.category === "Food" ? <CupSoda className="h-4 w-4" /> : <ShoppingBag className="h-4 w-4" />}
                    </span>
                    <Plus className="h-4 w-4 text-[#c8ab85] opacity-0 transition-opacity group-hover:opacity-100" />
                  </div>
                  <div className="relative mt-5"><span className="block text-sm font-semibold leading-tight text-[#f0e8de]">{product.name}</span><span className="mt-1.5 block font-['DM_Mono'] text-xs text-[#d5b17d]">{money(product.basePrice)}</span></div>
                </button>
              ))}
              {!filteredProducts.length && <div className="col-span-full flex min-h-[150px] flex-col items-center justify-center rounded-2xl border border-dashed border-[#574638] bg-[#211b17]/70 px-5 text-center"><Search className="h-5 w-5 text-[#b6966d]" /><p className="mt-3 text-sm font-medium text-[#eee1d2]">Nothing on the menu by that name.</p><p className="mt-1 text-xs text-[#a99b8e]">Try another search or choose a different category.</p></div>}
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-[#40352c] bg-[#211b17]/75 p-4"><span className="font-['DM_Mono'] text-[9px] uppercase tracking-wider text-[#a99b8e]">Orders today</span><div className="mt-1 text-xl font-semibold text-[#f0e8de]">32</div></div>
              <div className="rounded-2xl border border-[#40352c] bg-[#211b17]/75 p-4"><span className="font-['DM_Mono'] text-[9px] uppercase tracking-wider text-[#a99b8e]">Average ticket</span><div className="mt-1 text-xl font-semibold text-[#f0e8de]">{money(12.42)}</div></div>
              <div className="col-span-2 rounded-2xl border border-[#40352c] bg-[#211b17]/75 p-4 sm:col-span-1"><span className="font-['DM_Mono'] text-[9px] uppercase tracking-wider text-[#a99b8e]">Recently served</span><div className="mt-1 flex items-center gap-2 text-sm font-medium text-[#e6dbce]"><Clock3 className="h-4 w-4 text-[#c49a66]" />8 orders today</div></div>
            </div>
          </section>

          <aside className="ah-card overflow-hidden rounded-[1.5rem] border border-[#4a3b2e] xl:sticky xl:top-[88px]">
            <div className="flex items-center justify-between border-b border-[#44372c] px-5 py-4">
              <div><div className="flex items-center gap-2"><ShoppingCart className="h-4 w-4 text-[#d2a265]" /><h2 className="font-semibold text-[#f2e8dd]">Current order</h2></div><p className="mt-1 text-xs text-[#b3a79a]">{cart.reduce((sum, line) => sum + line.quantity, 0)} items · made fresh</p></div>
              <span className="rounded-full border border-[#544435] bg-[#30261e] px-2.5 py-1 font-['DM_Mono'] text-xs text-[#e6c18d]">{cart.length}</span>
            </div>
            <div className="ah-scroll max-h-[34vh] min-h-[90px] space-y-3 overflow-auto px-5 py-4 xl:max-h-[360px]">
              {!cart.length ? <div className="flex h-24 flex-col items-center justify-center text-center"><div className="grid h-9 w-9 place-items-center rounded-full border border-[#514234] bg-[#30261e]"><ShoppingBag className="h-4 w-4 text-[#c49a66]" /></div><p className="mt-2 text-sm font-medium text-[#eee1d2]">A fresh start.</p><p className="text-xs text-[#a99b8e]">Choose something from the menu.</p></div> : cart.map((line) => (
                <div key={line.key} className="rounded-xl border border-[#41352b] bg-[#1c1815] p-3">
                  <div className="flex items-start justify-between gap-2"><p className="text-sm font-semibold text-[#f0e8de]">{line.product.name}</p><span className="font-['DM_Mono'] text-xs text-[#e1bd88]">{money(line.product.basePrice * line.quantity)}</span></div>
                  <div className="mt-2 flex items-center gap-2">
                    <button className="grid h-8 w-8 place-items-center rounded-lg border border-[#594a3b] bg-[#29221c] text-[#f0e8de] hover:bg-[#3a2d22]" onClick={() => setQuantity(line.key, line.quantity - 1)} aria-label="Decrease quantity">−</button>
                    <span className="w-5 text-center font-['DM_Mono'] text-xs text-[#e8ded2]">{line.quantity}</span>
                    <button className="grid h-8 w-8 place-items-center rounded-lg border border-[#594a3b] bg-[#29221c] text-[#f0e8de] hover:bg-[#3a2d22]" onClick={() => setQuantity(line.key, line.quantity + 1)} aria-label="Increase quantity">+</button>
                    <button className="ml-auto min-h-8 px-2 text-xs text-[#b3a79a] hover:text-[#edc18b]" onClick={() => setQuantity(line.key, 0)}>Remove</button>
                  </div>
                </div>
              ))}
            </div>
            <div className="space-y-4 border-t border-[#44372c] px-5 py-4">
              <div className="space-y-2"><Label className="text-xs text-[#e8ded2]">Customer <span className="font-normal text-[#a99b8e]">· optional</span></Label><select value={customerId} onChange={(event) => setCustomerId(event.target.value)} className="ah-control h-10 w-full appearance-none rounded-xl border px-3 text-sm"><option value="">Walk-in guest</option>{customers.slice(1).map((customer) => <option key={customer.id} value={customer.id}>{customer.name} · {customer.loyaltyPointsBalance} pts</option>)}</select></div>
              <div className="space-y-2"><Label className="text-xs text-[#e8ded2]">Payment method</Label><div className="grid grid-cols-3 gap-2">{(["Card", "Cash", "E-Wallet"] as const).map((method) => { const Icon = method === "Card" ? CreditCard : method === "Cash" ? Banknote : Wallet; return <button key={method} onClick={() => setPayment(method)} className={`flex min-h-[58px] flex-col items-center justify-center gap-1 rounded-xl border px-2 py-2.5 text-[10px] font-medium transition-colors ${payment === method ? "border-[#a77c4d] bg-[#38291d] text-[#edc18b]" : "border-[#4a3d31] bg-[#1c1815] text-[#b3a79a] hover:bg-[#30261e] hover:text-[#eee1d2]"}`}><Icon className="h-4 w-4" />{method}</button>; })}</div></div>
              <div className="flex items-center justify-between border-t border-dashed border-[#514337] pt-3"><span className="text-sm text-[#b3a79a]">Total</span><strong className="font-['Fraunces'] text-2xl tracking-[-.03em] text-[#f3e7d5]">{money(cartTotal)}</strong></div>
              <Button disabled={!cart.length} className="h-12 w-full border border-[#eccb9b] bg-[#d2a265] text-sm font-semibold text-[#241a14] shadow-[0_5px_18px_rgba(210,162,101,.14)] hover:bg-[#dfb477] disabled:border-[#4a3d31] disabled:bg-[#3a3026] disabled:text-[#887b6e] disabled:shadow-none">Complete sale <span className="ml-auto">→</span></Button>
              <p className="text-center text-[10px] text-[#a99b8e]">A receipt will be ready as soon as the sale is complete.</p>
            </div>
          </aside>
        </div>
      </div>
    </CheckoutShell>
  );
}
