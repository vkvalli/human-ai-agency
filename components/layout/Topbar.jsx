import { NavLink } from "react-router-dom";
import { LayoutDashboard, BarChart3, Goal } from "lucide-react";

const navItems = [
  { label: "Home", to: "/home", icon: LayoutDashboard },
  { label: "Deeper Insights", to: "/insights", icon: BarChart3 },
  { label: "Improvement", to: "/improvement", icon: Goal },
];

export default function Topbar() {
  return (
    <header className="relative">
      <div className="relative mx-auto max-w-7xl px-6 pt-10 pb-6">
        <div className="mb-7 flex items-center justify-between">
          <div>
            <p className="text-xl font-medium  font-bold tracking-tight text-slate-950">Human vs AI</p>
            <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-[3.1rem]">
              Agency Dashboard
            </h1>
          </div>
        </div>

        <div className="mx-auto max-w-5xl rounded-full border border-cyan-100/45 bg-gradient-to-r from-[#0f5f84]/88 via-[#1186bb]/82 to-[#279ae2]/76 p-3 shadow-[0_24px_60px_rgba(4,33,61,0.28)] backdrop-blur-xl">
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
                        ? "bg-white/94 text-slate-900 shadow-[0_12px_30px_rgba(255,255,255,0.3)]"
                        : "text-cyan-50 hover:bg-white/10"
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
