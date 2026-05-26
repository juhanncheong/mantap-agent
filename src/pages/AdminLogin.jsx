import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, KeyRound, Database, Lock, Eye, EyeOff } from "lucide-react";

export default function AgentLogin() {
  const navigate = useNavigate();

  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("https://closed-deirdre-jayjay122-a04beb79.koyeb.app/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Login failed");
      }

      const role = data.user?.role;

      if (!["admin", "user", "super_agent"].includes(role)) {
        throw new Error("Only user, super agent, or admin accounts can access this dashboard.");
      }

      localStorage.setItem("auth_token", data.token);
      localStorage.setItem("auth_user", JSON.stringify(data.user));

      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err.message || "Login failed. Check credentials.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-full bg-[#0B1020]">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-40 left-20 h-[520px] w-[520px] rounded-full bg-white/10 blur-3xl" />
        <div className="absolute top-24 right-24 h-[520px] w-[520px] rounded-full bg-white/5 blur-3xl" />
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.06] via-transparent to-transparent" />
      </div>

      <div className="relative flex min-h-screen w-full items-center justify-center px-6">
        <div className="w-full max-w-6xl overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-2xl backdrop-blur-xl">
          <div className="grid grid-cols-1 md:grid-cols-2">
            <div className="relative p-9 text-white">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/10">
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-[15px] font-semibold tracking-tight">
                    Agent Dashboard
                  </div>
                </div>
              </div>

              <p className="mt-6 max-w-md text-sm leading-relaxed text-white/70">
                Secure read-only access for agent accounts.
              </p>

              <div className="mt-6 flex flex-wrap gap-2">
                <Tag icon={<KeyRound className="h-3.5 w-3.5" />} text="Read-only access" />
                <Tag icon={<Lock className="h-3.5 w-3.5" />} text="JWT secured" />
                <Tag icon={<Database className="h-3.5 w-3.5" />} text="MongoDB Atlas" />
              </div>

              <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <MiniCard title="Access" value="User + Super Agent + Admin" />
                <MiniCard title="Mode" value="View Only" />
                <div className="sm:col-span-2">
                  <MiniCard title="System" value="Online" />
                </div>
              </div>

              <div className="mt-8 text-xs text-white/40">
                This portal does not allow editing or admin actions.
              </div>

              <div className="mt-10 text-xs text-white/30">
                © {new Date().getFullYear()} • Internal View Dashboard
              </div>
            </div>

            <div className="bg-white p-9">
              <div className="max-w-md">
                <div className="text-[18px] font-semibold tracking-tight text-black">
                  Sign In
                </div>
                <div className="mt-1 text-xs text-black/55">
                  User, super agent, and admin accounts can log in.
                </div>

                {error ? (
                  <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
                    {error}
                  </div>
                ) : null}

                <form onSubmit={handleLogin} className="mt-6 space-y-4">
                  <div>
                    <label className="mb-1.5 block text-[11px] font-medium text-black/70">
                      Phone Number
                    </label>
                    <input
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="e.g. 123456"
                      className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm text-black outline-none transition focus:border-black/30 focus:ring-4 focus:ring-black/5"
                      autoComplete="off"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-[11px] font-medium text-black/70">
                      Password
                    </label>

                    <div className="relative">
                      <input
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        type={show ? "text" : "password"}
                        placeholder="••••••••"
                        className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 pr-24 text-sm text-black outline-none transition focus:border-black/30 focus:ring-4 focus:ring-black/5"
                      />

                      <button
                        type="button"
                        onClick={() => setShow((s) => !s)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg border border-black/10 bg-white px-3 py-1.5 text-xs text-black/70 hover:bg-black/5"
                      >
                        <span className="inline-flex items-center gap-1">
                          {show ? (
                            <>
                              <EyeOff className="h-3.5 w-3.5" />
                              Hide
                            </>
                          ) : (
                            <>
                              <Eye className="h-3.5 w-3.5" />
                              Show
                            </>
                          )}
                        </span>
                      </button>
                    </div>

                    <div className="mt-2 text-[11px] text-black/45">
                      User, super agent, and admin accounts are allowed.
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="mt-2 w-full rounded-xl bg-black px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-black/90 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? "Signing in..." : "Login"}
                  </button>

                  <div className="text-[11px] text-black/40">
                    This dashboard is read-only.
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Tag({ icon, text }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/70">
      <span className="text-white/70">{icon}</span>
      {text}
    </div>
  );
}

function MiniCard({ title, value }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-4">
      <div className="text-[11px] text-white/50">{title}</div>
      <div className="mt-1 text-sm font-semibold text-white">{value}</div>
    </div>
  );
}