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

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

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

      const result = response.data;
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

      if (!token) {
        setError(
          "Login response-ൽ token ലഭിച്ചില്ല. Backend login response പരിശോധിക്കുക.",
        );
        return;
      }

      if (role && String(role).toLowerCase() !== "admin") {
        setError("ഈ account-ന് Admin Dashboard access ഇല്ല.");
        return;
      }

      localStorage.setItem("token", token);

      if (user) {
        localStorage.setItem("user", JSON.stringify(user));
      }

      navigate("/dashboard", { replace: true });
    } catch (err) {
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
    <main className="flex min-h-screen items-center justify-center bg-[#f5f0e8] px-4 py-10 sm:px-6">
      {/* Decorative background */}
      <div className="fixed left-0 top-0 -z-0 h-64 w-64 rounded-full bg-[#e8d8c3]/30 blur-3xl" />
      <div className="fixed bottom-0 right-0 -z-0 h-72 w-72 rounded-full bg-[#d8c3a8]/25 blur-3xl" />

      <section className="relative z-10 w-full max-w-[460px] overflow-hidden rounded-2xl border border-[#e7dbcd] bg-[#fffdf9] shadow-[0_25px_80px_rgba(70,48,30,0.10)]">
        {/* Top accent */}
        <div className="h-1.5 w-full bg-[#51392b]" />

        <div className="px-6 py-9 sm:px-10 sm:py-11">
          {/* Brand */}
          <div className="mb-9 flex flex-col items-center text-center">
            <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full border border-[#d9c5aa] bg-[#f6efe5] font-serif text-3xl text-[#51392b]">
              É
            </div>

            <h2 className="font-serif text-2xl tracking-[5px] text-[#51392b]">
              ÉLORA
            </h2>

            <p className="mt-2 text-[9px] font-bold tracking-[3px] text-[#a17b50]">
              FASHION ADMINISTRATION
            </p>
          </div>

          {/* Heading */}
          <div className="mb-7">
            <p className="mb-2 text-[10px] font-extrabold tracking-[2.5px] text-[#a17b50]">
              WELCOME BACK
            </p>

            <h1 className="font-serif text-3xl font-medium tracking-tight text-[#39291f] sm:text-4xl">
              Admin Login
            </h1>

            <p className="mt-3 text-sm leading-6 text-[#8d8177]">
              Sign in to manage your fashion store.
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div
              role="alert"
              className="mb-5 flex items-start gap-3 rounded-lg border border-[#edcfca] bg-[#fff3f1] px-4 py-3 text-sm leading-5 text-[#a23d32]"
            >
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[#dca9a0] text-xs font-bold">
                !
              </span>
              <p>{error}</p>
            </div>
          )}

          {/* Login form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="text-xs font-bold tracking-wide text-[#594537]"
              >
                Email Address <span className="text-[#b55d4c]">*</span>
              </label>

              <input
                id="email"
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="admin@example.com"
                autoComplete="username"
                required
                className="mt-2 w-full rounded-lg border border-[#e5d9cb] bg-[#fffefa] px-4 py-3.5 text-sm text-[#39291f] outline-none transition placeholder:text-[#b5a89c] focus:border-[#a17b50] focus:ring-4 focus:ring-[#a17b50]/10"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="text-xs font-bold tracking-wide text-[#594537]"
              >
                Password <span className="text-[#b55d4c]">*</span>
              </label>

              <div className="relative mt-2">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                  className="w-full rounded-lg border border-[#e5d9cb] bg-[#fffefa] px-4 py-3.5 pr-16 text-sm text-[#39291f] outline-none transition placeholder:text-[#b5a89c] focus:border-[#a17b50] focus:ring-4 focus:ring-[#a17b50]/10"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((previous) => !previous)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded px-2 py-1 text-[11px] font-bold text-[#8b6744] transition hover:bg-[#f5ede2] hover:text-[#51392b]"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex min-h-[50px] w-full items-center justify-center gap-2 rounded-lg bg-[#51392b] px-5 py-3.5 text-sm font-bold tracking-wide text-white shadow-sm transition hover:bg-[#72523b] focus:outline-none focus:ring-4 focus:ring-[#51392b]/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Signing in...
                </>
              ) : (
                "Sign In to Dashboard →"
              )}
            </button>
          </form>

          {/* Security note */}
          <div className="mt-7 flex items-center justify-center gap-2 text-[#9a8877]">
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              className="h-4 w-4"
              stroke="currentColor"
              strokeWidth="1.6"
            >
              <rect x="5" y="10" width="14" height="11" rx="2" />
              <path d="M8 10V7a4 4 0 0 1 8 0v3" strokeLinecap="round" />
            </svg>

            <span className="text-[9px] font-bold tracking-[1.5px]">
              SECURE ADMIN ACCESS
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col items-center justify-between gap-2 border-t border-[#eee5da] bg-[#faf6f0] px-6 py-4 text-[9px] font-semibold tracking-[1.5px] text-[#958579] sm:flex-row">
          <span>ÉLORA · FASHION STORE</span>
          <span>DESIGNED WITH CARE ✦</span>
        </div>
      </section>
    </main>
  );
}

export default AdminLogin;
