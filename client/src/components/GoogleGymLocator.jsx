import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import FreeLiveGymMap from './FreeLiveGymMap';
import {
  APIProvider,
  APILoadingStatus,
  AdvancedMarker,
  ColorScheme,
  InfoWindow,
  Map as GoogleMap,
  Pin,
  useAdvancedMarkerRef,
  useApiLoadingStatus,
  useMap,
  useMapsLibrary,
} from '@vis.gl/react-google-maps';
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
  Star,
} from 'lucide-react';

const GMP_ATTRIBUTION_ID = 'gmp_mcp_codeassist_v1_aistudio';
const DEFAULT_CENTER = { lat: 40.758, lng: -73.9855 };

const FACILITY_FILTERS = ['All', '24/7 Gym', 'CrossFit Box', 'Powerlifting', 'Yoga Studio'];

const RADIUS_OPTIONS = [
  { label: '2 km', meters: 2000 },
  { label: '5 km', meters: 5000 },
  { label: '10 km', meters: 10000 },
  { label: '25 km', meters: 25000 },
];

const PLACE_FIELDS = [
  'id',
  'displayName',
  'location',
  'formattedAddress',
  'businessStatus',
  'rating',
  'userRatingCount',
  'openingHours',
  'googleMapsURI',
  'primaryTypeDisplayName',
];

const GOOGLE_MAPS_API_KEY = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '').trim();

export function GoogleMapsProvider({ children }) {
  if (!GOOGLE_MAPS_API_KEY) {
    return <>{children}</>;
  }

  return (
    <APIProvider
      apiKey={GOOGLE_MAPS_API_KEY}
      libraries={['places', 'marker', 'geometry']}
      internalUsageAttributionIds={[GMP_ATTRIBUTION_ID]}
    >
      {children}
    </APIProvider>
  );
}

function isQuotaExceededError(err) {
  if (!err) return false;
  const text = `${err?.code || ''} ${err?.status || ''} ${err?.message || String(err)}`.toUpperCase();
  return (
    text.includes('429') ||
    text.includes('RESOURCE_EXHAUSTED') ||
    text.includes('OVER_QUERY_LIMIT') ||
    text.includes('QUOTAEXCEEDEDERROR') ||
    text.includes('OVERQUOTAMAPERROR')
  );
}

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

function getTodayHours(openingHours) {
  const descriptions = openingHours?.weekdayDescriptions;
  if (!Array.isArray(descriptions) || descriptions.length === 0) return null;
  const jsDay = new Date().getDay(); // 0 = Sun, 1 = Mon ... 6 = Sat
  const mondayFirstIdx = jsDay === 0 ? 6 : jsDay - 1;
  const raw = descriptions[mondayFirstIdx] || descriptions[0];
  if (!raw) return null;
  const colonIdx = raw.indexOf(':');
  return colonIdx !== -1 ? raw.slice(colonIdx + 1).trim() : raw;
}

