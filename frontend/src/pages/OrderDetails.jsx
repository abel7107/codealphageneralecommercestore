import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../services/api";

function money(value) {
  return `ETB ${Number(value).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function OrderDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) {
      navigate("/login", { state: { from: `/orders/${id}` }, replace: true });
      return;
    }
    (async () => {
      setLoading(true);
      setError("");
      try {
        const response = await apiRequest(`/api/orders/${id}`);
        setOrder(response.data);
      } catch (err) {
        setError(err.message || "Unable to load order.");
      } finally {
        setLoading(false);
      }
    })();
  }, [id, user, navigate]);

  if (!user) return null;

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Loading order...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-lg sm:text-xl sm:text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">{error || "Order not found"}</h1>
        <Link to="/orders" className="mt-6 inline-block rounded-full bg-violet-700 dark:bg-violet-600 px-6 py-3 text-xs sm:text-sm font-semibold text-white">
          Back to orders
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <Link to="/orders" className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:text-white">
        ← Back to orders
      </Link>

      <div className="mt-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl sm:text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">Order details</h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">{order.orderNumber}</p>
          </div>
          <div className="flex gap-2">
            <span className="rounded-full bg-slate-100 dark:bg-slate-700 px-3 py-1 text-xs font-semibold text-slate-700 dark:text-slate-200">
              {order.status}
            </span>
            <span className="rounded-full bg-slate-100 dark:bg-slate-700 px-3 py-1 text-xs font-semibold text-slate-700 dark:text-slate-200">
              {order.paymentStatus}
            </span>
          </div>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div>
            <h2 className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Customer</h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-900 dark:text-white">{order.user?.name || order.shippingFullName}</p>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">{order.user?.email || order.shippingEmail}</p>
          </div>

          <div>
            <h2 className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Shipping address</h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-900 dark:text-white">{order.shippingFullName}</p>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">{order.shippingAddress}</p>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
              {order.shippingCity}
              {order.shippingPostalCode ? `, ${order.shippingPostalCode}` : ""}
            </p>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">{order.shippingCountry}</p>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">{order.shippingPhone}</p>
          </div>
        </div>

        <div className="mt-6">
          <h2 className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Purchased products</h2>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="border-b border-slate-200 dark:border-slate-700 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="py-3">Product</th>
                  <th className="py-3">Qty</th>
                  <th className="py-3">Unit price</th>
                  <th className="py-3 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {order.items.map((item) => (
                  <tr key={item.id}>
                    <td className="py-3">
                      <p className="font-semibold text-slate-900 dark:text-white">{item.productName}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{item.productSlug}</p>
                    </td>
                    <td className="py-3">{item.quantity}</td>
                    <td className="py-3">{money(item.unitPrice)}</td>
                    <td className="py-3 text-right font-semibold">{money(item.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-6 border-t border-slate-200 dark:border-slate-700 pt-4">
          <div className="flex justify-between text-xs sm:text-sm">
            <span className="text-slate-500 dark:text-slate-400">Order date</span>
            <span className="font-semibold">{new Date(order.createdAt).toLocaleString()}</span>
          </div>
          <div className="mt-2 flex justify-between text-xs sm:text-sm">
            <span className="text-slate-500 dark:text-slate-400">Payment method</span>
            <span className="font-semibold">{order.paymentMethod}</span>
          </div>
          <div className="mt-2 flex justify-between text-xs sm:text-sm">
            <span className="text-slate-500 dark:text-slate-400">Subtotal</span>
            <span className="font-semibold">{money(order.subtotal)}</span>
          </div>
          <div className="mt-2 flex justify-between text-xs sm:text-sm">
            <span className="text-slate-500 dark:text-slate-400">Shipping</span>
            <span className="font-semibold">{money(order.shippingCost)}</span>
          </div>
          <div className="mt-3 flex justify-between text-base sm:text-lg font-bold">
            <span>Total</span>
            <span>{money(order.total)}</span>
          </div>
        </div>

        {order.notes && (
          <div className="mt-6 rounded-xl bg-slate-50 dark:bg-slate-900 p-4 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
            <span className="font-semibold">Delivery instructions:</span> {order.notes}
          </div>
        )}
      </div>
    </div>
  );
}
