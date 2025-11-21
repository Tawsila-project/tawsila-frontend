import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { GeoSearchControl, OpenStreetMapProvider } from 'leaflet-geosearch';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-geosearch/dist/geosearch.css';

// Marker icon
const icon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const LocationMarker = ({ position, setPosition }) => {
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
    },
  });

  return position === null ? null : <Marker position={position} icon={icon} />;
};

const MapWithSearch = ({ setPosition }) => {
  const map = useMapEvents({});
  
  useEffect(() => {
    const provider = new OpenStreetMapProvider();
    const searchControl = new GeoSearchControl({ provider, showMarker: false, retainZoomLevel: true });

    map.addControl(searchControl);

    map.on('geosearch/showlocation', (result) => {
      setPosition(result.location);
    });

    return () => map.removeControl(searchControl);
  }, [map, setPosition]);

  return null;
};

export default function CustomerMap() {
  const [position, setPosition] = useState(null);

  return (
    <MapContainer center={[33.8938, 35.5018]} zoom={13} style={{ height: '500px', width: '100%' }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <LocationMarker position={position} setPosition={setPosition} />
      <MapWithSearch setPosition={setPosition} />
    </MapContainer>
  );
}