function buildDirectionsUrl(gym, userLocation) {
  const params = new URLSearchParams({
    api: '1',
    destination: gym.address ? `${gym.name}, ${gym.address}` : gym.name,
  });
  if (gym.id) {
    params.set('destination_place_id', gym.id);
  }
  if (userLocation) {
    params.set('origin', `${userLocation.lat},${userLocation.lng}`);
  }
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

function AccuracyCircle({ center, radius }) {
  const map = useMap();
  const mapsLib = useMapsLibrary('maps');
  const circleRef = useRef(null);

  useEffect(() => {
    if (!map || !mapsLib || !center || !radius) {
      if (circleRef.current) {
        circleRef.current.setMap(null);
        circleRef.current = null;
      }
      return;
    }

    if (!circleRef.current) {
      circleRef.current = new mapsLib.Circle({
        map,
        center,
        radius: Math.min(Math.max(radius, 15), 1500),
        strokeColor: '#38bdf8',
        strokeOpacity: 0.55,
        strokeWeight: 1.5,
        fillColor: '#38bdf8',
        fillOpacity: 0.12,
        clickable: false,
      });
    } else {
      circleRef.current.setMap(map);
      circleRef.current.setCenter(center);
      circleRef.current.setRadius(Math.min(Math.max(radius, 15), 1500));
    }
  }, [map, mapsLib, center, radius]);

  useEffect(() => {
    return () => {
      if (circleRef.current) {
        circleRef.current.setMap(null);
        circleRef.current = null;
      }
    };
  }, []);

  return null;
}

function GymAdvancedMarker({ gym, isSelected, onSelect }) {
  const [markerRef, marker] = useAdvancedMarkerRef();

  return (
    <AdvancedMarker
      ref={markerRef}
      position={gym.position}
      title={gym.name}
      zIndex={isSelected ? 1000 : 10}
      onClick={() => {
        if (marker) {
          onSelect(gym, marker);
        }
      }}
    >
      <Pin
        background={isSelected ? '#fde68a' : '#f59e0b'}
        borderColor={isSelected ? '#f59e0b' : '#78350f'}
        glyphColor="#07090e"
        scale={isSelected ? 1.25 : 1}
      />
    </AdvancedMarker>
  );
}

function UserLocationMarker({ position, accuracy }) {
  return (
    <AdvancedMarker
      position={position}
      title={`Your live location${accuracy ? ` (±${Math.round(accuracy)}m)` : ''}`}
      zIndex={1200}
    >
      <div className="gmp-user-beacon" aria-label="Your current live location">
        <span className="gmp-user-beacon-pulse" />
        <span className="gmp-user-beacon-core" />
      </div>
    </AdvancedMarker>
  );
}

function MapViewportController({
  mapTarget,
  gyms,
  userLocation,
  followUser,
  onUserPan,
}) {
  const map = useMap();
  const coreLib = useMapsLibrary('core');

  useEffect(() => {
    if (!map || !mapTarget) return;
    map.panTo(mapTarget.center);
    if (mapTarget.zoom) {
      map.setZoom(mapTarget.zoom);
    }
  }, [map, mapTarget]);

  useEffect(() => {
    if (!map || !userLocation || !followUser) return;
    map.panTo({ lat: userLocation.lat, lng: userLocation.lng });
  }, [map, userLocation, followUser]);

  useEffect(() => {
    if (!map || !coreLib || gyms.length === 0) return;
    if (followUser && userLocation) return;

    const bounds = new coreLib.LatLngBounds();
    if (userLocation) {
      bounds.extend({ lat: userLocation.lat, lng: userLocation.lng });
    }
    gyms.forEach((g) => {
      if (g.position) bounds.extend(g.position);
    });
    if (!bounds.isEmpty()) {
      map.fitBounds(bounds, { top: 48, right: 48, bottom: 48, left: 48 });
    }
  }, [map, coreLib, gyms, userLocation, followUser]);

  useEffect(() => {
    if (!map || !onUserPan) return;
    const listener = map.addListener('dragend', () => {
      const c = map.getCenter();
      if (c) {
        onUserPan({ lat: c.lat(), lng: c.lng() });
      }
    });
    return () => listener?.remove?.();
  }, [map, onUserPan]);

  return null;
}

function GoogleGymLocatorInner({ mode = 'full', onOpenFullMap }) {
  const apiStatus = useApiLoadingStatus();
  const placesLib = useMapsLibrary('places');
  const geometryLib = useMapsLibrary('geometry');
  const mapInstance = useMap();

  const [searchInput, setSearchInput] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [radiusMeters, setRadiusMeters] = useState(5000);

  const [userLocation, setUserLocation] = useState(null);
  const [trackingEnabled, setTrackingEnabled] = useState(true);
  const [followUser, setFollowUser] = useState(true);
  const [gpsStatus, setGpsStatus] = useState('locating'); // 'locating' | 'tracking' | 'paused' | 'denied' | 'unsupported'
  const [gpsError, setGpsError] = useState('');

  const [searchCenter, setSearchCenter] = useState(null);
  const [mapTarget, setMapTarget] = useState({ center: DEFAULT_CENTER, zoom: 13 });
  const [pannedCenter, setPannedCenter] = useState(null);
  const [activeQueryLabel, setActiveQueryLabel] = useState('Locating your position...');

  const [gyms, setGyms] = useState([]);
  const [searchingPlaces, setSearchingPlaces] = useState(false);
  const [placesError, setPlacesError] = useState('');
  const [selectedGymId, setSelectedGymId] = useState(null);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [infoOpen, setInfoOpen] = useState(false);

  const watchIdRef = useRef(null);
  const lastAutoSearchPosRef = useRef(null);
  const searchRequestSeqRef = useRef(0);

  const computeDistance = useCallback(
    (a, b) => {
      if (!a || !b) return null;
      if (geometryLib?.spherical?.computeDistanceBetween) {
        return geometryLib.spherical.computeDistanceBetween(a, b);
      }
      return haversineMeters(a, b);
    },
    [geometryLib]
  );

  const runNearbyOrTextSearch = useCallback(
    async ({ center, textQuery, filter = activeFilter, radius = radiusMeters, livePos = userLocation }) => {
      if (!placesLib?.Place) return;

      const reqSeq = ++searchRequestSeqRef.current;
      setSearchingPlaces(true);
      setPlacesError('');

      try {
        let fetchedPlaces = [];
        const trimmedText = (textQuery || '').trim();

        if (!trimmedText && filter === 'All' && center) {
          const { places } = await placesLib.Place.searchNearby({
            fields: PLACE_FIELDS,
            locationRestriction: {
              center,
              radius: Math.min(radius, 50000),
            },
            includedTypes: ['gym'],
            maxResultCount: 15,
            rankPreference: placesLib.SearchNearbyRankPreference.DISTANCE,
            internalUsageAttributionIds: [GMP_ATTRIBUTION_ID],
          });
          fetchedPlaces = places || [];
          setActiveQueryLabel(`Nearby gyms within ${(radius / 1000).toFixed(0)} km`);
        } else {
          const filterPhrase = filter === 'All' ? 'gym fitness center' : filter;
          const combinedQuery = trimmedText
            ? filter === 'All'
              ? `${trimmedText} gym`
              : `${trimmedText} ${filter}`
            : `${filterPhrase} near me`;

          const request = {
            textQuery: combinedQuery,
            fields: PLACE_FIELDS,
            maxResultCount: 15,
            internalUsageAttributionIds: [GMP_ATTRIBUTION_ID],
          };

          if (center) {
            request.locationBias = center;
          }

          const { places } = await placesLib.Place.searchByText(request);
          fetchedPlaces = places || [];
          setActiveQueryLabel(trimmedText ? `${trimmedText} (${filter})` : `${filter} nearby`);
        }

        if (reqSeq !== searchRequestSeqRef.current) return;

        const referenceOrigin = livePos || center;
        const normalized = fetchedPlaces
          .filter((p) => p.location)
          .map((p) => {
            const lat = typeof p.location.lat === 'function' ? p.location.lat() : p.location.lat;
            const lng = typeof p.location.lng === 'function' ? p.location.lng() : p.location.lng;
            const pos = { lat, lng };
            const distanceMeters = referenceOrigin ? computeDistance(referenceOrigin, pos) : null;

            return {
              id: p.id || `${lat},${lng}-${p.displayName}`,
              name: p.displayName || 'Fitness Center',
              position: pos,
              address: p.formattedAddress || '',
              rating: typeof p.rating === 'number' ? p.rating : null,
              userRatingCount: typeof p.userRatingCount === 'number' ? p.userRatingCount : null,
              businessStatus: p.businessStatus || '',
              typeLabel: p.primaryTypeDisplayName || 'Gym & Fitness',
              todayHours: getTodayHours(p.openingHours),
              googleMapsURI: p.googleMapsURI || '',
              attributions: Array.isArray(p.attributions) ? p.attributions : [],
              distanceMeters,
            };
          })
          .sort((a, b) => {
            if (a.distanceMeters != null && b.distanceMeters != null) {
              return a.distanceMeters - b.distanceMeters;
            }
            return (b.rating || 0) - (a.rating || 0);
          });

        setGyms(normalized);
        setPannedCenter(null);
        setSelectedGymId(null);
        setSelectedMarker(null);
        setInfoOpen(false);
      } catch (err) {
        if (reqSeq !== searchRequestSeqRef.current) return;
        console.error('Google Places search failed:', err);
        if (isQuotaExceededError(err)) {
          window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
          setPlacesError('Google Maps search quota was reached. Please try again later.');
        } else {
          setPlacesError('Unable to load nearby gyms right now. Check your connection or try a city search.');
        }
      } finally {
        if (reqSeq === searchRequestSeqRef.current) {
          setSearchingPlaces(false);
        }
      }
    },
    [placesLib, activeFilter, radiusMeters, userLocation, computeDistance]
  );

  // Live geolocation tracking using watchPosition + immediate position fix
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
      setGpsError('Geolocation is not supported by this browser. Search any city or area below.');
      setActiveQueryLabel('Search by city or neighborhood');
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

      const prevAuto = lastAutoSearchPosRef.current;
      const movedMeters = prevAuto ? haversineMeters(prevAuto, nextPos) : Infinity;

      if (!prevAuto) {
        lastAutoSearchPosRef.current = nextPos;
        const centerObj = { lat: nextPos.lat, lng: nextPos.lng };
        setSearchCenter(centerObj);
        setMapTarget({ center: centerObj, zoom: 14 });
      } else if (movedMeters > 350) {
        lastAutoSearchPosRef.current = nextPos;
        setSearchCenter({ lat: nextPos.lat, lng: nextPos.lng });
      }
    };

    const handleGeoError = (err) => {
      console.warn('Geolocation tracking issue:', err);
      if (err.code === 1) {
        setGpsStatus('denied');
        setGpsError('Location permission denied. Enable GPS access in your browser or search by city below.');
        setActiveQueryLabel('Manual search mode');
      } else {
        setGpsStatus('denied');
        setGpsError('Could not determine your live GPS position right now. Try searching your city below.');
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

  // Trigger initial & location-updated Places search once placesLib and searchCenter are ready
  useEffect(() => {
    if (!placesLib || !searchCenter) return;
    runNearbyOrTextSearch({
      center: searchCenter,
      textQuery: searchInput,
      filter: activeFilter,
      radius: radiusMeters,
      livePos: userLocation,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placesLib, searchCenter, activeFilter, radiusMeters]);

  // Recompute distances smoothly as user moves without needing to re-query Places every meter
  const gymsWithLiveDistance = useMemo(() => {
    if (!userLocation) return gyms;
    return gyms
      .map((g) => ({
        ...g,
        distanceMeters: computeDistance(userLocation, g.position),
      }))
      .sort((a, b) => (a.distanceMeters ?? Infinity) - (b.distanceMeters ?? Infinity));
  }, [gyms, userLocation, computeDistance]);

  const selectedGym = useMemo(
    () => gymsWithLiveDistance.find((g) => g.id === selectedGymId) || null,
    [gymsWithLiveDistance, selectedGymId]
  );

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
        setSearchInput('');
        lastAutoSearchPosRef.current = nextPos;
        setSearchCenter(centerObj);
        setMapTarget({ center: centerObj, zoom: 14 });
        if (placesLib) {
          runNearbyOrTextSearch({
            center: centerObj,
            textQuery: '',
            filter: activeFilter,
            radius: radiusMeters,
            livePos: nextPos,
          });
        }
      },
      (err) => {
        console.warn('Manual geolocation failed:', err);
        setGpsStatus('denied');
        setGpsError('Location access was blocked. Allow location permission or search by city below.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchInput.trim() && !searchCenter && !userLocation) return;
    setFollowUser(false);
    const biasCenter = userLocation
      ? { lat: userLocation.lat, lng: userLocation.lng }
      : searchCenter || undefined;
    runNearbyOrTextSearch({
      center: biasCenter,
      textQuery: searchInput,
      filter: activeFilter,
      radius: radiusMeters,
      livePos: userLocation,
    });
  };

  const handleFilterChange = (cat) => {
    setActiveFilter(cat);
    const centerObj = searchCenter || (userLocation ? { lat: userLocation.lat, lng: userLocation.lng } : null);
    if (centerObj || searchInput.trim()) {
      runNearbyOrTextSearch({
        center: centerObj,
        textQuery: searchInput,
        filter: cat,
        radius: radiusMeters,
        livePos: userLocation,
      });
    }
  };

  const handleSearchThisArea = () => {
    if (!mapInstance) return;
    const center = mapInstance.getCenter();
    if (!center) return;
    const areaCenter = { lat: center.lat(), lng: center.lng() };
    setFollowUser(false);
    setSearchCenter(areaCenter);
    setPannedCenter(null);
    runNearbyOrTextSearch({
      center: areaCenter,
      textQuery: searchInput,
      filter: activeFilter,
      radius: radiusMeters,
      livePos: userLocation,
    });
  };

  const handleSelectGymFromList = (gym) => {
    setFollowUser(false);
    setSelectedGymId(gym.id);
    setMapTarget({ center: gym.position, zoom: 15 });
    setInfoOpen(false);
  };

  const handleSelectMarker = useCallback((gym, markerInstance) => {
    setFollowUser(false);
    setSelectedGymId(gym.id);
    setSelectedMarker(markerInstance);
    setInfoOpen(true);
    setMapTarget({ center: gym.position });
  }, []);

  const visibleGyms = mode === 'compact' ? gymsWithLiveDistance.slice(0, 4) : gymsWithLiveDistance;
  const mapAuthFailed =
    apiStatus === APILoadingStatus.FAILED || apiStatus === APILoadingStatus.AUTH_FAILURE;

  if (mapAuthFailed) {
    return <FreeLiveGymMap mode={mode} onOpenFullMap={onOpenFullMap} />;
  }

  return (
    <div className={`google-gym-locator ${mode === 'compact' ? 'compact-mode' : 'full-mode'}`}>
      {/* Search & Controls */}
      <div className="gmp-controls-bar">
        <form onSubmit={handleSearchSubmit} className="map-search-form">
          <div className="search-field-wrap">
            <Search size={17} className="search-icon" />
            <input
              type="text"
              placeholder="Search by city, neighborhood, or gym name..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          <button type="submit" className="btn-search-map" disabled={searchingPlaces}>
            {searchingPlaces ? 'Searching...' : 'Search'}
          </button>
          <button
            type="button"
            className="btn-near-me"
            onClick={handleManualLocate}
            title="Center on my current GPS location and find nearby gyms"
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
                onClick={() => handleFilterChange(f)}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="gmp-tracking-controls">
            <label className="gmp-radius-select-wrap">
              <span>Radius:</span>
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
              title={trackingEnabled ? 'Pause live GPS tracking' : 'Resume live GPS tracking'}
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
                  setMapTarget({
                    center: { lat: userLocation.lat, lng: userLocation.lng },
                    zoom: 14,
                  });
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

      {/* Map + Nearby List Layout */}
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
                    <strong>Live Tracking</strong> (±{Math.round(userLocation.accuracy || 0)}m) •{' '}
                    {activeQueryLabel}
                  </>
                ) : (
                  <>
                    <strong>{activeQueryLabel}</strong>
                  </>
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
                <button
                  type="button"
                  className="gmp-expand-btn"
                  onClick={onOpenFullMap}
                >
                  <span>Full Map</span>
                  <ExternalLink size={12} />
                </button>
              )}
            </div>
          </div>

          <div className={`gmp-map-canvas-shell ${mode === 'compact' ? 'is-compact' : 'is-full'}`}>
            {!GOOGLE_MAPS_API_KEY || mapAuthFailed ? (
              <div className="gmp-map-fallback">
                <MapPin size={28} />
                <h4>Google Maps Unavailable</h4>
                <p>
                  {!GOOGLE_MAPS_API_KEY
                    ? 'Google Maps API key is not configured yet.'
                    : 'Unable to authenticate Google Maps JavaScript API right now.'}
                </p>
              </div>
            ) : (
              <GoogleMap
                mapId="DEMO_MAP_ID"
                defaultCenter={DEFAULT_CENTER}
                defaultZoom={13}
                gestureHandling="greedy"
                colorScheme={ColorScheme.DARK}
                streetViewControl={false}
                mapTypeControl={false}
                fullscreenControl={true}
                internalUsageAttributionIds={[GMP_ATTRIBUTION_ID]}
                style={{ width: '100%', height: '100%' }}
              >
                <MapViewportController
                  mapTarget={mapTarget}
                  gyms={gymsWithLiveDistance}
                  userLocation={userLocation}
                  followUser={followUser}
                  onUserPan={(c) => {
                    setFollowUser(false);
                    setPannedCenter(c);
                  }}
                />

                {userLocation && (
                  <>
                    <AccuracyCircle
                      center={{ lat: userLocation.lat, lng: userLocation.lng }}
                      radius={userLocation.accuracy}
                    />
                    <UserLocationMarker
                      position={{ lat: userLocation.lat, lng: userLocation.lng }}
                      accuracy={userLocation.accuracy}
                    />
                  </>
                )}

                {gymsWithLiveDistance.map((gym) => (
                  <GymAdvancedMarker
                    key={gym.id}
                    gym={gym}
                    isSelected={gym.id === selectedGymId}
                    onSelect={handleSelectMarker}
                  />
                ))}

                {infoOpen && selectedMarker && selectedGym && (
                  <InfoWindow
                    anchor={selectedMarker}
                    maxWidth={280}
                    onCloseClick={() => setInfoOpen(false)}
                  >
                    <div className="gmp-infowindow-card">
                      <h4>{selectedGym.name}</h4>
                      <p className="gmp-iw-meta">
                        <span>{selectedGym.typeLabel}</span>
                        {selectedGym.rating != null && (
                          <span> • ★ {selectedGym.rating.toFixed(1)}</span>
                        )}
                        {selectedGym.distanceMeters != null && (
                          <span> • {formatDistance(selectedGym.distanceMeters)} away</span>
                        )}
                      </p>
                      {selectedGym.address && (
                        <p className="gmp-iw-address">{selectedGym.address}</p>
                      )}
                      {selectedGym.todayHours && (
                        <p className="gmp-iw-hours">Today: {selectedGym.todayHours}</p>
                      )}
                      <div className="gmp-iw-links">
                        <a
                          href={buildDirectionsUrl(selectedGym, userLocation)}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Get Directions
                        </a>
                        {selectedGym.googleMapsURI && (
                          <a
                            href={selectedGym.googleMapsURI}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            View on Maps
                          </a>
                        )}
                      </div>
                    </div>
                  </InfoWindow>
                )}
              </GoogleMap>
            )}
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
                  ? 'Sorted by live distance from your tracked location'
                  : 'Real places via Google Maps Places'}
              </span>
            </div>
            {searchingPlaces && <Loader2 size={16} className="spinning text-gold" />}
          </div>

          {!searchingPlaces && visibleGyms.length === 0 ? (
            <div className="gmp-empty-gyms">
              <Navigation size={22} />
              <p>
                {userLocation
                  ? 'No gyms matched inside this radius. Try expanding the radius or searching another area.'
                  : 'Allow GPS tracking or search a city above to discover nearby gyms.'}
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
                      {gym.rating != null && (
                        <span className="gym-rating-pill">
                          <Star size={12} className="star-icon" />
                          <strong>{gym.rating.toFixed(1)}</strong>
                          {gym.userRatingCount ? <em>({gym.userRatingCount})</em> : null}
                        </span>
                      )}
                    </div>

                    <h4 className="gym-name">{gym.name}</h4>
                    {gym.address && (
                      <p className="gym-address">
                        <MapPin size={13} className="pin-icon" />
                        <span>{gym.address}</span>
                      </p>
                    )}

                    <div className="gym-info-chips">
                      {distLabel && <span className="info-chip distance">{distLabel} away</span>}
                      {gym.businessStatus === 'OPERATIONAL' && (
                        <span className="info-chip status">Operational</span>
                      )}
                    </div>

                    {gym.attributions?.length > 0 && (
                      <p className="gmp-place-attribution">
                        {gym.attributions.map((attr, idx) => (
                          <span key={idx}>
                            {attr.providerURI ? (
                              <a
                                href={attr.providerURI}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {attr.provider}
                              </a>
                            ) : (
                              attr.provider
                            )}
                            {idx < gym.attributions.length - 1 ? ', ' : ''}
                          </span>
                        ))}
                      </p>
                    )}

                    <div className="gym-card-footer">
                      <span className="gym-hours">
                        <Clock size={12} />
                        <span>{gym.todayHours || 'Hours on Google Maps'}</span>
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

const GoogleGymLocator = (props) => {
  if (!GOOGLE_MAPS_API_KEY) {
    return <FreeLiveGymMap {...props} />;
  }
  return <GoogleGymLocatorInner {...props} />;
};

export default GoogleGymLocator;
