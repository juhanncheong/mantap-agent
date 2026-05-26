import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Shell from "../components/Shell";

const API_BASE =
  import.meta.env.VITE_API_URL ||
  "https://closed-deirdre-jayjay122-a04beb79.koyeb.app";

const USERS_ENDPOINT = "/api/agent/users";

function formatDate(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString();
}

function safeNum(x) {
  const n = Number(x);
  return Number.isFinite(n) ? n : 0;
}

export default function AgentUsers() {
  const navigate = useNavigate();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

  function getAuthHeaders() {
    const token =
      localStorage.getItem("agent_token") ||
      localStorage.getItem("auth_token");

    if (!token) return null;

    return { Authorization: `Bearer ${token}` };
  }

  async function fetchJSON(url, options = {}) {
    const auth = getAuthHeaders();

    if (!auth) {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("agent_token");
      localStorage.removeItem("auth_user");
      navigate("/", { replace: true });
      throw new Error("Please login again.");
    }

    const res = await fetch(url, {
      ...options,
      headers: {
        ...(options.headers || {}),
        ...auth,
      },
    });

    let data = {};
    try {
      data = await res.json();
    } catch {
      throw new Error("Server returned non-JSON response.");
    }

    if (!res.ok) {
      if (res.status === 401) {
        localStorage.removeItem("auth_token");
        localStorage.removeItem("agent_token");
        localStorage.removeItem("auth_user");
        navigate("/", { replace: true });
      }

      throw new Error(data?.message || `Request failed (${res.status})`);
    }

    return data;
  }

  async function loadUsers() {
    setLoading(true);
    setError("");

    try {
      const data = await fetchJSON(`${API_BASE}${USERS_ENDPOINT}`);

      setRows(Array.isArray(data?.users) ? data.users : []);
    } catch (e) {
      setRows([]);
      setError(e.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();

    return rows.filter((u) => {
      const matchesQuery =
        !qq ||
        String(u.phoneNumber || "").toLowerCase().includes(qq) ||
        String(u.uid || "").toLowerCase().includes(qq) ||
        String(u._id || "").toLowerCase().includes(qq) ||
        String(u.registeredIp || "").toLowerCase().includes(qq) ||
        String(u?.referredBy?.phoneNumber || "").toLowerCase().includes(qq) ||
        String(u.registeredCountry || "").toLowerCase().includes(qq);

      const matchesRole =
        roleFilter === "all" ? true : String(u.role || "") === roleFilter;

      return matchesQuery && matchesRole;
    });
  }, [rows, q, roleFilter]);

  useEffect(() => {
    setPage(1);
  }, [q, roleFilter, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const paginatedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  return (
    <Shell title="Agent User List">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="text-xs text-white/50">
          View referred users, balances, activity, and status (read only)
        </div>

        <div className="flex flex-col gap-2 md:flex-row md:items-center">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search phone / UID / userId / IP / country / referrer..."
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/90 placeholder:text-white/30 outline-none focus:border-white/20 md:w-80"
          />

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="appearance-none rounded-xl border border-white/10 bg-[#111827] px-3 py-2 text-xs text-white/90 outline-none hover:bg-[#182236] focus:border-white/20"
          >
            <option value="all" className="bg-[#111827] text-white">
              All roles
            </option>
            <option value="user" className="bg-[#111827] text-white">
              user
            </option>
            <option value="admin" className="bg-[#111827] text-white">
              admin
            </option>
            <option value="agent" className="bg-[#111827] text-white">
              agent
            </option>
          </select>

          <button
            disabled={loading}
            onClick={loadUsers}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70 hover:bg-white/10 disabled:opacity-50"
          >
            Refresh
          </button>
        </div>
      </div>

      {error ? (
        <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-200">
          {error}
        </div>
      ) : null}

      <div className="mt-4 overflow-hidden rounded-2xl border border-white/10">
        <div className="bg-white/5 px-4 py-3 text-sm font-semibold">
          Users ({filtered.length})
        </div>

        <div className="users-table-scroll overflow-x-auto">
          <table className="min-w-[1800px] text-left text-sm">
            <thead className="bg-white/5 text-xs text-white/60">
              <tr>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">User ID</th>
                <th className="px-4 py-3">Referrer</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Pending</th>
                <th className="px-4 py-3">Balance</th>
                <th className="px-4 py-3">Orders</th>
                <th className="px-4 py-3">Rounds</th>
                <th className="px-4 py-3">VIP</th>
                <th className="px-4 py-3">Country</th>
                <th className="px-4 py-3">Registered IP</th>
                <th className="px-4 py-3">Last Online</th>
                <th className="px-4 py-3">Created</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-white/10">
              {loading ? (
                <tr>
                  <td className="px-4 py-5 text-white/60" colSpan={13}>
                    Loading users...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td className="px-4 py-5 text-white/60" colSpan={13}>
                    No referred users found.
                  </td>
                </tr>
              ) : (
                paginatedRows.map((u) => {
                  return (
                    <tr key={u._id} className="hover:bg-white/5">
                      <td className="px-4 py-3">
                        <div className="  text-xs text-white">
                          {u.phoneNumber || "-"}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="  text-xs text-white/75">
                          {u.uid || u._id || "-"}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <div
                          className="max-w-[140px] truncate text-xs text-white/80"
                          title={u?.referredBy?.phoneNumber || "-"}
                        >
                          {u?.referredBy?.phoneNumber || "-"}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] text-white/80">
                          {u.role || "-"}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <div className="  text-xs text-amber-200">
                          {safeNum(u.pendingAmount).toFixed(2)}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="  text-xs text-white/90">
                          {safeNum(u.displayBalance ?? u.balance).toFixed(2)}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="  text-xs text-white/90">
                          {safeNum(u.ordersCompleted)}/
                          {Number.isFinite(Number(u.ordersLimit))
                            ? Number(u.ordersLimit)
                            : 40}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="  text-xs text-white/90">
                          {safeNum(u.totalResetCount || 1)}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="  text-xs text-white/90">
                          Rank {safeNum(u.vipRank || 1)}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        {u.registeredCountry ? (
                          <div
                            className="flex items-center gap-2 text-xs text-white/80"
                            title={u.registeredCountry}
                          >
                            <img
                              src={`https://flagcdn.com/24x18/${String(
                                u.registeredCountry
                              ).toLowerCase()}.png`}
                              alt={String(u.registeredCountry).toUpperCase()}
                              className="h-[14px] w-[18px] rounded-[2px] object-cover"
                              loading="lazy"
                            />
                            <span>
                              {String(u.registeredCountry).toUpperCase()}
                            </span>
                          </div>
                        ) : (
                          <div className="text-xs text-white/70">-</div>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        <div
                          className="max-w-[180px] truncate   text-xs text-white/70"
                          title={u.registeredIp || "-"}
                        >
                          {u.registeredIp || "-"}
                        </div>
                      </td>

                      <td className="px-4 py-3 text-xs text-white/70">
                        {formatDate(u.lastOnlineAt)}
                      </td>

                      <td className="px-4 py-3 text-xs text-white/70">
                        {formatDate(u.createdAt)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-white/10 bg-white/5 px-4 py-3 md:flex-row md:items-center md:justify-between">
          <div className="text-xs text-white/50">
            Showing {filtered.length === 0 ? 0 : (page - 1) * pageSize + 1} to{" "}
            {Math.min(page * pageSize, filtered.length)} of {filtered.length} users
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2">
              <span className="text-xs text-white/50">Per page</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="appearance-none rounded-xl border border-white/10 bg-[#111827] px-3 py-2 text-xs text-white/90 outline-none hover:bg-[#182236] focus:border-white/20"
              >
                <option value={10} className="bg-[#111827] text-white">
                  10
                </option>
                <option value={20} className="bg-[#111827] text-white">
                  20
                </option>
                <option value={100} className="bg-[#111827] text-white">
                  100
                </option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70 hover:bg-white/10 disabled:opacity-40"
              >
                Prev
              </button>

              <div className="text-xs text-white/70">
                Page {page} / {totalPages}
              </div>

              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70 hover:bg-white/10 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </Shell>
  );
}