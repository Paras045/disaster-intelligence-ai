import {
  Area,
  AreaChart,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

function formatMonth(value, options) {
  return new Date(`${value}-01T00:00:00`).toLocaleDateString(
    'en-IN',
    options,
  )
}

function formatRainfall(value) {
  return Number.isFinite(value) ? `${value.toFixed(2)} mm` : 'Unavailable'
}

function MetricCard({ label, value, detail }) {
  return (
    <article className="stat-card analysis-metric">
      <p className="stat-title">{label}</p>
      <h2>{value}</h2>
      <p className="stat-detail">{detail}</p>
    </article>
  )
}

function RainfallAnalysis({ summary, daily, monthly }) {
  const maximumDailyCellValue = daily.reduce(
    (maximum, item) =>
      Number.isFinite(item.maximum_rainfall_mm)
        ? Math.max(maximum, item.maximum_rainfall_mm)
        : maximum,
    Number.NEGATIVE_INFINITY,
  )
  const grid = summary?.grid_dimensions
  const selection = summary?.geographic_selection

  return (
    <div className="page-content">
      <div className="welcome-section">
        <div>
          <h2>Rainfall Analysis</h2>
          <p>
            Historical daily rainfall observations from the IMD RFone 2024
            dataset.
          </p>
        </div>
        <span className="page-data-label">Historical · millimetres</span>
      </div>

      <section className="stats-grid analysis-metrics">
        <MetricCard
          label="Average rainfall"
          value={formatRainfall(summary?.average_rainfall_mm)}
          detail="Mean of valid grid-cell observations"
        />
        <MetricCard
          label="Maximum observation"
          value={formatRainfall(summary?.maximum_rainfall_mm)}
          detail="Highest valid grid-cell value in 2024"
        />
        <MetricCard
          label="Valid observations"
          value={
            summary?.valid_observations?.toLocaleString('en-IN') ??
            'Loading...'
          }
          detail="Daily values across the selected grid"
        />
        <MetricCard
          label="Missing observations"
          value={
            summary
              ? `${summary.missing_percentage.toFixed(2)}%`
              : 'Loading...'
          }
          detail={
            summary
              ? `${summary.missing_observations.toLocaleString('en-IN')} grid-cell values missing`
              : 'Loading missing-data statistics'
          }
        />
      </section>

      <section className="analysis-chart-grid">
        <article className="panel">
          <div className="panel-heading">
            <div>
              <h3>Monthly rainfall</h3>
              <p>Average of daily spatial averages · mm · 2024</p>
            </div>
          </div>
          <div className="chart-container">
            {monthly.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthly}>
                  <defs>
                    <linearGradient
                      id="rainfallMonthlyGradient"
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
                      formatMonth(value, { month: 'short' })
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
                    labelFormatter={(value) =>
                      formatMonth(value, {
                        month: 'long',
                        year: 'numeric',
                      })
                    }
                  />
                  <Area
                    type="monotone"
                    dataKey="average_daily_rainfall_mm"
                    stroke="#3182ce"
                    strokeWidth={3}
                    fill="url(#rainfallMonthlyGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <p className="chart-empty">Rainfall data is not available.</p>
            )}
          </div>
        </article>

        <article className="panel">
          <div className="panel-heading">
            <div>
              <h3>Daily rainfall</h3>
              <p>Daily spatial average and maximum grid cell · mm</p>
            </div>
          </div>
          <div className="chart-container">
            {daily.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={daily}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#e9eef5"
                  />
                  <XAxis
                    dataKey="date"
                    interval={29}
                    tickFormatter={(value) =>
                      new Date(`${value}T00:00:00`).toLocaleDateString(
                        'en-IN',
                        { day: 'numeric', month: 'short' },
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
                    labelFormatter={(value) =>
                      new Date(`${value}T00:00:00`).toLocaleDateString(
                        'en-IN',
                        {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric',
                        },
                      )
                    }
                    formatter={(value, name) => [
                      `${Number(value).toFixed(2)} mm`,
                      name === 'average_rainfall_mm'
                        ? 'Daily spatial average'
                        : 'Maximum grid-cell rainfall',
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="average_rainfall_mm"
                    name="average_rainfall_mm"
                    stroke="#3182ce"
                    fill="#3182ce"
                    fillOpacity={0.12}
                  />
                  <Line
                    type="monotone"
                    dataKey="maximum_rainfall_mm"
                    name="maximum_rainfall_mm"
                    stroke="#e18a39"
                    dot={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <p className="chart-empty">Daily rainfall data is not available.</p>
            )}
          </div>
        </article>
      </section>

      <section className="panel dataset-information">
        <div className="panel-heading">
          <div>
            <h3>Dataset information and coverage</h3>
            <p>Historical data only; the region is a preliminary rectangle.</p>
          </div>
        </div>
        <dl className="dataset-details">
          <div>
            <dt>Source</dt>
            <dd>{summary?.data_source ?? 'IMD RFone rainfall dataset'}</dd>
          </div>
          <div>
            <dt>Coverage</dt>
            <dd>{summary?.year ?? '2024'} daily observations</dd>
          </div>
          <div>
            <dt>Grid</dt>
            <dd>
              {grid
                ? `${grid.latitude_points} × ${grid.longitude_points} cells; ${grid.days} days`
                : 'Loading grid dimensions'}
            </dd>
          </div>
          <div>
            <dt>Latitude</dt>
            <dd>
              {selection
                ? `${selection.latitude_min}°–${selection.latitude_max}°`
                : 'Loading bounds'}
            </dd>
          </div>
          <div>
            <dt>Longitude</dt>
            <dd>
              {selection
                ? `${selection.longitude_min}°–${selection.longitude_max}°`
                : 'Loading bounds'}
            </dd>
          </div>
          <div>
            <dt>Highest daily grid-cell reading</dt>
            <dd>{formatRainfall(maximumDailyCellValue)}</dd>
          </div>
          <div>
            <dt>Coordinate selection</dt>
            <dd>
              Preliminary rectangular Maharashtra-region selection; not an
              exact state boundary.
            </dd>
          </div>
        </dl>
      </section>
    </div>
  )
}

export default RainfallAnalysis
