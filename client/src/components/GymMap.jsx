import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { 
  MapPin, 
  Search, 
  Navigation, 
  Compass, 
  Star, 
  ExternalLink, 
  Clock, 
  Sparkles,
  Dumbbell
} from 'lucide-react';
import './GymMap.scss';

const GymMap = () => {
  const [location, setLocation] = useState('Equinox Gyms');
  const [searchInput, setSearchInput] = useState('');
  const [filter, setFilter] = useState('All');
  const [loadingGps, setLoadingGps] = useState(false);
  const mapRef = useRef(null);

  useEffect(() => {
    gsap.from('.gym-map-container', { opacity: 0, y: 15, duration: 0.4, ease: 'power2.out' });
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchInput.trim()) {
      const query = `${searchInput.trim()} ${filter === 'All' ? 'Fitness Center Gym' : filter}`;
      setLocation(query);
    }
  };

  const handleFilterClick = (cat) => {
    setFilter(cat);
    const base = searchInput.trim() || 'Gyms';
    setLocation(`${base} ${cat === 'All' ? 'Fitness Center' : cat}`);
  };

  const handleFindNearMe = () => {
    if (navigator.geolocation) {
      setLoadingGps(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setLocation(`${lat},${lng} gyms`);
          setLoadingGps(false);
        },
        (error) => {
          console.error("Error getting location", error);
          alert("Location access denied or unavailable.");
          setLoadingGps(false);
        }
      );
    } else {
      alert("Geolocation is not supported by this browser.");
    }
  };

  // Google Maps embed URL that works reliably worldwide without requiring an API key
  const googleMapEmbedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(location)}&t=&z=14&ie=UTF8&iwloc=&output=embed`;

  const filters = ['All', '24/7 Gyms', 'CrossFit Box', 'Powerlifting', 'Yoga Studios'];

  const dummyGyms = [
    { 
      id: 1, 
      name: "Apex Performance Club", 
      rating: 4.9, 
      address: "240 Olympian Way, Suite 400", 
      distance: "0.6 miles", 
      status: "Open Now • 24/7", 
      type: "Powerlifting & Strength",
      hours: "5:00 AM - 11:00 PM"
    },
    { 
      id: 2, 
      name: "Iron Sanctuary Crossfit", 
      rating: 4.8, 
      address: "185 Barbell Blvd", 
      distance: "1.1 miles", 
      status: "Open Now", 
      type: "CrossFit Box",
      hours: "6:00 AM - 9:00 PM"
    },
    { 
      id: 3, 
      name: "Equinox Elite Fitness", 
      rating: 4.9, 
      address: "500 Grand Promenade", 
      distance: "1.7 miles", 
      status: "Open Now", 
      type: "Luxury Health Club",
      hours: "5:30 AM - 10:00 PM"
    },
  ];

  return (
    <div className="gym-map-container" ref={mapRef}>
      {/* ── Header ── */}
      <div className="map-page-header">
        <div className="map-title-group">
          <div className="map-icon-box">
            <MapPin size={22} />
          </div>
          <div>
            <h2>Fitness Centers & Gym Locator</h2>
            <p>Discover premier strength facilities, Olympic training boxes, and 24/7 access gyms.</p>
          </div>
        </div>

        <button 
          className="btn-near-me" 
          onClick={handleFindNearMe} 
          disabled={loadingGps}
        >
          <Navigation size={15} className={loadingGps ? 'spinning' : ''} />
          <span>{loadingGps ? 'Locating...' : 'Locate Near Me'}</span>
        </button>
      </div>

      {/* ── Search Bar & Filter Chips ── */}
      <div className="search-filter-card">
        <form onSubmit={handleSearch} className="map-search-form">
          <div className="search-field-wrap">
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              placeholder="Search by city, neighborhood, or gym name (e.g. Los Angeles, Gold's Gym)..." 
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          <button type="submit" className="btn-search-map">
            <span>Search Map</span>
          </button>
        </form>

        <div className="filter-chips-row">
          <span className="chips-label">Facility Filter:</span>
          {filters.map((f) => (
            <button 
              key={f}
              className={`chip-btn ${filter === f ? 'active' : ''}`}
              onClick={() => handleFilterClick(f)}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* ── Interactive Map Frame ── */}
      <div className="map-frame-wrapper">
        <div className="map-frame-header">
          <div className="status-dot-group">
            <span className="dot red" />
            <span className="dot yellow" />
            <span className="dot green" />
          </div>
          <span className="active-query-text">
            Active Query: <strong>{location}</strong>
          </span>
        </div>

        <iframe 
          title="Gym Locator Map"
          className="responsive-map-iframe"
          src={googleMapEmbedUrl}
          loading="lazy"
          allowFullScreen
        />
      </div>

      {/* ── Curated Recommendations List ── */}
      <div className="curated-gyms-section">
        <div className="section-title-row">
          <h3>Featured Fitness Facilities</h3>
          <span>Verified training grounds in this perimeter</span>
        </div>

        <div className="gyms-cards-grid">
          {dummyGyms.map((gym) => (
            <div key={gym.id} className="gym-card-tile">
              <div className="gym-tile-top">
                <span className="gym-type-tag">{gym.type}</span>
                <span className="gym-rating-pill">
                  <Star size={13} className="star-icon" />
                  <strong>{gym.rating}</strong>
                </span>
              </div>

              <h4 className="gym-name">{gym.name}</h4>
              <p className="gym-address">
                <MapPin size={13} className="pin-icon" />
                <span>{gym.address}</span>
              </p>

              <div className="gym-info-chips">
                <span className="info-chip distance">{gym.distance}</span>
                <span className="info-chip status">{gym.status}</span>
              </div>

              <div className="gym-card-footer">
                <span className="gym-hours">
                  <Clock size={12} />
                  <span>{gym.hours}</span>
                </span>
                
                <a 
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(gym.name + ' ' + gym.address)}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="btn-directions-link"
                >
                  <span>Directions</span>
                  <ExternalLink size={13} />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GymMap;
