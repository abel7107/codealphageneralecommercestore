import { TrendingUp, TrendingDown } from "lucide-react";

export default function StatCard({ title, value, description, Icon, trend, trendLabel, accent = "purple" }) {
  const accents = {
    purple: "bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400",
    blue: "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
    green: "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400",
    amber: "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400",
  };
  return (
    <article className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between">
        <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${accents[accent] || accents.purple}`}>
          {Icon && <Icon size={18} />}
        </div>
        {trend !== undefined && (
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
              trend >= 0 ? "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400" : "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400"
            }`}
          >
            {trend >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <p className="mt-3 text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
      <h2 className="mt-1 text-lg sm:text-xl font-bold text-slate-900 dark:text-white">{value}</h2>
      {description && <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">{description}</p>}
      {trendLabel && <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">{trendLabel}</p>}
    </article>
  );
}
