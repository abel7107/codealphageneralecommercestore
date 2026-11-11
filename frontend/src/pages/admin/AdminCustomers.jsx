import { useCallback, useEffect, useState } from "react";
import {
  Search,
  LoaderCircle,
  Eye,
  X,
} from "lucide-react";
import { apiRequest } from "../../services/api";

function money(value) {
  return `ETB ${Number(value).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function AdminCustomers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [customerOrders, setCustomerOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });
      if (search.trim()) params.set("search", search.trim());
      if (statusFilter) params.set("status", statusFilter);

      const response = await apiRequest(`/api/admin/customers?${params.toString()}`);
      setCustomers(response.data || []);
      setTotalPages(response.pagination?.totalPages || 1);
    } catch (err) {
      setError(err.message || "Unable to load customers.");
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, statusFilter]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  async function openDetails(customerId) {
    setDetailsLoading(true);
    setError("");
    try {
      const response = await apiRequest(`/api/admin/customers/${customerId}`);
      setSelectedCustomer(response.data);
      setOrdersLoading(true);
      const ordersResponse = await apiRequest(`/api/admin/customers/${customerId}/orders`);
      setCustomerOrders(ordersResponse.data || []);
    } catch (err) {
      setError(err.message || "Unable to load customer details.");
    } finally {
      setDetailsLoading(false);
      setOrdersLoading(false);
    }
  }

  function closeDetails() {
    setSelectedCustomer(null);
    setCustomerOrders([]);
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-slate-500">Store management</p>
        <h1 className="mt-1 text-3xl font-bold text-slate-900">Customers</h1>
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

      <section className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-3">
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-3">
          <Search size={18} className="text-slate-400" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by name or email..."
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
          <option value="">All customers</option>
          <option value="active">Active</option>
          <option value="disabled">Disabled</option>
        </select>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex min-h-60 items-center justify-center gap-3 text-sm text-slate-500">
            <LoaderCircle className="animate-spin" size={22} />
            Loading customers...
          </div>
        ) : customers.length === 0 ? (
          <div className="flex min-h-60 flex-col items-center justify-center px-5 text-center">
            <p className="font-semibold text-slate-800">No customers found</p>
            <p className="mt-2 text-sm text-slate-500">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-left">
              <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-4 font-semibold">Customer</th>
                  <th className="px-5 py-4 font-semibold">Email</th>
                  <th className="px-5 py-4 font-semibold">Registered</th>
                  <th className="px-5 py-4 font-semibold">Orders</th>
                  <th className="px-5 py-4 font-semibold">Spending</th>
                  <th className="px-5 py-4 font-semibold">Status</th>
                  <th className="px-5 py-4 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customers.map((customer) => (
                  <tr key={customer.id} className="transition hover:bg-slate-50">
                    <td className="px-5 py-4 font-semibold text-slate-900">{customer.name}</td>
                    <td className="px-5 py-4 text-sm text-slate-600">{customer.email}</td>
                    <td className="px-5 py-4 text-sm text-slate-600">
                      {new Date(customer.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600">{customer._count?.orders ?? 0}</td>
                    <td className="px-5 py-4 text-sm font-semibold text-slate-900">
                      {money(customer.totalSpending)}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          customer.isActive ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                        }`}
                      >
                        {customer.isActive ? "Active" : "Disabled"}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => openDetails(customer.id)}
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

      {selectedCustomer && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4">
          <div className="my-auto w-full max-w-4xl rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <h2 className="text-xl font-bold text-slate-900">{selectedCustomer.name}</h2>
                <p className="mt-1 text-sm text-slate-500">{selectedCustomer.email}</p>
              </div>
              <button onClick={closeDetails} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">
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
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-xl bg-slate-50 p-4">
                      <h3 className="text-sm font-semibold text-slate-700">Contact</h3>
                      <p className="mt-2 text-sm text-slate-900">{selectedCustomer.phone || "Not available"}</p>
                      <p className="text-sm text-slate-600">{selectedCustomer.contactEmail}</p>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-4">
                      <h3 className="text-sm font-semibold text-slate-700">Registration</h3>
                      <p className="mt-2 text-sm text-slate-900">
                        {new Date(selectedCustomer.createdAt).toLocaleString()}
                      </p>
                      <p className="text-sm text-slate-600">
                        {selectedCustomer.isActive ? "Active account" : "Disabled account"}
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-4">
                      <h3 className="text-sm font-semibold text-slate-700">Spending</h3>
                      <p className="mt-2 text-sm text-slate-900">
                        {selectedCustomer._count?.orders ?? 0} orders
                      </p>
                      <p className="text-sm font-semibold text-slate-900">
                        {money(selectedCustomer.totalSpending)}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-slate-700">Order history</h3>
                    {ordersLoading ? (
                      <div className="mt-3 flex items-center gap-2 text-slate-500">
                        <LoaderCircle className="animate-spin" size={18} />
                        Loading orders...
                      </div>
                    ) : customerOrders.length === 0 ? (
                      <p className="mt-3 text-sm text-slate-500">No orders found.</p>
                    ) : (
                      <div className="mt-3 space-y-3">
                        {customerOrders.map((order) => (
                          <div key={order.id} className="flex items-center justify-between rounded-xl border border-slate-100 p-4">
                            <div>
                              <p className="text-sm font-semibold text-slate-900">{order.orderNumber}</p>
                              <p className="text-xs text-slate-500">
                                {new Date(order.createdAt).toLocaleDateString()} · {order.status}
                              </p>
                            </div>
                            <p className="text-sm font-semibold text-slate-900">{money(order.total)}</p>
                          </div>
                        ))}
                      </div>
                    )}
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
