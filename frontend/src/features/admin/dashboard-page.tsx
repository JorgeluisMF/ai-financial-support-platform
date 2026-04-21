import {
  Bar,
  BarChart,
  Cell,
  CartesianGrid,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { useAdminStore } from '../../store/admin-store'

export function DashboardPage() {
  const rateColors = ['#6366f1', '#f97316']
  const pieColors = ['#22c55e', '#f59e0b']
  const { metrics, metricsLoading, metricsError, fetchMetrics } = useAdminStore()

  if (!metrics && !metricsLoading && !metricsError) {
    void fetchMetrics()
  }

  if (metricsLoading) {
    return (
      <div className="space-y-4">
        <div className="h-6 w-40 animate-pulse rounded bg-slate-800" />
        <div className="grid gap-3 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="glass-card h-24 animate-pulse" />
          ))}
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          <div className="glass-card h-72 animate-pulse" />
          <div className="glass-card h-72 animate-pulse" />
        </div>
      </div>
    )
  }

  if (!metrics || metricsError) {
    return (
      <div className="glass-card p-6 text-sm text-rose-300">
        Could not load operational metrics. Verify the user has admin role and backend is available.
      </div>
    )
  }

  const data = metrics
  const kpis = [
    { label: 'Total questions', value: data.total_questions },
    { label: 'Open unresolved', value: data.unresolved_open },
    { label: 'Average latency (ms)', value: Math.round(data.avg_latency_ms) },
  ]

  const barData = [
    { name: 'Error Rate', value: +(data.error_rate * 100).toFixed(2) },
    { name: 'Unresolved Rate', value: +(data.unresolved_rate * 100).toFixed(2) },
  ]
  const pieData = [
    { name: 'Resolved', value: Math.max(data.total_questions - data.unresolved_open, 0) },
    { name: 'Open', value: data.unresolved_open },
  ]

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Control panel
          </p>
          <h2 className="text-2xl font-semibold">Assistant status</h2>
        </div>
        <button
          type="button"
          onClick={() => {
            void fetchMetrics()
          }}
          className="text-xs text-slate-400 underline-offset-2 hover:underline"
        >
          Refresh
        </button>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {kpis.map((item) => (
          <div key={item.label} className="glass-card p-4">
            <p className="text-sm text-slate-400">{item.label}</p>
            <p className="mt-2 text-3xl font-semibold">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="glass-card p-4">
          <h3 className="mb-4 text-lg font-medium">Rates (%)</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
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
                  {barData.map((entry, index) => (
                    <Cell key={entry.name} fill={rateColors[index % rateColors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="glass-card p-4">
          <h3 className="mb-4 text-lg font-medium">Backlog status</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={90}
                  stroke="#0f172a"
                  strokeWidth={2}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={entry.name} fill={pieColors[index % pieColors.length]} />
                  ))}
                </Pie>
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  wrapperStyle={{ color: '#cbd5e1', fontSize: '12px' }}
                />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}
