import React, { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Compass,
  ExternalLink,
  Loader2,
  LocateFixed,
  MapPin,
  Pause,
  Play,
  Search,
  X,
} from 'lucide-react';

const DEFAULT_CENTER = { lat: 40.758, lng: -73.9855 };
const LAST_GPS_STORAGE_KEY = 'fittrack_last_browser_gps';

function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function loadCachedGps() {
  try {
    const raw = localStorage.getItem(LAST_GPS_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed?.lat === 'number' && typeof parsed?.lng === 'number') {
      return parsed;
    }
  } catch {
    // ignore invalid cache
  }
  return null;
}

function createUserBeaconIcon() {
  return L.divIcon({
    className: 'free-gps-beacon-wrapper',
    html: `<div class="gmp-user-beacon" aria-label="Your live location">
      <span class="gmp-user-beacon-pulse"></span>
      <span class="gmp-user-beacon-core"></span>
    </div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

function createSearchPinIcon() {
  return L.divIcon({
    className: 'free-gym-pin-wrapper is-selected',
    html: `<div class="free-gym-pin is-selected">
      <span class="free-gym-pin-dot"></span>
    </div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 28],
    popupAnchor: [0, -26],
  });
}

function buildDirectionsUrl(target, userLocation) {
  const params = new URLSearchParams({
    api: '1',
    destination: `${target.lat},${target.lng}`,
  });
  if (userLocation) {
    params.set('origin', `${userLocation.lat},${userLocation.lng}`);
  }
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

async function searchPlacesNominatim(queryText, nearCenter, signal) {
  const params = new URLSearchParams({
    format: 'json',
    limit: '5',
    q: queryText,
  });
  if (nearCenter) {
    const d = 0.35;
    params.set(
      'viewbox',
      `${nearCenter.lng - d},${nearCenter.lat + d},${nearCenter.lng + d},${nearCenter.lat - d}`
    );
  }
  const res = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
    headers: { Accept: 'application/json' },
    signal,
  });
  if (!res.ok) throw new Error('Location search failed.');
  const items = await res.json();
  if (!Array.isArray(items)) return [];
  return items.map((item) => ({
    id: `${item.place_id}`,
    lat: Number(item.lat),
    lng: Number(item.lon),
    title: item.display_name?.split(',')[0] || queryText,
    subtitle: item.display_name || '',
  }));
}

