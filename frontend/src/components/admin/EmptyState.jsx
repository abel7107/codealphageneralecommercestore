import { Package } from "lucide-react";

export default function EmptyState({ icon: Icon = Package, title, description, action }) {
  return (
    <div className="flex min-h-56 flex-col items-center justify-center px-5 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
        <Icon size={26} />
      </div>
      <h3 className="mt-4 text-base font-semibold text-slate-800">{title}</h3>
      {description && <p className="mt-2 max-w-sm text-sm text-slate-500">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
