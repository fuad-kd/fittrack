import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Clock,
  Compass,
  ExternalLink,
  Loader2,
  LocateFixed,
  MapPin,
  Navigation,
  Pause,
  Play,
  RefreshCw,
  Search,
} from 'lucide-react';

const DEFAULT_CENTER = { lat: 40.758, lng: -73.9855 };
const LAST_GPS_STORAGE_KEY = 'fittrack_last_browser_gps';

const FACILITY_FILTERS = ['All', '24/7 Gym', 'CrossFit Box', 'Powerlifting', 'Yoga Studio'];

const RADIUS_OPTIONS = [
  { label: '1 km', meters: 1000 },
  { label: '2 km', meters: 2000 },
  { label: '5 km', meters: 5000 },
  { label: '10 km', meters: 10000 },
  { label: '25 km', meters: 25000 },
];

const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
];

function haversineMeters(a, b) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h =
    sinLat * sinLat +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinLng * sinLng;
  return 2 * R * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function formatDistance(meters) {
  if (typeof meters !== 'number' || !Number.isFinite(meters)) return null;
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildDirectionsUrl(gym, userLocation) {
  const dest = `${gym.position.lat},${gym.position.lng}`;
  const params = new URLSearchParams({
    api: '1',
    destination: dest,
  });
  if (userLocation) {
    params.set('origin', `${userLocation.lat},${userLocation.lng}`);
  }
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

function buildOsmUrl(gym) {
  return `https://www.openstreetmap.org/?mlat=${gym.position.lat}&mlon=${gym.position.lng}#map=17/${gym.position.lat}/${gym.position.lng}`;
}

function classifyGym(tags = {}) {
  const combined = `${tags.name || ''} ${tags.sport || ''} ${tags.description || ''}`.toLowerCase();
  const is24 = tags.opening_hours === '24/7';
  if (combined.includes('crossfit')) return 'CrossFit Box';
  if (combined.includes('yoga') || combined.includes('pilates')) return 'Yoga Studio';
  if (
    combined.includes('powerlift') ||
    combined.includes('weightlift') ||
    combined.includes('barbell') ||
    combined.includes('strength')
  ) {
    return 'Powerlifting';
  }
  if (is24) return '24/7 Gym';
  return 'Gym & Fitness';
}

function matchesFacilityFilter(gym, filter) {
  if (filter === 'All') return true;
  if (filter === '24/7 Gym') {
    return gym.is24Hours || gym.typeLabel === '24/7 Gym' || gym.name.toLowerCase().includes('24');
  }
  return gym.typeLabel === filter;
}

function formatOsmAddress(tags = {}) {
  if (tags['addr:full']) return tags['addr:full'];
  const streetLine = [tags['addr:housenumber'], tags['addr:street']].filter(Boolean).join(' ');
  const areaLine = [
    tags['addr:suburb'] || tags['addr:neighbourhood'],
    tags['addr:city'] || tags['addr:town'],
  ]
    .filter(Boolean)
    .join(', ');
  const combined = [streetLine, areaLine].filter(Boolean).join(', ');
  return combined || 'Nearby training facility';
}

function normalizeOverpassElements(elements, origin) {
  const seen = new Set();
  const gyms = [];

  for (const el of elements || []) {
    const lat = el.lat ?? el.center?.lat;
    const lng = el.lon ?? el.center?.lon;
    if (typeof lat !== 'number' || typeof lng !== 'number') continue;

    const tags = el.tags || {};
    const rawName = tags.name || tags['name:en'] || tags.brand || tags.operator || '';
    const isExplicitGym = tags.leisure === 'fitness_centre' || tags.amenity === 'gym';
    if (!rawName && !isExplicitGym) continue;

    const name = rawName.trim() || 'Local Fitness Center';
    const dedupKey = `${name.toLowerCase()}_${lat.toFixed(4)}_${lng.toFixed(4)}`;
    if (seen.has(dedupKey)) continue;
    seen.add(dedupKey);

    const pos = { lat, lng };
    const distanceMeters = origin ? haversineMeters(origin, pos) : null;

    gyms.push({
      id: `osm-${el.type}-${el.id}`,
      name,
      position: pos,
      address: formatOsmAddress(tags),
      typeLabel: classifyGym(tags),
      is24Hours: tags.opening_hours === '24/7',
      todayHours: tags.opening_hours || null,
      phone: tags.phone || tags['contact:phone'] || null,
      website: tags.website || tags['contact:website'] || null,
      distanceMeters,
    });
  }

  return gyms.sort((a, b) => (a.distanceMeters ?? Infinity) - (b.distanceMeters ?? Infinity));
}

async function fetchOverpassGyms(center, radiusMeters, signal) {
  const radius = Math.min(Math.max(Number(radiusMeters) || 5000, 500), 25000);
  const { lat, lng } = center;

  const query = `
[out:json][timeout:15];
(
  node["leisure"="fitness_centre"](around:${radius},${lat},${lng});
  way["leisure"="fitness_centre"](around:${radius},${lat},${lng});
  relation["leisure"="fitness_centre"](around:${radius},${lat},${lng});
  node["amenity"="gym"](around:${radius},${lat},${lng});
  way["amenity"="gym"](around:${radius},${lat},${lng});
  node["leisure"="sports_centre"]["sport"~"fitness|weightlifting|crossfit|gym|bodybuilding|yoga|boxing|martial_arts",i](around:${radius},${lat},${lng});
  way["leisure"="sports_centre"]["sport"~"fitness|weightlifting|crossfit|gym|bodybuilding|yoga|boxing|martial_arts",i](around:${radius},${lat},${lng});
);
out center tags 80;
`.trim();

  let lastError = null;
  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
        body: `data=${encodeURIComponent(query)}`,
        signal,
      });
      if (!response.ok) {
        lastError = new Error(`Overpass returned HTTP ${response.status}`);
        continue;
      }
      const data = await response.json();
      return data?.elements || [];
    } catch (err) {
      if (err.name === 'AbortError') throw err;
      lastError = err;
    }
  }
  throw lastError || new Error('Could not reach OpenStreetMap gym directory.');
}

