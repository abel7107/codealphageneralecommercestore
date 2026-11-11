/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useAuth } from "./AuthContext";
import { apiRequest } from "../services/api";

const CartContext = createContext(null);
const GUEST_CART_KEY = "shopora_guest_cart";

function normalizeBackendItem(item) {
  return {
    ...item.product,
    price: Number(item.product.price),
    quantity: item.quantity,
    cartItemId: item.id,
  };
}

function readGuestCart() {
  try {
    return JSON.parse(localStorage.getItem(GUEST_CART_KEY) || "[]");
  } catch {
    return [];
  }
}

function writeGuestCart(items) {
  localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
}

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const refreshCart = useCallback(async () => {
    if (!user) {
      setItems(readGuestCart());
      return;
    }
    setLoading(true);
    try {
      const response = await apiRequest("/api/cart");
      setItems((response.data?.items || []).map(normalizeBackendItem));
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    async function migrate() {
      if (!user) {
        setItems(readGuestCart());
        return;
      }
      const guestItems = readGuestCart();
      if (guestItems.length > 0) {
        for (const item of guestItems) {
          try {
            await apiRequest("/api/cart/items", {
              method: "POST",
              body: JSON.stringify({ productId: item.id, quantity: item.quantity }),
            });
          } catch {
            // ignore migration errors
          }
        }
        localStorage.removeItem(GUEST_CART_KEY);
      }
      await refreshCart();
    }
    migrate();
  }, [user, refreshCart]);

  async function addToCart(product, quantity = 1) {
    if (user) {
      await apiRequest("/api/cart/items", {
        method: "POST",
        body: JSON.stringify({ productId: product.id, quantity }),
      });
      await refreshCart();
    } else {
      setItems((current) => {
        const existing = current.find((item) => item.id === product.id);
        let next;
        if (existing) {
          next = current.map((item) =>
            item.id === product.id
              ? { ...item, quantity: item.quantity + quantity }
              : item
          );
        } else {
          next = [...current, { ...product, price: Number(product.price), quantity }];
        }
        writeGuestCart(next);
        return next;
      });
    }
  }

  async function updateQuantity(productId, quantity) {
    if (quantity < 1) return removeItem(productId);
    if (user) {
      await apiRequest(`/api/cart/items/${productId}`, {
        method: "PATCH",
        body: JSON.stringify({ quantity }),
      });
      await refreshCart();
    } else {
      setItems((current) => {
        const next = current.map((item) =>
          item.id === productId ? { ...item, quantity } : item
        );
        writeGuestCart(next);
        return next;
      });
    }
  }

  async function removeItem(productId) {
    if (user) {
      await apiRequest(`/api/cart/items/${productId}`, { method: "DELETE" });
      await refreshCart();
    } else {
      setItems((current) => {
        const next = current.filter((item) => item.id !== productId);
        writeGuestCart(next);
        return next;
      });
    }
  }

  async function clearCart() {
    if (user) {
      try {
        await apiRequest("/api/cart", { method: "DELETE" });
      } catch {
        // ignore
      }
    } else {
      localStorage.removeItem(GUEST_CART_KEY);
    }
    setItems([]);
  }

  const cartCount = items.reduce((total, item) => total + item.quantity, 0);
  const cartTotal = items.reduce(
    (total, item) => total + Number(item.price) * item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        items,
        loading,
        cartCount,
        cartTotal,
        addToCart,
        updateQuantity,
        removeItem,
        clearCart,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside CartProvider");
  return context;
}
