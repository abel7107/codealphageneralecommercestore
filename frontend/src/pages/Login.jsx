import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
     const response = await login(email, password);

const from = location.state?.from || (response.user.role === "ADMIN" ? "/admin" : "/");

if (response.user.role === "ADMIN" && !location.state?.from) {
  navigate("/admin");
} else {
  navigate(from);
}
    } catch (err) {
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-800 p-6 shadow-lg">
        <Link to="/" className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-white">
          Shopora
        </Link>

        <h1 className="mt-6 text-lg sm:text-2xl font-bold text-slate-900 dark:text-white">
          Welcome back
        </h1>

        <p className="mt-2 text-slate-500 dark:text-slate-400">
          Sign in to continue shopping.
        </p>

        {error && (
          <div className="mt-5 rounded-lg bg-red-50 dark:bg-red-900/30 p-3 text-xs sm:text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="mb-2 block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200">
              Email address
            </label>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@gmail.com"
              required
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-3 outline-none focus:border-slate-900"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200">
              Password
            </label>

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-3 outline-none focus:border-slate-900"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-violet-700 dark:bg-violet-600 py-3 font-semibold text-white transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs sm:text-sm text-slate-600 dark:text-slate-300">
          Don't have an account?{" "}
          <Link
            to="/register"
            className="font-semibold text-slate-900 dark:text-white hover:underline"
          >
            Create account
          </Link>
        </p>

        <Link
          to="/"
          className="mt-6 block text-center text-xs sm:text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white"
        >
          ← Back to Shopora
        </Link>
      </div>
    </div>
  );
}