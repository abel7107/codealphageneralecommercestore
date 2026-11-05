
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem("shopora_token");

  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // DELETE endpoints may successfully return HTTP 204 with no body.
  if (response.status === 204) {
    return null;
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Something went wrong");
  }

  return data;
}
