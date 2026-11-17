/* eslint-disable react-hooks/set-state-in-effect */

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Package,
  X,
  LoaderCircle,
  RefreshCw,
  Image as ImageIcon,
} from "lucide-react";

import { apiRequest, getImageUrl } from "../../services/api";
import PageHeader from "../../components/admin/PageHeader";
import StatusBadge from "../../components/admin/StatusBadge";

const emptyForm = {
  name: "",
  slug: "",
  description: "",
  price: "",
  stock: "0",
  imageUrl: "",
  categoryId: "",
  isActive: true,
};

function createSlug(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function formatMoney(value) {
  return `ETB ${Number(value).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [imageFile, setImageFile] = useState(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({
        limit: "100",
        sortBy: "createdAt",
        order: "desc",
        includeInactive: "true",
      });

      if (search.trim()) {
        params.set("search", search.trim());
      }

      if (categoryFilter !== "all") {
        params.set("categoryId", categoryFilter);
      }

      const response = await apiRequest(
        `/api/products?${params.toString()}`
      );

      setProducts(response.data || []);
    } catch (err) {
      setError(err.message || "Unable to load products.");
    } finally {
      setLoading(false);
    }
  }, [search, categoryFilter]);

  async function fetchCategories() {
    try {
      const response = await apiRequest("/api/categories");
      setCategories(response.data || []);
    } catch (err) {
      setError(err.message || "Unable to load categories.");
    }
  }

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts();
    }, 300);

    return () => clearTimeout(timer);
  }, [fetchProducts]);

  const filteredCount = products.length;

  const totalStock = useMemo(
    () => products.reduce((total, product) => total + product.stock, 0),
    [products]
  );

  function openCreateModal() {
    setEditingProduct(null);
    setForm(emptyForm);
    setImageFile(null);
    setError("");
    setSuccess("");
    setModalOpen(true);
  }

  function openEditModal(product) {
    setEditingProduct(product);

    setForm({
      name: product.name || "",
      slug: product.slug || "",
      description: product.description || "",
      price: String(product.price ?? ""),
      stock: String(product.stock ?? 0),
      imageUrl: product.imageUrl || "",
      categoryId: String(product.categoryId),
      isActive: product.isActive ?? true,
    });
    setImageFile(null);

    setError("");
    setSuccess("");
    setModalOpen(true);
  }

  function closeModal() {
    if (saving) return;

    setModalOpen(false);
    setEditingProduct(null);
    setForm(emptyForm);
    setImageFile(null);
  }

  function updateField(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
      ...(name === "name" && !editingProduct
        ? { slug: createSlug(value) }
        : {}),
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!form.name.trim() || !form.categoryId || !form.price) {
      setError("Please complete the product name, price, and category.");
      return;
    }

    const price = Number(form.price);
    const stock = Number(form.stock);

    if (!Number.isFinite(price) || price <= 0) {
      setError("Price must be greater than zero.");
      return;
    }

    if (!Number.isSafeInteger(stock) || stock < 0) {
      setError("Stock must be a whole number of zero or greater.");
      return;
    }

    setSaving(true);

    let imageUrl = form.imageUrl.trim() || null;

    if (imageFile) {
      const api = import.meta.env.VITE_API_URL || "http://localhost:5000";
      const token = localStorage.getItem("shopora_token");
      const formData = new FormData();
      formData.append("image", imageFile);

      const uploadResponse = await fetch(`${api}/api/uploads/product-image`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      const uploadData = await uploadResponse.json();

      if (!uploadResponse.ok) {
        throw new Error(uploadData.message || "Unable to upload image.");
      }

      imageUrl = uploadData.data.url;
    }

    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim() || createSlug(form.name),
      description: form.description.trim(),
      price,
      stock,
      imageUrl,
      categoryId: Number(form.categoryId),
      isActive: Boolean(form.isActive),
    };

    try {
      if (editingProduct) {
        await apiRequest(`/api/products/${editingProduct.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });

        setSuccess("Product updated successfully.");
      } else {
        await apiRequest("/api/products", {
          method: "POST",
          body: JSON.stringify(payload),
        });

        setSuccess("Product created successfully.");
      }

      setModalOpen(false);
      setEditingProduct(null);
      setForm(emptyForm);
      setImageFile(null);

      await fetchProducts();
    } catch (err) {
      setError(err.message || "Unable to save product.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(product) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${product.name}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");

    try {
      await apiRequest(`/api/products/${product.id}`, {
        method: "DELETE",
      });

      setSuccess(`"${product.name}" was deleted successfully.`);
      await fetchProducts();
    } catch (err) {
      setError(err.message || "Unable to delete product.");
    }
  }

  return (
    <div className="space-y-7">
      {/* Page heading */}
      <PageHeader
        eyebrow="Store management"
        title="Products"
        description="Manage your store inventory, prices, and product information."
        actions={
          <button
            onClick={openCreateModal}
            className="flex items-center justify-center gap-2 rounded-xl bg-violet-700 dark:bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-800"
          >
            <Plus size={18} />
            Add Product
          </button>
        }
      />

      {/* Notifications */}
      {error && (
        <div className="flex items-start justify-between gap-3 rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/30 p-4 text-sm text-red-700 dark:text-red-400">
          <p>{error}</p>
          <button onClick={() => setError("")} aria-label="Dismiss error">
            <X size={18} />
          </button>
        </div>
      )}

      {success && !modalOpen && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-green-200 bg-green-50 dark:bg-green-900/30 p-4 text-sm text-green-700 dark:text-green-400">
          <p>{success}</p>
          <button onClick={() => setSuccess("")} aria-label="Dismiss success">
            <X size={18} />
          </button>
        </div>
      )}

      {/* Summary cards */}
      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-700">
              <Package size={22} />
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Products displayed</p>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                {filteredCount}
              </h2>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-700">
              <Package size={22} />
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Stock in displayed products</p>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                {totalStock.toLocaleString()}
              </h2>
            </div>
          </div>
        </div>
      </section>

      {/* Search and filter */}
      <section className="flex flex-col gap-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm sm:flex-row">
        <div className="flex flex-1 items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3">
          <Search size={19} className="text-slate-400 dark:text-slate-500" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search product name or description..."
            className="w-full bg-transparent text-sm outline-none"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(event) => setCategoryFilter(event.target.value)}
          className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-sm outline-none"
        >
          <option value="all">All categories</option>

          {categories.map((category) => (
            <option key={category.id} value={String(category.id)}>
              {category.name}
            </option>
          ))}
        </select>

        <button
          onClick={fetchProducts}
          disabled={loading}
          className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900 disabled:opacity-50"
        >
          <RefreshCw size={17} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </section>

      {/* Products table */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 px-5 py-3">
          <div>
            <h2 className="font-bold text-slate-900 dark:text-white">All Products</h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {products.length} products in this result
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-48 items-center justify-center gap-3 text-sm text-slate-500 dark:text-slate-400">
            <LoaderCircle className="animate-spin" size={22} />
            Loading products...
          </div>
        ) : products.length === 0 ? (
          <div className="flex min-h-52 flex-col items-center justify-center px-5 text-center">
            <Package size={35} className="text-slate-300 dark:text-slate-600" />
            <h3 className="mt-4 font-semibold text-slate-800 dark:text-slate-100">
              No products found
            </h3>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Try another search or add your first product.
            </p>
            <button
              onClick={openCreateModal}
              className="mt-5 rounded-xl bg-violet-700 dark:bg-violet-600 px-5 py-3 text-sm font-semibold text-white"
            >
              Add Product
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left">
              <thead className="bg-slate-50 dark:bg-slate-900 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="px-5 py-3 font-semibold">Product</th>
                  <th className="px-5 py-3 font-semibold">Category</th>
                  <th className="px-5 py-3 font-semibold">Price</th>
                  <th className="px-5 py-3 font-semibold">Stock</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {products.map((product) => (
                  <tr key={product.id} className="transition hover:bg-slate-50 dark:hover:bg-slate-900">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-700">
                          {product.imageUrl ? (
                            <img
                              src={getImageUrl(product.imageUrl) || "/assets/images/products/headphones.jpg"}
                              alt={product.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <ImageIcon size={21} className="text-slate-400 dark:text-slate-500" />
                          )}
                        </div>

                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white">
                            {product.name}
                          </p>
                          <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                            {product.slug}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-3 text-sm text-slate-600 dark:text-slate-300">
                      {product.category?.name || "Uncategorized"}
                    </td>

                    <td className="px-5 py-3 text-sm font-semibold text-slate-900 dark:text-white">
                      {formatMoney(product.price)}
                    </td>

                    <td className="px-5 py-3">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          product.stock === 0
                            ? "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                            : product.stock < 5
                              ? "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
                              : "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                        }`}
                      >
                        {product.stock} in stock
                      </span>
                    </td>

                    <td className="px-5 py-3">
                      <StatusBadge status={product.isActive ? "Active" : "Inactive"} />
                    </td>

                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEditModal(product)}
                          title="Edit product"
                          className="rounded-lg p-2 text-slate-500 dark:text-slate-400 transition hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-violet-700 dark:text-violet-400"
                        >
                          <Pencil size={18} />
                        </button>

                        <button
                          onClick={() => handleDelete(product)}
                          title="Delete product"
                          className="rounded-lg p-2 text-red-500 transition hover:bg-red-50 dark:bg-red-900/30"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Create / Edit modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-slate-950/60 dark:bg-black/60 p-4">
          <div className="my-auto w-full max-w-2xl rounded-2xl bg-white dark:bg-slate-800 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 px-6 py-5">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                  {editingProduct ? "Edit Product" : "Add New Product"}
                </h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Enter the product information below.
                </p>
              </div>

              <button
                onClick={closeModal}
                disabled={saving}
                className="rounded-lg p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                aria-label="Close form"
              >
                <X size={21} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 p-5">
              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/30 p-3 text-sm text-red-700 dark:text-red-400">
                  {error}
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Product Name *
                  </label>
                  <input
                    name="name"
                    value={form.name}
                    onChange={updateField}
                    required
                    maxLength={120}
                    placeholder="e.g. Wireless Headphones"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3 text-sm outline-none focus:border-violet-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Product Slug *
                  </label>
                  <input
                    name="slug"
                    value={form.slug}
                    onChange={updateField}
                    required
                    pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                    title="Use lowercase letters, numbers, and hyphens only."
                    placeholder="wireless-headphones"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3 text-sm outline-none focus:border-violet-500"
                  />
                  <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                    Used in product URLs. Lowercase letters and hyphens only.
                  </p>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Price (ETB) *
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={form.price}
                    onChange={updateField}
                    min="0.01"
                    step="0.01"
                    required
                    placeholder="1499.99"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3 text-sm outline-none focus:border-violet-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Stock Quantity *
                  </label>
                  <input
                    type="number"
                    name="stock"
                    value={form.stock}
                    onChange={updateField}
                    min="0"
                    step="1"
                    required
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3 text-sm outline-none focus:border-violet-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Category *
                  </label>
                  <select
                    name="categoryId"
                    value={form.categoryId}
                    onChange={updateField}
                    required
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-sm outline-none focus:border-violet-500"
                  >
                    <option value="">Select a category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={String(category.id)}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Active
                  </label>
                  <label className="flex items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3 text-sm">
                    <input
                      type="checkbox"
                      checked={Boolean(form.isActive)}
                      onChange={(e) =>
                        setForm((current) => ({ ...current, isActive: e.target.checked }))
                      }
                    />
                    Product is visible in the store
                  </label>
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Upload image
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) => setImageFile(event.target.files?.[0] || null)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3 text-sm"
                  />
                  {imageFile && (
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{imageFile.name}</p>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Image URL
                  </label>
                  <input
                    type="url"
                    name="imageUrl"
                    value={form.imageUrl}
                    onChange={updateField}
                    placeholder="https://example.com/product.jpg"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3 text-sm outline-none focus:border-violet-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={updateField}
                    rows={4}
                    placeholder="Describe the product..."
                    className="w-full resize-y rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3 text-sm outline-none focus:border-violet-500"
                  />
                </div>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 dark:border-slate-700 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-xl border border-slate-200 dark:border-slate-700 px-5 py-3 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center justify-center gap-2 rounded-xl bg-violet-700 dark:bg-violet-600 px-6 py-3 text-sm font-semibold text-white hover:bg-violet-800 disabled:opacity-60"
                >
                  {saving && <LoaderCircle size={17} className="animate-spin" />}
                  {saving
                    ? "Saving..."
                    : editingProduct
                      ? "Save Changes"
                      : "Create Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
