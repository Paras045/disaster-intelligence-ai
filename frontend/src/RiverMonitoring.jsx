import { useCallback, useEffect, useState } from 'react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import StationMap from './StationMap'

function RiverMonitoring({ summary, recentDischarge }) {
  const [selectedStation, setSelectedStation] = useState(null)
  const [history, setHistory] = useState([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [historyError, setHistoryError] = useState('')

  const handleStationSelect = useCallback((station) => {
    setSelectedStation(station)
  }, [])

  useEffect(() => {
    if (!selectedStation?.station) {
      return undefined
    }

    const controller = new AbortController()

    async function fetchStationHistory() {
      setLoadingHistory(true)
      setHistoryError('')

      try {
        const stationName = encodeURIComponent(selectedStation.station)
        const response = await fetch(
          `http://127.0.0.1:8000/api/stations/${stationName}`,
          { signal: controller.signal },
        )

        if (!response.ok) {
          throw new Error('Unable to load station discharge history')
        }

        setHistory(await response.json())
      } catch (error) {
        if (error.name !== 'AbortError') {
          setHistoryError(error.message)
          setHistory([])
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoadingHistory(false)
        }
      }
    }

    fetchStationHistory()
    return () => controller.abort()
  }, [selectedStation])

  return (
    <div className="page-content">
      <div className="welcome-section">
        <div>
          <h2>River Monitoring</h2>
          <p>
            Explore historical discharge records and station metadata. Values
            are observations, not live readings.
          </p>
        </div>
        <span className="page-data-label">Historical river observations</span>
      </div>

      <section className="stats-grid analysis-metrics river-metrics">
        <article className="stat-card analysis-metric">
          <p className="stat-title">Monitoring stations</p>
          <h2>{summary?.total_stations ?? 'Loading...'}</h2>
          <p className="stat-detail">Stations in the river dataset</p>
        </article>
        <article className="stat-card analysis-metric">
          <p className="stat-title">Discharge records</p>
          <h2>
            {summary?.total_records?.toLocaleString('en-IN') ?? 'Loading...'}
          </h2>
          <p className="stat-detail">Historical records in the CSV</p>
        </article>
        <article className="stat-card analysis-metric">
          <p className="stat-title">Rivers represented</p>
          <h2>{summary?.total_rivers ?? 'Loading...'}</h2>
          <p className="stat-detail">Unique river names in the dataset</p>
        </article>
        <article className="stat-card analysis-metric">
          <p className="stat-title">Latest observation</p>
          <h2 className="compact-metric">
            {summary?.latest_observation
              ? new Date(summary.latest_observation).toLocaleDateString(
                  'en-IN',
                  { day: '2-digit', month: 'short', year: 'numeric' },
                )
              : 'Loading...'}
          </h2>
          <p className="stat-detail">Latest timestamp present in the dataset</p>
        </article>
      </section>

      <section className="river-monitoring-grid">
        <article className="panel station-explorer-panel">
          <div className="panel-heading">
            <div>
              <h3>Station explorer</h3>
              <p>Search, filter, sort, and select a station.</p>
            </div>
          </div>
          <StationMap onStationSelect={handleStationSelect} />
        </article>

        <div className="river-history-column">
          <article className="panel">
            <div className="panel-heading">
              <div>
                <h3>Station discharge history</h3>
                <p>
                  {selectedStation?.station ??
                    'Select a station from the explorer below'}
                </p>
              </div>
            </div>
            <div className="chart-container">
              {loadingHistory ? (
                <p className="chart-empty">Loading station observations...</p>
              ) : historyError ? (
                <p className="chart-empty error-text">{historyError}</p>
              ) : history.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={history}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#e9eef5"
                    />
                    <XAxis
                      dataKey="observation_time"
                      minTickGap={32}
                      tickFormatter={(value) =>
                        new Date(value).toLocaleDateString('en-IN', {
                          month: 'short',
                          year: '2-digit',
                        })
                      }
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(value) => `${value} m³/s`}
                    />
                    <Tooltip
                      labelFormatter={(value) =>
                        new Date(value).toLocaleString('en-IN')
                      }
                      formatter={(value) => [
                        value == null
                          ? 'Unavailable'
                          : `${Number(value).toLocaleString('en-IN')} m³/s`,
                        'Discharge',
                      ]}
                    />
                    <Line
                      type="monotone"
                      dataKey="discharge"
                      stroke="#8066db"
                      dot={false}
                      connectNulls
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="chart-empty">
                  Select a station to view its historical discharge series.
                </p>
              )}
            </div>
            {selectedStation && (
              <dl className="selected-station-details">
                <div>
                  <dt>District</dt>
                  <dd>{selectedStation.district || 'Unavailable'}</dd>
                </div>
                <div>
                  <dt>River</dt>
                  <dd>{selectedStation.river || 'Unavailable'}</dd>
                </div>
                <div>
                  <dt>Latest observed discharge</dt>
                  <dd>
                    {selectedStation.latest_discharge == null
                      ? 'Unavailable'
                      : `${selectedStation.latest_discharge.toLocaleString('en-IN')} m³/s`}
                  </dd>
                </div>
                <div>
                  <dt>Observation date</dt>
                  <dd>
                    {selectedStation.latest_observation
                      ? new Date(
                          selectedStation.latest_observation,
                        ).toLocaleDateString('en-IN')
                      : 'Unavailable'}
                  </dd>
                </div>
              </dl>
            )}
          </article>

          <article className="panel recent-records-panel">
            <div className="panel-heading">
              <div>
                <h3>Recent recorded observations</h3>
                <p>Latest records returned by the historical dataset API.</p>
              </div>
            </div>
            <div className="recent-records">
              {recentDischarge.map((record) => (
                <div
                  className="recent-record"
                  key={`${record.station}-${record.observation_time}`}
                >
                  <div>
                    <strong>{record.station}</strong>
                    <span>
                      {record.district} · {record.river}
                    </span>
                  </div>
                  <div className="recent-record-value">
                    <strong>
                      {record.discharge == null
                        ? 'Unavailable'
                        : `${record.discharge.toLocaleString('en-IN')} m³/s`}
                    </strong>
                    <span>
                      {new Date(record.observation_time).toLocaleDateString(
                        'en-IN',
                      )}
                    </span>
                  </div>
                </div>
              ))}
              {recentDischarge.length === 0 && (
                <p className="chart-empty">
                  Recent discharge records are not available.
                </p>
              )}
            </div>
          </article>
        </div>
      </section>

      <p className="data-source-note">
        Source: Maharashtra river discharge dataset. Station history dates
        reflect the records available for each station and may not be current.
      </p>
    </div>
  )
}

export default RiverMonitoring
