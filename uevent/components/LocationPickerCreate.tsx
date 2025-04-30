import React, { useState, useEffect, useRef } from 'react';
import { Loader } from '@googlemaps/js-api-loader';

interface LocationPickerProps {
  onLocationSelect: (location: { 
    address: string; 
    coordinates: string;
  }) => void;
  initialAddress?: string;
  initialCoordinates?: string;
}

const LocationPickerCreate: React.FC<LocationPickerProps> = ({ 
  onLocationSelect, 
  initialAddress = '',
  initialCoordinates = ''
}) => {
  const [mapLoaded, setMapLoaded] = useState(false);
  const [searchQuery, setSearchQuery] = useState(initialAddress);
  const [selectedLocation, setSelectedLocation] = useState({
    address: initialAddress,
    coordinates: initialCoordinates
  });
  const [error, setError] = useState<string | null>(null);
  const searchQueryRef = useRef(searchQuery);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const searchBoxRef = useRef<google.maps.places.SearchBox | null>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Load Google Maps API
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
    
    if (!apiKey) {
      setError('Google Maps API key is missing');
      return;
    }

    const loader = new Loader({
      apiKey,
      version: 'weekly',
      libraries: ['places']
    });

    loader.load()
      .then(() => {
        setMapLoaded(true);
      })
      .catch(err => {
        console.error('Failed to load Google Maps API:', err);
        setError('Failed to load Google Maps. Please try again later.');
      });
  }, []);

  // Update when searchQuery changes