async function geocodePlaceNominatim(queryText, nearCenter, signal) {
  const params = new URLSearchParams({
    format: 'json',
    limit: '5',
    q: queryText,
  });
  if (nearCenter) {
    const d = 0.25;
    params.set(
      'viewbox',
      `${nearCenter.lng - d},${nearCenter.lat + d},${nearCenter.lng + d},${nearCenter.lat - d}`
    );
  }
  const res = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
    headers: { Accept: 'application/json' },
    signal,
  });
  if (!res.ok) throw new Error('Area search failed.');
  const items = await res.json();
  if (!Array.isArray(items) || items.length === 0) return null;
  const first = items[0];
  return {
    lat: Number(first.lat),
    lng: Number(first.lon),
    label: first.display_name?.split(',').slice(0, 2).join(', ') || queryText,
  };
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

function createGymPinIcon(isSelected) {
  return L.divIcon({
    className: `free-gym-pin-wrapper ${isSelected ? 'is-selected' : ''}`,
    html: `<div class="free-gym-pin ${isSelected ? 'is-selected' : ''}">
      <span class="free-gym-pin-dot"></span>
    </div>`,
    iconSize: isSelected ? [32, 32] : [26, 26],
    iconAnchor: isSelected ? [16, 30] : [13, 24],
    popupAnchor: [0, -26],
  });
}

