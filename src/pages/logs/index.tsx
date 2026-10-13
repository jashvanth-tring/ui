import { useEffect, useState, useCallback } from 'react';
import { fetchLogs, fetchLogDates, LogRecord, LogsQuery } from '../../store/services/logs';
import { getAllUsers } from '../../store/services/users';
import { User } from '../../store/model';
import { getUserNameEmail } from '../../utils/user-name';
import { LayoutContainer } from '../../styles/LayoutContainer';
import { Card, CardContent } from '../../components/ui/card';

const LEVELS = ['', 'fatal', 'error', 'warn', 'info', 'debug'];
const LEVEL_STYLES: Record<string, string> = {
  fatal: 'bg-red-100 text-red-800 border border-red-200',
  error: 'bg-red-50 text-red-700 border border-red-200',
  warn:  'bg-amber-50 text-amber-700 border border-amber-200',
  info:  'bg-blue-50 text-blue-700 border border-blue-200',
  debug: 'bg-gray-100 text-gray-600 border border-gray-200',
};

const PAGE_SIZE = 50;

export default function LogsPage() {
  const [logs, setLogs]         = useState<LogRecord[]>([]);
  const [total, setTotal]       = useState(0);
  const [hasMore, setHasMore]   = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [users, setUsers]       = useState<User[]>([]);
  const [dates, setDates]       = useState<string[]>([]);
  const [offset, setOffset]     = useState(0);
  const [expanded, setExpanded] = useState<number | null>(null);

  const [query, setQuery] = useState<LogsQuery>({
    level: '', userId: undefined, search: '',
    startDate: '', endDate: '',
    sort: 'timestamp', order: 'desc',
    limit: PAGE_SIZE, offset: 0,
  });

  useEffect(() => {
    fetchLogDates().then(setDates).catch(() => {});
    getAllUsers()
      .then(res => setUsers(Array.isArray(res.data) ? res.data : res.data?.data ?? []))
      .catch(() => {});
  }, []);

  const load = useCallback(async (q: LogsQuery, newOffset: number) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetchLogs({ ...q, offset: newOffset, limit: PAGE_SIZE });
      const seen = new Set<string>();
      const dedupedLogs = res.data.filter((entry: LogRecord) => {
      const key = `${(entry as any).queryId ?? ''}::${entry.timestamp}::${entry.message}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      setLogs(dedupedLogs);
      setTotal(res.total);
      setHasMore(res.hasMore);
      setOffset(newOffset);
    } catch {
      setError('Failed to fetch logs. Make sure you have admin access.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(query, 0); }, []);

  const handleSearch = () => { load(query, 0); };

  const handleReset = () => {
    const reset: LogsQuery = {
      level: '', userId: undefined, search: '',
      startDate: '', endDate: '',
      sort: 'timestamp', order: 'desc',
      limit: PAGE_SIZE, offset: 0,
    };
    setQuery(reset);
    load(reset, 0);
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1;

  return (
    <LayoutContainer>
      <div className="space-y-6">
        <div>
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Logs</h1>
            <button
              onClick={() => load(query, offset)}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
        </div>
            

       <Card className="overflow-hidden border border-slate-200 shadow-sm">
      <CardContent className="p-5">
        <div className="flex flex-wrap items-end gap-3">

          {/* Search */}
          <div className="min-w-[280px] flex-1">
            <label className="mb-1 block text-xs font-medium text-slate-500">
              Search
            </label>

            <input
              type="text"
              placeholder="Search logs..."
              value={query.search}
              onChange={e =>
                setQuery(q => ({ ...q, search: e.target.value }))
              }
              onKeyDown={e =>
                e.key === 'Enter' && handleSearch()
              }
              className=" w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Level */}
          <div className="w-40">
            <label className="mb-1 block text-xs font-medium text-slate-500">
              Level
            </label>

            <select
              value={query.level}
              onChange={e =>
                setQuery(q => ({ ...q, level: e.target.value }))
              }
              className=" w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              <option value="">All</option>

              {LEVELS.filter(Boolean).map(l => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>

          {/* User */}
          <div className="w-48">
            <label className="mb-1 block text-xs font-medium text-slate-500">
              User
            </label>

            <select
              value={query.userId ?? ''}
              onChange={e =>
                setQuery(q => ({
                  ...q,
                  userId: e.target.value
                    ? Number(e.target.value)
                    : undefined,
                }))
              }
              className="
                w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                >
              <option value="">All Users</option>

              {users.map(user => (
                <option
                  key={user.id}
                  value={user.id ?? ''}
                >
                  {getUserNameEmail(user)}
                </option>
              ))}
            </select>
          </div>

          {/* Start Date */}
          <div className="w-40">
            <label className="mb-1 block text-xs font-medium text-slate-500">
              Start
            </label>

            <select
              value={query.startDate}
              onChange={e =>
                setQuery(q => ({
                  ...q,
                  startDate: e.target.value,
                }))
              }
              className="
                w-full
                rounded-lg
                border border-slate-200
                px-3 py-2
                text-sm
              "
            >
              <option value="">Any</option>

              {dates.map(d => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* End Date */}
          <div className="w-40">
            <label className="mb-1 block text-xs font-medium text-slate-500">
              End
            </label>

            <select
              value={query.endDate}
              onChange={e =>
                setQuery(q => ({
                  ...q,
                  endDate: e.target.value,
                }))
              }
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              <option value="">Any</option>

              {dates.map(d => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Order */}
          <div className="w-40">
            <label className="mb-1 block text-xs font-medium text-slate-500">
              Order
            </label>

            <select
              value={query.order}
              onChange={e =>
                setQuery(q => ({
                  ...q,
                  order: e.target.value as 'asc' | 'desc',
                }))
              }
              className=" w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              <option value="desc">Newest</option>
              <option value="asc">Oldest</option>
            </select>
          </div>

          {/* Buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleSearch}
              className="rounded-lg bg-[var(--brand)] px-4 py-2 text-sm font-medium text-white "
            >
              Apply
            </button>

            <button
              onClick={handleReset} className=" rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 " >
              Reset
            </button>
          </div>

        </div>
      </CardContent>
    </Card>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Table */}
      <div className=" bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400 text-sm gap-2">
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            Loading logs...
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 text-sm gap-2">
            <svg className="w-8 h-8 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            No log records found
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10">
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500 ">
                <th className="text-left px-4 py-3 w-44">Timestamp</th>
                <th className="text-left px-4 py-3 w-20">Level</th>
                <th className="text-left px-4 py-3">Message</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {logs.map((log, idx) => (
                <>
                  <tr
                    key={idx}
                    onClick={() => setExpanded(expanded === idx ? null : idx)}
                    className={`cursor-pointer hover:bg-slate-50 transition-all border-l-4
                              ${
                                log.level === 'error'
                                  ? 'border-red-500'
                                  : log.level === 'warn'
                                  ? 'border-amber-500'
                                  : log.level === 'info'
                                  ? 'border-blue-500'
                                  : 'border-slate-300'
                              }
                      `}>
                    <td className="px-4 py-3 text-xs font-mono text-slate-500 whitespace-nowrap">
                      {log.timestamp?.replace('T', ' ').replace(/\..+$/, '') ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold shadow-sm ${LEVEL_STYLES[log.level] ?? 'bg-gray-100 text-gray-600'}`} >{log.level ?? '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700 truncate max-w-xs">
                      {log.message}
                    </td>
                  </tr>
                  {expanded === idx && (
                    <tr key={`${idx}-expanded`} className="bg-slate-50">
                      <td colSpan={3} className="px-4 py-3">
                        <pre className=" text-xs font-mono whitespace-pre-wrap break-all bg-slate-900 text-green-400 rounded-xl p-4 max-h-80 overflow-y-auto">
                          {JSON.stringify(log, null, 2)}
                        </pre>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {total > 0 && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>
            Showing {offset + 1}–{Math.min(offset + PAGE_SIZE, total)} of {total.toLocaleString()}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => load(query, 0)}
              disabled={currentPage === 1}
              className="px-2 py-1 rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >«</button>
            <button
              onClick={() => load(query, offset - PAGE_SIZE)}
              disabled={currentPage === 1}
              className="px-2 py-1 rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >‹</button>
            <span className="px-3 py-1 text-sm">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => load(query, offset + PAGE_SIZE)}
              disabled={!hasMore}
              className="px-2 py-1 rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >›</button>
            <button
              onClick={() => load(query, (totalPages - 1) * PAGE_SIZE)}
              disabled={!hasMore}
              className="px-2 py-1 rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >»</button>
          </div>
        </div>
      )}
    </div>
  </LayoutContainer>
  );
}