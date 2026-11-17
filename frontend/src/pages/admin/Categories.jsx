/* eslint-disable react-hooks/set-state-in-effect */
import { useCallback, useEffect, useState } from "react";
import { Pencil, Trash2, LoaderCircle } from "lucide-react";
import { apiRequest } from "../../services/api";
import PageHeader from "../../components/admin/PageHeader";

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
    <div className="space-y-5">
      <PageHeader
        eyebrow="Store management"
        title="Categories"
        description="Organize your product catalog into categories."
      />

      {error && <div className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/30 p-3 text-xs sm:text-sm text-red-700 dark:text-red-400">{error}</div>}
      {success && <div className="rounded-xl border border-green-200 bg-green-50 dark:bg-green-900/30 p-3 text-xs sm:text-sm text-green-700 dark:text-green-400">{success}</div>}

      <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Category name"
          className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3 text-xs sm:text-sm"
        />
        <button type="submit" className="rounded-xl bg-violet-700 dark:bg-violet-600 px-5 py-3 text-xs sm:text-sm font-semibold text-white">
          {editing ? "Update" : "Add"}
        </button>
        {editing && (
          <button
            type="button"
            onClick={() => { setEditing(null); setName(""); }}
            className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3 text-xs sm:text-sm"
          >
            Cancel
          </button>
        )}
      </form>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search categories..."
        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3 text-xs sm:text-sm sm:max-w-sm"
      />

      {loading ? (
        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
          <LoaderCircle className="animate-spin" /> Loading...
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm">
          <table className="w-full min-w-[480px] text-left">
            <thead className="bg-slate-50 dark:bg-slate-900 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Products</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((category) => (
                <tr key={category.id}>
                  <td className="px-5 py-3 font-semibold text-slate-900 dark:text-white">{category.name}</td>
                  <td className="px-5 py-3 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                    {category._count?.products ?? 0}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => { setEditing(category); setName(category.name); }}
                        className="rounded-lg p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                      >
                        <Pencil size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(category)}
                        className="rounded-lg p-2 text-red-500 hover:bg-red-50 dark:bg-red-900/30"
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
