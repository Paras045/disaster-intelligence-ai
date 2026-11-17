import { useEffect, useState } from 'react'
import {
  Activity,
  AlertTriangle,
  Bell,
  CloudRain,
  Droplets,
  LayoutDashboard,
  Map,
  Menu,
  Radio,
  Settings,
  ShieldAlert,
  Waves,
} from 'lucide-react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import RainfallAnalysis from './RainfallAnalysis'
import RiverMonitoring from './RiverMonitoring'
import StationMap from './StationMap'
import './App.css'

const navigationItems = [
  { name: 'Overview', icon: LayoutDashboard },
  { name: 'Risk Map', icon: Map },
  { name: 'Rainfall Analysis', icon: CloudRain },
  { name: 'River Monitoring', icon: Waves },
  { name: 'Alerts & Warnings', icon: Bell },
  { name: 'Settings', icon: Settings },
]

const alerts = [
  {
    location: 'Sangli',
    message: 'River discharge monitoring required',
    time: 'Example notification',
    level: 'High',
  },
  {
    location: 'Kolhapur',
    message: 'Heavy rainfall observation recorded',
    time: 'Example notification',
    level: 'Moderate',
  },
  {
    location: 'Satara',
    message: 'Monitoring station data updated',
    time: 'Example notification',
    level: 'Low',
  },
]

const stats = [
  {
    title: 'Monitoring Stations',
    value: 'Loading...',
    detail: 'River monitoring stations',
    icon: Radio,
    color: 'blue',
  },
  {
    title: 'Rainfall Monitoring',
    value: 'Loading...',
    detail: 'Historical rainfall dataset',
    icon: CloudRain,
    color: 'cyan',
  },
  {
    title: 'River Discharge',
    value: 'Loading...',
    detail: 'Historical discharge records',
    icon: Waves,
    color: 'purple',
  },
  {
    title: 'Active Alerts',
    value: '03',
    detail: 'Simulated demonstration alerts',
    icon: ShieldAlert,
    color: 'orange',
  },
]

const pageDescriptions = {
  Overview: 'WORKSPACE / OVERVIEW',
  'Risk Map': 'WORKSPACE / RISK MAP',
  'Rainfall Analysis': 'ANALYSIS / RAINFALL',
  'River Monitoring': 'MONITORING / RIVERS',
  'Alerts & Warnings': 'WORKSPACE / ALERTS',
  Settings: 'WORKSPACE / SETTINGS',
}

function Sidebar({ activePage, isOpen, onNavigate }) {
  return (
    <aside className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
      <div className="brand">
        <div className="brand-icon">
          <Activity size={23} />
        </div>
        <div>
          <h2>Disaster<span>AI</span></h2>
          <p>INTELLIGENCE SYSTEM</p>
        </div>
      </div>

      <div className="menu-label">WORKSPACE</div>

      <nav className="navigation" aria-label="Main navigation">
        {navigationItems.map((item) => {
          const Icon = item.icon

          return (
            <button
              type="button"
              key={item.name}
              className={`nav-item ${activePage === item.name ? 'active' : ''}`}
              aria-current={activePage === item.name ? 'page' : undefined}
              onClick={() => onNavigate(item.name)}
            >
              <Icon size={19} />
              <span>{item.name}</span>
            </button>
          )
        })}
      </nav>

      <div className="sidebar-bottom">
        <div className="system-status">
          <div className="status-dot" />
          <div>
            <strong>Historical data</strong>
            <p>Phase 1 dashboard</p>
          </div>
        </div>
        <p className="version">DISASTER INTELLIGENCE AI · v0.1</p>
      </div>
    </aside>
  )
}

function StatCard({ item }) {
  const Icon = item.icon

  return (
    <div className="stat-card">
      <div className={`stat-icon ${item.color}`}>
        <Icon size={22} />
      </div>
      <p className="stat-title">{item.title}</p>
      <h2>{item.value}</h2>
      <p className="stat-detail">{item.detail}</p>
    </div>
  )
}

function AlertList() {
  return (
    <div className="alerts-list">
      {alerts.map((alert) => (
        <div className="alert-item" key={alert.location}>
          <div className={`alert-indicator ${alert.level.toLowerCase()}`} />
          <div className="alert-info">
            <div className="alert-title-row">
              <strong>{alert.location}</strong>
              <span className={`level ${alert.level.toLowerCase()}`}>
                {alert.level}
              </span>
            </div>
            <p>{alert.message}</p>
            <small>{alert.time} · simulated</small>
          </div>
        </div>
      ))}
    </div>
  )
}

