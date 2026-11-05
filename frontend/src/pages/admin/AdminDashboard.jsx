import {
  Package,
  ShoppingCart,
  Users,
  Wallet,
  ArrowUpRight,
  Clock,
} from "lucide-react";

const stats = [
  {
    title: "Total Products",
    value: "—",
    description: "Products in your store",
    Icon: Package,
  },
  {
    title: "Total Orders",
    value: "—",
    description: "Orders received",
    Icon: ShoppingCart,
  },
  {
    title: "Total Customers",
    value: "—",
    description: "Registered customers",
    Icon: Users,
  },
  {
    title: "Total Revenue",
    value: "—",
    description: "Revenue generated",
    Icon: Wallet,
  },
];

export default function AdminDashboard() {
  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-medium text-slate-500">Overview</p>
        <h1 className="mt-1 text-3xl font-bold text-slate-900">
          Dashboard
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Welcome back! Here's what's happening with your store.
        </p>
      </div>

      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ title, value, description, Icon }) => (
          <article
            key={title}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
              <Icon size={22} />
            </div>

            <p className="mt-5 text-sm font-medium text-slate-500">
              {title}
            </p>

            <h2 className="mt-1 text-3xl font-bold text-slate-900">
              {value}
            </h2>

            <p className="mt-2 text-xs text-slate-400">
              {description}
            </p>
          </article>
        ))}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">
          Recent Orders
        </h2>

        <div className="flex min-h-40 flex-col items-center justify-center text-center">
          <ShoppingCart size={28} className="text-slate-400" />
          <h3 className="mt-4 font-semibold text-slate-800">
            Order management coming next
          </h3>
          <p className="mt-2 text-sm text-slate-500">
            We'll connect this section to your real orders database.
          </p>
        </div>
      </section>
    </div>
  );
}