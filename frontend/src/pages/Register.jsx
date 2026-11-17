import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);

    try {
      await register(name, email, password);
      navigate("/login", {
        state: { message: "Account created successfully. Please sign in." },
      });
    } catch (err) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50 dark:bg-slate-900 flex items-center justify-center px-4 py-12">
      {/* Animated ecommerce background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-20 -left-20 h-72 w-72 rounded-full bg-violet-300/30 dark:bg-violet-600/20 blur-3xl animate-float" />
        <div className="absolute top-1/3 -right-24 h-80 w-80 rounded-full bg-blue-300/30 dark:bg-blue-600/20 blur-3xl animate-float" style={{ animationDelay: "2s" }} />
        <div className="absolute -bottom-24 left-1/3 h-72 w-72 rounded-full bg-emerald-300/30 dark:bg-emerald-600/20 blur-3xl animate-float" style={{ animationDelay: "4s" }} />
      </div>

      <div className="relative w-full max-w-xs rounded-2xl bg-white dark:bg-slate-800 p-5 shadow-lg">
        <h1 className="text-center text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
          Sign up
        </h1>

        {error && (
          <div className="mt-4 rounded-lg bg-red-50 dark:bg-red-900/30 p-3 text-xs sm:text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-200">
              Full name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
              minLength={2}
              maxLength={100}
              required
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm outline-none focus:border-violet-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-200">
              Email address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm outline-none focus:border-violet-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-200">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              minLength={8}
              required
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm outline-none focus:border-violet-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-200">
              Confirm password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Enter your password again"
              required
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm outline-none focus:border-violet-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-violet-700 dark:bg-violet-600 py-2 text-sm font-semibold text-white transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Creating account..." : "Sign up"}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-slate-600 dark:text-slate-300">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-semibold text-violet-700 dark:text-violet-400 hover:underline"
          >
            Sign in
          </Link>
        </p>

        <Link
          to="/"
          className="mt-3 block text-center text-xs text-slate-500 dark:text-slate-400 hover:text-violet-700 dark:text-violet-400"
        >
          ← Back to Shopora
        </Link>
      </div>
    </div>
  );
}