function AlertsPanel() {
  return (
    <article className="panel alerts-panel">
      <div className="panel-heading">
        <div>
          <h3>Recent Alerts</h3>
          <p>Simulated demonstration alerts</p>
        </div>
        <span className="alert-count">03</span>
      </div>
      <AlertList />
    </article>
  )
}

function OverviewDashboard({
  summary,
  recentDischarge,
  rainfallSummary,
  monthlyRainfall,
  dailyRainfall,
  apiError,
}) {
  const actualValues = {
    'Monitoring Stations': summary?.total_stations,
    'Rainfall Monitoring': Number.isFinite(
      rainfallSummary?.average_rainfall_mm,
    )
      ? `${rainfallSummary.average_rainfall_mm.toFixed(2)} mm`
      : 'Loading...',
    'River Discharge': summary?.total_records?.toLocaleString('en-IN'),
    'Active Alerts': null,
  }

  const highestDailyCellRainfall = dailyRainfall.reduce(
    (maximum, item) =>
      Number.isFinite(item.maximum_rainfall_mm)
        ? Math.max(maximum, item.maximum_rainfall_mm)
        : maximum,
    Number.NEGATIVE_INFINITY,
  )

  return (
    <div className="page-content">
      <div className="welcome-section">
        <div>
          <h2>Disaster Intelligence Dashboard</h2>
          <p>
            Monitor historical environmental observations across Maharashtra.
          </p>
        </div>
        <div className="date-label">
          <Activity size={16} />
          Phase 1 · Historical data
        </div>
      </div>

      <section className="stats-grid">
        {stats.map((item) => (
          <StatCard
            key={item.title}
            item={{
              ...item,
              value: actualValues[item.title] ?? item.value,
              detail:
                item.title === 'Monitoring Stations'
                  ? 'Actual historical stations'
                  : item.title === 'Rainfall Monitoring'
                    ? 'Mean grid-cell rainfall · 2024'
                    : item.title === 'River Discharge'
                      ? 'Historical discharge records'
                      : item.detail,
            }}
          />
        ))}
      </section>

      <section className="charts-grid">
        <article className="panel chart-panel">
          <div className="panel-heading">
            <div>
              <h3>Rainfall Overview</h3>
              <p>Monthly average daily rainfall · mm · 2024</p>
            </div>
            <div className="panel-icon blue">
              <CloudRain size={20} />
            </div>
          </div>

          <div className="chart-container">
            {monthlyRainfall.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyRainfall}>
                  <defs>
                    <linearGradient
                      id="overviewRainGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor="#3182ce"
                        stopOpacity={0.25}
                      />
                      <stop
                        offset="100%"
                        stopColor="#3182ce"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#e9eef5"
                  />
                  <XAxis
                    dataKey="month"
                    tickFormatter={(value) =>
                      new Date(`${value}-01T00:00:00`).toLocaleDateString(
                        'en-IN',
                        { month: 'short' },
                      )
                    }
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value) => `${value} mm`}
                  />
                  <Tooltip
                    formatter={(value) => [
                      `${Number(value).toFixed(2)} mm`,
                      'Average daily rainfall',
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="average_daily_rainfall_mm"
                    stroke="#3182ce"
                    strokeWidth={3}
                    fill="url(#overviewRainGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <p className="chart-empty">
                {apiError || 'Loading historical rainfall data...'}
              </p>
            )}
          </div>
          <p className="data-source-note">
            IMD RFone 2024 · preliminary rectangular regional selection.
          </p>
          {Number.isFinite(highestDailyCellRainfall) && (
            <div className="observation-dates">
              <span>
                Highest daily grid-cell rainfall:{' '}
                {highestDailyCellRainfall.toFixed(2)} mm
              </span>
              <span>{dailyRainfall.length} daily observations</span>
            </div>
          )}
        </article>

        <article className="panel chart-panel">
          <div className="panel-heading">
            <div>
              <h3>River Discharge</h3>
              <p>Latest recorded observations · m³/s</p>
            </div>
            <div className="panel-icon purple">
              <Droplets size={20} />
            </div>
          </div>

          <div className="chart-container">
            {recentDischarge.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={recentDischarge.map((item) => ({
                    station: item.station,
                    discharge: item.discharge,
                  }))}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#e9eef5"
                  />
                  <XAxis
                    dataKey="station"
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Bar
                    dataKey="discharge"
                    fill="#8066db"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="chart-empty">
                {apiError || 'Loading historical discharge data...'}
              </p>
            )}
          </div>
          <p className="data-source-note">
            Historical Maharashtra river discharge observations.
          </p>
        </article>
      </section>

      <section className="bottom-grid">
        <article className="panel overview-map-panel">
          <div className="panel-heading">
            <div>
              <h3>Monitoring Network</h3>
              <p>Maharashtra · actual station locations</p>
            </div>
            <div className="panel-icon cyan">
              <Map size={20} />
            </div>
          </div>
          <StationMap />
        </article>

        <AlertsPanel />
      </section>
    </div>
  )
}

