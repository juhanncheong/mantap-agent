import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Shell from "../components/Shell";

const API_BASE =
  import.meta.env.VITE_API_URL ||
  "https://closed-deirdre-jayjay122-a04beb79.koyeb.app";

const REFERRAL_ENDPOINT = "/api/agent/referral-users";

function formatDate(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString();
}

export default function ReferralUsers() {
  const navigate = useNavigate();

  const [me, setMe] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [q, setQ] = useState("");
  const [refFilter, setRefFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  function getAuthHeaders() {
    const token =
      localStorage.getItem("auth_token") ||
      localStorage.getItem("agent_token");

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

    let data;
    try {
      data = await res.json();
    } catch {
      throw new Error("Server returned non-JSON response.");
    }

    if (!res.ok) {
      const msg = data?.message || `Request failed (${res.status})`;

      if (res.status === 401) {
        localStorage.removeItem("auth_token");
        localStorage.removeItem("agent_token");
        localStorage.removeItem("auth_user");
        navigate("/", { replace: true });
      }

      throw new Error(msg);
    }

    return data;
  }

  async function loadUsers() {
    setLoading(true);
    setError("");

    try {
      const data = await fetchJSON(`${API_BASE}${REFERRAL_ENDPOINT}`);
      setMe(data?.me || null);
      setRows(Array.isArray(data?.users) ? data.users : []);
    } catch (e) {
      setMe(null);
      setRows([]);
      setError(e.message || "Failed to load referral users");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalUsers = rows.length;

  const filteredRows = useMemo(() => {
    const qq = q.trim().toLowerCase();

    let list = rows.filter((u) => {
      const referredByPhone = String(u?.referredBy?.phoneNumber || "").toLowerCase();
      const phone = String(u?.phoneNumber || "").toLowerCase();
      const uid = String(u?.uid || "").toLowerCase();
      const referralCode = String(u?.referralCode || "").toLowerCase();

      const matchesSearch =
        !qq ||
        phone.includes(qq) ||
        uid.includes(qq) ||
        referralCode.includes(qq) ||
        referredByPhone.includes(qq);

      const hasReferrer = Boolean(u?.referredBy?._id);

      const matchesFilter =
        refFilter === "all"
          ? true
          : refFilter === "hasReferrer"
          ? hasReferrer
          : !hasReferrer;

      return matchesSearch && matchesFilter;
    });

    list.sort((a, b) => {
      const aTime = new Date(a?.createdAt || 0).getTime();
      const bTime = new Date(b?.createdAt || 0).getTime();

      if (sortBy === "oldest") return aTime - bTime;
      return bTime - aTime;
    });

    return list;
  }, [rows, q, refFilter, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));

  useEffect(() => {
    setPage(1);
  }, [q, refFilter, sortBy]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const paginatedRows = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredRows.slice(start, start + PAGE_SIZE);
  }, [filteredRows, page]);

  const startItem = filteredRows.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const endItem = Math.min(page * PAGE_SIZE, filteredRows.length);

  return (
    <Shell title="Referral Users">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-sm font-semibold text-white">Referral Users</div>
          <div className="text-xs text-white/50">
            View your invitation code and your referred users' invitation codes
          </div>
        </div>

        <div className="flex flex-col gap-2 md:flex-row md:items-center">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search phone / UID / referral code / referred by..."
            className="w-full md:w-72 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/90 placeholder:text-white/30 outline-none focus:border-white/20"
          />

          <select
            value={refFilter}
            onChange={(e) => setRefFilter(e.target.value)}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/90 outline-none hover:bg-white/10"
          >
            <option value="all">All users</option>
            <option value="hasReferrer">Has referrer</option>
            <option value="noReferrer">No referrer</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/90 outline-none hover:bg-white/10"
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
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

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="text-xs text-white/50">My Invitation Code</div>
          <div className="mt-2 font-mono text-2xl font-semibold text-white">
            {me?.referralCode || "-"}
          </div>
          <div className="mt-2 text-xs text-white/50">
            Phone: {me?.phoneNumber || "-"}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="text-xs text-white/50">My Referred Users</div>
          <div className="mt-2 text-2xl font-semibold text-white">{totalUsers}</div>
          <div className="mt-2 text-xs text-white/50">
            Only users registered under your invitation code are shown
          </div>
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-white/10">
        <div className="bg-white/5 px-4 py-3 text-sm font-semibold">
          Referral Users ({filteredRows.length})
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/5 text-xs text-white/60">
              <tr>
                <th className="px-4 py-3">Phone Number</th>
                <th className="px-4 py-3">User ID</th>
                <th className="px-4 py-3">Invitation Code</th>
                <th className="px-4 py-3">Referred By</th>
                <th className="px-4 py-3">Referral Count</th>
                <th className="px-4 py-3">Created Date</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-white/10">
              {loading ? (
                <tr>
                  <td className="px-4 py-5 text-white/60" colSpan={6}>
                    Loading users...
                  </td>
                </tr>
              ) : paginatedRows.length === 0 ? (
                <tr>
                  <td className="px-4 py-5 text-white/60" colSpan={6}>
                    No referred users found.
                  </td>
                </tr>
              ) : (
                paginatedRows.map((u) => (
                  <tr key={u._id} className="hover:bg-white/5">
                    <td className="px-4 py-3">
                      <div className="font-mono text-xs text-white">
                        {u.phoneNumber || "-"}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="font-mono text-xs text-white/80">
                        {u.uid || u._id || "-"}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="font-mono text-xs text-white">
                        {u.referralCode || "-"}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="text-xs text-white/80">
                        {u?.referredBy?.phoneNumber || me?.phoneNumber || "-"}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-full bg-blue-500/15 px-2 py-1 text-xs text-blue-200">
                        {Number(u.referralCount || 0)}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-xs text-white/70">
                      {formatDate(u.createdAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-white/10 bg-white/5 px-4 py-3 md:flex-row md:items-center md:justify-between">
          <div className="text-xs text-white/50">
            Showing {startItem}-{endItem} of {filteredRows.length}
          </div>

          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/80 hover:bg-white/10 disabled:opacity-40"
            >
              Prev
            </button>

            <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/80">
              Page {page} / {totalPages}
            </div>

            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/80 hover:bg-white/10 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </Shell>
  );
}