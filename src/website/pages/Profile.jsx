import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  UserRound,
  Mail,
  Phone,
  CalendarDays,
  MapPin,
  Pencil,
  LogOut,
  ArrowRight,
  ShieldCheck,
  Package,
  ChevronRight,
  ShoppingBag,
  Sparkles,
} from "lucide-react";

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      navigate("/login", {
        state: { from: { pathname: "/profile" } },
        replace: true,
      });
      return;
    }

    try {
      setUser(JSON.parse(localStorage.getItem("user") || "null"));
    } catch {
      setUser(null);
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login", { replace: true });
  };

  if (!localStorage.getItem("token")) return null;

  const address = user?.address;

  const details = [
    {
      label: "Full name",
      value: user?.name || "Not added yet",
      icon: UserRound,
    },
    {
      label: "Email address",
      value: user?.email || "Not added yet",
      icon: Mail,
    },
    {
      label: "Phone number",
      value: user?.phone || "Not added yet",
      icon: Phone,
    },
    {
      label: "Date of birth",
      value: user?.dateOfBirth
        ? new Date(user.dateOfBirth).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "long",
            year: "numeric",
          })
        : "Not added yet",
      icon: CalendarDays,
    },
  ];

  const addressText = address
    ? [address.addressLine, address.city, address.state, address.pinCode]
        .filter(Boolean)
        .join(", ")
    : "";

  return (
    <main className="min-h-screen bg-[#F7F3ED] px-4 py-10 text-[#544339] sm:px-6 sm:py-16">
      <div className="mx-auto max-w-4xl">
        {/* Page heading */}
        <header className="mb-10 text-center sm:mb-12">
          <div className="mb-4 flex items-center justify-center gap-2 text-[#A88B73]">
            <span className="h-px w-8 bg-[#C8B29E]" />
            <Sparkles size={14} strokeWidth={1.3} />
            <span className="h-px w-8 bg-[#C8B29E]" />
          </div>

          <p className="text-[9px] tracking-[0.4em] text-[#967663]">
            YOUR PERSONAL SPACE
          </p>

          <h1 className="mt-3 font-serif text-4xl tracking-wide sm:text-5xl">
            My Profile
          </h1>

          <p className="mx-auto mt-4 max-w-md text-xs leading-6 text-[#8A6C5F] sm:text-sm">
            A little space for your details, your orders, and everything that
            makes your ÉLORA experience yours.
          </p>
        </header>

        {/* Main profile card */}
        <section className="overflow-hidden border border-[#E4D9CE] bg-[#FCFAF7] shadow-[0_20px_60px_rgba(84,67,57,0.07)]">
          {/* Identity banner */}
          <div className="relative overflow-hidden bg-[#514035] px-6 py-9 sm:px-10 sm:py-12">
            <div className="pointer-events-none absolute -right-12 -top-28 h-72 w-72 rounded-full border border-[#C7A98C]/20" />
            <div className="pointer-events-none absolute -right-2 -top-16 h-52 w-52 rounded-full border border-[#C7A98C]/20" />
            <div className="pointer-events-none absolute bottom-0 left-0 h-px w-full bg-gradient-to-r from-transparent via-[#C7A98C]/50 to-transparent" />

            <div className="relative flex flex-col items-center gap-5 sm:flex-row sm:gap-6">
              <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full border border-[#C7A98C]/60 bg-[#F8F4EE] shadow-inner sm:h-28 sm:w-28">
                <UserRound
                  size={42}
                  strokeWidth={1.1}
                  className="text-[#655044]"
                />
              </div>

              <div className="min-w-0 text-center sm:text-left">
                <p className="text-[9px] tracking-[0.35em] text-[#D0B59A]">
                  WELCOME TO ÉLORA
                </p>

                <h2 className="mt-2 break-words font-serif text-3xl text-[#FCF8F1] sm:text-4xl">
                  {user?.name || "ÉLORA Member"}
                </h2>

                <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-[#D0B59A]/30 px-3 py-1.5 text-[10px] tracking-wide text-[#E8D8C8]">
                  <ShieldCheck size={14} strokeWidth={1.4} />
                  Member account
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-10 px-5 py-8 sm:px-10 sm:py-10">
            {/* Orders section */}
            <section>
              <div className="mb-5">
                <p className="text-[9px] tracking-[0.3em] text-[#A17E68]">
                  YOUR ÉLORA EXPERIENCE
                </p>
                <h3 className="mt-2 font-serif text-2xl sm:text-3xl">
                  My orders
                </h3>
                <p className="mt-2 text-xs leading-5 text-[#967D6D]">
                  Your purchases, all in one place.
                </p>
              </div>

              <Link
                to="/orders"
                className="group relative flex items-center gap-4 overflow-hidden border border-[#DCCBBB] bg-[#F7F1E9] p-5 transition duration-300 hover:border-[#9B7A63] hover:bg-[#F1E7DC] sm:gap-5 sm:p-6"
              >
                <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-[#8A6C5F] transition-all duration-500 group-hover:w-full" />

                <div className="flex h-14 w-14 shrink-0 items-center justify-center border border-[#D8C4B1] bg-[#FCFAF7] text-[#80614E] transition duration-300 group-hover:bg-[#544339] group-hover:text-[#FCFAF7]">
                  <ShoppingBag size={23} strokeWidth={1.3} />
                </div>

                <div className="min-w-0 flex-1">
                  <h4 className="font-serif text-xl sm:text-2xl">
                    View your orders
                  </h4>
                  <p className="mt-1 text-xs leading-5 text-[#967D6D]">
                    Track deliveries and check your order history.
                  </p>
                </div>

                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#D8C4B1] text-[#80614E] transition duration-300 group-hover:translate-x-1 group-hover:border-[#544339]">
                  <ChevronRight size={19} strokeWidth={1.4} />
                </div>
              </Link>
            </section>

            {/* Personal details */}
            <section>
              <div className="mb-6 flex items-end justify-between gap-3">
                <div>
                  <p className="text-[9px] tracking-[0.3em] text-[#A17E68]">
                    YOUR INFORMATION
                  </p>
                  <h3 className="mt-2 font-serif text-2xl sm:text-3xl">
                    Personal details
                  </h3>
                </div>

                <span className="hidden text-[9px] tracking-[0.15em] text-[#B49A83] sm:block">
                  ÉLORA MEMBER
                </span>
              </div>

              <div className="divide-y divide-[#E5DCD2] border-y border-[#E5DCD2]">
                {details.map(({ label, value, icon: Icon }) => (
                  <div
                    key={label}
                    className="group flex items-center gap-4 py-5 sm:gap-5"
                  >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center bg-[#F0E9E1] text-[#947560] transition-colors group-hover:bg-[#E8DCCE]">
                      <Icon size={19} strokeWidth={1.35} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] tracking-wide text-[#987B67]">
                        {label}
                      </p>
                      <p className="mt-1 break-words text-sm text-[#514035]">
                        {value}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Delivery address */}
            <section>
              <div className="mb-5">
                <p className="text-[9px] tracking-[0.3em] text-[#A17E68]">
                  DELIVERY INFORMATION
                </p>
                <h3 className="mt-2 font-serif text-2xl sm:text-3xl">
                  Delivery address
                </h3>
              </div>

              <div className="flex items-start gap-4 border border-[#E2D7CB] bg-[#F8F4EE] p-5 sm:p-6">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center bg-[#EAE0D5] text-[#8A6C5F]">
                  <MapPin size={19} strokeWidth={1.35} />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-sm leading-6 text-[#544339]">
                    {addressText || "No delivery address added yet."}
                  </p>

                  {address?.pinCode && (
                    <p className="mt-2 text-[9px] tracking-[0.15em] text-[#967663]">
                      PIN CODE: {address.pinCode}
                    </p>
                  )}
                </div>
              </div>
            </section>

            {/* Profile actions */}
            <section className="grid gap-3 border-t border-[#E5DCD2] pt-7 sm:grid-cols-2">
              <Link
                to="/profile/edit"
                className="group flex items-center justify-center gap-3 border border-[#BDA38D] px-5 py-4 text-[10px] tracking-[0.16em] transition duration-300 hover:bg-[#F0E7DD]"
              >
                <Pencil size={15} strokeWidth={1.5} />
                EDIT PROFILE
                <ArrowRight
                  size={14}
                  className="transition-transform group-hover:translate-x-1"
                />
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center justify-center gap-3 bg-[#514035] px-5 py-4 text-[10px] tracking-[0.16em] text-[#FCF8F1] transition duration-300 hover:bg-[#6B5145]"
              >
                <LogOut size={15} strokeWidth={1.5} />
                SIGN OUT
              </button>
            </section>
          </div>
        </section>

        {/* Footer navigation */}
        <footer className="mt-8 flex flex-col items-center gap-5 text-center">
          <Link
            to="/products"
            className="group inline-flex items-center gap-2 text-xs text-[#8A6C5F] transition hover:text-[#544339]"
          >
            <ArrowRight
              size={14}
              className="rotate-180 transition-transform group-hover:-translate-x-1"
            />
            Continue browsing
          </Link>

          <p className="text-[9px] tracking-[0.3em] text-[#B49A83]">
            ÉLORA · YOUR EVERYDAY ELEGANCE
          </p>
        </footer>
      </div>
    </main>
  );
}
