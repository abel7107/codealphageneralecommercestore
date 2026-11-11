import { useEffect, useState } from "react";
import { LoaderCircle } from "lucide-react";
import { apiRequest } from "../../services/api";

export default function Settings() {
  const [form, setForm] = useState({
    storeName: "",
    storeDescription: "",
    contactEmail: "",
    contactPhone: "",
    currency: "ETB",
    shippingFee: "0",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError("");
      try {
        const response = await apiRequest("/api/admin/settings");
        const settings = response.data || {};
        setForm({
          storeName: settings.storeName || "",
          storeDescription: settings.storeDescription || "",
          contactEmail: settings.contactEmail || "",
          contactPhone: settings.contactPhone || "",
          currency: settings.currency || "ETB",
          shippingFee: String(settings.shippingFee ?? 0),
        });
      } catch (err) {
        setError(err.message || "Unable to load settings.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      await apiRequest("/api/admin/settings", {
        method: "PUT",
        body: JSON.stringify({
          storeName: form.storeName.trim(),
          storeDescription: form.storeDescription.trim() || null,
          contactEmail: form.contactEmail.trim() || null,
          contactPhone: form.contactPhone.trim() || null,
          currency: form.currency.trim(),
          shippingFee: Number(form.shippingFee),
        }),
      });
      setSuccess("Settings updated successfully.");
    } catch (err) {
      setError(err.message || "Unable to update settings.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-60 items-center justify-center gap-3 text-sm text-slate-500">
        <LoaderCircle className="animate-spin" size={22} />
        Loading settings...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-slate-500">Store configuration</p>
        <h1 className="mt-1 text-3xl font-bold text-slate-900">Settings</h1>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      {success && <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700">{success}</div>}

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">Store name</label>
          <input
            name="storeName"
            value={form.storeName}
            onChange={updateField}
            required
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">Store description</label>
          <textarea
            name="storeDescription"
            value={form.storeDescription}
            onChange={updateField}
            rows={3}
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">Contact email</label>
          <input
            type="email"
            name="contactEmail"
            value={form.contactEmail}
            onChange={updateField}
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">Contact phone</label>
          <input
            name="contactPhone"
            value={form.contactPhone}
            onChange={updateField}
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">Currency</label>
          <input
            name="currency"
            value={form.currency}
            onChange={updateField}
            required
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">Shipping fee</label>
          <input
            type="number"
            name="shippingFee"
            value={form.shippingFee}
            onChange={updateField}
            min="0"
            step="0.01"
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save settings"}
        </button>
      </form>
    </div>
  );
}
