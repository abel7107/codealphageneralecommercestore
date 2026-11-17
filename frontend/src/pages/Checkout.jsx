/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { apiRequest, getImageUrl } from "../services/api";

const emptyShipping = {
  fullName: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  postalCode: "",
  country: "Ethiopia",
  notes: "",
};

function validateForm(form) {
  const errors = {};
  if (!form.fullName.trim()) errors.fullName = "Full name is required.";
  if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = "Valid email is required.";
  if (!form.phone.trim()) errors.phone = "Phone number is required.";
  if (!form.address.trim()) errors.address = "Shipping address is required.";
  if (!form.city.trim()) errors.city = "City is required.";
  return errors;
}

export default function Checkout() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { items, cartCount, cartTotal, clearCart } = useCart();

  const [form, setForm] = useState({
    ...emptyShipping,
    fullName: user?.name || "",
    email: user?.email || "",
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    if (!user) {
      navigate("/login", { state: { from: "/checkout" }, replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    setForm((current) => ({
      ...current,
      fullName: current.fullName || user?.name || "",
      email: current.email || user?.email || "",
    }));
  }, [user]);

  const money = (value) =>
    `ETB ${Number(value).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitError("");

    if (items.length === 0) {
      setSubmitError("Your cart is empty.");
      return;
    }

    const validationErrors = validateForm(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        items: items.map((item) => ({
          productId: item.id,
          quantity: item.quantity,
        })),
        shipping: {
          fullName: form.fullName.trim(),
          email: form.email.trim() || null,
          phone: form.phone.trim(),
          address: form.address.trim(),
          city: form.city.trim(),
          postalCode: form.postalCode.trim() || null,
          country: form.country.trim() || "Ethiopia",
        },
        paymentMethod: "COD",
        notes: form.notes.trim() || null,
      };

      const response = await apiRequest("/api/orders", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      await clearCart();
      navigate(`/order-confirmation/${response.data.orderNumber}`, {
        state: { order: response.data },
        replace: true,
      });
    } catch (err) {
      setSubmitError(err.message || "Unable to place order.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!user) {
    return null;
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Your cart is empty</h1>
        <p className="mt-3 text-slate-500 dark:text-slate-400">Add products before checking out.</p>
        <Link to="/" className="mt-6 inline-block rounded-full bg-violet-700 dark:bg-violet-600 px-6 py-3 text-sm font-semibold text-white">
          Continue shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Checkout</h1>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Complete your shipping details to place your order.</p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.8fr)]">
        <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Customer information</h2>
          </div>

          {submitError && (
            <div className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/30 p-3 text-sm text-red-700 dark:text-red-400">
              {submitError}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">Full name *</label>
              <input
                name="fullName"
                value={form.fullName}
                onChange={updateField}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-3 outline-none focus:border-slate-900"
              />
              {errors.fullName && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.fullName}</p>}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">Email *</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={updateField}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-3 outline-none focus:border-slate-900"
              />
              {errors.email && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.email}</p>}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">Phone *</label>
              <input
                name="phone"
                value={form.phone}
                onChange={updateField}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-3 outline-none focus:border-slate-900"
              />
              {errors.phone && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.phone}</p>}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">City *</label>
              <input
                name="city"
                value={form.city}
                onChange={updateField}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-3 outline-none focus:border-slate-900"
              />
              {errors.city && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.city}</p>}
            </div>

            <div className="sm:col-span-2">
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">Shipping address *</label>
              <input
                name="address"
                value={form.address}
                onChange={updateField}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-3 outline-none focus:border-slate-900"
              />
              {errors.address && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.address}</p>}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">Postal code</label>
              <input
                name="postalCode"
                value={form.postalCode}
                onChange={updateField}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-3 outline-none focus:border-slate-900"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">Country</label>
              <input
                name="country"
                value={form.country}
                onChange={updateField}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-3 outline-none focus:border-slate-900"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">Delivery instructions</label>
              <textarea
                name="notes"
                value={form.notes}
                onChange={updateField}
                rows={3}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-3 outline-none focus:border-slate-900"
              />
            </div>
          </div>

          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Payment method</h2>
            <label className="mt-3 flex items-center gap-3 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
              <input type="radio" checked readOnly />
              <span className="text-sm font-medium text-slate-900 dark:text-white">Cash on Delivery</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-violet-700 dark:bg-violet-600 py-3 font-semibold text-white transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Placing order..." : "Place order"}
          </button>
        </form>

        <aside className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Order summary</h2>
          <div className="mt-4 space-y-4">
            {items.map((item) => (
              <div key={item.id} className="flex gap-3">
                <img
                  src={getImageUrl(item.imageUrl || item.image) || "/assets/images/products/headphones.jpg"}
                  alt={item.name}
                  className="h-14 w-14 rounded-lg object-cover"
                />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{item.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {item.quantity} × {money(item.price)}
                  </p>
                </div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {money(Number(item.price) * item.quantity)}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-6 border-t border-slate-200 dark:border-slate-700 pt-4">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500 dark:text-slate-400">Items</span>
              <span className="font-semibold">{cartCount}</span>
            </div>
            <div className="mt-2 flex justify-between text-sm">
              <span className="text-slate-500 dark:text-slate-400">Total</span>
              <span className="text-lg font-bold">{money(cartTotal)}</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
