import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../services/api";

const STATUSES = ["All", "PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];

function money(value) {
  return `ETB ${Number(value).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function SkeletonRow() {
  return (
    <div className="animate-pulse rounded-2xl border border-gray-200 bg-white p-5">
      <div className="h-4 w-40 rounded bg-gray-200" />
      <div className="mt-3 h-3 w-24 rounded bg-gray-200" />
      <div className="mt-4 h-3 w-full rounded bg-gray-200" />
    </div>
  );
}

export default function MyOrders() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [page, setPage] = useState(1);
  const pageSize = 5;

  useEffect(() => {
    if (!user) {
      navigate("/login", { state: { from: "/orders" }, replace: true });
      return;
    }
    (async () => {
      setLoading(true);
      setError("");
      try {
        const response = await apiRequest("/api/orders/my-orders");
        setOrders(response.data || []);
      } catch (err) {
        setError(err.message || "Unable to load orders.");
      } finally {
        setLoading(false);
      }
    })();
  }, [user, navigate]);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesSearch = order.orderNumber.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "All" || order.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [orders, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pagedOrders = filteredOrders.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  if (!user) return null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My orders</h1>
          <p className="mt-2 text-sm text-gray-500">Track and review your previous orders.</p>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search by order number..."
          className="flex-1 rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-gray-900"
        />
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-gray-900"
        >
          {STATUSES.map((status) => (
            <option key={status} value={status}>
              {status === "All" ? "All statuses" : status}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mt-6 space-y-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, index) => <SkeletonRow key={index} />)
        ) : pagedOrders.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center">
            <h2 className="text-xl font-bold text-gray-900">No orders found</h2>
            <p className="mt-2 text-sm text-gray-500">
              {orders.length === 0
                ? "You have not placed any orders yet."
                : "Try another search or status filter."}
            </p>
            <Link to="/" className="mt-6 inline-block rounded-full bg-gray-950 px-6 py-3 text-sm font-semibold text-white">
              Start shopping
            </Link>
          </div>
        ) : (
          pagedOrders.map((order) => (
            <article key={order.id} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{order.orderNumber}</p>
                  <p className="mt-1 text-xs text-gray-500">
                    {new Date(order.createdAt).toLocaleString()}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                    {order.status}
                  </span>
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                    {order.paymentStatus}
                  </span>
                  <span className="text-sm font-bold text-gray-900">{money(order.total)}</span>
                  <Link
                    to={`/orders/${order.id}`}
                    className="rounded-lg border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-900 transition hover:bg-gray-50"
                  >
                    View details
                  </Link>
                </div>
              </div>
            </article>
          ))
        )}
      </div>

      {!loading && filteredOrders.length > pageSize && (
        <div className="mt-8 flex items-center justify-center gap-3">
          <button
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={currentPage === 1}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
            disabled={currentPage === totalPages}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