export default function FreeLiveGymMap({ mode = 'full', onOpenFullMap }) {
  const cachedGps = useMemo(() => loadCachedGps(), []);

  const [searchInput, setSearchInput] = useState('');
  const [appliedNameFilter, setAppliedNameFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [radiusMeters, setRadiusMeters] = useState(5000);

  const [userLocation, setUserLocation] = useState(cachedGps);
  const [trackingEnabled, setTrackingEnabled] = useState(true);
  const [followUser, setFollowUser] = useState(true);
  const [gpsStatus, setGpsStatus] = useState(cachedGps ? 'locating' : 'locating');
  const [gpsError, setGpsError] = useState('');

  const [searchCenter, setSearchCenter] = useState(
    cachedGps ? { lat: cachedGps.lat, lng: cachedGps.lng } : null
  );
  const [pannedCenter, setPannedCenter] = useState(null);
  const [activeQueryLabel, setActiveQueryLabel] = useState(
    cachedGps ? 'Refreshing your live GPS position...' : 'Waiting for browser location...'
  );

  const [rawGyms, setRawGyms] = useState([]);
  const [searchingPlaces, setSearchingPlaces] = useState(false);
  const [placesError, setPlacesError] = useState('');
  const [selectedGymId, setSelectedGymId] = useState(null);

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const userMarkerRef = useRef(null);
  const searchPinMarkerRef = useRef(null);
  const accuracyCircleRef = useRef(null);
  const radiusCircleRef = useRef(null);
  const gymLayerGroupRef = useRef(null);
  const gymMarkersMapRef = useRef(new Map());

  const watchIdRef = useRef(null);
  const lastAutoSearchPosRef = useRef(cachedGps ? { lat: cachedGps.lat, lng: cachedGps.lng } : null);
  const searchAbortRef = useRef(null);
  const searchSeqRef = useRef(0);
  const lastMapClickRef = useRef(0);

  // Initialize Leaflet map instance
  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container || mapInstanceRef.current) return;

    const initialCenter = cachedGps
      ? [cachedGps.lat, cachedGps.lng]
      : [DEFAULT_CENTER.lat, DEFAULT_CENTER.lng];

    const map = L.map(container, {
      center: initialCenter,
      zoom: cachedGps ? 14 : 12,
      zoomControl: true,
      attributionControl: true,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap &copy; CARTO',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map);

    const gymLayer = L.layerGroup().addTo(map);
    gymLayerGroupRef.current = gymLayer;
    mapInstanceRef.current = map;

    map.on('dragend', () => {
      const c = map.getCenter();
      if (c) {
        setFollowUser(false);
        setPannedCenter({ lat: c.lat, lng: c.lng });
      }
    });

    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    resizeObserver.observe(container);
    const markersMap = gymMarkersMapRef.current;

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapInstanceRef.current = null;
      userMarkerRef.current = null;
      searchPinMarkerRef.current = null;
      accuracyCircleRef.current = null;
      radiusCircleRef.current = null;
      gymLayerGroupRef.current = null;
      markersMap.clear();
    };
  }, [cachedGps]);

  const runNearbyGymSearch = useCallback(
    async ({ center, radius = radiusMeters, livePos = userLocation, labelOverride = null }) => {
      if (!center) return;

      if (searchAbortRef.current) {
        searchAbortRef.current.abort();
      }
      const controller = new AbortController();
      searchAbortRef.current = controller;
      const reqSeq = ++searchSeqRef.current;

      setSearchingPlaces(true);
      setPlacesError('');

      try {
        const elements = await fetchOverpassGyms(center, radius, controller.signal);
        if (reqSeq !== searchSeqRef.current) return;

        const referenceOrigin = livePos || center;
        const normalized = normalizeOverpassElements(elements, referenceOrigin).filter(
          (g) => g.distanceMeters == null || g.distanceMeters <= radius * 1.15
        );

        setRawGyms(normalized);
        setPannedCenter(null);
        setSelectedGymId(null);

        const kmLabel = radius < 1000 ? `${radius} m` : `${(radius / 1000).toFixed(0)} km`;
        setActiveQueryLabel(labelOverride || `Nearby gyms within ${kmLabel}`);
      } catch (err) {
        if (err.name === 'AbortError' || reqSeq !== searchSeqRef.current) return;
        console.warn('Overpass nearby gym lookup failed:', err);
        setPlacesError('Could not fetch nearby gym directory right now. Click Search or Near Me to retry.');
      } finally {
        if (reqSeq === searchSeqRef.current) {
          setSearchingPlaces(false);
        }
      }
    },
    [radiusMeters, userLocation]
  );

  // Live Browser Geolocation tracking (no API key required)
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
      setGpsError('Browser geolocation is unavailable. Search your city above or click on the map to set your location.');
      setActiveQueryLabel('Manual location mode');
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
        // ignore storage quota
      }

      const prevAuto = lastAutoSearchPosRef.current;
      const movedMeters = prevAuto ? haversineMeters(prevAuto, nextPos) : Infinity;

      if (!prevAuto || movedMeters > 300) {
        const centerObj = { lat: nextPos.lat, lng: nextPos.lng };
        lastAutoSearchPosRef.current = nextPos;
        setSearchCenter(centerObj);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([centerObj.lat, centerObj.lng], 14, { animate: true });
        }
      }
    };

    const handleGeoError = (err) => {
      console.warn('Browser geolocation error:', err);
      setGpsStatus('denied');
      if (err.code === 1) {
        setGpsError('Location permission denied. Allow browser location access, search a city above, or click anywhere on the map.');
      } else {
        setGpsError('Unable to read live GPS right now. Search a city above or click the map to pin your area.');
      }
      if (!searchCenter) {
        setActiveQueryLabel('Search city or click map to set location');
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trackingEnabled]);

  // Allow clicking on map to set reference location when GPS is denied/unavailable
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const onMapClick = (e) => {
      if (gpsStatus === 'tracking' && trackingEnabled) return;
      const now = Date.now();
      if (now - lastMapClickRef.current < 300) return;
      lastMapClickRef.current = now;

      const clicked = { lat: e.latlng.lat, lng: e.latlng.lng };
      setFollowUser(false);
      setSearchCenter(clicked);
      setPannedCenter(null);
      runNearbyGymSearch({
        center: clicked,
        radius: radiusMeters,
        livePos: userLocation,
        labelOverride: `Nearby gyms within ${(radiusMeters / 1000).toFixed(0)} km of pinned spot`,
      });
    };

    map.on('click', onMapClick);
    return () => {
      map.off('click', onMapClick);
    };
  }, [gpsStatus, trackingEnabled, radiusMeters, userLocation, runNearbyGymSearch]);

  // Trigger Overpass query whenever searchCenter or radiusMeters changes
  useEffect(() => {
    if (!searchCenter) return;
    runNearbyGymSearch({
      center: searchCenter,
      radius: radiusMeters,
      livePos: userLocation,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchCenter, radiusMeters]);

  // Compute strict nearby gyms (within radius + facility filter + optional name filter)
  const gymsWithLiveDistance = useMemo(() => {
    const origin = userLocation || searchCenter;
    const nameTerm = appliedNameFilter.trim().toLowerCase();

    return rawGyms
      .map((g) => ({
        ...g,
        distanceMeters: origin ? haversineMeters(origin, g.position) : g.distanceMeters,
      }))
      .filter((g) => {
        if (searchCenter) {
          const distFromSearchCenter = haversineMeters(searchCenter, g.position);
          if (distFromSearchCenter > radiusMeters) return false;
        }
        if (!matchesFacilityFilter(g, activeFilter)) return false;
        if (nameTerm) {
          const haystack = `${g.name} ${g.address} ${g.typeLabel}`.toLowerCase();
          if (!haystack.includes(nameTerm)) return false;
        }
        return true;
      })
      .sort((a, b) => (a.distanceMeters ?? Infinity) - (b.distanceMeters ?? Infinity));
  }, [rawGyms, userLocation, searchCenter, radiusMeters, activeFilter, appliedNameFilter]);

  const visibleGyms = mode === 'compact' ? gymsWithLiveDistance.slice(0, 4) : gymsWithLiveDistance;

  // Update User GPS Marker, Accuracy Circle, and Search Radius Circle on Leaflet Map
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const activeCenter = userLocation
      ? { lat: userLocation.lat, lng: userLocation.lng }
      : searchCenter;

    if (userLocation) {
      const latLng = [userLocation.lat, userLocation.lng];
      if (!userMarkerRef.current) {
        userMarkerRef.current = L.marker(latLng, {
          icon: createUserBeaconIcon(),
          zIndexOffset: 1200,
        })
          .bindTooltip(
            `Your live location${userLocation.accuracy ? ` (±${Math.round(userLocation.accuracy)}m)` : ''}`,
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
            fillOpacity: 0.12,
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
    }

    const ringCenter = searchCenter || activeCenter;
    if (ringCenter) {
      const ringLatLng = [ringCenter.lat, ringCenter.lng];
      if (!radiusCircleRef.current) {
        radiusCircleRef.current = L.circle(ringLatLng, {
          radius: radiusMeters,
          color: '#f59e0b',
          opacity: 0.45,
          weight: 1.5,
          dashArray: '6, 8',
          fillColor: '#f59e0b',
          fillOpacity: 0.03,
          interactive: false,
        }).addTo(map);
      } else {
        radiusCircleRef.current.setLatLng(ringLatLng);
        radiusCircleRef.current.setRadius(radiusMeters);
      }

      const showSearchPin =
        !userLocation ||
        haversineMeters(userLocation, ringCenter) > 150;

      if (showSearchPin) {
        if (!searchPinMarkerRef.current) {
          searchPinMarkerRef.current = L.circleMarker(ringLatLng, {
            radius: 6,
            color: '#f59e0b',
            weight: 2,
            fillColor: '#fde68a',
            fillOpacity: 0.9,
          })
            .bindTooltip('Search center', { direction: 'top' })
            .addTo(map);
        } else {
          searchPinMarkerRef.current.setLatLng(ringLatLng);
        }
      } else if (searchPinMarkerRef.current) {
        searchPinMarkerRef.current.remove();
        searchPinMarkerRef.current = null;
      }
    }
  }, [userLocation, searchCenter, radiusMeters, followUser]);

  // Render Nearby Gym Markers on Leaflet Map
  useEffect(() => {
    const map = mapInstanceRef.current;
    const gymLayer = gymLayerGroupRef.current;
    if (!map || !gymLayer) return;

    gymLayer.clearLayers();
    gymMarkersMapRef.current.clear();

    const bounds = L.latLngBounds([]);
    if (userLocation) {
      bounds.extend([userLocation.lat, userLocation.lng]);
    } else if (searchCenter) {
      bounds.extend([searchCenter.lat, searchCenter.lng]);
    }

    gymsWithLiveDistance.forEach((gym) => {
      const isSelected = gym.id === selectedGymId;
      const marker = L.marker([gym.position.lat, gym.position.lng], {
        icon: createGymPinIcon(isSelected),
        zIndexOffset: isSelected ? 1000 : 100,
      });

      const distLabel = formatDistance(gym.distanceMeters);
      const dirUrl = buildDirectionsUrl(gym, userLocation);
      const osmUrl = buildOsmUrl(gym);

      const popupHtml = `
        <div class="gmp-infowindow-card">
          <h4>${escapeHtml(gym.name)}</h4>
          <p class="gmp-iw-meta">
            <span>${escapeHtml(gym.typeLabel)}</span>
            ${distLabel ? `<span> &bull; ${escapeHtml(distLabel)} away</span>` : ''}
          </p>
          <p class="gmp-iw-address">${escapeHtml(gym.address)}</p>
          ${gym.todayHours ? `<p class="gmp-iw-hours">Hours: ${escapeHtml(gym.todayHours)}</p>` : ''}
          <div class="gmp-iw-links">
            <a href="${escapeHtml(dirUrl)}" target="_blank" rel="noopener noreferrer">Get Directions</a>
            <a href="${escapeHtml(osmUrl)}" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml, { maxWidth: 280 });
      marker.on('click', () => {
        setFollowUser(false);
        setSelectedGymId(gym.id);
      });

      marker.addTo(gymLayer);
      gymMarkersMapRef.current.set(gym.id, marker);
      bounds.extend([gym.position.lat, gym.position.lng]);
    });

    if (!followUser && gymsWithLiveDistance.length > 0 && !selectedGymId && bounds.isValid()) {
      map.fitBounds(bounds, { padding: [44, 44], maxZoom: 15 });
    }
  }, [gymsWithLiveDistance, selectedGymId, userLocation, searchCenter, followUser]);

  const handleManualLocate = () => {
    if (!('geolocation' in navigator)) {
      setGpsStatus('unsupported');
      setGpsError('Geolocation is not supported by this browser.');
      return;
    }

    setTrackingEnabled(true);
    setFollowUser(true);
    setGpsStatus('locating');
    setGpsError('');
    setSearchInput('');
    setAppliedNameFilter('');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const nextPos = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          updatedAt: Date.now(),
        };
        const centerObj = { lat: nextPos.lat, lng: nextPos.lng };
        setUserLocation(nextPos);
        setGpsStatus('tracking');
        lastAutoSearchPosRef.current = nextPos;
        setSearchCenter(centerObj);
        try {
          localStorage.setItem(LAST_GPS_STORAGE_KEY, JSON.stringify(nextPos));
        } catch {
          // ignore
        }
        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([centerObj.lat, centerObj.lng], 14, { duration: 0.7 });
        }
        runNearbyGymSearch({
          center: centerObj,
          radius: radiusMeters,
          livePos: nextPos,
        });
      },
      (err) => {
        console.warn('Manual geolocation failed:', err);
        setGpsStatus('denied');
        setGpsError('Location access was blocked. Allow location permission, search a city above, or click the map.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSearchSubmit = async (e) => {
    e.preventDefault();
    const trimmed = searchInput.trim();
    if (!trimmed) {
      setAppliedNameFilter('');
      if (userLocation) {
        const centerObj = { lat: userLocation.lat, lng: userLocation.lng };
        setFollowUser(true);
        setSearchCenter(centerObj);
        runNearbyGymSearch({ center: centerObj, radius: radiusMeters, livePos: userLocation });
      }
      return;
    }

    // First check if user is filtering gyms already near their current area
    const localNameMatches = rawGyms.filter((g) =>
      `${g.name} ${g.typeLabel} ${g.address}`.toLowerCase().includes(trimmed.toLowerCase())
    );
    if (localNameMatches.length > 0 && userLocation) {
      setAppliedNameFilter(trimmed);
      setFollowUser(false);
      const first = localNameMatches[0];
      setSelectedGymId(first.id);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.flyTo([first.position.lat, first.position.lng], 15, { duration: 0.6 });
      }
      return;
    }

    // Otherwise geocode the city / neighborhood / address via Nominatim (no API key)
    setAppliedNameFilter('');
    setSearchingPlaces(true);
    setPlacesError('');
    try {
      const geo = await geocodePlaceNominatim(trimmed, userLocation || searchCenter);
      if (!geo) {
        setPlacesError(`No location found for "${trimmed}". Try a city or neighborhood name.`);
        setSearchingPlaces(false);
        return;
      }
      setFollowUser(false);
      const newCenter = { lat: geo.lat, lng: geo.lng };
      setSearchCenter(newCenter);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.flyTo([newCenter.lat, newCenter.lng], 14, { duration: 0.7 });
      }
      await runNearbyGymSearch({
        center: newCenter,
        radius: radiusMeters,
        livePos: userLocation,
        labelOverride: `Gyms near ${geo.label}`,
      });
    } catch (err) {
      console.warn('Nominatim search failed:', err);
      setPlacesError('Could not search that area right now. Please try again.');
      setSearchingPlaces(false);
    }
  };

  const handleSearchThisArea = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    const c = map.getCenter();
    if (!c) return;
    const areaCenter = { lat: c.lat, lng: c.lng };
    setFollowUser(false);
    setAppliedNameFilter('');
    setSearchCenter(areaCenter);
    setPannedCenter(null);
    runNearbyGymSearch({
      center: areaCenter,
      radius: radiusMeters,
      livePos: userLocation,
    });
  };

  const handleSelectGymFromList = (gym) => {
    setFollowUser(false);
    setSelectedGymId(gym.id);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([gym.position.lat, gym.position.lng], 16, { duration: 0.55 });
    }
    const marker = gymMarkersMapRef.current.get(gym.id);
    if (marker) {
      setTimeout(() => marker.openPopup(), 250);
    }
  };

  return (
    <div className={`google-gym-locator ${mode === 'compact' ? 'compact-mode' : 'full-mode'}`}>
      {/* Search & Controls */}
      <div className="gmp-controls-bar">
        <form onSubmit={handleSearchSubmit} className="map-search-form">
          <div className="search-field-wrap">
            <Search size={17} className="search-icon" />
            <input
              type="text"
              placeholder="Filter nearby gyms or search any city / area..."
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                if (!e.target.value.trim()) setAppliedNameFilter('');
              }}
            />
          </div>
          <button type="submit" className="btn-search-map" disabled={searchingPlaces}>
            {searchingPlaces ? 'Searching...' : 'Search'}
          </button>
          <button
            type="button"
            className="btn-near-me"
            onClick={handleManualLocate}
            title="Track my live browser GPS location and show only nearby gyms"
          >
            <LocateFixed size={15} className={gpsStatus === 'locating' ? 'spinning' : ''} />
            <span>{gpsStatus === 'locating' ? 'Locating...' : 'Near Me'}</span>
          </button>
        </form>

        <div className="gmp-meta-controls">
          <div className="filter-chips-row">
            <span className="chips-label">Filter:</span>
            {FACILITY_FILTERS.map((f) => (
              <button
                key={f}
                type="button"
                className={`chip-btn ${activeFilter === f ? 'active' : ''}`}
                onClick={() => setActiveFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="gmp-tracking-controls">
            <label className="gmp-radius-select-wrap">
              <span>Nearby Radius:</span>
              <select
                value={radiusMeters}
                onChange={(e) => setRadiusMeters(Number(e.target.value))}
                aria-label="Search radius"
              >
                {RADIUS_OPTIONS.map((r) => (
                  <option key={r.meters} value={r.meters}>
                    {r.label}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="button"
              className={`gmp-live-toggle ${trackingEnabled && gpsStatus === 'tracking' ? 'is-live' : ''}`}
              onClick={() => setTrackingEnabled((prev) => !prev)}
              title={trackingEnabled ? 'Pause live browser GPS tracking' : 'Resume live browser GPS tracking'}
            >
              {trackingEnabled ? <Pause size={13} /> : <Play size={13} />}
              <span>{trackingEnabled ? 'Live GPS On' : 'GPS Paused'}</span>
            </button>

            {userLocation && !followUser && (
              <button
                type="button"
                className="gmp-recenter-btn"
                onClick={() => {
                  setFollowUser(true);
                  const centerObj = { lat: userLocation.lat, lng: userLocation.lng };
                  setSearchCenter(centerObj);
                  if (mapInstanceRef.current) {
                    mapInstanceRef.current.flyTo([centerObj.lat, centerObj.lng], 14, { duration: 0.6 });
                  }
                }}
              >
                <Compass size={13} />
                <span>Recenter</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Geolocation / Search Status Banner */}
      {(gpsError || placesError) && (
        <div className="gmp-inline-notice" role="status">
          <span>{placesError || gpsError}</span>
          {gpsStatus === 'denied' && (
            <button type="button" onClick={handleManualLocate} className="gmp-retry-link">
              Retry GPS
            </button>
          )}
        </div>
      )}

      {/* Map + Nearby Gyms Layout */}
      <div className={mode === 'compact' ? 'dashboard-map-layout' : 'gmp-full-layout'}>
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
                    <strong>Live GPS Tracking</strong> (±{Math.round(userLocation.accuracy || 0)}m) &bull;{' '}
                    {activeQueryLabel}
                  </>
                ) : (
                  <strong>{activeQueryLabel}</strong>
                )}
              </span>
            </div>

            <div className="gmp-header-actions">
              {pannedCenter && (
                <button
                  type="button"
                  className="gmp-search-area-btn"
                  onClick={handleSearchThisArea}
                  disabled={searchingPlaces}
                >
                  <RefreshCw size={12} />
                  <span>Search This Area</span>
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

        {/* Nearby Gyms Results Column / Grid */}
        <div className={mode === 'compact' ? 'nearest-facilities-card' : 'curated-gyms-section'}>
          <div className="section-title-row">
            <div>
              <h3>
                {searchingPlaces
                  ? 'Finding Nearby Gyms...'
                  : `Nearby Gyms (${gymsWithLiveDistance.length})`}
              </h3>
              <span>
                {userLocation
                  ? `Only gyms within ${(radiusMeters / 1000).toFixed(0)} km, sorted nearest first`
                  : 'OpenStreetMap gyms within your selected radius'}
              </span>
            </div>
            {searchingPlaces && <Loader2 size={16} className="spinning text-gold" />}
          </div>

          {!searchingPlaces && visibleGyms.length === 0 ? (
            <div className="gmp-empty-gyms">
              <Navigation size={22} />
              <p>
                {searchCenter
                  ? `No gyms found within ${(radiusMeters / 1000).toFixed(0)} km. Try increasing the radius or clearing filters.`
                  : 'Allow browser location access or search a city above to see nearby gyms.'}
              </p>
            </div>
          ) : (
            <div className={mode === 'compact' ? 'facilities-list' : 'gyms-cards-grid'}>
              {visibleGyms.map((gym) => {
                const distLabel = formatDistance(gym.distanceMeters);
                const isSelected = gym.id === selectedGymId;
                return (
                  <div
                    key={gym.id}
                    className={`gym-card-tile ${isSelected ? 'is-selected' : ''}`}
                    onClick={() => handleSelectGymFromList(gym)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleSelectGymFromList(gym);
                      }
                    }}
                  >
                    <div className="gym-tile-top">
                      <span className="gym-type-tag">{gym.typeLabel}</span>
                      {gym.is24Hours && <span className="gym-rating-pill">24/7 Open</span>}
                    </div>

                    <h4 className="gym-name">{gym.name}</h4>
                    <p className="gym-address">
                      <MapPin size={13} className="pin-icon" />
                      <span>{gym.address}</span>
                    </p>

                    <div className="gym-info-chips">
                      {distLabel && <span className="info-chip distance">{distLabel} away</span>}
                      <span className="info-chip status">Nearby Gym</span>
                    </div>

                    <div className="gym-card-footer">
                      <span className="gym-hours">
                        <Clock size={12} />
                        <span>{gym.todayHours || 'OpenStreetMap Verified'}</span>
                      </span>

                      <a
                        href={buildDirectionsUrl(gym, userLocation)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-directions-link"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span>Directions</span>
                        <ExternalLink size={12} />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