function AlertsPage() {
  return (
    <div className="page-content">
      <div className="welcome-section">
        <div>
          <h2>Alerts &amp; Warnings</h2>
          <p>Demonstration alert examples for the Phase 1 interface.</p>
        </div>
        <span className="simulated-label">SIMULATED</span>
      </div>
      <div className="demo-notice">
        <AlertTriangle size={18} />
        <p>
          <strong>Not a warning service:</strong> These alerts are simulated
          examples. They are not generated from thresholds, verified by an
          authority, or intended for emergency decisions.
        </p>
      </div>
      <article className="panel alerts-page-panel">
        <div className="panel-heading">
          <div>
            <h3>Demonstration alerts</h3>
            <p>Sample records only · not live monitoring notifications</p>
          </div>
          <span className="alert-count">03</span>
        </div>
        <AlertList />
      </article>
    </div>
  )
}

function SettingsPage({ summary, rainfallSummary, apiConnected, apiError }) {
  const settings = [
    ['Project', 'Disaster Intelligence AI · Phase 1'],
    ['River dataset', summary?.data_source ?? 'Loading dataset metadata'],
    [
      'River observations',
      summary
        ? `${summary.total_records.toLocaleString('en-IN')} records · latest ${new Date(summary.latest_observation).toLocaleDateString('en-IN')}`
        : 'Loading river statistics',
    ],
    [
      'Rainfall dataset',
      rainfallSummary?.data_source ?? 'Loading dataset metadata',
    ],
    [
      'Rainfall coverage',
      rainfallSummary
        ? `${rainfallSummary.year} · ${rainfallSummary.unit} · ${rainfallSummary.grid_dimensions.days} days`
        : 'Loading rainfall statistics',
    ],
    [
      'Geographic selection',
      rainfallSummary?.geographic_selection.description ??
        'Preliminary rectangular Maharashtra-region selection',
    ],
    [
      'API connection',
      apiConnected ? 'Connected to historical-data API' : apiError || 'Connecting',
    ],
    [
      'Technology stack',
      'React · Vite · FastAPI · Pandas · Xarray · Recharts · Leaflet',
    ],
  ]

  return (
    <div className="page-content">
      <div className="welcome-section">
        <div>
          <h2>Settings &amp; Project Information</h2>
          <p>Read-only project, dataset, and service details.</p>
        </div>
        <span className={`service-label ${apiConnected ? 'connected' : ''}`}>
          {apiConnected ? 'API CONNECTED' : 'API UNAVAILABLE'}
        </span>
      </div>

      <article className="panel settings-panel">
        <dl className="settings-list">
          {settings.map(([label, value]) => (
            <div className="settings-row" key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      </article>
      <p className="data-source-note">
        This application presents historical observations and educational
        demonstrations; it is not an operational disaster-warning system.
      </p>
    </div>
  )
}

function App() {
  const [summary, setSummary] = useState(null)
  const [recentDischarge, setRecentDischarge] = useState([])
  const [rainfallSummary, setRainfallSummary] = useState(null)
  const [monthlyRainfall, setMonthlyRainfall] = useState([])
  const [dailyRainfall, setDailyRainfall] = useState([])
  const [apiError, setApiError] = useState('')
  const [activePage, setActivePage] = useState('Overview')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const controller = new AbortController()

    async function fetchDashboardData() {
      try {
        const endpoints = [
          'http://127.0.0.1:8000/api/summary',
          'http://127.0.0.1:8000/api/discharge/recent?limit=5',
          'http://127.0.0.1:8000/api/rainfall/summary',
          'http://127.0.0.1:8000/api/rainfall/monthly',
          'http://127.0.0.1:8000/api/rainfall/daily',
        ]
        const responses = await Promise.all(
          endpoints.map((url) =>
            fetch(url, { signal: controller.signal }),
          ),
        )

        if (responses.some((response) => !response.ok)) {
          throw new Error('Could not load dashboard API data')
        }

        const [riverSummary, discharge, rainSummary, monthly, daily] =
          await Promise.all(responses.map((response) => response.json()))

        setSummary(riverSummary)
        setRecentDischarge(discharge)
        setRainfallSummary(rainSummary)
        setMonthlyRainfall(monthly)
        setDailyRainfall(daily)
        setApiError('')
      } catch (error) {
        if (error.name !== 'AbortError') {
          setApiError(error.message)
        }
      }
    }

    fetchDashboardData()
    return () => controller.abort()
  }, [])

  const apiConnected = Boolean(summary && rainfallSummary)

  function navigateTo(page) {
    setActivePage(page)
    setMobileMenuOpen(false)
  }

  function renderActivePage() {
    if (activePage === 'Rainfall Analysis') {
      return (
        <RainfallAnalysis
          summary={rainfallSummary}
          daily={dailyRainfall}
          monthly={monthlyRainfall}
        />
      )
    }

    if (activePage === 'River Monitoring') {
      return (
        <RiverMonitoring
          summary={summary}
          recentDischarge={recentDischarge}
        />
      )
    }

    if (activePage === 'Risk Map') {
      return (
        <div className="page-content">
          <div className="welcome-section">
            <div>
              <h2>Monitoring Network Map</h2>
              <p>
                Explore the locations and metadata of historical monitoring
                stations.
              </p>
            </div>
            <span className="page-data-label">Station locations only</span>
          </div>
          <div className="demo-notice">
            <Map size={18} />
            <p>
              <strong>No risk scores or flood predictions are shown.</strong>{' '}
              This map displays station locations and recorded attributes only.
            </p>
          </div>
          <article className="panel risk-map-panel">
            <StationMap />
          </article>
        </div>
      )
    }

    if (activePage === 'Alerts & Warnings') {
      return <AlertsPage />
    }

    if (activePage === 'Settings') {
      return (
        <SettingsPage
          summary={summary}
          rainfallSummary={rainfallSummary}
          apiConnected={apiConnected}
          apiError={apiError}
        />
      )
    }

    return (
      <OverviewDashboard
        summary={summary}
        recentDischarge={recentDischarge}
        rainfallSummary={rainfallSummary}
        monthlyRainfall={monthlyRainfall}
        dailyRainfall={dailyRainfall}
        apiError={apiError}
      />
    )
  }

  return (
    <div className="app-shell">
      {mobileMenuOpen && (
        <button
          type="button"
          className="sidebar-backdrop"
          aria-label="Close navigation"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
      <Sidebar
        activePage={activePage}
        isOpen={mobileMenuOpen}
        onNavigate={navigateTo}
      />

      <main className="main-content">
        <header className="topbar">
          <div className="page-heading">
            <button
              type="button"
              className="mobile-menu"
              aria-label="Toggle navigation"
              aria-expanded={mobileMenuOpen}
              onClick={() => setMobileMenuOpen((isOpen) => !isOpen)}
            >
              <Menu size={22} />
            </button>
            <div>
              <p className="breadcrumb">{pageDescriptions[activePage]}</p>
              <h1>{activePage}</h1>
            </div>
          </div>

          <div className="topbar-right">
            <span className="demo-badge">HISTORICAL DATA</span>
            <div className="profile-avatar">DI</div>
          </div>
        </header>

        <section className="dashboard-body">
          <div className="demo-notice">
            <AlertTriangle size={18} />
            <p>
              <strong>Data transparency:</strong> Rainfall and river values are
              historical observations. Alerts are simulated for demonstration
              and are not verified disaster warnings or AI predictions.
            </p>
          </div>

          <div className="api-status" role="status">
            <span
              className={`api-dot ${apiConnected ? 'online' : 'offline'}`}
            />
            {apiConnected
              ? 'Connected to historical river and rainfall datasets'
              : apiError || 'Connecting to Python API...'}
          </div>

          {renderActivePage()}

          <footer className="footer">
            <span>Disaster Intelligence AI</span>
            <span>Academic Project · Phase 1 · Historical data only</span>
          </footer>
        </section>
      </main>
    </div>
  )
}

export default App