export default function FreeLiveGymMap({ mode = 'full', onOpenFullMap }) {
  const cachedGps = useMemo(() => loadCachedGps(), []);

  const [searchInput, setSearchInput] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState(null);

  const [userLocation, setUserLocation] = useState(cachedGps);
  const [trackingEnabled, setTrackingEnabled] = useState(true);
  const [followUser, setFollowUser] = useState(true);
  const [gpsStatus, setGpsStatus] = useState('locating');
  const [gpsError, setGpsError] = useState('');

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const userMarkerRef = useRef(null);
  const accuracyCircleRef = useRef(null);
  const searchMarkerRef = useRef(null);
  const watchIdRef = useRef(null);
  const searchAbortRef = useRef(null);
  const hasCenteredInitialRef = useRef(Boolean(cachedGps));

  // Initialize Leaflet map (100% API-key-free)
  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container || mapInstanceRef.current) return;

    const initialCenter = cachedGps
      ? [cachedGps.lat, cachedGps.lng]
      : [DEFAULT_CENTER.lat, DEFAULT_CENTER.lng];

    const map = L.map(container, {
      center: initialCenter,
      zoom: cachedGps ? 15 : 13,
      zoomControl: true,
      attributionControl: true,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap &copy; CARTO',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map);

    mapInstanceRef.current = map;

    map.on('dragstart', () => {
      setFollowUser(false);
    });

    map.on('click', (e) => {
      const clicked = {
        id: `pin_${Date.now()}`,
        lat: e.latlng.lat,
        lng: e.latlng.lng,
        title: 'Pinned Location',
        subtitle: `${e.latlng.lat.toFixed(5)}, ${e.latlng.lng.toFixed(5)}`,
      };
      setFollowUser(false);
      setSelectedPlace(clicked);
    });

    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapInstanceRef.current = null;
      userMarkerRef.current = null;
      accuracyCircleRef.current = null;
      searchMarkerRef.current = null;
    };
  }, [cachedGps]);

  // Live Browser Geolocation tracking
  useEffect(() => {
    if (!trackingEnabled) {
      if (watchIdRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      setGpsStatus((prev) => (prev === 'denied' || prev === 'unsupported' ? prev : 'paused'));
      return;
    }

    if (!('geolocation' in navigator)) {
      setGpsStatus('unsupported');
      setGpsError('Browser geolocation is not supported. Use the search bar above or click the map.');
      return;
    }

    setGpsStatus('locating');
    setGpsError('');

    const handlePosition = (pos) => {
      const nextPos = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
        updatedAt: Date.now(),
      };

      setUserLocation(nextPos);
      setGpsStatus('tracking');
      setGpsError('');

      try {
        localStorage.setItem(LAST_GPS_STORAGE_KEY, JSON.stringify(nextPos));
      } catch {
        // ignore storage quota errors
      }

      if (!hasCenteredInitialRef.current && mapInstanceRef.current) {
        hasCenteredInitialRef.current = true;
        mapInstanceRef.current.setView([nextPos.lat, nextPos.lng], 15, { animate: true });
      }
    };

    const handleGeoError = (err) => {
      console.warn('Browser geolocation issue:', err);
      setGpsStatus('denied');
      if (err.code === 1) {
        setGpsError('Location permission denied. Allow browser location access, search a place above, or click the map.');
      } else {
        setGpsError('Unable to read live GPS right now. Use the search bar above or click anywhere on the map.');
      }
    };

    watchIdRef.current = navigator.geolocation.watchPosition(handlePosition, handleGeoError, {
      enableHighAccuracy: true,
      maximumAge: 5000,
      timeout: 12000,
    });

    return () => {
      if (watchIdRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [trackingEnabled]);

  // Update Live User GPS Marker + Accuracy Circle
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !userLocation) return;

    const latLng = [userLocation.lat, userLocation.lng];

    if (!userMarkerRef.current) {
      userMarkerRef.current = L.marker(latLng, {
        icon: createUserBeaconIcon(),
        zIndexOffset: 1200,
      })
        .bindTooltip(
          `Your Location (${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)})`,
          { direction: 'top' }
        )
        .addTo(map);
    } else {
      userMarkerRef.current.setLatLng(latLng);
    }

    if (userLocation.accuracy) {
      const clampedAcc = Math.min(Math.max(userLocation.accuracy, 15), 1500);
      if (!accuracyCircleRef.current) {
        accuracyCircleRef.current = L.circle(latLng, {
          radius: clampedAcc,
          color: '#38bdf8',
          opacity: 0.55,
          weight: 1.5,
          fillColor: '#38bdf8',
          fillOpacity: 0.14,
          interactive: false,
        }).addTo(map);
      } else {
        accuracyCircleRef.current.setLatLng(latLng);
        accuracyCircleRef.current.setRadius(clampedAcc);
      }
    }

    if (followUser) {
      map.panTo(latLng, { animate: true });
    }
  }, [userLocation, followUser]);

  // Update Searched / Pinned Marker + Popup
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (!selectedPlace) {
      if (searchMarkerRef.current) {
        searchMarkerRef.current.remove();
        searchMarkerRef.current = null;
      }
      return;
    }

    const latLng = [selectedPlace.lat, selectedPlace.lng];
    const dirUrl = buildDirectionsUrl(selectedPlace, userLocation);
    const osmUrl = `https://www.openstreetmap.org/?mlat=${selectedPlace.lat}&mlon=${selectedPlace.lng}#map=16/${selectedPlace.lat}/${selectedPlace.lng}`;

    const popupHtml = `
      <div class="gmp-infowindow-card">
        <h4>${escapeHtml(selectedPlace.title)}</h4>
        ${selectedPlace.subtitle ? `<p class="gmp-iw-address">${escapeHtml(selectedPlace.subtitle)}</p>` : ''}
        <div class="gmp-iw-links">
          <a href="${escapeHtml(dirUrl)}" target="_blank" rel="noopener noreferrer">Directions</a>
          <a href="${escapeHtml(osmUrl)}" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>
        </div>
      </div>
    `;

    if (!searchMarkerRef.current) {
      searchMarkerRef.current = L.marker(latLng, {
        icon: createSearchPinIcon(),
        zIndexOffset: 1100,
      })
        .bindPopup(popupHtml, { maxWidth: 280 })
        .addTo(map);
    } else {
      searchMarkerRef.current.setLatLng(latLng);
      searchMarkerRef.current.setPopupContent(popupHtml);
    }

    searchMarkerRef.current.openPopup();
  }, [selectedPlace, userLocation]);

  const handleLocateMe = () => {
    if (!('geolocation' in navigator)) {
      setGpsStatus('unsupported');
      setGpsError('Geolocation is not supported by this browser.');
      return;
    }

    setTrackingEnabled(true);
    setFollowUser(true);
    setGpsStatus('locating');
    setGpsError('');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const nextPos = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          updatedAt: Date.now(),
        };
        setUserLocation(nextPos);
        setGpsStatus('tracking');
        try {
          localStorage.setItem(LAST_GPS_STORAGE_KEY, JSON.stringify(nextPos));
        } catch {
          // ignore
        }
        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([nextPos.lat, nextPos.lng], 15, { duration: 0.65 });
        }
      },
      (err) => {
        console.warn('Manual geolocation failed:', err);
        setGpsStatus('denied');
        setGpsError('Location access was blocked. Allow browser location permission or search a place above.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSearchSubmit = async (e) => {
    e.preventDefault();
    const trimmed = searchInput.trim();
    if (!trimmed) return;

    if (searchAbortRef.current) {
      searchAbortRef.current.abort();
    }
    const controller = new AbortController();
    searchAbortRef.current = controller;

    setSearching(true);
    setSearchError('');

    try {
      const results = await searchPlacesNominatim(trimmed, userLocation, controller.signal);
      if (results.length === 0) {
        setSearchResults([]);
        setSearchError(`No place found for "${trimmed}". Try a city, street, or landmark.`);
        return;
      }

      setSearchResults(results);
      const top = results[0];
      setFollowUser(false);
      setSelectedPlace(top);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.flyTo([top.lat, top.lng], 15, { duration: 0.7 });
      }
    } catch (err) {
      if (err.name === 'AbortError') return;
      console.warn('Map search error:', err);
      setSearchError('Could not search right now. Please try again.');
    } finally {
      setSearching(false);
    }
  };

  const handlePickSearchResult = (place) => {
    setFollowUser(false);
    setSelectedPlace(place);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([place.lat, place.lng], 15, { duration: 0.6 });
    }
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setSearchError('');
    setSearchResults([]);
    setSelectedPlace(null);
    if (userLocation && mapInstanceRef.current) {
      setFollowUser(true);
      mapInstanceRef.current.flyTo([userLocation.lat, userLocation.lng], 15, { duration: 0.6 });
    }
  };

  return (
    <div className={`google-gym-locator ${mode === 'compact' ? 'compact-mode' : 'full-mode'}`}>
      {/* Search & Live Location Controls */}
      <div className="gmp-controls-bar">
        <form onSubmit={handleSearchSubmit} className="map-search-form">
          <div className="search-field-wrap">
            <Search size={17} className="search-icon" />
            <input
              type="text"
              placeholder="Search any city, address, neighborhood, or gym..."
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                setSearchError('');
              }}
            />
            {(searchInput || selectedPlace) && (
              <button
                type="button"
                className="map-search-clear-btn"
                onClick={handleClearSearch}
                title="Clear search"
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <button type="submit" className="btn-search-map" disabled={searching || !searchInput.trim()}>
            {searching ? (
              <span className="map-btn-inline">
                <Loader2 size={14} className="spinning" />
                <span>Searching...</span>
              </span>
            ) : (
              'Search'
            )}
          </button>

          <button
            type="button"
            className="btn-near-me"
            onClick={handleLocateMe}
            title="Center map on my live browser location"
          >
            <LocateFixed size={15} className={gpsStatus === 'locating' ? 'spinning' : ''} />
            <span>{gpsStatus === 'locating' ? 'Locating...' : 'My Location'}</span>
          </button>
        </form>

        {/* Optional quick-pick pills when search returns multiple matches */}
        {searchResults.length > 1 && (
          <div className="filter-chips-row">
            <span className="chips-label">Matches:</span>
            {searchResults.map((place) => (
              <button
                key={place.id}
                type="button"
                className={`chip-btn ${selectedPlace?.id === place.id ? 'active' : ''}`}
                onClick={() => handlePickSearchResult(place)}
                title={place.subtitle}
              >
                <MapPin size={11} style={{ marginRight: 4, verticalAlign: '-1px' }} />
                {place.title}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Geolocation / Search Status Notice */}
      {(gpsError || searchError) && (
        <div className="gmp-inline-notice" role="status">
          <span>{searchError || gpsError}</span>
          {gpsStatus === 'denied' && !searchError && (
            <button type="button" onClick={handleLocateMe} className="gmp-retry-link">
              Retry GPS
            </button>
          )}
        </div>
      )}

      {/* Map Only (with Live Location & Search Pin) */}
      <div className="map-frame-wrapper">
        <div className="map-frame-header">
          <div className="gmp-status-left">
            <span
              className={`gmp-gps-dot ${
                gpsStatus === 'tracking'
                  ? 'live'
                  : gpsStatus === 'locating'
                  ? 'locating'
                  : 'idle'
              }`}
            />
            <span className="active-query-text">
              {gpsStatus === 'tracking' && userLocation ? (
                <>
                  <strong>My Live Location</strong> ({userLocation.lat.toFixed(4)},{' '}
                  {userLocation.lng.toFixed(4)}
                  {userLocation.accuracy ? ` • ±${Math.round(userLocation.accuracy)}m` : ''})
                </>
              ) : gpsStatus === 'locating' ? (
                <strong>Detecting your browser location...</strong>
              ) : selectedPlace ? (
                <>
                  <strong>Showing:</strong> {selectedPlace.title}
                </>
              ) : (
                <strong>Search a place above or allow browser location</strong>
              )}
            </span>
          </div>

          <div className="gmp-header-actions">
            <button
              type="button"
              className={`gmp-live-toggle ${trackingEnabled && gpsStatus === 'tracking' ? 'is-live' : ''}`}
              onClick={() => setTrackingEnabled((prev) => !prev)}
              title={trackingEnabled ? 'Pause live browser GPS tracking' : 'Resume live browser GPS tracking'}
            >
              {trackingEnabled ? <Pause size={12} /> : <Play size={12} />}
              <span>{trackingEnabled ? 'Live GPS On' : 'GPS Paused'}</span>
            </button>

            {userLocation && !followUser && (
              <button
                type="button"
                className="gmp-recenter-btn"
                onClick={() => {
                  setFollowUser(true);
                  if (mapInstanceRef.current) {
                    mapInstanceRef.current.flyTo([userLocation.lat, userLocation.lng], 15, {
                      duration: 0.6,
                    });
                  }
                }}
              >
                <Compass size={12} />
                <span>Recenter</span>
              </button>
            )}

            {mode === 'compact' && onOpenFullMap && (
              <button type="button" className="gmp-expand-btn" onClick={onOpenFullMap}>
                <span>Full Map</span>
                <ExternalLink size={12} />
              </button>
            )}
          </div>
        </div>

        <div className={`gmp-map-canvas-shell ${mode === 'compact' ? 'is-compact' : 'is-full'}`}>
          <div ref={mapContainerRef} className="free-leaflet-map" />
        </div>
      </div>
    </div>
  );
}
