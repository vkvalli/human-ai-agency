import { NavLink } from "react-router-dom";
import { LayoutDashboard, BarChart3, Goal } from "lucide-react";

const navItems = [
  { label: "Home", to: "/home", icon: LayoutDashboard },
  { label: "Deeper Insights", to: "/insights", icon: BarChart3 },
  { label: "Improvement", to: "/improvement", icon: Goal },
];

export default function Topbar() {
  return (
    <header className="relative overflow-hidden border-b border-sky-100 bg-gradient-to-b from-sky-200 via-cyan-100 to-slate-50">
      {/* decorative background blobs */}
      <div className="absolute left-10 top-6 h-24 w-24 rounded-full bg-white/20 blur-2xl" />
      <div className="absolute right-20 top-10 h-32 w-32 rounded-full bg-cyan-300/20 blur-3xl" />
      <div className="absolute left-1/3 top-0 h-28 w-72 rounded-full bg-sky-300/30 blur-2xl" />

      <div className="relative mx-auto max-w-7xl px-6 py-6">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-sky-700">Human vs AI</p>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Agency Dashboard
            </h1>
          </div>

        </div>

        <div className="mx-auto max-w-5xl rounded-full border border-white/50 bg-gradient-to-r from-sky-500 to-cyan-400 p-3 shadow-[0_18px_50px_rgba(14,116,144,0.18)]">
          <nav className="flex flex-wrap items-center justify-center gap-3">
            {navItems.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition ${
                      isActive
                        ? "bg-white text-sky-700 shadow-md"
                        : "text-white hover:bg-white/20"
                    }`
                  }
                >
                  <Icon size={18} />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}