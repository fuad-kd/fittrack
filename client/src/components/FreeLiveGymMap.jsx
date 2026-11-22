import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Clock,
  Compass,
  Dumbbell,
  ExternalLink,
  Loader2,
  LocateFixed,
  MapPin,
  Navigation,
  Pause,
  Play,
  Radar,
  Search,
  X,
} from 'lucide-react';

const DEFAULT_CENTER = { lat: 40.758, lng: -73.9855 };
const LAST_GPS_STORAGE_KEY = 'fittrack_last_browser_gps';
const RADIUS_OPTIONS_KM = [1, 2, 5, 10, 25];
const CATEGORY_FILTERS = ['All', '24/7 Gym', 'CrossFit Box', 'Powerlifting', 'Yoga Studio'];

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

function haversineKm(a, b) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h =
    sinLat * sinLat +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinLng * sinLng;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function buildGoogleDirectionsUrl(lat, lng) {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

function classifyGym(tags = {}) {
  const name = (tags.name || '').toLowerCase();
  const sport = (tags.sport || '').toLowerCase();
  const hours = (tags.opening_hours || '').toLowerCase();
  const desc = (tags.description || '').toLowerCase();
  const combined = `${name} ${sport} ${desc}`;

  const is24Hours = hours.includes('24/7');

  if (combined.includes('crossfit')) {
    return { category: 'CrossFit Box', is24Hours };
  }
  if (
    combined.includes('powerlifting') ||
    combined.includes('weightlifting') ||
    combined.includes('barbell') ||
    combined.includes('strength')
  ) {
    return { category: 'Powerlifting', is24Hours };
  }
  if (combined.includes('yoga') || combined.includes('pilates')) {
    return { category: 'Yoga Studio', is24Hours };
  }
  if (is24Hours) {
    return { category: '24/7 Gym', is24Hours: true };
  }
  return { category: 'Gym / Fitness', is24Hours: false };
}

function formatOsmAddress(tags = {}, lat, lng) {
  const streetLine = [tags['addr:housenumber'], tags['addr:street']].filter(Boolean).join(' ');
  const cityLine = [tags['addr:city'] || tags['addr:suburb'], tags['addr:postcode']]
    .filter(Boolean)
    .join(', ');
  const full = [streetLine, cityLine].filter(Boolean).join(', ');
  if (full) return full;
  if (tags['addr:full']) return tags['addr:full'];
  return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
}

async function fetchNearbyGymsOverpass(center, radiusKm, originForDistance, signal) {
  const radiusMeters = Math.round(radiusKm * 1000);
  const query = `
[out:json][timeout:18];
(
  node["leisure"="fitness_centre"](around:${radiusMeters},${center.lat},${center.lng});
  way["leisure"="fitness_centre"](around:${radiusMeters},${center.lat},${center.lng});
  node["amenity"="gym"](around:${radiusMeters},${center.lat},${center.lng});
  way["amenity"="gym"](around:${radiusMeters},${center.lat},${center.lng});
  node["sport"~"fitness|weightlifting|powerlifting|crossfit|yoga",i](around:${radiusMeters},${center.lat},${center.lng});
  way["sport"~"fitness|weightlifting|powerlifting|crossfit|yoga",i](around:${radiusMeters},${center.lat},${center.lng});
);
out center 60;
`.trim();

  const endpoints = [
    'https://overpass-api.de/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter',
  ];

  let data = null;
  let lastError = null;

  for (const endpoint of endpoints) {
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
          Accept: 'application/json',
        },
        body: `data=${encodeURIComponent(query)}`,
        signal,
      });
      if (!res.ok) {
        lastError = new Error(`Overpass returned ${res.status}`);
        continue;
      }
      data = await res.json();
      break;
    } catch (err) {
      if (err.name === 'AbortError') throw err;
      lastError = err;
    }
  }

  if (!data) {
    throw lastError || new Error('Failed to load nearby gyms.');
  }

  const elements = Array.isArray(data.elements) ? data.elements : [];
  const seen = new Set();
  const gyms = [];
  const refPoint = originForDistance || center;

  for (const el of elements) {
    const lat = typeof el.lat === 'number' ? el.lat : el.center?.lat;
    const lng = typeof el.lon === 'number' ? el.lon : el.center?.lon;
    if (typeof lat !== 'number' || typeof lng !== 'number') continue;

    const tags = el.tags || {};
    const name = tags.name || tags.brand || tags.operator || 'Fitness Center';
    const dedupKey = `${name.toLowerCase()}_${lat.toFixed(4)}_${lng.toFixed(4)}`;
    if (seen.has(dedupKey)) continue;
    seen.add(dedupKey);

    const { category, is24Hours } = classifyGym(tags);
    const distanceKm = haversineKm(refPoint, { lat, lng });

    gyms.push({
      id: `${el.type}_${el.id}`,
      name,
      lat,
      lng,
      address: formatOsmAddress(tags, lat, lng),
      openingHours: tags.opening_hours || (is24Hours ? 'Open 24/7' : ''),
      category,
      is24Hours,
      distanceKm,
      phone: tags.phone || tags['contact:phone'] || '',
      website: tags.website || tags['contact:website'] || '',
    });
  }

  gyms.sort((a, b) => a.distanceKm - b.distanceKm);
  return gyms;
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