useEffect(() => {
    searchQueryRef.current = searchQuery;
  }, [searchQuery]);
  
  // Modify the map initialization useEffect:
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;
  
    try {
      // Default to a central position if no coordinates provided
      let initialLatLng = { lat: 40.7128, lng: -74.006 }; // Default to New York
  
      // If initial coordinates are provided, use them
      if (initialCoordinates) {
        const [lat, lng] = initialCoordinates.split(',').map(coord => parseFloat(coord.trim()));
        if (!isNaN(lat) && !isNaN(lng)) {
          initialLatLng = { lat, lng };
        }
      }
  
      // Create map instance
      const mapOptions = {
        center: initialLatLng,
        zoom: 15,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        zoomControl: true,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ]
      };
  
      const map = new google.maps.Map(mapRef.current, mapOptions);
      mapInstanceRef.current = map;
  
      // Add marker if initial coordinates exist
      if (initialCoordinates) {
        const marker = new google.maps.Marker({
          position: initialLatLng,
          map,
          draggable: true,
          animation: google.maps.Animation.DROP
        });
        markerRef.current = marker;
  
        // Update coordinates when marker is dragged
        marker.addListener('dragend', () => {
          const position = marker.getPosition();
          if (position) {
            const lat = position.lat();
            const lng = position.lng();
            const coordinates = `${lat},${lng}`;
            
            // Reverse geocode to get address
            const geocoder = new google.maps.Geocoder();
            geocoder.geocode({ location: position }, (results, status) => {
              if (status === 'OK' && results && results[0]) {
                const address = results[0].formatted_address;
                setSearchQuery(address);
                setSelectedLocation({ address, coordinates });
                onLocationSelect({ address, coordinates });
              }
            });
          }
        });
      }
  
      // Initialize autocomplete
      if (searchInputRef.current) {
        const autocomplete = new google.maps.places.Autocomplete(searchInputRef.current, {
          fields: ['formatted_address', 'geometry', 'name'],
          types: ['establishment', 'geocode']
        });
        autocompleteRef.current = autocomplete;
  
        // Update map when place is selected
        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();
          
          if (!place.geometry || !place.geometry.location) {
            setError('No details available for this place');
            return;
          }
  
          // Update map
          map.setCenter(place.geometry.location);
          map.setZoom(17);
  
          // Add or update marker
          if (markerRef.current) {
            markerRef.current.setPosition(place.geometry.location);
          } else {
            const marker = new google.maps.Marker({
              position: place.geometry.location,
              map,
              draggable: true,
              animation: google.maps.Animation.DROP
            });
            markerRef.current = marker;
  
            // Update coordinates when marker is dragged
            marker.addListener('dragend', () => {
              const position = marker.getPosition();
              if (position) {
                const lat = position.lat();
                const lng = position.lng();
                const coordinates = `${lat},${lng}`;
                
                // Reverse geocode to get address
                const geocoder = new google.maps.Geocoder();
                geocoder.geocode({ location: position }, (results, status) => {
                  if (status === 'OK' && results && results[0]) {
                    const address = results[0].formatted_address;
                    setSearchQuery(address);
                    setSelectedLocation({ address, coordinates });
                    onLocationSelect({ address, coordinates });
                  }
                });
              }
            });
          }
  
          // Update selected location
          const coordinates = `${place.geometry.location.lat()},${place.geometry.location.lng()}`;
          const address = place.formatted_address || place.name || searchQueryRef.current;
          
          setSelectedLocation({ address, coordinates });
          onLocationSelect({ address, coordinates });
        });
      }
  
      // Allow clicking on map to set location
      map.addListener('click', (e) => {
        if (!e.latLng) return;
        
        // Add or update marker
        if (markerRef.current) {
          markerRef.current.setPosition(e.latLng);
        } else {
          const marker = new google.maps.Marker({
            position: e.latLng,
            map,
            draggable: true,
            animation: google.maps.Animation.DROP
          });
          markerRef.current = marker;
  
          // Update coordinates when marker is dragged
          marker.addListener('dragend', () => {
            const position = marker.getPosition();
            if (position) {
              const lat = position.lat();
              const lng = position.lng();
              const coordinates = `${lat},${lng}`;
              
              // Reverse geocode to get address
              const geocoder = new google.maps.Geocoder();
              geocoder.geocode({ location: position }, (results, status) => {
                if (status === 'OK' && results && results[0]) {
                  const address = results[0].formatted_address;
                  setSearchQuery(address);
                  setSelectedLocation({ address, coordinates });
                  onLocationSelect({ address, coordinates });
                }
              });
            }
          });
        }
  
        // Get coordinates and do reverse geocoding
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        const coordinates = `${lat},${lng}`;
        
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ location: e.latLng }, (results, status) => {
          if (status === 'OK' && results && results[0]) {
            const address = results[0].formatted_address;
            setSearchQuery(address);
            setSelectedLocation({ address, coordinates });
            onLocationSelect({ address, coordinates });
          } else {
            setSelectedLocation({
              address: `Location at ${lat.toFixed(6)}, ${lng.toFixed(6)}`,
              coordinates
            });
            onLocationSelect({
              address: `Location at ${lat.toFixed(6)}, ${lng.toFixed(6)}`,
              coordinates
            });
          }
        });
      });
  
      // Return cleanup function
      return () => {
        // Clean up event listeners
        if (markerRef.current) {
          google.maps.event.clearInstanceListeners(markerRef.current);
        }
        if (mapInstanceRef.current) {
          google.maps.event.clearInstanceListeners(mapInstanceRef.current);
        }
        if (autocompleteRef.current) {
          google.maps.event.clearInstanceListeners(autocompleteRef.current);
        }
      };
    } catch (err) {
      console.error('Error initializing Google Maps:', err);
      setError('Failed to initialize map. Please try again.');
    }
  }, [mapLoaded, initialCoordinates, onLocationSelect]);
  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 text-red-700 dark:text-red-400 text-sm rounded">
          {error}
        </div>
      )}
      
      <div className="relative">
        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400 dark:text-gray-500">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
          </svg>
        </div>
        <input 
          ref={searchInputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search for a location..."
          className="w-full pl-12 px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 group-hover:border-emerald-300 dark:group-hover:border-emerald-700 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 dark:bg-gray-800 dark:text-white"
        />
      </div>
      
      <div 
        ref={mapRef} 
        className="w-full h-96 rounded-xl overflow-hidden border-2 border-gray-200 dark:border-gray-700"
      >
        {!mapLoaded && (
          <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
            <div className="animate-spin w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full"></div>
          </div>
        )}
      </div>
      
      {selectedLocation.coordinates && (
        <div className="flex items-center p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-100 dark:border-emerald-800">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-500 mr-2 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
          </svg>
          <div className="text-sm">
            <span className="font-medium text-emerald-700 dark:text-emerald-400">Selected Location: </span>
            <span className="text-gray-700 dark:text-gray-300">{selectedLocation.address}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationPickerCreate;