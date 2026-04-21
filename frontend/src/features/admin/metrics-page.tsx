import {
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  BarChart,
  Bar,
  Cell,
  CartesianGrid,
} from 'recharts'
import { useAdminStore } from '../../store/admin-store'

export function MetricsPage() {
  const rateColors = ['#f97316', '#6366f1']
  const { metrics, metricsLoading, metricsError, fetchMetrics } = useAdminStore()

  if (!metrics && !metricsLoading && !metricsError) {
    void fetchMetrics()
  }

  const qualitySnapshot =
    metrics &&
    [
      { name: 'Avg latency (ms)', value: +metrics.avg_latency_ms.toFixed(2) },
      { name: 'Open unresolved', value: metrics.unresolved_open },
      { name: 'Total requests', value: metrics.total_questions },
    ]

  const rateData =
    metrics &&
    [
      { name: 'Error', value: +(metrics.error_rate * 100).toFixed(2) },
      { name: 'Unresolved', value: +(metrics.unresolved_rate * 100).toFixed(2) },
    ]

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Metrics</p>
        <h2 className="text-2xl font-semibold">System telemetry</h2>
        <p className="mt-1 text-sm text-slate-400">
          Track latency, volume, and error ratios for the financial assistant.
        </p>
      </div>

      {metricsLoading && (
        <div className="glass-card h-40 animate-pulse p-4 text-sm text-slate-400">
          Loading metrics...
        </div>
      )}

      {metricsError && !metricsLoading && (
        <div className="glass-card p-4 text-sm text-rose-300">
          Could not load metrics. Try refreshing or check backend availability.
        </div>
      )}

      {metrics && (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="glass-card p-4">
              <p className="text-xs text-slate-400">Total requests</p>
              <p className="mt-2 text-2xl font-semibold">{metrics.total_questions}</p>
            </div>
            <div className="glass-card p-4">
              <p className="text-xs text-slate-400">Error rate</p>
              <p className="mt-2 text-2xl font-semibold">
                {(metrics.error_rate * 100).toFixed(2)}%
              </p>
            </div>
            <div className="glass-card p-4">
              <p className="text-xs text-slate-400">Unresolved rate</p>
              <p className="mt-2 text-2xl font-semibold">
                {(metrics.unresolved_rate * 100).toFixed(2)}%
              </p>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="glass-card p-4">
              <h3 className="mb-3 text-sm font-medium text-slate-100">
                Operational snapshot
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={qualitySnapshot ?? []}>
                    <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
                    <XAxis dataKey="name" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip />
                    <Bar dataKey="value" fill="#6366f1" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="glass-card p-4">
              <h3 className="mb-3 text-sm font-medium text-slate-100">Rates (%)</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={rateData ?? []}>
                    <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
                    <XAxis dataKey="name" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip
                      cursor={{ fill: 'transparent' }}
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        border: '1px solid #334155',
                        borderRadius: '10px',
                        color: '#e2e8f0',
                      }}
                      labelStyle={{ color: '#cbd5e1', fontWeight: 600 }}
                      itemStyle={{ color: '#e2e8f0' }}
                    />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                      {(rateData ?? []).map((entry, index) => (
                        <Cell key={entry.name} fill={rateColors[index % rateColors.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

