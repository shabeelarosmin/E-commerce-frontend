import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  UserRound,
  Mail,
  Phone,
  CalendarDays,
  MapPin,
  Save,
} from "lucide-react";

import { updateProfile } from "../../api/profileApi";

const initialForm = {
  name: "",
  email: "",
  phone: "",
  dateOfBirth: "",
  gender: "",
  address: "",
  city: "",
  state: "",
  pinCode: "",
};

const labelClass =
  "mb-2 block text-[10px] font-medium tracking-[0.15em] text-[#544339]";

const inputClass =
  "w-full border-b border-[#BFA38A] bg-transparent px-1 py-3 text-sm text-[#544339] outline-none transition placeholder:text-[#BFA38A] focus:border-[#544339]";

function EditProfile() {
  const navigate = useNavigate();

  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      navigate("/login", { replace: true });
      return;
    }

    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");

      const address =
        user.address && typeof user.address === "object" ? user.address : {};

      setForm({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        dateOfBirth: user.dateOfBirth
          ? new Date(user.dateOfBirth).toISOString().slice(0, 10)
          : "",
        gender: user.gender || "",
        address:
          address.addressLine ||
          (typeof user.address === "string" ? user.address : ""),
        city: address.city || user.city || "",
        state: address.state || user.state || "",
        pinCode: address.pinCode || user.pincode || user.pinCode || "",
      });
    } catch {
      setMessage("Unable to load your saved profile.");
    }
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!/^\d{6}$/.test(form.pinCode)) {
      setMessage("Please enter a valid 6-digit PIN code.");
      return;
    }

    setLoading(true);

    try {
      const response = await updateProfile({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        dateOfBirth: form.dateOfBirth || null,
        gender: form.gender,
        address: form.address.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        pinCode: form.pinCode,
      });

      const updatedUser = response.user;

      if (!updatedUser) {
        throw new Error("The server did not return the updated profile.");
      }

      localStorage.setItem("user", JSON.stringify(updatedUser));

      setMessage("Profile updated successfully!");

      navigate("/profile", {
        replace: true,
        state: { profileUpdated: true },
      });
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          error.message ||
          "Unable to update your profile.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#F8F4EE] px-4 py-10 text-[#544339] sm:px-6 sm:py-14">
      <div className="mx-auto max-w-3xl">
        <Link
          to="/profile"
          className="mb-8 inline-flex items-center gap-2 text-xs text-[#8A6C5F] transition hover:text-[#544339]"
        >
          <ArrowLeft size={15} />
          BACK TO PROFILE
        </Link>

        <header className="mb-9">
          <p className="text-[10px] tracking-[0.32em] text-[#8A6C5F]">
            YOUR ÉLORA ACCOUNT
          </p>

          <h1 className="mt-3 font-serif text-4xl sm:text-5xl">Edit profile</h1>

          <p className="mt-3 text-sm leading-6 text-[#8A6C5F]">
            Keep your personal details and delivery information up to date.
          </p>
        </header>

        <form
          onSubmit={handleSave}
          className="border border-[#E0D9CF] bg-[#FCFAF6] p-5 shadow-[0_12px_40px_rgba(84,67,57,0.05)] sm:p-9"
        >
          <section>
            <div className="mb-6 flex items-center gap-3 border-b border-[#E0D9CF] pb-4">
              <UserRound size={19} className="text-[#8A6C5F]" />
              <h2 className="font-serif text-2xl">Personal information</h2>
            </div>

            <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
              <div>
                <label htmlFor="name" className={labelClass}>
                  FULL NAME
                </label>
                <input
                  id="name"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  autoComplete="name"
                  required
                  className={inputClass}
                  placeholder="Your full name"
                />
              </div>

              <div>
                <label htmlFor="email" className={labelClass}>
                  EMAIL ADDRESS
                </label>
                <div className="flex items-center gap-2">
                  <Mail size={16} className="shrink-0 text-[#8A6C5F]" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    autoComplete="email"
                    required
                    className={inputClass}
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="phone" className={labelClass}>
                  PHONE NUMBER
                </label>
                <div className="flex items-center gap-2">
                  <Phone size={16} className="shrink-0 text-[#8A6C5F]" />
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={form.phone}
                    onChange={handleChange}
                    autoComplete="tel"
                    required
                    className={inputClass}
                    placeholder="Your phone number"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="dateOfBirth" className={labelClass}>
                  DATE OF BIRTH
                </label>
                <div className="flex items-center gap-2">
                  <CalendarDays size={16} className="shrink-0 text-[#8A6C5F]" />
                  <input
                    id="dateOfBirth"
                    name="dateOfBirth"
                    type="date"
                    value={form.dateOfBirth}
                    onChange={handleChange}
                    max={new Date().toISOString().slice(0, 10)}
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="gender" className={labelClass}>
                  GENDER
                </label>
                <select
                  id="gender"
                  name="gender"
                  value={form.gender}
                  onChange={handleChange}
                  className={inputClass}
                >
                  <option value="">Prefer not to say</option>
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
          </section>

          <section className="mt-10">
            <div className="mb-6 flex items-center gap-3 border-b border-[#E0D9CF] pb-4">
              <MapPin size={19} className="text-[#8A6C5F]" />
              <h2 className="font-serif text-2xl">Delivery address</h2>
            </div>

            <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="address" className={labelClass}>
                  HOUSE / STREET / AREA
                </label>
                <input
                  id="address"
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  autoComplete="street-address"
                  required
                  className={inputClass}
                  placeholder="House name, street, area"
                />
              </div>

              <div>
                <label htmlFor="city" className={labelClass}>
                  CITY / TOWN
                </label>
                <input
                  id="city"
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  autoComplete="address-level2"
                  required
                  className={inputClass}
                  placeholder="City or town"
                />
              </div>

              <div>
                <label htmlFor="state" className={labelClass}>
                  STATE
                </label>
                <input
                  id="state"
                  name="state"
                  value={form.state}
                  onChange={handleChange}
                  autoComplete="address-level1"
                  required
                  className={inputClass}
                  placeholder="State"
                />
              </div>

              <div>
                <label htmlFor="pinCode" className={labelClass}>
                  PIN CODE
                </label>
                <input
                  id="pinCode"
                  name="pinCode"
                  value={form.pinCode}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      pinCode: e.target.value.replace(/\D/g, "").slice(0, 6),
                    }))
                  }
                  inputMode="numeric"
                  autoComplete="postal-code"
                  required
                  className={inputClass}
                  placeholder="6-digit PIN code"
                />
              </div>
            </div>
          </section>

          {message && (
            <p
              role="status"
              className="mt-7 border border-[#BFA38A] bg-[#F8F4EE] p-4 text-sm leading-6 text-[#8A6C5F]"
            >
              {message}
            </p>
          )}

          <div className="mt-9 flex flex-col-reverse gap-3 border-t border-[#E0D9CF] pt-6 sm:flex-row">
            <Link
              to="/profile"
              className="flex flex-1 items-center justify-center border border-[#BFA38A] px-5 py-4 text-[10px] tracking-[0.16em] transition hover:bg-[#E0D9CF]/40"
            >
              CANCEL
            </Link>

            <button
              type="submit"
              disabled={loading}
              className="flex flex-1 items-center justify-center gap-3 bg-[#544339] px-5 py-4 text-[10px] tracking-[0.16em] text-[#F8F4EE] transition hover:bg-[#6B5145] disabled:opacity-60"
            >
              <Save size={15} />
              {loading ? "SAVING..." : "SAVE CHANGES"}
            </button>
          </div>
        </form>

        <p className="mt-7 text-center text-[9px] tracking-[0.25em] text-[#BFA38A]">
          ÉLORA · YOUR EVERYDAY ELEGANCE
        </p>
      </div>
    </main>
  );
}

export default EditProfile;
