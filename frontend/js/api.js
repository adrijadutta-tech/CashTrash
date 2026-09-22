// Shared helper for talking to the CashTrash backend.
// Change API_BASE_URL if your backend runs somewhere other than localhost:4000.
const API_BASE_URL = 'http://localhost:4000/api';

const Auth = {
  getToken() { return localStorage.getItem('cashtrash_token'); },
  getUser() {
    const raw = localStorage.getItem('cashtrash_user');
    return raw ? JSON.parse(raw) : null;
  },
  setSession(token, user) {
    localStorage.setItem('cashtrash_token', token);
    localStorage.setItem('cashtrash_user', JSON.stringify(user));
  },
  clearSession() {
    localStorage.removeItem('cashtrash_token');
    localStorage.removeItem('cashtrash_user');
  },
  isLoggedIn() { return !!this.getToken(); }
};

// Redirect to login if this page requires a signed-in user and there's no token.
// Call at the top of any protected page.
function requireLogin() {
  if (!Auth.isLoggedIn()) {
    window.location.href = 'login.html';
  }
}

// Wraps fetch(): adds the base URL, JSON headers (unless sending a file),
// the auth token when present, and throws with the server's error message
// on a non-2xx response so callers can just try/catch.
async function apiFetch(path, options = {}) {
  const headers = options.headers ? { ...options.headers } : {};
  const isFormData = options.body instanceof FormData;

  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }
  const token = Auth.getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  let data = null;
  try { data = await res.json(); } catch (_) { /* no body */ }

  if (!res.ok) {
    if (res.status === 401) {
      Auth.clearSession();
    }
    throw new Error((data && data.error) || `Request failed (${res.status})`);
  }
  return data;
}
