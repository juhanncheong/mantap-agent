import { NavLink, useNavigate } from "react-router-dom";
import { Users, Ticket, LogOut, Shield, Gift } from "lucide-react";

export default function Shell({ title = "Dashboard", children }) {
  const navigate = useNavigate();

  function handleLogout() {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("agent_token");
    localStorage.removeItem("auth_user");
    navigate("/", { replace: true });
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#0B1020] text-white">
      <div className="flex min-h-screen">
        <aside className="w-[290px] shrink-0 border-r border-white/10 bg-white/5 px-4 py-5">
          <div className="flex items-center gap-3 px-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
              <Shield className="h-5 w-5" />
            </div>

            <div>
              <div className="text-sm font-semibold">曼达【MANTAP】集团</div>
            </div>
          </div>

          <nav className="mt-6 space-y-2">
            <SideLink to="/dashboard" icon={<Users className="h-4 w-4 shrink-0" />}>
              Users
            </SideLink>

            <SideLink
              to="/invitation-codes"
              icon={<Ticket className="h-4 w-4 shrink-0" />}
            >
              Invitation Codes
            </SideLink>

            <SideLink
              to="/trial-bonus"
              icon={<Gift className="h-4 w-4 shrink-0" />}
            >
              Trial Bonus
            </SideLink>
          </nav>

          <button
            onClick={handleLogout}
            className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/80 hover:bg-white/10"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Logout
          </button>
        </aside>

        <main className="min-w-0 flex-1 px-8 py-6">
          <div className="mb-4 text-lg font-semibold">{title}</div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

function SideLink({ to, icon, children }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition ${
          isActive
            ? "bg-white/10 text-white"
            : "text-white/70 hover:bg-white/10 hover:text-white"
        }`
      }
    >
      {icon}
      <span className="whitespace-nowrap">{children}</span>
    </NavLink>
  );
}