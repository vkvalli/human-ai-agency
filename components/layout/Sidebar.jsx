import { NavLink } from "react-router-dom";
import { LayoutDashboard, BarChart3, Goal } from "lucide-react";

const navItems = [
  { label: "Home", to: "/home", icon: LayoutDashboard },
  { label: "Deeper Insights", to: "/insights", icon: BarChart3 },
  { label: "Improvement", to: "/improvement", icon: Goal },
];

export default function Sidebar() {
  return (
    <aside className="hidden w-72 border-r border-slate-200 bg-white lg:flex lg:flex-col">
      <div className="border-b border-slate-200 px-6 py-6">
        <p className="text-sm text-slate-500">Human vs AI</p>
        <h1 className="text-xl font-semibold">Agency Dashboard</h1>
      </div>

      <nav className="flex-1 space-y-2 p-4">
        {navItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                  isActive
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`
              }
            >
              <Icon size={18} />
              {item.label}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}