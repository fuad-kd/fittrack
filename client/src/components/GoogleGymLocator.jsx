import React from 'react';
import FreeLiveGymMap from './FreeLiveGymMap';

export function GoogleMapsProvider({ children }) {
  return <>{children}</>;
}

const GoogleGymLocator = (props) => {
  return <FreeLiveGymMap {...props} />;
};

export default GoogleGymLocator;
