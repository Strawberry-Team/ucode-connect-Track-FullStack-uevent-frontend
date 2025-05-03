import React, { useState, useEffect, useRef, useMemo } from 'react';

const LocationPicker = ({ 
  initialCoordinates = '', 
  onLocationSelect 
}) => {
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const googleMapRef = useRef(null);
  const autoCompleteRef = useRef(null);
  const scriptRef = useRef(null);
  const lastReportedCoordinatesRef = useRef(initialCoordinates);
  const googleMapsLoadedRef = useRef(false);
  const mapInitializedRef = useRef(false);

  const [coordinates, setCoordinates] = useState(initialCoordinates);
  const [searchValue, setSearchValue] = useState('');
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const isInitializedRef = useRef(false);
  const initialLocation = useMemo(() => {
    const defaultLocation = { lat: 50.450001, lng: 30.523333 };
    
    if (!initialCoordinates) {
      return defaultLocation;
    }

    try {
      const [lat, lng] = initialCoordinates.split(',').map(coord => parseFloat(coord.trim()));
      return (!isNaN(lat) && !isNaN(lng)) 
        ? { lat, lng } 
        : defaultLocation;
    } catch {
      return defaultLocation;
    }
  }, []);

  useEffect(() => {
    if (initialCoordinates !== coordinates && initialCoordinates !== lastReportedCoordinatesRef.current && initialCoordinates !== '') {
      setCoordinates(initialCoordinates);
      lastReportedCoordinatesRef.current = initialCoordinates;
    }
  }, [initialCoordinates]);

  useEffect(() => {
    if (isInitializedRef.current) return;
  isInitializedRef.current = true;
    if (window.google?.maps) {
      googleMapsLoadedRef.current = true;
      if (!mapInitializedRef.current) {
        initializeMap();
      }
      return;
    }

    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      const checkGoogle = setInterval(() => {
        if (window.google?.maps) {
          clearInterval(checkGoogle);
          googleMapsLoadedRef.current = true;
          if (!mapInitializedRef.current) {
            initializeMap();
          }
        }
      }, 100);
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      googleMapsLoadedRef.current = true;
      initializeMap();
    };
    
    script.onerror = () => {
      console.error('Failed to load Google Maps script');
    };

    scriptRef.current = script;
    document.head.appendChild(script);

    return () => {
    };
  }, []);

  const initializeMap = () => {
    if (!mapRef.current || !window.google || mapInitializedRef.current) return;

    try {
      const mapOptions = {
        center: initialLocation,
        zoom: 15,
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: true,
      };
      
      const map = new window.google.maps.Map(mapRef.current, mapOptions);
      googleMapRef.current = map;
      
      const marker = new window.google.maps.Marker({
        position: initialLocation,
        map: map,
        draggable: true,
        animation: window.google.maps.Animation.DROP,
      });
      markerRef.current = marker;
      
      marker.addListener('dragend', () => {
        const position = marker.getPosition();
        const newCoordinates = `${position.lat()},${position.lng()}`;
        updateCoordinates(newCoordinates);
      });
      
      map.addListener('click', (e) => {
        marker.setPosition(e.latLng);
        const newCoordinates = `${e.latLng.lat()},${e.latLng.lng()}`;
        updateCoordinates(newCoordinates);
      });
      
      const autocomplete = new window.google.maps.places.Autocomplete(
        document.getElementById('location-search-input'),
        { types: ['geocode', 'establishment'] }
      );
      autoCompleteRef.current = autocomplete;
      
      autocomplete.bindTo('bounds', map);
      
      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        
        if (!place.geometry || !place.geometry.location) return;
        
        if (place.geometry.viewport) {
          map.fitBounds(place.geometry.viewport);
        } else {
          map.setCenter(place.geometry.location);
          map.setZoom(17);
        }
        
        marker.setPosition(place.geometry.location);
        
        const newCoordinates = `${place.geometry.location.lat()},${place.geometry.location.lng()}`;
        updateCoordinates(newCoordinates);
        
        setSearchValue(place.formatted_address || '');
      });
      
      mapInitializedRef.current = true;
      setIsMapLoaded(true);
    } catch (error) {
      console.error('Error initializing Google Maps:', error);
    }
  };

  const updateCoordinates = (newCoordinates) => {
    if (newCoordinates !== lastReportedCoordinatesRef.current) {
      setCoordinates(newCoordinates);
      lastReportedCoordinatesRef.current = newCoordinates;
      
      if (onLocationSelect) {
        setTimeout(() => {
          onLocationSelect(newCoordinates);
        }, 10);
      }
    }
  };


  useEffect(() => {
    if (isMapLoaded && coordinates && googleMapRef.current && markerRef.current) {
      try {
        const [lat, lng] = coordinates.split(',').map(coord => parseFloat(coord.trim()));
        
        if (!isNaN(lat) && !isNaN(lng)) {
          const location = { lat, lng };
          
          const currentPos = markerRef.current.getPosition();
          if (!currentPos || 
              Math.abs(currentPos.lat() - lat) > 0.0000001 || 
              Math.abs(currentPos.lng() - lng) > 0.0000001) {
            
            googleMapRef.current.setCenter(location);
            markerRef.current.setPosition(location);
          }
        }
      } catch (error) {
        console.error('Error updating map position:', error);
      }
    }
  }, [coordinates, isMapLoaded]);

  const handleCoordinatesChange = (e) => {
    setCoordinates(e.target.value);
  };

  const handleCoordinatesBlur = () => {
    updateCoordinates(coordinates);
  };

  const handleSearchChange = (e) => {
    setSearchValue(e.target.value);
  };

  const handleReverseGeocode = async () => {
    if (!coordinates || !window.google) return;
    
    try {
      setIsSearching(true);
      const [lat, lng] = coordinates.split(',').map(coord => parseFloat(coord.trim()));
      
      if (isNaN(lat) || isNaN(lng)) return;
      
      const geocoder = new window.google.maps.Geocoder();
      const response = await new Promise((resolve, reject) => {
        geocoder.geocode({ location: { lat, lng } }, (results, status) => {
          if (status === 'OK') {
            resolve(results);
          } else {
            reject(status);
          }
        });
      });
      
      if (response && response.length > 0) {
        setSearchValue(response[0].formatted_address);
      }
    } catch (error) {
      console.error('Error reverse geocoding:', error);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-4">
      
      <div className="relative group">
        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400 dark:text-gray-500">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
          </svg>
        </div>
        <input
          id="location-search-input"
          type="text"
          value={searchValue}
          onChange={handleSearchChange}
          placeholder="Search for a location"
          className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 group-hover:border-emerald-300 dark:group-hover:border-emerald-700 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 dark:bg-gray-800 dark:text-white"
        />
      </div>

      
      <div className="w-full h-[400px] rounded-xl overflow-hidden border-2 border-gray-200 dark:border-gray-700 hover:border-emerald-300 dark:hover:border-emerald-700 transition-all bg-gray-100 dark:bg-gray-800 relative">
        <div ref={mapRef} className="w-full h-full"></div>
        
        
        {!isMapLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 bg-opacity-70 dark:bg-opacity-70">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-4 text-emerald-600 dark:text-emerald-400 font-medium">Loading map...</p>
            </div>
          </div>
        )}
      </div>

      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-3 relative group">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400 dark:text-gray-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
          </div>
          <input
            type="text"
            value={coordinates}
            onChange={handleCoordinatesChange}
            onBlur={handleCoordinatesBlur}
            placeholder="Latitude,Longitude (e.g., 50.4501,30.5234)"
            className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 group-hover:border-emerald-300 dark:group-hover:border-emerald-700 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 dark:bg-gray-800 dark:text-white"
          />
        </div>
        <button
          type="button"
          onClick={handleReverseGeocode}
          disabled={!coordinates || isSearching}
          className="px-4 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-xl flex items-center justify-center font-medium transition-colors"
        >
          {isSearching ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
          )}
          Get Address
        </button>
      </div>
      
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Click on the map to set a location, or search for an address, or enter coordinates manually.
      </p>
    </div>
  );
};

export default React.memo(LocationPicker, (prevProps, nextProps) => {
  return prevProps.initialCoordinates === nextProps.initialCoordinates;
});

