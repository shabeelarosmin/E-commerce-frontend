import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const LOGIN_URL = "http://localhost:8000/api/dashboard/auth/login";

function AdminLogin() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // INPUT CHANGE
  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // ADMIN LOGIN
  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    const email = form.email.trim();

    if (!email || !form.password) {
      setError("Please enter your email and password.");
      return;
    }

    try {
      setLoading(true);

      console.log("Admin login request:", LOGIN_URL);

      const response = await axios.post(
        LOGIN_URL,
        {
          email,
          password: form.password,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
          timeout: 15000,
        },
      );

      console.log("Admin login response:", response.data);

      const result = response.data;

      // Support common API response structures.
      const payload = result?.data ?? result;

      const token =
        payload?.token ||
        payload?.accessToken ||
        payload?.access_token ||
        result?.token ||
        result?.accessToken;

      const user =
        payload?.user ||
        payload?.admin ||
        result?.user ||
        result?.admin ||
        null;

      const role = user?.role || payload?.role || result?.role;

      // Token must be returned by the backend.
      if (!token) {
        console.error("Token missing in login response:", result);

        setError(
          "Login response-ൽ token ലഭിച്ചില്ല. Backend login response പരിശോധിക്കുക.",
        );

        return;
      }

      // Do not allow a known non-admin account into the dashboard.
      if (role && String(role).toLowerCase() !== "admin") {
        setError("ഈ account-ന് Admin Dashboard access ഇല്ല.");
        return;
      }

      // SAVE LOGIN DATA
      localStorage.setItem("token", token);

      if (user) {
        localStorage.setItem("user", JSON.stringify(user));
      }

      // NAVIGATE TO DASHBOARD
      navigate("/dashboard", { replace: true });
    } catch (err) {
      console.error("Admin login error:", err);
      console.error("Backend response:", err.response?.data);
      console.error("HTTP status:", err.response?.status);

      if (err.code === "ECONNABORTED") {
        setError("Login request timeout ആയി. വീണ്ടും ശ്രമിക്കുക.");
      } else if (!err.response) {
        setError(
          "Backend connect ചെയ്യാൻ കഴിയുന്നില്ല. Server running ആണോ പരിശോധിക്കുക.",
        );
      } else {
        const status = err.response.status;
        const backendMessage = err.response.data?.message;

        if (status === 404) {
          setError(
            "Login API route കണ്ടെത്താനായില്ല. Backend route പരിശോധിക്കുക.",
          );
        } else if (status === 401) {
          setError(backendMessage || "Email അല്ലെങ്കിൽ password തെറ്റാണ്.");
        } else if (status === 403) {
          setError(backendMessage || "ഈ account-ന് Admin access ഇല്ല.");
        } else if (status === 400) {
          setError(backendMessage || "Login details ശരിയാണോ പരിശോധിക്കുക.");
        } else if (status >= 500) {
          setError(
            backendMessage || "Backend server error. Terminal പരിശോധിക്കുക.",
          );
        } else {
          setError(backendMessage || `Login failed. HTTP ${status}`);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="admin-login-page">
      <section className="admin-login-card">
        {/* BRAND */}
        <div className="admin-login-brand">
          <span className="admin-login-logo">A</span>
          <p>ÉLORA</p>
          <span>FASHION ADMINISTRATION</span>
        </div>

        {/* HEADING */}
        <div className="admin-login-heading">
          <p className="fashion-eyebrow">WELCOME BACK</p>
          <h1>Admin Login</h1>
          <p>Sign in to manage your fashion store.</p>
        </div>

        {/* ERROR */}
        {error && (
          <div className="fashion-alert error" role="alert">
            {error}
          </div>
        )}

        {/* LOGIN FORM */}
        <form className="admin-login-form" onSubmit={handleSubmit}>
          <label className="fashion-field">
            Email Address <span>*</span>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="admin@example.com"
              autoComplete="username"
              required
            />
          </label>

          <label className="fashion-field">
            Password <span>*</span>
            <div className="admin-password-field">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Enter your password"
                autoComplete="current-password"
                required
              />

              <button
                type="button"
                className="admin-password-toggle"
                onClick={() => setShowPassword((previous) => !previous)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </label>

          <button
            type="submit"
            className="fashion-button admin-login-submit"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign In to Dashboard →"}
          </button>
        </form>

        <div className="admin-login-footer">
          <span>SECURE ADMIN ACCESS</span>
          <span>ÉLORA · FASHION STORE</span>
        </div>
      </section>
    </main>
  );
}

export default AdminLogin;
