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
        <p className="text-sm text-gray-500">Loading order...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-900">{error || "Order not found"}</h1>
        <Link to="/" className="mt-6 inline-block rounded-full bg-gray-950 px-6 py-3 text-sm font-semibold text-white">
          Back to store
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="rounded-3xl border border-green-200 bg-green-50 p-8 text-center">
        <h1 className="text-3xl font-bold text-green-800">Order placed successfully</h1>
        <p className="mt-3 text-sm text-green-700">
          Your order number is <strong>{order.orderNumber}</strong>.
        </p>
      </div>

      <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900">Order details</h2>
        <div className="mt-4 space-y-3">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span>
                {item.productName} × {item.quantity}
              </span>
              <span className="font-semibold">{money(item.subtotal)}</span>
            </div>
          ))}
        </div>

        <div className="mt-6 border-t border-gray-200 pt-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Subtotal</span>
            <span className="font-semibold">{money(order.subtotal)}</span>
          </div>
          <div className="mt-2 flex justify-between text-sm">
            <span className="text-gray-500">Shipping</span>
            <span className="font-semibold">{money(order.shippingCost)}</span>
          </div>
          <div className="mt-2 flex justify-between text-lg font-bold">
            <span>Total</span>
            <span>{money(order.total)}</span>
          </div>
        </div>

        <div className="mt-6 rounded-xl bg-gray-50 p-4 text-sm text-gray-600">
          <p>Status: {order.status}</p>
          <p>Payment: {order.paymentMethod} ({order.paymentStatus})</p>
          <p className="mt-2">
            {order.shippingFullName}, {order.shippingAddress}, {order.shippingCity}
          </p>
        </div>
      </div>

      <div className="mt-8 flex justify-center">
        <Link to="/" className="rounded-full bg-gray-950 px-6 py-3 text-sm font-semibold text-white">
          Continue shopping
        </Link>
      </div>
    </div>
  );
}
