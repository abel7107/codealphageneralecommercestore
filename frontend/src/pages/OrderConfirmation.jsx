import { useEffect, useState } from "react";
import { Link, useParams, useLocation } from "react-router-dom";
import { apiRequest } from "../services/api";

export default function OrderConfirmation() {
  const { orderNumber } = useParams();
  const location = useLocation();
  const [order, setOrder] = useState(location.state?.order || null);
  const [loading, setLoading] = useState(!location.state?.order);
  const [error, setError] = useState("");

  useEffect(() => {
    if (order) return;
    (async () => {
      try {
        const response = await apiRequest("/api/orders/my-orders");
        const found = (response.data || []).find((item) => item.orderNumber === orderNumber);
        if (!found) {
          setError("Order not found.");
        } else {
          setOrder(found);
        }
      } catch (err) {
        setError(err.message || "Unable to load order.");
      } finally {
        setLoading(false);
      }
    })();
  }, [order, orderNumber]);

  const money = (value) =>
    `ETB ${Number(value).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

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
        <Link to="/" className="mt-6 inline-block rounded-full bg-violet-700 dark:bg-violet-600 px-6 py-3 text-xs sm:text-sm font-semibold text-white">
          Back to store
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="rounded-3xl border border-green-200 bg-green-50 dark:bg-green-900/30 p-8 text-center">
        <h1 className="text-xl sm:text-2xl sm:text-2xl sm:text-3xl font-bold text-green-800">Order placed successfully</h1>
        <p className="mt-3 text-xs sm:text-sm text-green-700 dark:text-green-400">
          Your order number is <strong>{order.orderNumber}</strong>.
        </p>
      </div>

      <div className="mt-8 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
        <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">Order details</h2>
        <div className="mt-4 space-y-3">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between text-xs sm:text-sm">
              <span>
                {item.productName} × {item.quantity}
              </span>
              <span className="font-semibold">{money(item.subtotal)}</span>
            </div>
          ))}
        </div>

        <div className="mt-6 border-t border-slate-200 dark:border-slate-700 pt-4">
          <div className="flex justify-between text-xs sm:text-sm">
            <span className="text-slate-500 dark:text-slate-400">Subtotal</span>
            <span className="font-semibold">{money(order.subtotal)}</span>
          </div>
          <div className="mt-2 flex justify-between text-xs sm:text-sm">
            <span className="text-slate-500 dark:text-slate-400">Shipping</span>
            <span className="font-semibold">{money(order.shippingCost)}</span>
          </div>
          <div className="mt-2 flex justify-between text-base sm:text-lg font-bold">
            <span>Total</span>
            <span>{money(order.total)}</span>
          </div>
        </div>

        <div className="mt-6 rounded-xl bg-slate-50 dark:bg-slate-900 p-4 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
          <p>Status: {order.status}</p>
          <p>Payment: {order.paymentMethod} ({order.paymentStatus})</p>
          <p className="mt-2">
            {order.shippingFullName}, {order.shippingAddress}, {order.shippingCity}
          </p>
        </div>
      </div>

      <div className="mt-8 flex justify-center">
        <Link to="/" className="rounded-full bg-violet-700 dark:bg-violet-600 px-6 py-3 text-xs sm:text-sm font-semibold text-white">
          Continue shopping
        </Link>
      </div>
    </div>
  );
}
