import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  ArrowRight,
  Eye,
  EyeOff,
  UserRound,
  Mail,
  Phone,
  LockKeyhole,
  CalendarDays,
  MapPin,
  Map,
  Hash,
} from "lucide-react";

const initialForm = {
  name: "",
  email: "",
  phone: "",
  dateOfBirth: "",
  gender: "",
  password: "",
  confirmPassword: "",
  address: "",
  city: "",
  state: "",
  pinCode: "",
};

const inputClass =
  "w-full bg-transparent text-sm text-[#544339] outline-none placeholder:text-[#BFA38A]";

const labelClass =
  "mb-2.5 block text-[10px] font-medium tracking-[0.12em] text-[#544339]";

const fieldClass =
  "flex items-center gap-3 border-b border-[#BFA38A] pb-3 transition-colors focus-within:border-[#544339]";

function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState(initialForm);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const updateField = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setMessage("");
    setIsError(false);

    if (form.password.length < 6) {
      setIsError(true);
      setMessage("Password must contain at least 6 characters.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setIsError(true);
      setMessage("Passwords do not match.");
      return;
    }

    if (!/^\d{6}$/.test(form.pinCode)) {
      setIsError(true);
      setMessage("Please enter a valid 6-digit PIN code.");
      return;
    }

    if (!acceptedTerms) {
      setIsError(true);
      setMessage("Please accept the Terms & Conditions to continue.");
      return;
    }

    setLoading(true);

    try {
      // Keep the existing registration endpoint.
      // confirmPassword is only for frontend validation.
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.password,
        dateOfBirth: form.dateOfBirth,
        gender: form.gender,
        address: {
          addressLine: form.address.trim(),
          city: form.city.trim(),
          state: form.state.trim(),
          pinCode: form.pinCode.trim(),
        },
      };

      const response = await axios.post(
        "http://localhost:8000/api/website/auth/register",
        payload,
      );

      const { token, user } = response.data;

      if (token) {
        localStorage.setItem("token", token);

        if (user) {
          localStorage.setItem("user", JSON.stringify(user));
        }

        navigate("/products", { replace: true });
      } else {
        navigate("/login", { replace: true });
      }
    } catch (error) {
      setIsError(true);
      setMessage(
        error.response?.data?.message ||
          "Registration failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const today = new Date().toISOString().split("T")[0];

  return (
    <main className="min-h-screen bg-[#F8F4EE] px-4 py-10 text-[#544339] sm:px-6 sm:py-14">
      <div className="mx-auto w-full max-w-xl">
        {/* Brand */}
        <Link to="/" className="mb-8 block text-center">
          <h1 className="font-serif text-4xl tracking-[0.2em]">ÉLORA</h1>
          <p className="mt-2 text-[9px] tracking-[0.4em] text-[#8A6C5F]">
            YOUR EVERYDAY ELEGANCE
          </p>
        </Link>

        {/* Main card */}
        <section className="border border-[#E0D9CF] bg-[#FCFAF6] px-5 py-8 shadow-[0_12px_45px_rgba(84,67,57,0.07)] sm:px-9 sm:py-10">
          <header className="mb-9 text-center">
            <p className="mb-3 text-[10px] tracking-[0.3em] text-[#8A6C5F]">
              JOIN THE ÉLORA WORLD
            </p>
            <h2 className="font-serif text-4xl sm:text-5xl">Create account</h2>
            <p className="mx-auto mt-4 max-w-sm text-sm leading-6 text-[#8A6C5F]">
              Create your account for a more personal shopping experience.
            </p>
          </header>

          <form onSubmit={handleRegister} className="space-y-8">
            {/* Personal information */}
            <section>
              <h3 className="mb-5 border-b border-[#E0D9CF] pb-3 text-[10px] tracking-[0.22em] text-[#8A6C5F]">
                01 — PERSONAL INFORMATION
              </h3>

              <div className="space-y-6">
                <div>
                  <label htmlFor="name" className={labelClass}>
                    FULL NAME *
                  </label>
                  <div className={fieldClass}>
                    <UserRound size={17} className="shrink-0 text-[#8A6C5F]" />
                    <input
                      id="name"
                      name="name"
                      autoComplete="name"
                      value={form.name}
                      onChange={updateField}
                      placeholder="Enter your full name"
                      required
                      className={inputClass}
                    />
                  </div>
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <label htmlFor="email" className={labelClass}>
                      EMAIL ADDRESS *
                    </label>
                    <div className={fieldClass}>
                      <Mail size={17} className="shrink-0 text-[#8A6C5F]" />
                      <input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        value={form.email}
                        onChange={updateField}
                        placeholder="you@example.com"
                        required
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="phone" className={labelClass}>
                      PHONE NUMBER *
                    </label>
                    <div className={fieldClass}>
                      <Phone size={17} className="shrink-0 text-[#8A6C5F]" />
                      <input
                        id="phone"
                        name="phone"
                        type="tel"
                        autoComplete="tel"
                        value={form.phone}
                        onChange={updateField}
                        placeholder="Phone number"
                        required
                        className={inputClass}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <label htmlFor="dateOfBirth" className={labelClass}>
                      DATE OF BIRTH
                    </label>
                    <div className={fieldClass}>
                      <CalendarDays
                        size={17}
                        className="shrink-0 text-[#8A6C5F]"
                      />
                      <input
                        id="dateOfBirth"
                        name="dateOfBirth"
                        type="date"
                        max={today}
                        value={form.dateOfBirth}
                        onChange={updateField}
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="gender" className={labelClass}>
                      GENDER
                    </label>
                    <div className={fieldClass}>
                      <UserRound
                        size={17}
                        className="shrink-0 text-[#8A6C5F]"
                      />
                      <select
                        id="gender"
                        name="gender"
                        value={form.gender}
                        onChange={updateField}
                        className={`${inputClass} cursor-pointer`}
                      >
                        <option value="">Prefer not to say</option>
                        <option value="female">Female</option>
                        <option value="male">Male</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Delivery address */}
            <section>
              <h3 className="mb-5 border-b border-[#E0D9CF] pb-3 text-[10px] tracking-[0.22em] text-[#8A6C5F]">
                02 — DELIVERY ADDRESS
              </h3>

              <div className="space-y-6">
                <div>
                  <label htmlFor="address" className={labelClass}>
                    HOUSE / STREET / AREA *
                  </label>
                  <div className={fieldClass}>
                    <MapPin size={17} className="shrink-0 text-[#8A6C5F]" />
                    <input
                      id="address"
                      name="address"
                      autoComplete="street-address"
                      value={form.address}
                      onChange={updateField}
                      placeholder="House name, street, area"
                      required
                      className={inputClass}
                    />
                  </div>
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <label htmlFor="city" className={labelClass}>
                      CITY / TOWN *
                    </label>
                    <div className={fieldClass}>
                      <Map size={17} className="shrink-0 text-[#8A6C5F]" />
                      <input
                        id="city"
                        name="city"
                        autoComplete="address-level2"
                        value={form.city}
                        onChange={updateField}
                        placeholder="City or town"
                        required
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="state" className={labelClass}>
                      STATE *
                    </label>
                    <div className={fieldClass}>
                      <Map size={17} className="shrink-0 text-[#8A6C5F]" />
                      <input
                        id="state"
                        name="state"
                        autoComplete="address-level1"
                        value={form.state}
                        onChange={updateField}
                        placeholder="State"
                        required
                        className={inputClass}
                      />
                    </div>
                  </div>
                </div>

                <div className="max-w-xs">
                  <label htmlFor="pinCode" className={labelClass}>
                    PIN CODE *
                  </label>
                  <div className={fieldClass}>
                    <Hash size={17} className="shrink-0 text-[#8A6C5F]" />
                    <input
                      id="pinCode"
                      name="pinCode"
                      type="text"
                      inputMode="numeric"
                      autoComplete="postal-code"
                      maxLength={6}
                      pattern="[0-9]{6}"
                      value={form.pinCode}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          pinCode: e.target.value
                            .replace(/\D/g, "")
                            .slice(0, 6),
                        }))
                      }
                      placeholder="6-digit PIN code"
                      required
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Account security */}
            <section>
              <h3 className="mb-5 border-b border-[#E0D9CF] pb-3 text-[10px] tracking-[0.22em] text-[#8A6C5F]">
                03 — ACCOUNT SECURITY
              </h3>

              <div className="space-y-6">
                <div>
                  <label htmlFor="password" className={labelClass}>
                    PASSWORD *
                  </label>
                  <div className={fieldClass}>
                    <LockKeyhole
                      size={17}
                      className="shrink-0 text-[#8A6C5F]"
                    />
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      minLength={6}
                      value={form.password}
                      onChange={updateField}
                      placeholder="Minimum 6 characters"
                      required
                      className={inputClass}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                      className="shrink-0 text-[#8A6C5F] hover:text-[#544339]"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className={labelClass}>
                    CONFIRM PASSWORD *
                  </label>
                  <div className={fieldClass}>
                    <LockKeyhole
                      size={17}
                      className="shrink-0 text-[#8A6C5F]"
                    />
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      autoComplete="new-password"
                      minLength={6}
                      value={form.confirmPassword}
                      onChange={updateField}
                      placeholder="Enter password again"
                      required
                      className={inputClass}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      aria-label={
                        showConfirmPassword ? "Hide password" : "Show password"
                      }
                      className="shrink-0 text-[#8A6C5F] hover:text-[#544339]"
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* Terms */}
            <label className="flex cursor-pointer items-start gap-3 text-xs leading-5 text-[#8A6C5F]">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="mt-1 accent-[#544339]"
              />
              <span>
                I agree to the{" "}
                <Link
                  to="/terms"
                  className="underline underline-offset-2 hover:text-[#544339]"
                >
                  Terms & Conditions
                </Link>{" "}
                and{" "}
                <Link
                  to="/privacy"
                  className="underline underline-offset-2 hover:text-[#544339]"
                >
                  Privacy Policy
                </Link>
                .
              </span>
            </label>

            {message && (
              <p
                role="alert"
                className={`border p-3 text-sm ${
                  isError
                    ? "border-red-200 bg-red-50 text-red-700"
                    : "border-[#BFA38A] bg-[#E0D9CF]/40 text-[#544339]"
                }`}
              >
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-3 bg-[#544339] py-4 text-[10px] tracking-[0.2em] text-[#F8F4EE] transition hover:bg-[#6B5145] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "CREATING ACCOUNT..." : "SUBMIT"}
              {!loading && <ArrowRight size={16} />}
            </button>
          </form>

          <div className="my-7 flex items-center gap-4">
            <div className="h-px flex-1 bg-[#E0D9CF]" />
            <span className="text-[9px] tracking-[0.15em] text-[#8A6C5F]">
              ALREADY A MEMBER?
            </span>
            <div className="h-px flex-1 bg-[#E0D9CF]" />
          </div>

          <Link
            to="/login"
            className="flex w-full items-center justify-center border border-[#BFA38A] py-3.5 text-[10px] tracking-[0.18em] transition hover:bg-[#E0D9CF]/40"
          >
            SIGN IN
          </Link>
        </section>

        <div className="mt-6 text-center">
          <Link
            to="/products"
            className="text-xs text-[#8A6C5F] underline underline-offset-4 hover:text-[#544339]"
          >
            Continue browsing
          </Link>
        </div>

        <p className="mt-7 text-center text-[9px] tracking-[0.18em] text-[#BFA38A]">
          ÉLORA · YOUR EVERYDAY ELEGANCE
        </p>
      </div>
    </main>
  );
}

export default Register;
