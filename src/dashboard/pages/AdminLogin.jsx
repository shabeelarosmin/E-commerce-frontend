import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";

function AdminLogin() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (loading) return;

    setError("");
    setLoading(true);

    try {
      const response = await axios.post(
        "http://localhost:8000/api/dashboard/auth/login",
        {
          email: email.trim(),
          password,
        },
      );

      console.log("ADMIN LOGIN STATUS:", response.status);
      console.log("ADMIN LOGIN RESPONSE:", response.data);

      // Your backend returns user and token directly.
      const data = response.data?.data ?? response.data;
      const token = data?.token;
      const user = data?.user ?? data?.admin;

      if (!token) {
        throw new Error("Login token is missing from the server response.");
      }

      if (String(user?.role ?? "").toLowerCase() !== "admin") {
        throw new Error(
          "Admin access denied. Please use an administrator account.",
        );
      }

      // Save admin authentication.
      localStorage.setItem("adminToken", token);
      localStorage.setItem("adminUser", JSON.stringify(user));

      console.log("ADMIN LOGIN SUCCESSFUL");
      console.log("ADMIN ROLE:", user.role);
      console.log("NAVIGATING TO /dashboard");

      // Notify components that listen for authentication changes.
      window.dispatchEvent(new Event("auth-change"));

      navigate("/dashboard", { replace: true });
    } catch (err) {
      console.error(
        "ADMIN LOGIN ERROR:",
        err.response?.data || err.message || err,
      );

      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to log in. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F8F4EE] px-5 py-12">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-8 block text-center">
          <h1 className="font-serif text-4xl tracking-[0.2em] text-[#544339]">
            ÉLORA
          </h1>

          <p className="mt-2 text-[9px] tracking-[0.4em] text-[#8A6C5F]">
            ADMINISTRATION
          </p>
        </Link>

        <div className="border border-[#E0D9CF] bg-[#FCFAF6] px-6 py-9 shadow-[0_12px_45px_rgba(84,67,57,0.07)] sm:px-10 sm:py-11">
          <div className="mb-8 text-center">
            <p className="mb-3 text-[10px] tracking-[0.3em] text-[#8A6C5F]">
              ADMINISTRATOR ACCESS
            </p>

            <h2 className="font-serif text-4xl text-[#544339]">Admin Login</h2>

            <p className="mt-4 text-sm leading-6 text-[#8A6C5F]">
              Sign in to manage your ÉLORA store.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="admin-email"
                className="mb-3 block text-[10px] font-medium tracking-[0.12em] text-[#544339]"
              >
                EMAIL ADDRESS
              </label>

              <div className="flex items-center gap-3 border-b border-[#BFA38A] pb-3 focus-within:border-[#544339]">
                <Mail size={17} className="text-[#8A6C5F]" />

                <input
                  id="admin-email"
                  type="email"
                  autoComplete="username"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  className="w-full bg-transparent text-sm text-[#544339] outline-none placeholder:text-[#BFA38A]"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="admin-password"
                className="mb-3 block text-[10px] font-medium tracking-[0.12em] text-[#544339]"
              >
                PASSWORD
              </label>

              <div className="flex items-center gap-3 border-b border-[#BFA38A] pb-3 focus-within:border-[#544339]">
                <LockKeyhole size={17} className="text-[#8A6C5F]" />

                <input
                  id="admin-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Enter admin password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  className="w-full bg-transparent text-sm text-[#544339] outline-none placeholder:text-[#BFA38A]"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((previous) => !previous)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="text-[#8A6C5F] hover:text-[#544339]"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <p
                role="alert"
                className="border border-red-200 bg-red-50 p-3 text-sm text-red-700"
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-3 bg-[#544339] py-4 text-[11px] tracking-[0.2em] text-[#F8F4EE] transition hover:bg-[#6B5145] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "SIGNING IN..." : "SIGN IN"}

              {!loading && <ArrowRight size={16} />}
            </button>
          </form>

          <div className="mt-7 text-center">
            <Link
              to="/"
              className="text-xs text-[#8A6C5F] underline underline-offset-4 hover:text-[#544339]"
            >
              Back to Store
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

export default AdminLogin;
