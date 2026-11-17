
import AdminLayout from "./layouts/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import { useState, useEffect } from "react";
import { useCart } from "./context/CartContext";
import { getImageUrl } from "./services/api";
import { useAuth } from "./context/AuthContext";
import { useTheme } from "./context/ThemeContext";
import ProtectedRoute from "./components/ProtectedRoute";
import { Routes, Route, Link, useNavigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Checkout from "./pages/Checkout";
import OrderConfirmation from "./pages/OrderConfirmation";
import MyOrders from "./pages/MyOrders";
import OrderDetails from "./pages/OrderDetails";
import Products from "./pages/admin/Products";
import Categories from "./pages/admin/Categories";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminCustomers from "./pages/admin/AdminCustomers";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import Settings from "./pages/admin/Settings";
import {
  Headphones,
  Shirt,
  House,
  Watch,
} from "lucide-react";
import {
  Search,
  ShoppingBag,
  UserRound,
  Menu,
  ArrowRight,
  Heart,
  Star,
  Truck,
  ShieldCheck,
  RotateCcw,
  X,
  Plus,
  Minus,
  Trash2,
  Sun,
  Moon,
} from "lucide-react";



const money = (amount) =>
  `ETB ${amount.toLocaleString("en-US")}`;

function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { items: cart, cartCount, cartTotal, addToCart: addToCartCtx, updateQuantity, removeItem } = useCart();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const api = import.meta.env.VITE_API_URL || "http://localhost:5000";
        const [productsRes, categoriesRes] = await Promise.all([
          fetch(`${api}/api/products?limit=100`).then((r) => r.json()),
          fetch(`${api}/api/categories`).then((r) => r.json()),
        ]);
        setProducts(productsRes.data || []);
        setCategories(categoriesRes.data || []);
      } catch {
        setProducts([]);
        setCategories([]);
      }
    })();
  }, []);

  const uiCategories = categories.length
    ? categories.map((c) => {
        const iconMap = { Electronics: Headphones, Fashion: Shirt, "Home & Living": House, Accessories: Watch };
        return { name: c.name, Icon: iconMap[c.name] || ShoppingBag, color: "bg-slate-100 dark:bg-slate-700" };
      })
    : [
        { name: "Electronics", Icon: Headphones, color: "bg-slate-100 dark:bg-slate-700" },
        { name: "Fashion", Icon: Shirt, color: "bg-slate-100 dark:bg-slate-700" },
        { name: "Home & Living", Icon: House, color: "bg-slate-100 dark:bg-slate-700" },
        { name: "Accessories", Icon: Watch, color: "bg-slate-100 dark:bg-slate-700" },
      ];

  const filteredProducts = products.filter((product) => {
    const matchesSearch = `${product.name} ${product.category?.name || ""}`
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchesCategory =
      activeCategory === "All" ||
      product.category?.name === activeCategory;

    return matchesSearch && matchesCategory;
  });

  function addToCart(product) {
    addToCartCtx(product, 1);
  }

  function changeQuantity(id, amount) {
    const item = cart.find((i) => i.id === id);
    if (!item) return;
    updateQuantity(id, Math.max(1, item.quantity + amount));
  }

  function removeFromCart(id) {
    removeItem(id);
  }

  function continueShopping() {
    setCartOpen(false);
    document.getElementById("products")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  function toggleFavorite(id) {
    setFavorites((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
        
        

      <header className="sticky top-0 z-30 border-b border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <button
            className="rounded-lg p-2 lg:hidden"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          <a
            href="#home"
            className="text-2xl font-black tracking-tight sm:text-3xl"
          >
            shopora<span className="text-slate-950 dark:text-white">.</span>
          </a>

          <nav className="hidden items-center gap-8 text-sm font-medium text-slate-600 dark:text-slate-300 lg:flex">
            <a href="#home" className="text-slate-950 dark:text-white">Home</a>
            <a href="#products" className="transition hover:text-violet-700 dark:text-violet-400">Shop</a>
            <a href="#categories" className="transition hover:text-violet-700 dark:text-violet-400">Categories</a>
            <a href="#benefits" className="transition hover:text-violet-700 dark:text-violet-400">Why Shopora?</a>
          </nav>

          <div className="hidden max-w-sm flex-1 md:flex lg:max-w-xs">
            <div className="flex w-full items-center gap-2 rounded-full bg-slate-100 dark:bg-slate-700 px-4 py-2.5 focus-within:ring-2 focus-within:ring-slate-300">
              <Search size={18} className="shrink-0 text-slate-400 dark:text-slate-500" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search products..."
                className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400 dark:text-slate-500"
                aria-label="Search products"
              />
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-3">
            <button
              onClick={toggleTheme}
              className="rounded-full p-2.5 transition hover:bg-slate-100 dark:hover:bg-slate-700"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun size={21} /> : <Moon size={21} />}
            </button>
            <button
              className="relative rounded-full p-2.5 transition hover:bg-slate-100 dark:bg-slate-700"
              onClick={() => setCartOpen(true)}
              aria-label="Open shopping cart"
            >
              <ShoppingBag size={21} />
              {cartCount > 0 && (

          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white ring-2 ring-white">
            {cartCount}
          </span>

              )}
            </button>
           <Link
              to={user ? "/orders" : "/login"}
              className="hidden rounded-full p-2.5 transition hover:bg-slate-100 dark:bg-slate-700 sm:block"
              aria-label={user ? "My orders" : "Account"}
            >
              <UserRound size={21} />
            </Link>


          </div>
        </div>

        {menuOpen && (
          <nav className="flex flex-col gap-4 border-t border-slate-100 dark:border-slate-700 px-6 py-5 text-sm lg:hidden">
            <a href="#home" onClick={() => setMenuOpen(false)}>Home</a>
            <a href="#products" onClick={() => setMenuOpen(false)}>Shop</a>
            <a href="#categories" onClick={() => setMenuOpen(false)}>Categories</a>
            <a href="#benefits" onClick={() => setMenuOpen(false)}>Why Shopora?</a>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search products..."
              className="rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 outline-slate-500"
            />
          </nav>
        )}
      </header>

      <main>
        <section id="home" className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8 lg:pt-10">
          <div className="relative overflow-hidden rounded-3xl bg-slate-100 dark:bg-slate-700">
            <div className="grid min-h-[420px] items-center md:grid-cols-2">
              <div className="relative z-10 px-6 py-12 sm:px-10 sm:py-16 lg:px-14">
                <span className="inline-flex items-center gap-2 rounded-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-slate-950 dark:text-white">
                  Discover your style
                </span>
                <h1 className="mt-6 max-w-xl text-4xl font-black leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
                  Good finds.
                  <br />
                  <span className="text-slate-950 dark:text-white">Better living.</span>
                </h1>
                <p className="mt-5 max-w-md text-base leading-7 text-slate-600 dark:text-slate-300 sm:text-lg">
                  Discover everyday essentials, thoughtful design, and things
                  you will love — all in one place.
                </p>
                <a
                  href="#products"
                  className="mt-8 inline-flex items-center gap-3 rounded-full bg-violet-700 dark:bg-violet-600 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-slate-100 dark:bg-slate-700"
                >
                  Explore the collection <ArrowRight size={18} />
                </a>
                <div className="mt-8 flex flex-wrap items-center gap-4 text-xs font-medium text-slate-500 dark:text-slate-400 sm:gap-6">
                  <span>✦ Curated finds</span>
                  <span>✦ Everyday essentials</span>
                </div>
              </div>

              <div className="relative min-h-[260px] md:h-full">
                <img
                  src="/assets/images/hero/shopora-hero.jpg"
                  alt="Beautiful modern retail store"
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-slate-100 via-slate-100/20 to-transparent md:bg-gradient-to-r md:from-slate-100/30 md:via-transparent md:to-transparent" />
                <div className="absolute bottom-5 right-5 rounded-2xl bg-white dark:bg-slate-800/95 p-4 shadow-lg backdrop-blur sm:bottom-8 sm:right-8">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Your everyday destination</p>
                  <p className="mt-1 text-lg font-bold">Find your something.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="categories" className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
          <div className="mb-7 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-950 dark:text-white">
                Browse your way
              </p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
                Shop by category
              </h2>
            </div>
            <button
              onClick={() => {
                setActiveCategory("All");
                document.getElementById("products")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="hidden items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-violet-700 dark:text-violet-400 sm:flex"
            >
              All products <ArrowRight size={16} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-5">
            {uiCategories.map((category) => (
              <button
                key={category.name}
                onClick={() => {
                  setActiveCategory(category.name);
                  document.getElementById("products")?.scrollIntoView({ behavior: "smooth" });
                }}
                className={`group rounded-2xl ${category.color} p-5 text-left transition hover:-translate-y-1 hover:shadow-md sm:p-7 ${
                  activeCategory === category.name ? "ring-2 ring-violet-700" : ""
                }`}
              >
                <category.Icon
                    size={44}
                    strokeWidth={1.5}
                    className="text-slate-900 dark:text-white"
                    aria-hidden="true"
                  />
                                  <p className="mt-5 font-bold">{category.name}</p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Explore collection ↗</p>
              </button>
            ))}
          </div>
        </section>

        <section id="products" className="bg-slate-50 dark:bg-slate-900 py-14 sm:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-950 dark:text-white">
                  The good stuff
                </p>
                <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
                  {search ? "Search results" : activeCategory === "All" ? "Featured products" : activeCategory}
                </h2>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  Thoughtful picks for everyday life.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {["All", ...uiCategories.map((item) => item.name)].map((category) => (
                  <button
                    key={category}
                    onClick={() => setActiveCategory(category)}
                    className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                      activeCategory === category
                        ? "bg-violet-700 dark:bg-violet-600 text-white"
                        : "border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:border-slate-400"
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
              {filteredProducts.map((product) => (
                <article key={product.id} className="group min-w-0">
                  <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-800">
                    <img
                      src={getImageUrl(product.imageUrl) || "/assets/images/products/headphones.jpg"}
                      alt={product.name}
                      className="aspect-[4/4.5] w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                    />
                    {product.badge && (
                      <span className="absolute left-2 top-2 rounded-full bg-white dark:bg-slate-800 px-2.5 py-1 text-[9px] font-bold tracking-wide sm:left-3 sm:top-3 sm:text-[10px]">
                        {product.badge}
                      </span>
                    )}
                    <button
                      onClick={() => toggleFavorite(product.id)}
                      className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-white dark:bg-slate-800/95 transition hover:bg-slate-100 dark:bg-slate-700 sm:right-3 sm:top-3"
                      aria-label={`Toggle favorite for ${product.name}`}
                    >
                      <Heart
                        size={17}
                        className={favorites.includes(product.id) ? "fill-red-500 text-red-500" : "text-slate-700 dark:text-slate-200"}
                      />
                    </button>
                    <button
                      onClick={() => addToCart(product)}
                      className="absolute bottom-3 left-3 right-3 flex items-center justify-center gap-2 rounded-full bg-white dark:bg-slate-800 py-3 text-xs font-bold shadow-sm transition hover:bg-violet-700 dark:bg-violet-600 hover:text-white sm:translate-y-16 sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100"
                    >
                      <ShoppingBag size={15} /> Add to bag
                    </button>
                  </div>
                  <div className="pt-4">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      {product.category?.name}
                    </p>
                    <h3 className="mt-1 line-clamp-2 min-h-10 text-sm font-semibold leading-5 sm:text-[15px]">
                      {product.name}
                    </h3>
                    <div className="mt-2 flex items-center gap-1">
                      <Star size={13} className="fill-slate-700 text-slate-700 dark:text-slate-200" />
                      <span className="text-xs font-semibold">{product.rating}</span>
                      <span className="text-xs text-slate-400 dark:text-slate-500">(Customer rating)</span>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="text-sm font-bold">{money(Number(product.price))}</span>
                      {product.oldPrice && (
                        <span className="text-xs text-slate-400 dark:text-slate-500 line-through">
                          {money(product.oldPrice)}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => addToCart(product)}
                      className="mt-3 w-full rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 py-2.5 text-xs font-semibold transition hover:border-slate-950 hover:bg-violet-700 dark:bg-violet-600 hover:text-white sm:hidden"
                    >
                      Add to bag
                    </button>
                  </div>
                </article>
              ))}
            </div>

            {filteredProducts.length === 0 && (
              <div className="py-16 text-center">
                <Search className="mx-auto text-slate-300 dark:text-slate-600" size={36} />
                <h3 className="mt-4 text-lg font-bold">No products found</h3>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  Try another search or browse all products.
                </p>
                <button
                  onClick={() => {
                    setSearch("");
                    setActiveCategory("All");
                  }}
                  className="mt-5 rounded-full bg-violet-700 dark:bg-violet-600 px-5 py-3 text-sm font-semibold text-white"
                >
                  Clear filters
                </button>
              </div>
            )}
          </div>
        </section>

        <section id="benefits" className="mx-auto grid max-w-7xl gap-6 px-4 py-14 sm:grid-cols-3 sm:px-6 lg:px-8 lg:py-16">
          {[
            { icon: Truck, title: "Delivery made simple", description: "A smooth path from browsing to your doorstep." },
            { icon: ShieldCheck, title: "Shop with confidence", description: "A shopping experience designed around trust." },
            { icon: RotateCcw, title: "Here to help", description: "Clear support when you need a hand." },
          ].map(({ icon: Icon, title, description }) => (
            <div key={title} className="flex gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-700 text-slate-950 dark:text-white">
                <Icon size={23} />
              </div>
              <div>
                <h3 className="font-bold">{title}</h3>
                <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">{description}</p>
              </div>
            </div>
          ))}
        </section>
      </main>

      <footer className="bg-slate-950 text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-9 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <a href="#home" className="text-2xl font-black tracking-tight">
            shopora<span className="text-slate-950 dark:text-white">.</span>
          </a>
          <p className="text-sm text-slate-400 dark:text-slate-500">
            Find your something. © {new Date().getFullYear()} Shopora.
          </p>
          <a href="#products" className="text-sm text-slate-300 dark:text-slate-600 hover:text-white">
            Explore products ↑
          </a>
        </div>
      </footer>


{cartOpen && (
  <div className="fixed inset-0 z-50 overflow-y-auto bg-white dark:bg-slate-800">
   <div className="mx-auto min-h-screen max-w-7xl px-3 py-4 sm:px-6 sm:py-6 lg:px-8">

      {/* Cart Header */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-5">
        <a href="#home" className="text-2xl font-black tracking-tight">
          shopora<span className="text-slate-400 dark:text-slate-500">.</span>
        </a>

        <button
         onClick={continueShopping}
          className="flex items-center gap-2 rounded-full border border-slate-200 dark:border-slate-700 px-4 py-2 text-sm font-medium transition hover:bg-slate-100 dark:bg-slate-700"
        >
          <X size={16} />
          Continue shopping
        </button>
      </div>

      {/* Page Title */}
      <div className="mb-8 mt-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
          Your selection
        </p>

        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
          Shopping Cart
        </h1>

        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          {cartCount} {cartCount === 1 ? "item" : "items"} in your shopping bag
        </p>
      </div>

      {cart.length === 0 ? (
        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-3xl border border-slate-200 dark:border-slate-700 px-5 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700">
            <ShoppingBag size={34} className="text-slate-400 dark:text-slate-500" />
          </div>

          <h2 className="mt-5 text-xl font-bold">
            Your shopping bag is empty
          </h2>

          <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500 dark:text-slate-400">
            Looks like you haven't discovered your next favorite item yet.
          </p>

          <button
            onClick={continueShopping}
            className="mt-6 rounded-full bg-violet-700 dark:bg-violet-600 px-7 py-3 text-sm font-semibold text-white transition hover:bg-violet-800"
          >
            Start shopping
          </button>
        </div>
      ) : (
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.8fr)_minmax(280px,0.8fr)]">

          {/* Product List */}
          <section className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">

            {/* Table Heading */}
            <div className="hidden grid-cols-[minmax(0,1fr)_120px_100px_45px] items-center gap-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 sm:grid">
              <span>Product</span>
              <span className="text-center">Quantity</span>
              <span className="text-right">Total</span>
              <span className="text-center">Action</span>
            </div>

            {/* Product Rows */}
            <div className="divide-y divide-slate-100 px-4 sm:px-5">
              {cart.map((item) => (
                <article
                  key={item.id}
                 className="grid grid-cols-1 items-start gap-3 py-5 sm:grid-cols-[minmax(0,1fr)_120px_100px_45px] sm:items-center sm:gap-4"
                >
                  {/* Product */}
                  <div className="flex min-w-0 items-center gap-4">
                    <img
                      src={getImageUrl(item.imageUrl || item.image) || "/assets/images/products/headphones.jpg"}
                      alt={item.name}
                      className="h-20 w-20 shrink-0 rounded-xl bg-slate-50 dark:bg-slate-900 object-cover sm:h-16 sm:w-16"
                    />

                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        {item.category?.name || item.category}
                      </p>

                      <h3 className="mt-1 text-sm font-bold text-slate-900 dark:text-white">
                        {item.name}
                      </h3>

                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {money(Number(item.price))} each
                      </p>
                    </div>
                  </div>

                  {/* Quantity */}
                  <div className="flex items-center justify-between sm:justify-center">
                    <span className="text-xs text-slate-400 dark:text-slate-500 sm:hidden">
                      Quantity
                    </span>

                    <div className="flex items-center gap-3 rounded-full border border-slate-200 dark:border-slate-700 px-2 py-1.5">
                      <button
                        onClick={() => changeQuantity(item.id, -1)}
                        disabled={item.quantity <= 1}
                        className="flex h-6 w-6 items-center justify-center rounded-full transition hover:bg-slate-100 dark:bg-slate-700 disabled:opacity-30"
                        aria-label={`Decrease ${item.name}`}
                      >
                        <Minus size={13} />
                      </button>

                      <span className="min-w-4 text-center text-xs font-semibold">
                        {item.quantity}
                      </span>

                      <button
                        onClick={() => changeQuantity(item.id, 1)}
                        className="flex h-6 w-6 items-center justify-center rounded-full transition hover:bg-slate-100 dark:bg-slate-700"
                        aria-label={`Increase ${item.name}`}
                      >
                        <Plus size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Line Total */}
                  <div className="flex items-center justify-between sm:justify-end">
                    <span className="text-xs text-slate-400 dark:text-slate-500 sm:hidden">
                      Total
                    </span>

                    <span className="text-sm font-bold">
                      {money(Number(item.price) * item.quantity)}
                    </span>
                  </div>

                  {/* Remove */}
                  <div className="flex justify-end sm:justify-center">
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 dark:text-slate-500 transition hover:bg-red-50 dark:bg-red-900/30 hover:text-red-600 dark:text-red-400"
                      aria-label={`Remove ${item.name}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>

          {/* Order Summary */}
         <aside className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 sm:p-6 lg:sticky lg:top-6">
            <h2 className="text-lg font-bold tracking-tight">
              Order Summary
            </h2>

            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400">Subtotal ({cartCount} items)</span>
                <span className="font-semibold">{money(cartTotal)}</span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400">Discount</span>
                <span className="text-slate-400 dark:text-slate-500">Not applied</span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400">Delivery fee</span>
                <span className="text-slate-400 dark:text-slate-500">Calculated later</span>
              </div>

              <div className="border-t border-slate-200 dark:border-slate-700 pt-5">
                <div className="flex items-center justify-between">
                  <span className="font-bold">Estimated Total</span>
                  <span className="text-xl font-bold">
                    {money(cartTotal)}
                  </span>
                </div>

                <p className="mt-2 text-[11px] leading-5 text-slate-400 dark:text-slate-500">
                  Final delivery charges will be calculated at checkout.
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-xl bg-slate-50 dark:bg-slate-900 p-4">
              <div className="flex items-center gap-2">
                <ShieldCheck size={17} className="text-slate-600 dark:text-slate-300" />
                <span className="text-xs font-semibold">
                  Shop with confidence
                </span>
              </div>

              <p className="mt-1 pl-6 text-[11px] leading-5 text-slate-500 dark:text-slate-400">
                Your order details will be reviewed before confirmation.
              </p>
            </div>

            <button
              onClick={() => {
                setCartOpen(false);
                navigate("/checkout");
              }}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-violet-700 dark:bg-violet-600 py-4 text-sm font-bold text-white transition hover:bg-violet-800 active:scale-[0.99]"
            >
              Checkout Now <ArrowRight size={17} />
            </button>

            <button
              onClick={() => setCartOpen(false)}
              className="mt-3 w-full py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 transition hover:text-violet-700 dark:text-violet-400"
            >
              Continue shopping
            </button>
          </aside>
        </div>
      )}
    </div>
  </div>
)}
    </div>

  );
}
 
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/checkout" element={<Checkout />} />
      <Route path="/order-confirmation/:orderNumber" element={<OrderConfirmation />} />
      <Route path="/orders" element={<MyOrders />} />
      <Route path="/orders/:id" element={<OrderDetails />} />

     <Route element={<ProtectedRoute requiredRole="ADMIN" />}>
  <Route path="/admin" element={<AdminLayout />}>
    <Route index element={<AdminDashboard />} />
    <Route path="products" element={<Products />} />
    <Route path="categories" element={<Categories />} />
    <Route path="orders" element={<AdminOrders />} />
    <Route path="customers" element={<AdminCustomers />} />
    <Route path="analytics" element={<AdminAnalytics />} />
    <Route path="settings" element={<Settings />} />
  </Route>
</Route>
    </Routes>
  );
}
