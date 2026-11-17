import { TrendingUp, TrendingDown } from "lucide-react";

export default function StatCard({ title, value, description, Icon, trend, trendLabel, accent = "purple" }) {
  const accents = {
    purple: "bg-violet-50 text-violet-700",
    blue: "bg-blue-50 text-blue-700",
    green: "bg-green-50 text-green-700",
    amber: "bg-amber-50 text-amber-700",
  };
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between">
        <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${accents[accent] || accents.purple}`}>
          {Icon && <Icon size={18} />}
        </div>
        {trend !== undefined && (
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
              trend >= 0 ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
            }`}
          >
            {trend >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <p className="mt-3 text-sm font-medium text-slate-500">{title}</p>
      <h2 className="mt-1 text-xl font-bold text-slate-900">{value}</h2>
      {description && <p className="mt-1 text-xs text-slate-400">{description}</p>}
      {trendLabel && <p className="mt-1 text-xs text-slate-400">{trendLabel}</p>}
    </article>
  );
}
