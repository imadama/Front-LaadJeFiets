import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in React Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom marker icons
const createMarkerIcon = (isSelected) => {
  return L.icon({
    iconUrl: isSelected 
      ? 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png'
      : 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    shadowSize: [41, 41]
  });
};

// Center the map on a specific position
function CenterMapOnMarker({ position }) {
  const map = useMap();
  
  useEffect(() => {
    if (position) {
      map.setView(position, map.getZoom());
    }
  }, [position, map]);
  
  return null;
}

// Internal marker component for single marker selection
function SingleMapMarker({ position, setPosition }) {
  const map = useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });

  // When position changes, recenter the map
  useEffect(() => {
    if (position) {
      map.setView(position, map.getZoom());
    }
  }, [position, map]);

  return position ? <Marker position={position} /> : null;
}

// Component to handle multiple markers
function MultipleMarkers({ markers, onMarkerSelect }) {
  return (
    <>
      {markers.map((marker) => (
        <Marker 
          key={marker.id} 
          position={marker.position}
          icon={createMarkerIcon(marker.isSelected)}
          eventHandlers={{
            click: () => {
              if (onMarkerSelect) onMarkerSelect(marker.id);
            },
          }}
        >
          <Popup>
            <div>
              <strong>Socket ID:</strong> {marker.id}
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  );
}

// Main component
function MapComponent({ onPositionSelected, initialPosition, allMarkers, onMarkerSelect, isViewOnly }) {
  const [position, setPosition] = useState(initialPosition);
  const [mapKey, setMapKey] = useState(Date.now());
  const containerRef = useRef(null);

  // Custom position handler
  const handlePositionChange = (newPosition) => {
    setPosition(newPosition);
    if (onPositionSelected) {
      onPositionSelected(newPosition);
    }
  };

  // Cleanup and recreate map if there's an error
  useEffect(() => {
    return () => {
      // Get all leaflet-related elements that might be causing conflicts
      const mapContainers = document.querySelectorAll('.leaflet-container');
      mapContainers.forEach(container => {
        if (container._leaflet_id) {
          // Manually remove leaflet id to avoid conflicts
          delete container._leaflet_id;
        }
      });
    };
  }, []);

  return (
    <div className="map-wrapper" style={{ width: '100%', height: '100%' }} ref={containerRef}>
      <MapContainer
        key={mapKey}
        center={initialPosition || [52.0907, 5.1214]} // Default: Utrecht, Netherlands
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        {/* If we have markers data, show multiple markers */}
        {allMarkers && allMarkers.length > 0 ? (
          <>
            <MultipleMarkers markers={allMarkers} onMarkerSelect={onMarkerSelect} />
            {initialPosition && <CenterMapOnMarker position={initialPosition} />}
          </>
        ) : (
          /* Otherwise, show single marker with click-to-place functionality */
          <>
            {!isViewOnly && <SingleMapMarker position={position} setPosition={handlePositionChange} />}
            {isViewOnly && position && <Marker position={position} />}
            {position && <CenterMapOnMarker position={position} />}
          </>
        )}
      </MapContainer>
    </div>
  );
}

export default MapComponent; 