function createGymPinIcon(isSelected) {
  return L.divIcon({
    className: `free-gym-pin-wrapper ${isSelected ? 'is-selected' : ''}`,
    html: `<div class="free-gym-pin ${isSelected ? 'is-selected' : ''}">
      <span class="free-gym-pin-dot"></span>
    </div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 26],
    popupAnchor: [0, -24],
  });
}

function createSearchPinIcon() {
  return L.divIcon({
    className: 'free-gym-pin-wrapper is-search-pin',
    html: `<div class="free-gym-pin is-search-pin">
      <span class="free-gym-pin-dot"></span>
    </div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 26],
    popupAnchor: [0, -24],
  });
}

export default function FreeLiveGymMap({ mode = 'full', onOpenFullMap }) {
  const cachedGps = useMemo(() => loadCachedGps(), []);
  const initialCenter = cachedGps || DEFAULT_CENTER;

  const [searchInput, setSearchInput] = useState('');
  const [searchingPlace, setSearchingPlace] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searchedPlace, setSearchedPlace] = useState(null);

  const [userLocation, setUserLocation] = useState(cachedGps);
  const [searchCenter, setSearchCenter] = useState(initialCenter);
  const [radiusKm, setRadiusKm] = useState(5);
  const [selectedCategory, setSelectedCategory] = useState('All');

  const [gyms, setGyms] = useState([]);
  const [loadingGyms, setLoadingGyms] = useState(false);
  const [gymError, setGymError] = useState('');
  const [selectedGymId, setSelectedGymId] = useState(null);

  const [trackingEnabled, setTrackingEnabled] = useState(true);
  const [followUser, setFollowUser] = useState(true);
  const [gpsStatus, setGpsStatus] = useState('locating');
  const [gpsError, setGpsError] = useState('');

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const userMarkerRef = useRef(null);
  const accuracyCircleRef = useRef(null);
  const radiusCircleRef = useRef(null);
  const gymMarkersLayerRef = useRef(null);
  const gymMarkerMapRef = useRef(new Map());
  const searchMarkerRef = useRef(null);
  const watchIdRef = useRef(null);
  const overpassAbortRef = useRef(null);
  const nominatimAbortRef = useRef(null);
  const hasCenteredInitialRef = useRef(Boolean(cachedGps));
  const userLocationRef = useRef(cachedGps);

  useEffect(() => {
    userLocationRef.current = userLocation;
  }, [userLocation]);

  // Initialize Leaflet map with standard watermark-free OpenStreetMap tiles
  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container || mapInstanceRef.current) return;

    const map = L.map(container, {
      center: [initialCenter.lat, initialCenter.lng],
      zoom: cachedGps ? 14 : 13,
      zoomControl: true,
      attributionControl: true,
    });

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    const gymLayer = L.layerGroup().addTo(map);
    gymMarkersLayerRef.current = gymLayer;
    mapInstanceRef.current = map;

    map.on('dragstart', () => {
      setFollowUser(false);
    });

    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    resizeObserver.observe(container);

    const markerMap = gymMarkerMapRef.current;

    return () => {
      resizeObserver.disconnect();
      markerMap.clear();
      map.remove();
      mapInstanceRef.current = null;
      userMarkerRef.current = null;
      accuracyCircleRef.current = null;
      radiusCircleRef.current = null;
      gymMarkersLayerRef.current = null;
      searchMarkerRef.current = null;
    };
  }, [cachedGps, initialCenter.lat, initialCenter.lng]);

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
      setGpsError('Browser geolocation is not supported. Search a city or gym above.');
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

      if (!hasCenteredInitialRef.current) {
        hasCenteredInitialRef.current = true;
        setSearchCenter({ lat: nextPos.lat, lng: nextPos.lng });
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([nextPos.lat, nextPos.lng], 14, { animate: true });
        }
      }
    };

    const handleGeoError = (err) => {
      console.warn('Browser geolocation issue:', err);
      setGpsStatus('denied');
      if (err.code === 1) {
        setGpsError(
          'Location permission denied. Allow browser location access or search any city above.'
        );
      } else {
        setGpsError('Unable to read live GPS right now. You can search any location above.');
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

  // Load nearby gyms via Overpass API whenever searchCenter or radiusKm changes
  const runOverpassSearch = useCallback(async (center, radius) => {
    if (overpassAbortRef.current) {
      overpassAbortRef.current.abort();
    }
    const controller = new AbortController();
    overpassAbortRef.current = controller;

    setLoadingGyms(true);
    setGymError('');

    try {
      const origin = userLocationRef.current || center;
      const results = await fetchNearbyGymsOverpass(center, radius, origin, controller.signal);
      setGyms(results);
      if (results.length > 0) {
        setSelectedGymId((prev) => (results.some((g) => g.id === prev) ? prev : null));
      } else {
        setSelectedGymId(null);
      }
    } catch (err) {
      if (err.name === 'AbortError') return;
      console.warn('Overpass gym lookup issue:', err);
      setGymError('Could not load nearby gyms right now. Click "Search This Area" to retry.');
    } finally {
      setLoadingGyms(false);
    }
  }, []);

  useEffect(() => {
    runOverpassSearch(searchCenter, radiusKm);
    return () => {
      if (overpassAbortRef.current) {
        overpassAbortRef.current.abort();
      }
    };
  }, [searchCenter, radiusKm, runOverpassSearch]);

  // Filter gyms by selected category and optional text filter
  const filteredGyms = useMemo(() => {
    return gyms.filter((gym) => {
      if (selectedCategory === 'All') return true;
      if (selectedCategory === '24/7 Gym') {
        return gym.is24Hours || gym.category === '24/7 Gym';
      }
      return gym.category === selectedCategory;
    });
  }, [gyms, selectedCategory]);

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
          `Your Live Location (${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)})`,
          { direction: 'top' }
        )
        .addTo(map);
    } else {
      userMarkerRef.current.setLatLng(latLng);
    }

    if (userLocation.accuracy) {
      const clampedAcc = Math.min(Math.max(userLocation.accuracy, 15), 1200);
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

  // Update Amber Search Radius Circle
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const latLng = [searchCenter.lat, searchCenter.lng];
    const radiusMeters = radiusKm * 1000;

    if (!radiusCircleRef.current) {
      radiusCircleRef.current = L.circle(latLng, {
        radius: radiusMeters,
        color: '#f59e0b',
        weight: 1.5,
        opacity: 0.65,
        fillColor: '#f59e0b',
        fillOpacity: 0.08,
        dashArray: '6 6',
        interactive: false,
      }).addTo(map);
    } else {
      radiusCircleRef.current.setLatLng(latLng);
      radiusCircleRef.current.setRadius(radiusMeters);
    }
  }, [searchCenter, radiusKm]);

  // Update Gym Markers & Popups with Gold "Google Maps Directions" button
  useEffect(() => {
    const layer = gymMarkersLayerRef.current;
    if (!layer) return;

    layer.clearLayers();
    gymMarkerMapRef.current.clear();

    filteredGyms.forEach((gym) => {
      const isSelected = gym.id === selectedGymId;
      const directionsUrl = buildGoogleDirectionsUrl(gym.lat, gym.lng);

      const popupHtml = `
        <div class="gmp-infowindow-card">
          <h4>${escapeHtml(gym.name)}</h4>
          <p class="gmp-iw-meta">${escapeHtml(gym.category)} • ${gym.distanceKm.toFixed(2)} km away</p>
          <p class="gmp-iw-address">${escapeHtml(gym.address)}</p>
          ${gym.openingHours ? `<p class="gmp-iw-hours">Hours: ${escapeHtml(gym.openingHours)}</p>` : ''}
          <div class="gmp-iw-actions">
            <a
              href="${escapeHtml(directionsUrl)}"
              target="_blank"
              rel="noopener noreferrer"
              class="gmp-iw-gmaps-btn"
            >
              Google Maps Directions &nearr;
            </a>
          </div>
        </div>
      `;

      const marker = L.marker([gym.lat, gym.lng], {
        icon: createGymPinIcon(isSelected),
        zIndexOffset: isSelected ? 1050 : 900,
      })
        .bindPopup(popupHtml, { maxWidth: 280 })
        .on('click', () => {
          setFollowUser(false);
          setSelectedGymId(gym.id);
        });

      marker.addTo(layer);
      gymMarkerMapRef.current.set(gym.id, marker);

      if (isSelected) {
        marker.openPopup();
      }
    });
  }, [filteredGyms, selectedGymId]);

  // Update Searched Place Pin (when user searches a specific address/city)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (!searchedPlace) {
      if (searchMarkerRef.current) {
        searchMarkerRef.current.remove();
        searchMarkerRef.current = null;
      }
      return;
    }

    const directionsUrl = buildGoogleDirectionsUrl(searchedPlace.lat, searchedPlace.lng);
    const popupHtml = `
      <div class="gmp-infowindow-card">
        <h4>${escapeHtml(searchedPlace.title)}</h4>
        ${searchedPlace.subtitle ? `<p class="gmp-iw-address">${escapeHtml(searchedPlace.subtitle)}</p>` : ''}
        <div class="gmp-iw-actions">
          <a
            href="${escapeHtml(directionsUrl)}"
            target="_blank"
            rel="noopener noreferrer"
            class="gmp-iw-gmaps-btn"
          >
            Google Maps Directions &nearr;
          </a>
        </div>
      </div>
    `;

    if (!searchMarkerRef.current) {
      searchMarkerRef.current = L.marker([searchedPlace.lat, searchedPlace.lng], {
        icon: createSearchPinIcon(),
        zIndexOffset: 1000,
      })
        .bindPopup(popupHtml, { maxWidth: 280 })
        .addTo(map);
    } else {
      searchMarkerRef.current.setLatLng([searchedPlace.lat, searchedPlace.lng]);
      searchMarkerRef.current.setPopupContent(popupHtml);
    }
  }, [searchedPlace]);

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
        setSearchedPlace(null);
        setSearchCenter({ lat: nextPos.lat, lng: nextPos.lng });
        try {
          localStorage.setItem(LAST_GPS_STORAGE_KEY, JSON.stringify(nextPos));
        } catch {
          // ignore
        }
        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([nextPos.lat, nextPos.lng], 14, { duration: 0.65 });
        }
      },
      (err) => {
        console.warn('Manual geolocation failed:', err);
        setGpsStatus('denied');
        setGpsError(
          'Location access was blocked. Allow browser location permission or search a city above.'
        );
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSearchSubmit = async (e) => {
    e.preventDefault();
    const trimmed = searchInput.trim();
    if (!trimmed) return;

    if (nominatimAbortRef.current) {
      nominatimAbortRef.current.abort();
    }
    const controller = new AbortController();
    nominatimAbortRef.current = controller;

    setSearchingPlace(true);
    setGymError('');

    try {
      const results = await searchPlacesNominatim(trimmed, searchCenter, controller.signal);
      if (results.length === 0) {
        setSearchResults([]);
        setGymError(`No location found for "${trimmed}". Try a city, street, or neighborhood.`);
        return;
      }

      setSearchResults(results);
      const top = results[0];
      setFollowUser(false);
      setSearchedPlace(top);
      setSearchCenter({ lat: top.lat, lng: top.lng });
      if (mapInstanceRef.current) {
        mapInstanceRef.current.flyTo([top.lat, top.lng], 14, { duration: 0.7 });
      }
    } catch (err) {
      if (err.name === 'AbortError') return;
      console.warn('Map place search error:', err);
      setGymError('Could not search that place right now. Please try again.');
    } finally {
      setSearchingPlace(false);
    }
  };

  const handlePickSearchResult = (place) => {
    setFollowUser(false);
    setSearchedPlace(place);
    setSearchCenter({ lat: place.lat, lng: place.lng });
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([place.lat, place.lng], 14, { duration: 0.6 });
    }
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setSearchResults([]);
    setSearchedPlace(null);
    setGymError('');
    if (userLocation && mapInstanceRef.current) {
      setFollowUser(true);
      setSearchCenter({ lat: userLocation.lat, lng: userLocation.lng });
      mapInstanceRef.current.flyTo([userLocation.lat, userLocation.lng], 14, { duration: 0.6 });
    }
  };

  const handleSearchThisArea = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    const c = map.getCenter();
    setFollowUser(false);
    setSearchCenter({ lat: c.lat, lng: c.lng });
  };

  const handleSelectGymCard = (gym) => {
    setFollowUser(false);
    setSelectedGymId(gym.id);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([gym.lat, gym.lng], 15, { duration: 0.55 });
    }
    const marker = gymMarkerMapRef.current.get(gym.id);
    if (marker) {
      marker.openPopup();
    }
  };

  const displayedGyms = mode === 'compact' ? filteredGyms.slice(0, 4) : filteredGyms;

  return (
    <div className={`google-gym-locator ${mode === 'compact' ? 'compact-mode' : 'full-mode'}`}>
      {/* Search, Radius & Category Controls */}
      <div className="gmp-controls-bar">
        <form onSubmit={handleSearchSubmit} className="map-search-form">
          <div className="search-field-wrap">
            <Search size={17} className="search-icon" />
            <input
              type="text"
              placeholder="Search any city, neighborhood, address, or gym..."
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                setGymError('');
              }}
            />
            {(searchInput || searchedPlace) && (
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

          <button
            type="submit"
            className="btn-search-map"
            disabled={searchingPlace || !searchInput.trim()}
          >
            {searchingPlace ? (
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

        {searchResults.length > 1 && (
          <div className="filter-chips-row">
            <span className="chips-label">Area Matches:</span>
            {searchResults.map((place) => (
              <button
                key={place.id}
                type="button"
                className={`chip-btn ${searchedPlace?.id === place.id ? 'active' : ''}`}
                onClick={() => handlePickSearchResult(place)}
                title={place.subtitle}
              >
                <MapPin size={11} style={{ marginRight: 4, verticalAlign: '-1px' }} />
                {place.title}
              </button>
            ))}
          </div>
        )}

        <div className="gmp-meta-controls">
          <div className="filter-chips-row">
            <span className="chips-label">Type:</span>
            {CATEGORY_FILTERS.map((cat) => (
              <button
                key={cat}
                type="button"
                className={`chip-btn ${selectedCategory === cat ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="gmp-tracking-controls">
            <label className="gmp-radius-select-wrap">
              <span>Radius:</span>
              <select
                value={radiusKm}
                onChange={(e) => setRadiusKm(Number(e.target.value))}
                aria-label="Search radius in kilometers"
              >
                {RADIUS_OPTIONS_KM.map((km) => (
                  <option key={km} value={km}>
                    {km} km
                  </option>
                ))}
              </select>
            </label>

            <button
              type="button"
              className={`gmp-live-toggle ${trackingEnabled && gpsStatus === 'tracking' ? 'is-live' : ''}`}
              onClick={() => setTrackingEnabled((prev) => !prev)}
              title={
                trackingEnabled ? 'Pause live browser GPS tracking' : 'Resume live browser GPS tracking'
              }
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
                  setSearchCenter({ lat: userLocation.lat, lng: userLocation.lng });
                  if (mapInstanceRef.current) {
                    mapInstanceRef.current.flyTo([userLocation.lat, userLocation.lng], 14, {
                      duration: 0.6,
                    });
                  }
                }}
              >
                <Compass size={12} />
                <span>Recenter</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Geolocation or Overpass Notice */}
      {(gpsError || gymError) && (
        <div className="gmp-inline-notice" role="status">
          <span>{gymError || gpsError}</span>
          {gpsStatus === 'denied' && !gymError && (
            <button type="button" onClick={handleLocateMe} className="gmp-retry-link">
              Retry GPS
            </button>
          )}
        </div>
      )}

      {/* Map Canvas */}
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
                  <strong>Live GPS</strong> ({userLocation.lat.toFixed(4)},{' '}
                  {userLocation.lng.toFixed(4)}
                  {userLocation.accuracy ? ` • ±${Math.round(userLocation.accuracy)}m` : ''})
                </>
              ) : gpsStatus === 'locating' ? (
                <strong>Detecting your browser location...</strong>
              ) : searchedPlace ? (
                <>
                  <strong>Viewing:</strong> {searchedPlace.title}
                </>
              ) : (
                <strong>Showing gyms within {radiusKm} km</strong>
              )}
            </span>
          </div>

          <div className="gmp-header-actions">
            <button
              type="button"
              className="gmp-search-area-btn"
              onClick={handleSearchThisArea}
              disabled={loadingGyms}
              title="Discover gyms within the current map view"
            >
              {loadingGyms ? (
                <Loader2 size={12} className="spinning" />
              ) : (
                <Radar size={12} />
              )}
              <span>{loadingGyms ? 'Scanning...' : 'Search This Area'}</span>
            </button>

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

      {/* Nearby Gyms List */}
      <div className="curated-gyms-section">
        <div className="section-title-row">
          <div>
            <h3>
              Nearby Gyms &amp; Training Studios{' '}
              {loadingGyms ? '(Scanning...)' : `(${filteredGyms.length})`}
            </h3>
            <span>
              Within {radiusKm} km • Free OpenStreetMap + Overpass discovery with Google Maps
              navigation
            </span>
          </div>
        </div>

        {loadingGyms && gyms.length === 0 ? (
          <div className="gmp-empty-gyms">
            <Loader2 size={24} className="spinning" />
            <p>Scanning nearby fitness centers, CrossFit boxes, and gyms...</p>
          </div>
        ) : displayedGyms.length === 0 ? (
          <div className="gmp-empty-gyms">
            <Dumbbell size={24} />
            <p>
              No matching gyms found within {radiusKm} km
              {selectedCategory !== 'All' ? ` for "${selectedCategory}"` : ''}. Try increasing the
              radius, switching to &ldquo;All&rdquo;, or pan the map and click &ldquo;Search This
              Area&rdquo;.
            </p>
          </div>
        ) : (
          <div className="gyms-cards-grid">
            {displayedGyms.map((gym) => {
              const isSelected = gym.id === selectedGymId;
              const directionsUrl = buildGoogleDirectionsUrl(gym.lat, gym.lng);
              return (
                <div
                  key={gym.id}
                  className={`gym-card-tile ${isSelected ? 'is-selected' : ''}`}
                  onClick={() => handleSelectGymCard(gym)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleSelectGymCard(gym);
                    }
                  }}
                >
                  <div className="gym-tile-top">
                    <span className="gym-type-tag">{gym.category}</span>
                    {gym.is24Hours && <span className="gym-24h-pill">24/7</span>}
                  </div>

                  <h4 className="gym-name">{gym.name}</h4>

                  <p className="gym-address">
                    <MapPin size={14} className="pin-icon" />
                    <span>{gym.address}</span>
                  </p>

                  <div className="gym-info-chips">
                    <span className="info-chip distance">{gym.distanceKm.toFixed(2)} km away</span>
                    {gym.openingHours && (
                      <span className="info-chip status">{gym.openingHours}</span>
                    )}
                  </div>

                  <div className="gym-card-footer">
                    <span className="gym-hours">
                      <Clock size={13} />
                      <span>{gym.openingHours || 'Hours not listed'}</span>
                    </span>

                    <a
                      href={directionsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-google-directions"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Navigation size={13} />
                      <span>Google Maps Directions</span>
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
