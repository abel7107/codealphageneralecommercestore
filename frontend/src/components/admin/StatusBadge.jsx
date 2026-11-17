const STATUS_STYLES = {
  active: "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200",
  inactive: "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700",
  "out-of-stock": "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200",
  PENDING: "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200",
  CONFIRMED: "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200",
  PROCESSING: "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200",
  SHIPPED: "bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 border-violet-200",
  DELIVERED: "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200",
  CANCELLED: "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200",
  PAID: "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200",
  FAILED: "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200",
  REFUNDED: "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700",
  Active: "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200",
  Disabled: "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200",
};

export default function StatusBadge({ status, className = "" }) {
  const style = STATUS_STYLES[status] || "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700";
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${style} ${className}`}
    >
      {status}
    </span>
  );
}
