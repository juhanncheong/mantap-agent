import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Shield,
  KeyRound,
  Database,
  Lock,
  Eye,
  EyeOff,
  ScanLine,
  X,
  Copy,
  CheckCircle2,
  Smartphone,
} from "lucide-react";

const API_BASE =
  import.meta.env.VITE_API_URL ||
  "https://closed-deirdre-jayjay122-a04beb79.koyeb.app";

export default function AgentLogin() {
  const navigate = useNavigate();

  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [twoFaOpen, setTwoFaOpen] = useState(false);
  const [twoFaMode, setTwoFaMode] = useState(null); // "setup" | "login"
  const [setupToken, setSetupToken] = useState("");
  const [tempToken, setTempToken] = useState("");
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [manualKey, setManualKey] = useState("");
  const [gaCode, setGaCode] = useState("");
  const [twoFaLoading, setTwoFaLoading] = useState(false);
  const [setupLoaded, setSetupLoaded] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: String(phoneNumber).trim(),
          password,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.message || "Login failed");
      }

      const role = data.user?.role;

      if (!["admin", "user", "super_agent"].includes(role)) {
        throw new Error(
          "Only user, super agent, or admin accounts can access this dashboard.",
        );
      }

      // ✅ First-time Google Authenticator setup
      if (data?.setup2FARequired && data?.setupToken) {
        setSetupToken(data.setupToken);
        setTempToken("");
        setTwoFaMode("setup");
        setTwoFaOpen(true);
        setGaCode("");
        setQrCodeUrl("");
        setManualKey("");
        setSetupLoaded(false);
        await loadSetupQr(data.setupToken);
        return;
      }

      // ✅ Future login with 6-digit Google Authenticator code
      if (data?.twoFactorRequired && data?.tempToken) {
        setTempToken(data.tempToken);
        setSetupToken("");
        setTwoFaMode("login");
        setTwoFaOpen(true);
        setGaCode("");
        setQrCodeUrl("");
        setManualKey("");
        setSetupLoaded(true);
        return;
      }

      if (!data?.token) {
        throw new Error("Login succeeded but token missing");
      }

      finishLogin(data);
    } catch (err) {
      setError(err.message || "Login failed. Check credentials.");
    } finally {
      setLoading(false);
    }
  }

  async function loadSetupQr(tokenToUse = setupToken) {
    try {
      setTwoFaLoading(true);
      setError("");

      const res = await fetch(`${API_BASE}/api/auth/admin/2fa/setup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ setupToken: tokenToUse }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(
          data?.message || "Failed to create Google Authenticator setup",
        );
      }

      setQrCodeUrl(data.qrCodeUrl || "");
      setManualKey(data.manualKey || "");
      setSetupLoaded(true);
    } catch (err) {
      setError(err.message || "Failed to load Google Authenticator QR");
    } finally {
      setTwoFaLoading(false);
    }
  }

  async function handleVerify2FA(e) {
    e.preventDefault();
    setError("");

    const cleanCode = String(gaCode || "").trim();

    if (!/^\d{6}$/.test(cleanCode)) {
      setError("Enter the 6-digit Google Authenticator code");
      return;
    }

    setTwoFaLoading(true);

    try {
      const isSetup = twoFaMode === "setup";

      const url = isSetup
        ? `${API_BASE}/api/auth/admin/2fa/verify-setup`
        : `${API_BASE}/api/auth/admin/2fa/verify-login`;

      const payload = isSetup
        ? { setupToken, code: cleanCode }
        : { tempToken, code: cleanCode };

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.message || "Invalid Google Authenticator code");
      }

      if (!data?.token) {
        throw new Error("2FA passed but token missing");
      }

      finishLogin(data);
    } catch (err) {
      setError(err.message || "Google Authenticator verification failed");
    } finally {
      setTwoFaLoading(false);
    }
  }

  function finishLogin(data) {
    localStorage.setItem("auth_token", data.token);
    localStorage.setItem("auth_user", JSON.stringify(data.user));

    closeTwoFa();
    navigate("/dashboard", { replace: true });
  }

  async function copyManualKey() {
    if (!manualKey) return;

    try {
      await navigator.clipboard.writeText(manualKey);
    } catch {
      setError("Copy failed");
    }
  }

  function closeTwoFa() {
    if (twoFaLoading) return;

    setTwoFaOpen(false);
    setTwoFaMode(null);
    setSetupToken("");
    setTempToken("");
    setQrCodeUrl("");
    setManualKey("");
    setGaCode("");
    setSetupLoaded(false);
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
                <Tag
                  icon={<KeyRound className="h-3.5 w-3.5" />}
                  text="GA protected"
                />
                <Tag
                  icon={<Lock className="h-3.5 w-3.5" />}
                  text="JWT secured"
                />
                <Tag
                  icon={<Database className="h-3.5 w-3.5" />}
                  text="MongoDB Atlas"
                />
              </div>

              <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <MiniCard title="Access" value="User + Super Agent + Admin" />
                <MiniCard title="Mode" value="View Only" />
                <div className="sm:col-span-2">
                  <MiniCard title="System" value="Online" />
                </div>
              </div>

              <div className="mt-8 text-xs text-white/40">
                Super agent accounts may require Google Authenticator.
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
                      className="min-h-[50px] w-full rounded-xl border border-black/10 bg-white px-4 text-base text-black outline-none transition focus:border-black/30 focus:ring-4 focus:ring-black/5"
                      autoComplete="username"
                      inputMode="text"
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
                        className="min-h-[50px] w-full rounded-xl border border-black/10 bg-white px-4 pr-24 text-base text-black outline-none transition focus:border-black/30 focus:ring-4 focus:ring-black/5"
                        autoComplete="current-password"
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
                      Super agent accounts will be asked for Google
                      Authenticator.
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="mt-2 min-h-[50px] w-full rounded-xl bg-black px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-black/90 disabled:cursor-not-allowed disabled:opacity-60"
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

      <TwoFactorSidebar
        open={twoFaOpen}
        mode={twoFaMode}
        qrCodeUrl={qrCodeUrl}
        manualKey={manualKey}
        gaCode={gaCode}
        setGaCode={setGaCode}
        loading={twoFaLoading}
        setupLoaded={setupLoaded}
        onClose={closeTwoFa}
        onSubmit={handleVerify2FA}
        onCopyManualKey={copyManualKey}
      />
    </div>
  );
}

function TwoFactorSidebar({
  open,
  mode,
  qrCodeUrl,
  manualKey,
  gaCode,
  setGaCode,
  loading,
  setupLoaded,
  onClose,
  onSubmit,
  onCopyManualKey,
}) {
  const isSetup = mode === "setup";

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-md transition-opacity duration-300 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
      />

      <aside
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-[500px] flex-col border-l border-white/10 bg-[#0B1020] text-white shadow-[0_0_80px_rgba(0,0,0,0.55)] transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="relative overflow-hidden border-b border-white/10 px-5 py-6 sm:px-7">
          <div className="relative z-10 flex items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs text-white/55">
                <Shield className="h-3.5 w-3.5" />
                Two-Factor Authentication
              </div>

              <h2 className="mt-5 text-2xl font-semibold tracking-[-0.03em]">
                {isSetup
                  ? "Set up Google Authenticator"
                  : "Verify Google Authenticator"}
              </h2>

              <p className="mt-2 text-sm leading-6 text-white/50">
                {isSetup
                  ? "Scan the QR code once, then enter the 6-digit code from your app."
                  : "Open Google Authenticator and enter your current 6-digit code."}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-2xl border border-white/10 bg-white/[0.06] p-2.5 text-white/70 transition hover:bg-white/10 disabled:opacity-50"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-6 sm:px-7">
          <div className="rounded-[28px] border border-white/10 bg-white/[0.055] p-5 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#0B1020] shadow-lg">
                {isSetup ? (
                  <ScanLine className="h-5 w-5" />
                ) : (
                  <Smartphone className="h-5 w-5" />
                )}
              </div>

              <div>
                <div className="text-sm font-semibold">
                  {isSetup ? "First-time setup" : "Login verification"}
                </div>
                <div className="text-xs text-white/45">
                  {isSetup ? "Scan once only" : "Code changes every 30 seconds"}
                </div>
              </div>
            </div>

            {isSetup && (
              <div className="mt-6">
                {!setupLoaded || loading ? (
                  <div className="flex h-[280px] items-center justify-center rounded-3xl border border-white/10 bg-black/20">
                    <div className="text-center">
                      <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                      <div className="mt-4 text-sm text-white/55">
                        Creating secure QR...
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="rounded-3xl bg-white p-5 shadow-xl">
                      {qrCodeUrl ? (
                        <img
                          src={qrCodeUrl}
                          alt="Google Authenticator QR Code"
                          className="mx-auto h-[230px] w-[230px]"
                        />
                      ) : (
                        <div className="flex h-[230px] items-center justify-center text-sm text-black/50">
                          QR code not available
                        </div>
                      )}
                    </div>

                    <div className="mt-5 rounded-3xl border border-white/10 bg-black/20 p-4">
                      <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/35">
                        Manual setup key
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="min-w-0 flex-1 break-all rounded-2xl bg-white/[0.06] px-3 py-3 font-mono text-xs text-white/75">
                          {manualKey || "No manual key"}
                        </div>

                        <button
                          type="button"
                          onClick={onCopyManualKey}
                          className="rounded-2xl border border-white/10 bg-white/[0.06] p-3 text-white/70 transition hover:bg-white/10"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="mt-3 text-xs leading-6 text-white/45">
                        If scanning does not work, open Google Authenticator,
                        choose manual entry, and paste this key.
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {!isSetup && (
              <div className="mt-6 rounded-3xl border border-emerald-300/15 bg-emerald-300/10 p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-white">
                  <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                  Authenticator already connected
                </div>

                <p className="mt-2 text-xs leading-6 text-white/45">
                  No need to scan again. Use the current 6-digit code from your
                  Google Authenticator app.
                </p>
              </div>
            )}

            <form onSubmit={onSubmit} className="mt-6">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
                6-digit code
              </label>

              <input
                value={gaCode}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                  setGaCode(value);
                }}
                placeholder="000000"
                inputMode="numeric"
                autoComplete="one-time-code"
                className="min-h-[64px] w-full rounded-3xl border border-white/10 bg-white px-4 text-center text-2xl font-bold tracking-[0.35em] text-[#0B1020] shadow-lg outline-none transition placeholder:text-slate-300 focus:border-black/30 focus:ring-4 focus:ring-white/10"
              />

              <button
                type="submit"
                disabled={loading || gaCode.length !== 6}
                className="mt-5 flex min-h-[58px] w-full items-center justify-center rounded-3xl bg-white px-4 text-sm font-bold uppercase tracking-[0.14em] text-[#0B1020] shadow-[0_20px_50px_rgba(255,255,255,0.12)] transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading
                  ? "Verifying..."
                  : isSetup
                    ? "Verify & Enable Authenticator"
                    : "Verify & Enter Dashboard"}
              </button>
            </form>
          </div>
        </div>
      </aside>
    </>
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
