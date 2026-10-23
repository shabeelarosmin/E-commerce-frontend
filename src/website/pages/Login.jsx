import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await axios.post(
        "http://localhost:8000/api/website/auth/login",
        {
          email: email.trim(),
          password,
        },
      );

      // Read login response
      const { token, user } = response.data;

      // Token is required for authentication
      if (!token) {
        throw new Error(
          "Login successful, but authentication token is missing.",
        );
      }

      // Save login details
      localStorage.setItem("token", token);

      if (user) {
        localStorage.setItem("user", JSON.stringify(user));
      }

      // Notify Navbar that login status has changed
      window.dispatchEvent(new Event("auth-change"));

      // Navigate to Home after successful login
      navigate("/", { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Invalid email or password. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F8F4EE] px-5 py-12">
      <div className="w-full max-w-md">
        {/* Brand */}
        <Link to="/" className="mb-8 block text-center">
          <h1 className="font-serif text-4xl tracking-[0.2em] text-[#544339]">
            ÉLORA
          </h1>

          <p className="mt-2 text-[9px] tracking-[0.4em] text-[#8A6C5F]">
            YOUR EVERYDAY ELEGANCE
          </p>
        </Link>

        {/* Login Card */}
        <div className="border border-[#E0D9CF] bg-[#FCFAF6] px-6 py-9 shadow-[0_12px_45px_rgba(84,67,57,0.07)] sm:px-10 sm:py-11">
          <div className="mb-8 text-center">
            <p className="mb-3 text-[10px] tracking-[0.3em] text-[#8A6C5F]">
              WELCOME BACK
            </p>

            <h2 className="font-serif text-4xl text-[#544339]">Login</h2>

            <p className="mx-auto mt-4 max-w-xs text-sm leading-6 text-[#8A6C5F]">
              Sign in to save your favourites, manage your cart and keep track
              of your orders.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="mb-3 block text-[10px] font-medium tracking-[0.12em] text-[#544339]"
              >
                EMAIL ADDRESS
              </label>

              <div className="flex items-center gap-3 border-b border-[#BFA38A] pb-3 focus-within:border-[#544339]">
                <Mail size={17} className="text-[#8A6C5F]" />

                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-transparent text-sm text-[#544339] outline-none placeholder:text-[#BFA38A]"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="mb-3 block text-[10px] font-medium tracking-[0.12em] text-[#544339]"
              >
                PASSWORD
              </label>

              <div className="flex items-center gap-3 border-b border-[#BFA38A] pb-3 focus-within:border-[#544339]">
                <LockKeyhole size={17} className="text-[#8A6C5F]" />

                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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

            {/* Error message */}
            {error && (
              <p
                role="alert"
                className="border border-red-200 bg-red-50 p-3 text-sm text-red-700"
              >
                {error}
              </p>
            )}

            {/* Sign in button */}
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-3 bg-[#544339] py-4 text-[11px] tracking-[0.2em] text-[#F8F4EE] transition hover:bg-[#6B5145] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "SIGNING IN..." : "SIGN IN"}

              {!loading && <ArrowRight size={16} />}
            </button>
          </form>

          {/* Register link */}
          <div className="my-7 flex items-center gap-4">
            <div className="h-px flex-1 bg-[#E0D9CF]" />

            <span className="text-[9px] tracking-[0.18em] text-[#8A6C5F]">
              NEW TO ÉLORA?
            </span>

            <div className="h-px flex-1 bg-[#E0D9CF]" />
          </div>

          <Link
            to="/register"
            className="flex w-full items-center justify-center border border-[#BFA38A] py-4 text-[10px] tracking-[0.18em] text-[#544339] transition hover:bg-[#E0D9CF]/40"
          >
            CREATE AN ACCOUNT
          </Link>

          <p className="mt-7 text-center text-[11px] leading-5 text-[#8A6C5F]">
            Your style, your choices — all in one place.
          </p>
        </div>

        {/* Back to store */}
        <div className="mt-6 text-center">
          <Link
            to="/"
            className="text-xs text-[#8A6C5F] underline underline-offset-4 transition hover:text-[#544339]"
          >
            Back to Home
          </Link>
        </div>

        <p className="mt-8 text-center text-[9px] tracking-[0.18em] text-[#BFA38A]">
          ÉLORA · YOUR EVERYDAY ELEGANCE
        </p>
      </div>
    </main>
  );
}
