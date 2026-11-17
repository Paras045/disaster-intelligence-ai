import { useEffect, useMemo, useState } from 'react'
import {
  CircleMarker,
  MapContainer,
  Popup,
  TileLayer,
  useMap,
} from 'react-leaflet'
import MarkerClusterGroup from 'react-leaflet-cluster'

import 'leaflet/dist/leaflet.css'
import './StationMap.css'

function FocusStation({ station }) {
  const map = useMap()

  useEffect(() => {
    if (station) {
      map.flyTo([station.latitude, station.longitude], 10, { duration: 0.8 })
    }
  }, [station, map])

  return null
}

function formatDate(value) {
  if (!value) {
    return 'Unavailable'
  }

  const date = new Date(value)
  if (!Number.isFinite(date.getTime())) {
    return 'Unavailable'
  }

  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function StationMap() {
  const [stations, setStations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [selectedDistrict, setSelectedDistrict] = useState('All')
  const [selectedRiver, setSelectedRiver] = useState('All')
  const [sortOrder, setSortOrder] = useState('name')
  const [selectedStation, setSelectedStation] = useState(null)

  useEffect(() => {
    async function fetchStations() {
      try {
        const response = await fetch('http://127.0.0.1:8000/api/stations')

        if (!response.ok) {
          throw new Error('Unable to load monitoring stations')
        }

        const data = await response.json()
        setStations(data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchStations()
  }, [])

  const validStations = useMemo(
    () =>
      stations.filter(
        (station) =>
          Number.isFinite(station.latitude) &&
          Number.isFinite(station.longitude),
      ),
    [stations],
  )

  const districts = useMemo(
    () =>
      [...new Set(validStations.map((station) => station.district))]
        .filter(Boolean)
        .sort(),
    [validStations],
  )

  const rivers = useMemo(
    () =>
      [...new Set(validStations.map((station) => station.river))]
        .filter(Boolean)
        .sort(),
    [validStations],
  )

  const filteredStations = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase()
    const result = validStations.filter((station) => {
      const matchesSearch =
        String(station.station ?? '').toLocaleLowerCase().includes(normalizedSearch) ||
        String(station.district ?? '').toLocaleLowerCase().includes(normalizedSearch)
      const matchesDistrict =
        selectedDistrict === 'All' || station.district === selectedDistrict
      const matchesRiver =
        selectedRiver === 'All' || station.river === selectedRiver

      return matchesSearch && matchesDistrict && matchesRiver
    })

    return result.sort((a, b) => {
      if (sortOrder === 'discharge') {
        if (a.latest_discharge == null) {
          return b.latest_discharge == null ? 0 : 1
        }
        if (b.latest_discharge == null) {
          return -1
        }

        return b.latest_discharge - a.latest_discharge
      }

      if (sortOrder === 'records') {
        return b.record_count - a.record_count
      }

      return String(a.station ?? '').localeCompare(String(b.station ?? ''))
    })
  }, [validStations, search, selectedDistrict, selectedRiver, sortOrder])

  if (loading) {
    return <div className="map-message">Loading monitoring stations...</div>
  }

  if (error) {
    return <div className="map-message error">{error}</div>
  }

  return (
    <div className="station-explorer">
      <div className="explorer-toolbar">
        <input
          type="search"
          placeholder="Search station or district..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          aria-label="Search stations"
        />

        <select
          value={selectedDistrict}
          onChange={(event) => setSelectedDistrict(event.target.value)}
          aria-label="Filter by district"
        >
          <option value="All">All districts</option>
          {districts.map((district) => (
            <option key={district} value={district}>
              {district}
            </option>
          ))}
        </select>

        <select
          value={selectedRiver}
          onChange={(event) => setSelectedRiver(event.target.value)}
          aria-label="Filter by river"
        >
          <option value="All">All rivers</option>
          {rivers.map((river) => (
            <option key={river} value={river}>
              {river}
            </option>
          ))}
        </select>

        <select
          value={sortOrder}
          onChange={(event) => setSortOrder(event.target.value)}
          aria-label="Sort stations"
        >
          <option value="name">Sort: Name</option>
          <option value="discharge">Sort: Discharge</option>
          <option value="records">Sort: Record count</option>
        </select>
      </div>

      <div className="map-summary">
        Showing <strong>{filteredStations.length}</strong> of {validStations.length}{' '}
        stations with valid coordinates
      </div>

      <MapContainer
        center={[19.5, 76.5]}
        zoom={6}
        scrollWheelZoom
        className="station-map"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <FocusStation station={selectedStation} />

        <MarkerClusterGroup chunkedLoading>
          {filteredStations.map((station, index) => (
            <CircleMarker
              key={`${station.station}-${station.district}-${index}`}
              center={[station.latitude, station.longitude]}
              radius={7}
              pathOptions={{
                color: '#ffffff',
                weight: 2,
                fillColor: '#1684c7',
                fillOpacity: 0.9,
              }}
            >
              <Popup>
                <div className="station-popup">
                  <strong>{station.station}</strong>
                  <p>District: {station.district || 'Unavailable'}</p>
                  <p>River: {station.river || 'Unavailable'}</p>
                  <p>
                    Latest discharge:{' '}
                    {station.latest_discharge ?? 'Unavailable'} m³/s
                  </p>
                  <p>Observation: {formatDate(station.latest_observation)}</p>
                  <p>Records: {station.record_count ?? 'Unavailable'}</p>
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MarkerClusterGroup>
      </MapContainer>

      <div className="station-list-heading">
        <h4>Monitoring Stations</h4>
        <span>{filteredStations.length} results</span>
      </div>

      <div className="station-list">
        {filteredStations.map((station, index) => (
          <button
            type="button"
            key={`${station.station}-${station.district}-${index}`}
            className={`station-list-item ${
              selectedStation === station ? 'selected' : ''
            }`}
            onClick={() => setSelectedStation(station)}
          >
            <div className="station-list-main">
              <strong>{station.station || 'Unnamed station'}</strong>
              <span>
                {station.district || 'Unknown district'} ·{' '}
                {station.river || 'Unknown river'}
              </span>
            </div>

            <div className="station-list-value">
              <strong>
                {station.latest_discharge == null
                  ? 'N/A'
                  : `${station.latest_discharge.toLocaleString('en-IN')} m³/s`}
              </strong>
              <span>{formatDate(station.latest_observation)}</span>
            </div>
          </button>
        ))}

        {filteredStations.length === 0 && (
          <p className="empty-stations">
            No stations match your search and filters.
          </p>
        )}
      </div>

      <p className="data-source-note">
        Source: Historical Maharashtra river discharge dataset. Each station
        displays its own latest recorded observation, which may not be current.
      </p>
    </div>
  )
}

export default StationMap
