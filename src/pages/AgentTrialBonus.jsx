import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Shell from "../components/Shell";

const API_BASE =
  import.meta.env.VITE_API_URL ||
  "https://closed-deirdre-jayjay122-a04beb79.koyeb.app";

const TRIAL_USERS_ENDPOINT = "/api/agent/trial-users";
const TRIAL_SUMMARY_ENDPOINT = "/api/agent/users";

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

function classNames(...xs) {
  return xs.filter(Boolean).join(" ");
}

export default function AgentTrialBonus() {
  const navigate = useNavigate();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");

  const [q, setQ] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

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
        "Content-Type": "application/json",
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

  async function loadRows(nextPage = page, nextQ = q, nextPageSize = pageSize) {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();
      params.set("page", String(nextPage));
      params.set("limit", String(nextPageSize));

      const cleanQ = String(nextQ || "").trim();
      if (cleanQ) params.set("q", cleanQ);

      const data = await fetchJSON(
        `${API_BASE}${TRIAL_USERS_ENDPOINT}?${params.toString()}`
      );

      const list = Array.isArray(data?.rows) ? data.rows : [];
      const pg = data?.pagination || {};

      setRows(list);
      setPage(Number(pg.page || nextPage || 1));
      setPageSize(Number(pg.limit || nextPageSize || 10));
      setTotal(Number(pg.total || 0));
      setTotalPages(Number(pg.totalPages || 1));
    } catch (e) {
      setRows([]);
      setError(e.message || "Failed to load trial users");
    } finally {
      setLoading(false);
    }
  }

  async function refreshRow(userId) {
    setBusyId(userId);
    setError("");

    try {
      const data = await fetchJSON(
        `${API_BASE}${TRIAL_SUMMARY_ENDPOINT}/${userId}/trial-summary`
      );

      setRows((prev) =>
        prev.map((row) =>
          row.userId === userId
            ? {
                ...row,
                credited: safeNum(data?.credited),
                reversed: safeNum(data?.reversed),
                remaining: safeNum(data?.remaining),
                lastCreditAt: data?.lastCreditAt || null,
                lastReversalAt: data?.lastReversalAt || null,
                hasTrial: Boolean(data?.hasTrial),
                isFullyRevoked: Boolean(data?.isFullyRevoked),
              }
            : row
        )
      );
    } catch (e) {
      setError(e.message || "Failed to refresh row");
    } finally {
      setBusyId(null);
    }
  }

  useEffect(() => {
    loadRows(1, "", 10);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      setQ(searchInput.trim());
    }, 400);

    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    loadRows(page, q, pageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, q, pageSize]);

  const pageInfo = useMemo(() => {
    if (total === 0) {
      return { from: 0, to: 0 };
    }

    return {
      from: (page - 1) * pageSize + 1,
      to: Math.min(page * pageSize, total),
    };
  }, [page, pageSize, total]);

  function getStatus(row) {
    if (!row?.hasTrial) return "None";
    if (row?.isFullyRevoked) return "Revoked";
    return "Active";
  }

  function getStatusClass(status) {
    if (status === "Active") {
      return "border border-emerald-500/20 bg-emerald-500/10 text-emerald-200";
    }
    if (status === "Revoked") {
      return "border border-red-500/20 bg-red-500/10 text-red-200";
    }
    return "border border-white/10 bg-white/5 text-white/60";
  }

  return (
    <Shell title="Trial Bonus">
      <div className="mx-auto w-full max-w-7xl px-4 py-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-xl font-semibold text-white">
              Trial Bonus Overview
            </div>
            <div className="mt-1 text-sm text-white/50">
              View trial bonus records for your referred users only
            </div>
          </div>

          <div className="flex w-full flex-col gap-2 md:w-[420px]">
            <label className="text-xs text-white/60">
              Search by UID / phone
            </label>
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-white/20"
              placeholder="Search UID / phone..."
            />
          </div>
        </div>

        {error ? (
          <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-200">
            {error}
          </div>
        ) : null}

        <div className="mt-5 overflow-hidden rounded-3xl border border-white/10 bg-white/5">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <div className="text-sm text-white/70">
              {loading ? "Loading..." : `${total} total referred trial users`}
            </div>

            <button
              disabled={loading}
              onClick={() => loadRows(page, q, pageSize)}
              className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70 hover:bg-white/10 disabled:opacity-50"
            >
              Refresh
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[1246px] text-left text-sm">
              <thead className="bg-white/5 text-xs text-white/60">
                <tr>
                  <th className="px-4 py-3">UID</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Trial Status</th>
                  <th className="px-4 py-3">Credited</th>
                  <th className="px-4 py-3">Reversed</th>
                  <th className="px-4 py-3">Remaining</th>
                  <th className="px-4 py-3">Last Credit</th>
                  <th className="px-4 py-3">Last Reversal</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/10">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-10 text-center text-white/50">
                      Loading trial users...
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-10 text-center text-white/50">
                      No referred trial users found.
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => {
                    const isBusy = busyId === row.userId;
                    const status = getStatus(row);

                    return (
                      <tr key={row.userId} className="hover:bg-white/5">
                        <td className="px-4 py-3 text-white">
                          {row.uid || "-"}
                        </td>

                        <td className="px-4 py-3 text-white/70">
                          {row.phoneNumber || "-"}
                        </td>

                        <td className="px-4 py-3">
                          <span
                            className={classNames(
                              "rounded-xl px-2 py-1 text-xs",
                              getStatusClass(status)
                            )}
                          >
                            {status}
                          </span>
                        </td>

                        <td className="px-4 py-3 text-white/70">
                          {safeNum(row.credited).toFixed(2)}
                        </td>

                        <td className="px-4 py-3 text-white/70">
                          {safeNum(row.reversed).toFixed(2)}
                        </td>

                        <td className="px-4 py-3 text-white">
                          {safeNum(row.remaining).toFixed(2)}
                        </td>

                        <td className="px-4 py-3 text-white/50">
                          {formatDate(row.lastCreditAt)}
                        </td>

                        <td className="px-4 py-3 text-white/50">
                          {formatDate(row.lastReversalAt)}
                        </td>

                        <td className="px-4 py-3">
                          <div className="flex justify-end">
                            <button
                              disabled={isBusy}
                              onClick={() => refreshRow(row.userId)}
                              className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70 hover:bg-white/10 disabled:opacity-50"
                            >
                              {isBusy ? "Refreshing..." : "Refresh Row"}
                            </button>
                          </div>
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
              Showing {pageInfo.from} to {pageInfo.to} of {total} rows
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="flex items-center gap-2">
                <span className="text-xs text-white/50">Per page</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPage(1);
                    setPageSize(Number(e.target.value));
                  }}
                  className="appearance-none rounded-xl border border-white/10 bg-[#111827] px-3 py-2 text-xs text-white/90 outline-none hover:bg-[#182236]"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1 || loading}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70 hover:bg-white/10 disabled:opacity-50"
                >
                  Prev
                </button>

                <div className="text-xs text-white/70">
                  Page {page} / {Math.max(1, totalPages)}
                </div>

                <button
                  disabled={page >= totalPages || loading}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70 hover:bg-white/10 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Shell>
  );
}