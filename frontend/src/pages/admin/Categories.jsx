import { useCallback, useEffect, useState } from "react";
import { Plus, Pencil, Trash2, LoaderCircle, X } from "lucide-react";
import { apiRequest } from "../../services/api";

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiRequest("/api/categories");
      setCategories(response.data || []);
    } catch (err) {
      setError(err.message || "Unable to load categories.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!name.trim()) {
      setError("Category name is required.");
      return;
    }
    try {
      if (editing) {
        await apiRequest(`/api/categories/${editing.id}`, {
          method: "PUT",
          body: JSON.stringify({ name: name.trim() }),
        });
        setSuccess("Category updated.");
      } else {
        await apiRequest("/api/categories", {
          method: "POST",
          body: JSON.stringify({ name: name.trim() }),
        });
        setSuccess("Category created.");
      }
      setName("");
      setEditing(null);
      await fetchCategories();
    } catch (err) {
      setError(err.message || "Unable to save category.");
    }
  }

  async function handleDelete(category) {
    if (!window.confirm(`Delete "${category.name}"?`)) return;
    setError("");
    setSuccess("");
    try {
      await apiRequest(`/api/categories/${category.id}`, { method: "DELETE" });
      setSuccess("Category deleted.");
      await fetchCategories();
    } catch (err) {
      setError(err.message || "Unable to delete category.");
    }
  }

  const filtered = categories.filter((category) =>
    category.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-slate-500">Store management</p>
        <h1 className="mt-1 text-3xl font-bold text-slate-900">Categories</h1>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      {success && <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700">{success}</div>}

      <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Category name"
          className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm"
        />
        <button type="submit" className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white">
          {editing ? "Update" : "Add"}
        </button>
        {editing && (
          <button
            type="button"
            onClick={() => { setEditing(null); setName(""); }}
            className="rounded-xl border border-slate-200 px-4 py-3 text-sm"
          >
            Cancel
          </button>
        )}
      </form>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search categories..."
        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm sm:max-w-sm"
      />

      {loading ? (
        <div className="flex items-center gap-2 text-slate-500">
          <LoaderCircle className="animate-spin" /> Loading...
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-4">Name</th>
                <th className="px-5 py-4">Products</th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((category) => (
                <tr key={category.id}>
                  <td className="px-5 py-4 font-semibold text-slate-900">{category.name}</td>
                  <td className="px-5 py-4 text-sm text-slate-600">
                    {category._count?.products ?? 0}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => { setEditing(category); setName(category.name); }}
                        className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                      >
                        <Pencil size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(category)}
                        className="rounded-lg p-2 text-red-500 hover:bg-red-50"
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
    </div>
  );
}
