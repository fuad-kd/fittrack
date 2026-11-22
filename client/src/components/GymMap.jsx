import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { MapPin } from 'lucide-react';
import FreeLiveGymMap from './FreeLiveGymMap';
import './GymMap.scss';

const GymMap = () => {
  const mapRef = useRef(null);

  useEffect(() => {
    gsap.from('.gym-map-container', { opacity: 0, y: 15, duration: 0.4, ease: 'power2.out' });
  }, []);

  return (
    <div className="gym-map-container" ref={mapRef}>
      <div className="map-page-header">
        <div className="map-title-group">
          <div className="map-icon-box">
            <MapPin size={22} />
          </div>
          <div>
            <h2>Gym &amp; Fitness Locator</h2>
            <p>
              Live browser GPS tracking, nearby gym discovery, and instant Google Maps directions —
              100% free with zero API keys.
            </p>
          </div>
        </div>
      </div>

      <FreeLiveGymMap mode="full" />
    </div>
  );
};

export default GymMap;
