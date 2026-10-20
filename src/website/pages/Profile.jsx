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
    <main className="min-h-screen bg-[#F8F4EE] px-4 py-12 text-[#544339] sm:px-6 sm:py-16">
      <div className="mx-auto max-w-3xl">
        {/* Heading */}
        <header className="mb-10 text-center">
          <p className="text-[10px] tracking-[0.35em] text-[#8A6C5F]">
            YOUR PERSONAL SPACE
          </p>

          <h1 className="mt-4 font-serif text-4xl sm:text-5xl">My Profile</h1>

          <p className="mt-4 text-sm leading-6 text-[#8A6C5F]">
            Your details, your preferences, your ÉLORA experience.
          </p>

          <div className="mx-auto mt-6 h-px w-16 bg-[#BFA38A]" />
        </header>

        {/* Main card */}
        <section className="overflow-hidden border border-[#E0D9CF] bg-[#FCFAF6] shadow-[0_15px_50px_rgba(84,67,57,0.06)]">
          {/* Profile identity */}
          <div className="relative overflow-hidden bg-[#544339] px-6 py-9 sm:px-10 sm:py-11">
            <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full border border-[#BFA38A]/30" />
            <div className="pointer-events-none absolute -right-6 -top-14 h-44 w-44 rounded-full border border-[#BFA38A]/20" />

            <div className="relative flex flex-col items-center gap-5 text-center sm:flex-row sm:text-left">
              <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full border border-[#BFA38A]/60 bg-[#F8F4EE] text-[#544339]">
                <UserRound size={39} strokeWidth={1.2} />
              </div>

              <div className="min-w-0">
                <p className="text-[9px] tracking-[0.3em] text-[#BFA38A]">
                  WELCOME TO ÉLORA
                </p>

                <h2 className="mt-2 break-words font-serif text-3xl text-[#F8F4EE] sm:text-4xl">
                  {user?.name || "ÉLORA Member"}
                </h2>

                <div className="mt-3 inline-flex items-center gap-2 text-xs text-[#E0D9CF]">
                  <ShieldCheck size={15} />
                  Member account
                </div>
              </div>
            </div>
          </div>

          {/* Personal information */}
          <div className="px-6 py-8 sm:px-10 sm:py-10">
            <div className="mb-7 flex items-end justify-between gap-4">
              <div>
                <p className="text-[9px] tracking-[0.3em] text-[#8A6C5F]">
                  YOUR INFORMATION
                </p>
                <h3 className="mt-2 font-serif text-2xl sm:text-3xl">
                  Personal details
                </h3>
              </div>

              <span className="hidden text-[9px] tracking-[0.15em] text-[#BFA38A] sm:block">
                ÉLORA MEMBER
              </span>
            </div>

            <div className="divide-y divide-[#E0D9CF] border-y border-[#E0D9CF]">
              {details.map(({ label, value, icon: Icon }) => (
                <div
                  key={label}
                  className="flex items-center gap-4 py-5 sm:gap-5"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center bg-[#E0D9CF]/40 text-[#8A6C5F]">
                    <Icon size={19} strokeWidth={1.4} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] tracking-wide text-[#8A6C5F]">
                      {label}
                    </p>
                    <p className="mt-1 break-words text-sm text-[#544339]">
                      {value}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Delivery address */}
            <div className="mt-8">
              <p className="mb-4 text-[9px] tracking-[0.25em] text-[#8A6C5F]">
                DELIVERY ADDRESS
              </p>

              <div className="flex items-start gap-4 border border-[#E0D9CF] bg-[#F8F4EE] p-5 sm:p-6">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center bg-[#E0D9CF]/60 text-[#8A6C5F]">
                  <MapPin size={19} strokeWidth={1.4} />
                </div>

                <div className="min-w-0">
                  <p className="text-sm leading-6">
                    {addressText || "No delivery address added yet."}
                  </p>

                  {address?.pinCode && (
                    <p className="mt-2 text-[10px] tracking-[0.15em] text-[#8A6C5F]">
                      PIN CODE: {address.pinCode}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <Link
                to="/profile/edit"
                className="flex items-center justify-center gap-3 border border-[#BFA38A] px-5 py-4 text-[10px] tracking-[0.17em] transition hover:bg-[#E0D9CF]/40"
              >
                <Pencil size={15} />
                EDIT PROFILE
                <ArrowRight size={14} />
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center justify-center gap-3 bg-[#544339] px-5 py-4 text-[10px] tracking-[0.17em] text-[#F8F4EE] transition hover:bg-[#6B5145]"
              >
                <LogOut size={15} />
                SIGN OUT
              </button>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-8 text-center">
          <Link
            to="/products"
            className="inline-flex items-center gap-2 text-xs text-[#8A6C5F] transition hover:text-[#544339]"
          >
            <ArrowRight size={14} className="rotate-180" />
            Continue browsing
          </Link>

          <p className="mt-6 text-[9px] tracking-[0.3em] text-[#BFA38A]">
            ÉLORA · YOUR EVERYDAY ELEGANCE
          </p>
        </footer>
      </div>
    </main>
  );
}
