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
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  BarChart,
  Bar,
} from 'recharts'

import StationMap from './StationMap'
import './App.css'

const rainfallData = [
  { day: 'Mon', rainfall: 12 },
  { day: 'Tue', rainfall: 28 },
  { day: 'Wed', rainfall: 18 },
  { day: 'Thu', rainfall: 45 },
  { day: 'Fri', rainfall: 32 },
  { day: 'Sat', rainfall: 68 },
  { day: 'Sun', rainfall: 52 },
]

const alerts = [
  {
    location: 'Sangli',
    message: 'River discharge monitoring required',
    time: '10 minutes ago',
    level: 'High',
  },
  {
    location: 'Kolhapur',
    message: 'Heavy rainfall observation recorded',
    time: '35 minutes ago',
    level: 'Moderate',
  },
  {
    location: 'Satara',
    message: 'Monitoring station data updated',
    time: '1 hour ago',
    level: 'Low',
  },
]

const stats = [
  {
    title: 'Monitoring Stations',
    value: '93',
    detail: 'River monitoring stations',
    icon: Radio,
    color: 'blue',
  },
  {
    title: 'Rainfall Monitoring',
    value: '68 mm',
    detail: 'Demo weekly rainfall',
    icon: CloudRain,
    color: 'cyan',
  },
  {
    title: 'River Discharge',
    value: '680',
    detail: 'Demo maximum m³/s',
    icon: Waves,
    color: 'purple',
  },
  {
    title: 'Active Alerts',
    value: '03',
    detail: 'Simulated alerts',
    icon: ShieldAlert,
    color: 'orange',
  },
]

function Sidebar() {
  const menuItems = [
    { name: 'Overview', icon: LayoutDashboard, active: true },
    { name: 'Risk Map', icon: Map },
    { name: 'Rainfall Analysis', icon: CloudRain },
    { name: 'River Monitoring', icon: Waves },
    { name: 'Alerts & Warnings', icon: Bell },
    { name: 'Settings', icon: Settings },
  ]

  return (
    <aside className="sidebar">
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

      <nav className="navigation">
        {menuItems.map((item) => {
          const Icon = item.icon

          return (
            <button
              key={item.name}
              className={`nav-item ${item.active ? 'active' : ''}`}
              key={item.name}
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
            <strong>System Online</strong>
            <p>Monitoring interface</p>
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

function App() {
  const [summary, setSummary] = useState(null)
  const [recentDischarge, setRecentDischarge] = useState([])
  const [apiError, setApiError] = useState('')

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const [summaryResponse, dischargeResponse] = await Promise.all([
          fetch('http://127.0.0.1:8000/api/summary'),
          fetch('http://127.0.0.1:8000/api/discharge/recent?limit=5'),
        ])

        if (!summaryResponse.ok || !dischargeResponse.ok) {
          throw new Error('Could not load API data')
        }

        setSummary(await summaryResponse.json())
        setRecentDischarge(await dischargeResponse.json())
      } catch (error) {
        setApiError(error.message)
      }
    }

    fetchDashboardData()
  }, [])

  return (
    <div className="app-shell">
      <Sidebar />

      <main className="main-content">
        <header className="topbar">
          <div className="page-heading">
            <button className="mobile-menu">
              <Menu size={22} />
            </button>
            <div>
              <p className="breadcrumb">WORKSPACE / OVERVIEW</p>
              <h1>Disaster Overview</h1>
            </div>
          </div>

          <div className="topbar-right">
            <span className="demo-badge">DEMO DATA</span>
            <button className="notification-button">
              <Bell size={19} />
              <span />
            </button>
            <div className="profile-avatar">DI</div>
          </div>
        </header>

        <section className="dashboard-body">
          <div className="welcome-section">
            <div>
              <h2>Disaster Intelligence Dashboard</h2>
              <p>
                Monitor environmental conditions and explore disaster-related
                data across Maharashtra.
              </p>
            </div>
            <div className="date-label">
              <Activity size={16} />
              Phase 1 · Initial Development
            </div>
          </div>

          <div className="demo-notice">
            <AlertTriangle size={18} />
            <p>
              <strong>Demonstration mode:</strong> Values and alerts shown here
              are sample data. They are not live measurements or verified
              disaster predictions.
            </p>
          </div>

          <div className="api-status">
            <span className={summary ? 'api-dot online' : 'api-dot offline'} />
            {summary
              ? 'Connected to historical river dataset'
              : apiError || 'Connecting to Python API...'}
          </div>

          <section className="stats-grid">
            {stats.map((item) => {
              const actualValues = {
                'Monitoring Stations': summary?.total_stations,
                'Rainfall Monitoring': null,
                'River Discharge':
                  summary?.total_records?.toLocaleString('en-IN'),
                'Active Alerts': null,
              }

              const value = actualValues[item.title]

              return (
                <StatCard
                  key={item.title}
                  item={{
                    ...item,
                    value: value ?? item.value,
                    detail:
                      item.title === 'Monitoring Stations'
                        ? 'Actual historical stations'
                        : item.title === 'River Discharge'
                          ? 'Historical discharge records'
                          : item.detail,
                  }}
                />
              )
            })}
          </section>

          <section className="charts-grid">
            <div className="panel chart-panel">
              <div className="panel-heading">
                <div>
                  <h3>Rainfall Overview</h3>
                  <p>Sample weekly rainfall · millimetres</p>
                </div>
                <div className="panel-icon blue">
                  <CloudRain size={20} />
                </div>
              </div>

              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={rainfallData}>
                    <defs>
                      <linearGradient
                        id="rainGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop offset="0%" stopColor="#3182ce" stopOpacity={0.25} />
                        <stop offset="100%" stopColor="#3182ce" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e9eef5" />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="rainfall"
                      stroke="#3182ce"
                      strokeWidth={3}
                      fill="url(#rainGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="panel chart-panel">
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
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={recentDischarge.map((item) => ({
                      station: item.station,
                      discharge: item.discharge,
                    }))}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e9eef5" />
                    <XAxis dataKey="station" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} />
                    <Tooltip />
                    <Bar
                      dataKey="discharge"
                      fill="#8066db"
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="data-source-note">
                Historical observations from the Maharashtra river discharge
                dataset. Each station has its own latest recorded date.
              </p>
              <div className="observation-dates">
                {recentDischarge.map((item) => (
                  <span key={`${item.station}-${item.observation_time}`}>
                    {item.station}:{' '}
                    {new Date(item.observation_time).toLocaleDateString('en-IN')}
                  </span>
                ))}
              </div>
            </div>
          </section>

          <section className="bottom-grid">
            <div className="panel map-placeholder">
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
            </div>

            <div className="panel alerts-panel">
              <div className="panel-heading">
                <div>
                  <h3>Recent Alerts</h3>
                  <p>Sample system notifications</p>
                </div>
                <span className="alert-count">03</span>
              </div>

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
                      <small>{alert.time}</small>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <footer className="footer">
            <span>Disaster Intelligence AI</span>
            <span>Academic Project · Phase 1</span>
          </footer>
        </section>
      </main>
    </div>
  )
}

export default App
