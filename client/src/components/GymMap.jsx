import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { MapPin } from 'lucide-react';
import GoogleGymLocator from './GoogleGymLocator';
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
            <h2>Live Location &amp; Map Search</h2>
            <p>Track your live browser GPS location and search any place on the map — no API key required.</p>
          </div>
        </div>
      </div>

      <GoogleGymLocator mode="full" />
    </div>
  );
};

export default GymMap;
