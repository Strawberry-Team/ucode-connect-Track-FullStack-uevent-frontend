import React, { useEffect, useRef, useState } from 'react';

const EventLocationMap = ({ coordinates, venueName }) => {
  const mapRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [mapError, setMapError] = useState(null);
  const [useGoogleMap, setUseGoogleMap] = useState(true);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const googleLoadAttemptedRef = useRef(false);
  
  useEffect(() => {
    if (!coordinates) return;
    
    if (useGoogleMap && !googleLoadAttemptedRef.current) {
      googleLoadAttemptedRef.current = true;
      loadGoogleMap();
    } else if (!useGoogleMap) {
      googleLoadAttemptedRef.current = false;
    }
    
    return () => {
      if (mapInstanceRef.current && window.google && window.google.maps) {
        google.maps.event.clearInstanceListeners(mapInstanceRef.current);
        
        if (markerRef.current) {
          google.maps.event.clearInstanceListeners(markerRef.current);
        }
      }
    };
  }, [coordinates, useGoogleMap]);
  
  const loadGoogleMap = () => {
    if (window.google && window.google.maps) {
      initializeGoogleMap();
      return;
    }
    
    const existingScript = document.getElementById('google-maps-script');
    if (existingScript) {
      const checkGoogleInterval = setInterval(() => {
        if (window.google && window.google.maps) {
          clearInterval(checkGoogleInterval);
          initializeGoogleMap();
        }
      }, 100);
      
      setTimeout(() => {
        clearInterval(checkGoogleInterval);
        if (!window.google || !window.google.maps) {
          console.error('Google Maps failed to load within timeout');
          setMapError('Failed to load Google Maps. Showing OpenStreetMap instead.');
          setUseGoogleMap(false);
          setIsLoaded(false);
        }
      }, 10000);
      
      return;
    }
    
    window.googleMapCallback = () => {
      initializeGoogleMap();
    };
    
    const script = document.createElement('script');
    script.id = 'google-maps-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places&callback=googleMapCallback`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
    };
    
    script.onerror = () => {
      console.error('Failed to load Google Maps API');
      setMapError('Failed to load Google Maps. Showing OpenStreetMap instead.');
      setUseGoogleMap(false);
      setIsLoaded(false);
    };
    
    document.head.appendChild(script);
  };
  
  const initializeGoogleMap = () => {
    try {
      if (!coordinates || !mapRef.current) return;
      
      if (mapInstanceRef.current) {
        updateGoogleMap();
        return;
      }
      
      const [lat, lng] = coordinates.split(',').map(coord => parseFloat(coord.trim()));
      
      if (isNaN(lat) || isNaN(lng)) {
        throw new Error('Invalid coordinates');
      }
      
      const mapOptions = {
        center: { lat, lng },
        zoom: 15,
        mapTypeId: window.google.maps.MapTypeId.ROADMAP,
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: true,
      };
      
      const map = new window.google.maps.Map(mapRef.current, mapOptions);
      mapInstanceRef.current = map;
      
      const marker = new window.google.maps.Marker({
        position: { lat, lng },
        map: map,
        title: venueName || 'Event Location',
        animation: window.google.maps.Animation.DROP,
        icon: {
          url: "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
          scaledSize: new window.google.maps.Size(40, 40),
        }
      });
      markerRef.current = marker;
      
      setIsLoaded(true);
      setMapError(null);
    } catch (error) {
      console.error('Error initializing Google Map:', error);
      setMapError('Error loading Google Maps. Showing OpenStreetMap instead.');
      setUseGoogleMap(false);
      setIsLoaded(false);
    }
  };
  
  const updateGoogleMap = () => {
    if (!coordinates || !mapInstanceRef.current || !markerRef.current) return;
    
    try {
      const [lat, lng] = coordinates.split(',').map(coord => parseFloat(coord.trim()));
      
      if (isNaN(lat) || isNaN(lng)) {
        throw new Error('Invalid coordinates');
      }
      
      const position = { lat, lng };
      mapInstanceRef.current.setCenter(position);
      markerRef.current.setPosition(position);
      
      if (markerRef.current.getTitle() !== venueName) {
        markerRef.current.setTitle(venueName || 'Event Location');
      }
    } catch (error) {
      console.error('Error updating Google Map:', error);
    }
  };
  
  const renderOpenStreetMap = () => {
    if (!coordinates) return null;
    
    try {
      const [lat, lng] = coordinates.split(',').map(coord => parseFloat(coord.trim()));
      
      if (isNaN(lat) || isNaN(lng)) {
        return (
          <div className="flex items-center justify-center h-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
            Invalid coordinates
          </div>
        );
      }
      
      return (
        <iframe 
          width="100%" 
          height="100%" 
          frameBorder="0" 
          scrolling="no" 
          marginHeight="0" 
          marginWidth="0" 
          src={`https://www.openstreetmap.org/export/embed.html?bbox=${lng-0.01},${lat-0.01},${lng+0.01},${lat+0.01}&layer=mapnik&marker=${lat},${lng}`} 
          style={{ border: 0 }}
          title="Event Location Map"
        ></iframe>
      );
    } catch (error) {
      console.error('Error rendering OpenStreetMap:', error);
      return (
        <div className="flex items-center justify-center h-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
          Could not load map
        </div>
      );
    }
  };
  
  if (!coordinates) {
    return (
      <div className="aspect-video bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden flex items-center justify-center text-gray-500 dark:text-gray-400">
        No location coordinates available
      </div>
    );
  }
  
  return (
    <div className="aspect-video bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden relative">
      {useGoogleMap ? (
        <>
          <div ref={mapRef} className="w-full h-full"></div>
          
          {!isLoaded && !mapError && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-700">
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500"></div>
                <p className="mt-4 text-gray-600 dark:text-gray-400">Loading map...</p>
              </div>
            </div>
          )}
          
          {mapError && !isLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-700">
              {renderOpenStreetMap()}
            </div>
          )}
        </>
      ) : (
        renderOpenStreetMap()
      )}
    </div>
  );
};

export default EventLocationMap;

