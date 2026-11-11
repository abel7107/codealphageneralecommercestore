import { useCallback, useEffect, useState } from "react";
import {
  Search,
  LoaderCircle,
  Eye,
  X,
} from "lucide-react";
import { apiRequest } from "../../services/api";

const ORDER_STATUSES = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];
const PAYMENT_STATUSES = ["PENDING", "PAID", "FAILED", "REFUNDED"];
const TRANSITIONS = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};

function money(value) {
  return `ETB ${Number(value).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [nextStatus, setNextStatus] = useState("");
  const [nextPaymentStatus, setNextPaymentStatus] = useState("");

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });
      if (search.trim()) params.set("search", search.trim());
      if (statusFilter) params.set("status", statusFilter);
      if (paymentFilter) params.set("paymentStatus", paymentFilter);
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);

      const response = await apiRequest(`/api/admin/orders?${params.toString()}`);
      setOrders(response.data || []);
      setTotalPages(response.pagination?.totalPages || 1);
    } catch (err) {
      setError(err.message || "Unable to load orders.");
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, statusFilter, paymentFilter, startDate, endDate]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  async function openDetails(orderId) {
    setDetailsLoading(true);
    setError("");
    try {
      const response = await apiRequest(`/api/admin/orders/${orderId}`);
      setSelectedOrder(response.data);
      setNextStatus(response.data.status);
      setNextPaymentStatus(response.data.paymentStatus);
    } catch (err) {
      setError(err.message || "Unable to load order details.");
    } finally {
      setDetailsLoading(false);
    }
  }

  function closeDetails() {
    if (updating) return;
    setSelectedOrder(null);
    setNextStatus("");
    setNextPaymentStatus("");
  }

  async function handleUpdateStatus() {
    if (!selectedOrder) return;
    setUpdating(true);
    setError("");
    setSuccess("");
    try {
      await apiRequest(`/api/admin/orders/${selectedOrder.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({
          status: nextStatus,
          paymentStatus: nextPaymentStatus,
        }),
      });
      setSuccess("Order updated successfully.");
      await openDetails(selectedOrder.id);
      await fetchOrders();
    } catch (err) {
      setError(err.message || "Unable to update order.");
    } finally {
      setUpdating(false);
    }
  }

  const availableTransitions = selectedOrder
    ? TRANSITIONS[selectedOrder.status] || []
    : [];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-slate-500">Store management</p>
        <h1 className="mt-1 text-3xl font-bold text-slate-900">Orders</h1>
      </div>

      {error && (
        <div className="flex items-start justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <p>{error}</p>
          <button onClick={() => setError("")} aria-label="Dismiss error">
            <X size={18} />
          </button>
        </div>
      )}

      {success && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          <p>{success}</p>
          <button onClick={() => setSuccess("")} aria-label="Dismiss success">
            <X size={18} />
          </button>
        </div>
      )}

      {/* Filters */}
      <section className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:grid-cols-5">
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-3">
          <Search size={18} className="text-slate-400" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search order or customer..."
            className="w-full bg-transparent py-2 text-sm outline-none"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
        >
          <option value="">All statuses</option>
          {ORDER_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>

        <select
          value={paymentFilter}
          onChange={(e) => {
            setPaymentFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
        >
          <option value="">All payments</option>
          {PAYMENT_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>

        <input
          type="date"
          value={startDate}
          onChange={(e) => {
            setStartDate(e.target.value);
            setPage(1);
          }}
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
        />

        <input
          type="date"
          value={endDate}
          onChange={(e) => {
            setEndDate(e.target.value);
            setPage(1);
          }}
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
        />
      </section>

      {/* Table */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex min-h-60 items-center justify-center gap-3 text-sm text-slate-500">
            <LoaderCircle className="animate-spin" size={22} />
            Loading orders...
          </div>
        ) : orders.length === 0 ? (
          <div className="flex min-h-60 flex-col items-center justify-center px-5 text-center">
            <p className="font-semibold text-slate-800">No orders found</p>
            <p className="mt-2 text-sm text-slate-500">Try adjusting your filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left">
              <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-4 font-semibold">Order</th>
                  <th className="px-5 py-4 font-semibold">Customer</th>
                  <th className="px-5 py-4 font-semibold">Date</th>
                  <th className="px-5 py-4 font-semibold">Items</th>
                  <th className="px-5 py-4 font-semibold">Total</th>
                  <th className="px-5 py-4 font-semibold">Payment</th>
                  <th className="px-5 py-4 font-semibold">Status</th>
                  <th className="px-5 py-4 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((order) => (
                  <tr key={order.id} className="transition hover:bg-slate-50">
                    <td className="px-5 py-4 font-semibold text-slate-900">{order.orderNumber}</td>
                    <td className="px-5 py-4 text-sm text-slate-600">
                      {order.user?.name || "Unknown"}
                      <p className="text-xs text-slate-400">{order.user?.email}</p>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600">{order.items?.length ?? 0}</td>
                    <td className="px-5 py-4 text-sm font-semibold text-slate-900">{money(order.total)}</td>
                    <td className="px-5 py-4">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                        {order.paymentStatus}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                        {order.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => openDetails(order.id)}
                        className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-950"
                        title="View details"
                      >
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={page === 1}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-sm text-slate-600">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
            disabled={page === totalPages}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}

      {/* Details modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4">
          <div className="my-auto w-full max-w-4xl rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Order {selectedOrder.orderNumber}</h2>
                <p className="mt-1 text-sm text-slate-500">
                  {selectedOrder.user?.name} · {new Date(selectedOrder.createdAt).toLocaleString()}
                </p>
              </div>
              <button onClick={closeDetails} disabled={updating} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">
                <X size={21} />
              </button>
            </div>

            <div className="max-h-[75vh] overflow-y-auto p-6">
              {detailsLoading ? (
                <div className="flex items-center gap-2 text-slate-500">
                  <LoaderCircle className="animate-spin" size={20} />
                  Loading details...
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-xl bg-slate-50 p-4">
                      <h3 className="text-sm font-semibold text-slate-700">Shipping address</h3>
                      <p className="mt-2 text-sm text-slate-900">{selectedOrder.shippingFullName}</p>
                      <p className="text-sm text-slate-600">{selectedOrder.shippingAddress}</p>
                      <p className="text-sm text-slate-600">
                        {selectedOrder.shippingCity}
                        {selectedOrder.shippingPostalCode ? `, ${selectedOrder.shippingPostalCode}` : ""}
                      </p>
                      <p className="text-sm text-slate-600">{selectedOrder.shippingCountry}</p>
                      <p className="text-sm text-slate-600">{selectedOrder.shippingPhone}</p>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-4">
                      <h3 className="text-sm font-semibold text-slate-700">Payment</h3>
                      <p className="mt-2 text-sm text-slate-900">{selectedOrder.paymentMethod}</p>
                      <p className="text-sm text-slate-600">Status: {selectedOrder.paymentStatus}</p>
                      <p className="mt-3 text-sm font-semibold text-slate-900">Total: {money(selectedOrder.total)}</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-slate-700">Items</h3>
                    <div className="mt-3 space-y-3">
                      {selectedOrder.items.map((item) => (
                        <div key={item.id} className="flex items-center gap-4 rounded-xl border border-slate-100 p-3">
                          <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-lg bg-slate-100">
                            {item.product?.imageUrl ? (
                              <img
                                src={item.product.imageUrl}
                                alt={item.productName}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <span className="text-xs text-slate-400">No image</span>
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-slate-900">{item.productName}</p>
                            <p className="text-xs text-slate-500">
                              {item.quantity} × {money(item.unitPrice)}
                            </p>
                          </div>
                          <p className="text-sm font-semibold text-slate-900">{money(item.subtotal)}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <label className="mb-2 block text-sm font-semibold text-slate-700">
                            Order status
                          </label>
                          <select
                            value={nextStatus}
                            onChange={(e) => setNextStatus(e.target.value)}
                            disabled={updating}
                            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                          >
                            <option value={selectedOrder.status}>{selectedOrder.status}</option>
                            {availableTransitions.map((status) => (
                              <option key={status} value={status}>
                                {status}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="mb-2 block text-sm font-semibold text-slate-700">
                            Payment status
                          </label>
                          <select
                            value={nextPaymentStatus}
                            onChange={(e) => setNextPaymentStatus(e.target.value)}
                            disabled={updating}
                            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                          >
                            {PAYMENT_STATUSES.map((status) => (
                              <option key={status} value={status}>
                                {status}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          if (nextStatus !== selectedOrder.status) {
                            const confirmed = window.confirm(
                              `Change order status from ${selectedOrder.status} to ${nextStatus}?`
                            );
                            if (!confirmed) return;
                          }
                          handleUpdateStatus();
                        }}
                        disabled={
                          updating ||
                          (nextStatus === selectedOrder.status &&
                            nextPaymentStatus === selectedOrder.paymentStatus)
                        }
                        className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
                      >
                        {updating ? "Updating..." : "Update order"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
