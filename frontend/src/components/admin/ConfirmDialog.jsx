import { AlertTriangle, X } from "lucide-react";

export default function ConfirmDialog({ open, title, description, confirmLabel = "Confirm", cancelLabel = "Cancel", danger = false, loading = false, onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/60 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${danger ? "bg-red-50 text-red-600" : "bg-violet-50 text-violet-700"}`}>
              <AlertTriangle size={20} />
            </div>
            <h2 className="text-lg font-bold text-slate-900">{title}</h2>
          </div>
          <button onClick={onCancel} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>
        <div className="px-6 py-5">
          <p className="text-sm text-slate-600">{description}</p>
        </div>
        <div className="flex justify-end gap-2 border-t border-slate-100 px-6 py-4">
          <button onClick={onCancel} disabled={loading} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 ${danger ? "bg-red-600 hover:bg-red-700" : "bg-violet-700 hover:bg-violet-800"}`}
          >
            {loading ? "Processing..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
