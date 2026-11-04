import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const guessIcon = L.divIcon({
  className: 'guess-map-marker',
  html: '<span></span>',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

export default function GuessMap({ location, onLocationSelect }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    const map = L.map(containerRef.current, {
      center: [15, 0],
      zoom: 2,
      minZoom: 2,
      maxZoom: 18,
      worldCopyJump: true,
    });
    mapRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    map.on('click', (event) => {
      onLocationSelect({
        latitude: Number(event.latlng.lat.toFixed(4)),
        longitude: Number(event.latlng.lng.toFixed(4)),
      });
    });

    const resizeObserver = new ResizeObserver(() => map.invalidateSize());
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, [onLocationSelect]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) {
      return;
    }

    if (location) {
      if (markerRef.current) {
        markerRef.current.setLatLng([location.latitude, location.longitude]);
      } else {
        markerRef.current = L.marker(
          [location.latitude, location.longitude],
          { icon: guessIcon },
        ).addTo(map);
      }
    } else if (markerRef.current) {
      markerRef.current.remove();
      markerRef.current = null;
    }
  }, [location]);

  return (
    <div
      ref={containerRef}
      className="guess-map"
      role="application"
      aria-label="Interactive world map. Click to choose your guess location."
    />
  );
}
