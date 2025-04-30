"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";

const GOOGLE_MAPS_LIBRARIES: ("places")[] = ["places"];
const DEFAULT_CENTER = { lat: 50.4501, lng: 30.5234 };
const SIDEBAR_WIDTH = 350;
const ZOOM_DEFAULT = 15;

interface PlaceDetails {
    name: string;
    address: string;
    coordinates: string;
    location?: google.maps.LatLngLiteral;
    rating?: number;
    reviews?: number;
    openingHours?: string[];
    phone?: string;
    website?: string;
    photo?: string;
    isOpen24Hours?: boolean;
}

interface LocationPickerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (venue: string, coordinates: string) => void;
    initialVenue: string;
    initialCoordinates: string;
}

const parseCoordinates = (coords: string): google.maps.LatLngLiteral | null => {
    if (!coords) return null;
    const [lat, lng] = coords.split(",").map(Number);
    return isNaN(lat) || isNaN(lng) ? null : { lat, lng };
};

const getCityAndCountryFromComponents = (placeDetails: google.maps.places.PlaceResult | google.maps.GeocoderResult): { city: string; country: string } => {
    let city = "";
    let country = "";

    if (placeDetails.address_components) {
        for (const component of placeDetails.address_components) {
            if (component.types.includes("locality")) city = component.long_name;
            if (component.types.includes("country")) country = component.long_name;
        }
    }

    return { city, country };
};

const createPlaceDetails = (
    placeDetails: google.maps.places.PlaceResult,
    fallbackCoordinates: string,
    fallbackLocation?: google.maps.LatLngLiteral
): PlaceDetails => {
    const isOpen24Hours =
        placeDetails.opening_hours?.isOpen() &&
        placeDetails.opening_hours.weekday_text?.every((day) => day.includes("24 hours"));

    return {
        name: placeDetails.name || "",
        address: placeDetails.formatted_address || "",
        coordinates: placeDetails.geometry?.location
            ? `${placeDetails.geometry.location.lat()},${placeDetails.geometry.location.lng()}`
            : fallbackCoordinates,
        rating: placeDetails.rating,
        reviews: placeDetails.user_ratings_total,
        openingHours: placeDetails.opening_hours?.weekday_text,
        phone: placeDetails.formatted_phone_number,
        website: placeDetails.website,
        photo: placeDetails.photos?.[0]?.getUrl({ maxWidth: 400 }),
        location: placeDetails.geometry?.location?.toJSON() || fallbackLocation,
        isOpen24Hours,
    };
};

export default function GoogleMapLocationPickerModal({
    isOpen,
    onClose,
    onSelect,
    initialVenue,
    initialCoordinates,
}: LocationPickerModalProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const mapRef = useRef<google.maps.Map | null>(null);
    const [venue, setVenue] = useState(initialVenue);
    const [coordinates, setCoordinates] = useState(initialCoordinates);
    const [searchQuery, setSearchQuery] = useState("");
    const [filteredPlaces, setFilteredPlaces] = useState<google.maps.places.AutocompletePrediction[]>([]);
    const [selectedPlace, setSelectedPlace] = useState<PlaceDetails | null>(null);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isHoursExpanded, setIsHoursExpanded] = useState(false);
    const [mapCenter, setMapCenter] = useState<google.maps.LatLngLiteral | null>(null);
    const [zoom, setZoom] = useState(ZOOM_DEFAULT);

    const { isLoaded } = useJsApiLoader({
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "YOUR_API_KEY_HERE",
        libraries: GOOGLE_MAPS_LIBRARIES,
    });

    const getLngOffset = useCallback((pixels: number, zoomLevel: number, latitude: number) => {
        const metersPerPixel = (40075016.686 * Math.cos((latitude * Math.PI) / 180)) / (256 * Math.pow(2, zoomLevel));
        return (pixels * metersPerPixel) / 111320;
    }, []);

    const centerMapWithOffset = useCallback(
        (location: google.maps.LatLngLiteral) => {
            const offsetPixels = SIDEBAR_WIDTH / 2;
            const currentZoom = mapRef.current?.getZoom() || zoom;
            const lngOffset = getLngOffset(offsetPixels, currentZoom, location.lat);
            setMapCenter({ lat: location.lat, lng: location.lng - lngOffset });
        },
        [getLngOffset, zoom]
    );

    const resetState = () => {
        setVenue(initialVenue);
        setCoordinates(initialCoordinates);
        setSelectedPlace(null);
        setSearchQuery(initialVenue);
        setFilteredPlaces([]);
        setShowSuggestions(false);
    };

    const fetchPlaceDetails = (
        place: google.maps.places.AutocompletePrediction,
        fallbackCoordinates: string,
        fallbackLocation?: google.maps.LatLngLiteral
    ) => {
        const placesService = new google.maps.places.PlacesService(document.createElement("div"));
        placesService.getDetails(
            {
                placeId: place.place_id,
                fields: [
                    "name",
                    "formatted_address",
                    "address_components",
                    "geometry",
                    "rating",
                    "user_ratings_total",
                    "opening_hours",
                    "formatted_phone_number",
                    "website",
                    "photos",
                ],
            },
            (placeDetails, status) => {
                if (status === google.maps.places.PlacesServiceStatus.OK && placeDetails) {
                    const newPlace = createPlaceDetails(placeDetails, fallbackCoordinates, fallbackLocation);
                    setVenue(newPlace.name);
                    setCoordinates(newPlace.coordinates);
                    setSelectedPlace(newPlace);

                    const { city, country } = getCityAndCountryFromComponents(placeDetails);
                    const formattedQuery = city && country ? `${country}, ${city}, ${newPlace.name}` : newPlace.name;
                    setSearchQuery(formattedQuery);

                    setShowSuggestions(false);
                    if (newPlace.location) centerMapWithOffset(newPlace.location);
                }
            }
        );
    };

    useEffect(() => {
        if (!isOpen) return;
        resetState();

        if (!initialVenue) {
            setSelectedPlace(null);
            setSearchQuery("");
            setMapCenter(null);
            return;
        }

        const initialLocation = parseCoordinates(initialCoordinates);
        if (initialLocation) centerMapWithOffset(initialLocation);

        if (isLoaded && initialVenue.trim().length >= 3) {
            const autocompleteService = new google.maps.places.AutocompleteService();
            autocompleteService.getPlacePredictions(
                { input: initialVenue, types: ["establishment", "geocode"] },
                (predictions, status) => {
                    if (status === google.maps.places.PlacesServiceStatus.OK && predictions?.length) {
                        fetchPlaceDetails(predictions[0], initialCoordinates, initialLocation || undefined);
                    } else {
                        setSelectedPlace(null);
                    }
                }
            );
        }
    }, [initialVenue, initialCoordinates, isLoaded, isOpen, centerMapWithOffset]);

    const filterPlaces = (query: string) => {
        if (!isLoaded || query.trim().length < 3) {
            setFilteredPlaces([]);
            setShowSuggestions(false);
            return;
        }

        const autocompleteService = new google.maps.places.AutocompleteService();
        autocompleteService.getPlacePredictions(
            { input: query, types: ["establishment", "geocode"] },
            (predictions, status) => {
                setFilteredPlaces(status === google.maps.places.PlacesServiceStatus.OK && predictions ? predictions : []);
                setShowSuggestions(status === google.maps.places.PlacesServiceStatus.OK && !!predictions);
            }
        );
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value;
        setSearchQuery(query);
        filterPlaces(query);
    };

    const handlePlaceSelect = (place: google.maps.places.AutocompletePrediction) => {
        if (!isLoaded) return;
        fetchPlaceDetails(place, "");
    };

    const handleMapClick = (event: google.maps.MapMouseEvent) => {
        if (!isLoaded || !event.latLng) return;

        const lat = event.latLng.lat();
        const lng = event.latLng.lng();
        const clickedLocation = { lat, lng };
        const coordinates = `${lat},${lng}`;

        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ location: clickedLocation }, (results, status) => {
            if (status !== google.maps.GeocoderStatus.OK || !results?.[0]) return;

            const place = results[0];
            const newPlace: PlaceDetails = {
                name: place.formatted_address || "Unknown place",
                address: place.formatted_address || "",
                coordinates,
                location: clickedLocation,
            };

            const placesService = new google.maps.places.PlacesService(document.createElement("div"));
            placesService.nearbySearch(
                { location: clickedLocation, radius: 50, type: "point_of_interest" },
                (nearbyResults, nearbyStatus) => {
                    if (nearbyStatus === google.maps.places.PlacesServiceStatus.OK && nearbyResults?.[0]) {
                        placesService.getDetails(
                            {
                                placeId: nearbyResults[0].place_id!,
                                fields: [
                                    "name",
                                    "formatted_address",
                                    "address_components",
                                    "geometry",
                                    "rating",
                                    "user_ratings_total",
                                    "opening_hours",
                                    "formatted_phone_number",
                                    "website",
                                    "photos",
                                ],
                            },
                            (placeDetails, detailStatus) => {
                                const updatedPlace =
                                    detailStatus === google.maps.places.PlacesServiceStatus.OK && placeDetails
                                        ? createPlaceDetails(placeDetails, coordinates, clickedLocation)
                                        : newPlace;

                                setVenue(updatedPlace.name);
                                setCoordinates(updatedPlace.coordinates);
                                setSelectedPlace(updatedPlace);

                                const { city, country } = getCityAndCountryFromComponents(placeDetails || place);
                                const formattedQuery = city && country ? `${updatedPlace.name}, ${city}, ${country}` : updatedPlace.name;
                                setSearchQuery(formattedQuery);

                                setShowSuggestions(false);
                                centerMapWithOffset(clickedLocation);
                            }
                        );
                    } else {
                        setVenue(newPlace.name);
                        setCoordinates(newPlace.coordinates);
                        setSelectedPlace(newPlace);

                        const { city, country } = place.address_components
                            ? getCityAndCountryFromComponents(place)
                            : { city: "", country: "" };
                        const formattedQuery = city && country ? `${country}, ${city}, ${newPlace.name}` : newPlace.name;
                        setSearchQuery(formattedQuery);

                        setShowSuggestions(false);
                        centerMapWithOffset(clickedLocation);
                    }
                }
            );
        });
    };

    const handleApply = () => {
        if (!venue || !coordinates) {
            alert("Please select a place");
            return;
        }
        onSelect(venue, coordinates);
    };

    const handleClose = () => {
        resetState();
        onClose();
    };

    const handleClearSearch = () => {
        setSearchQuery("");
        setSelectedPlace(null);
        setFilteredPlaces([]);
        setShowSuggestions(false);
        setMapCenter(null);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={handleClose}>
            <div
                className="bg-white rounded-lg w-[1000px] h-[700px] relative flex"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Sidebar */}
                <div className="w-[350px] h-full bg-white border-r border-gray-200 overflow-y-auto">
                    {/* Search Input */}
                    <div className="p-4 relative">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={handleSearchChange}
                            onFocus={() => {
                                if (searchQuery.trim() !== "") filterPlaces(searchQuery);
                            }}
                            onBlur={() => setTimeout(() => setShowSuggestions(false), 100)}
                            placeholder="Search location..."
                            className="w-full p-2 border border-gray-300 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            ref={inputRef}
                            autoComplete="off"
                        />
                        {searchQuery && (
                            <button
                                onClick={handleClearSearch}
                                className="absolute right-6 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                            >
                                ✕
                            </button>
                        )}
                        {showSuggestions && filteredPlaces.length > 0 && (
                            <ul className="absolute left-4 right-4 bg-white border border-gray-300 rounded-b-lg shadow-lg mt-1 max-h-60 overflow-y-auto z-10">
                                {filteredPlaces.map((place) => (
                                    <li
                                        key={place.place_id}
                                        onClick={() => handlePlaceSelect(place)}
                                        className="p-2 hover:bg-gray-100 cursor-pointer"
                                    >
                                        {place.description}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {/* Place Details */}
                    {selectedPlace && (
                        <div className="p-4 space-y-4">
                            {selectedPlace.photo && (
                                <img
                                    src={selectedPlace.photo}
                                    alt={selectedPlace.name}
                                    className="w-full h-48 object-cover rounded-lg"
                                />
                            )}
                            <h3 className="text-lg font-semibold text-gray-900">
                                {selectedPlace.name}
                            </h3>
                            {selectedPlace.rating && (
                                <div className="flex items-center">
                                    <span className="text-yellow-500 mr-1">★</span>
                                    <span className="text-sm text-gray-600">
                                        {selectedPlace.rating} ({selectedPlace.reviews} reviews)
                                    </span>
                                </div>
                            )}
                            <div className="flex items-start">
                                <span className="text-gray-600 mr-2">📍</span>
                                <p className="text-sm">{selectedPlace.address}</p>
                            </div>
                            {selectedPlace.openingHours && (
                                <div>
                                    {selectedPlace.isOpen24Hours ? (
                                        <div className="flex items-center">
                                            <span className="text-gray-600 mr-2">🕒</span>
                                            <p className="text-sm">Open 24 hours</p>
                                        </div>
                                    ) : (
                                        <div>
                                            <div
                                                className="flex items-center cursor-pointer"
                                                onClick={() => setIsHoursExpanded(!isHoursExpanded)}
                                            >
                                                <span className="text-gray-600 mr-2">🕒</span>
                                                <p className="text-sm">Opening hours</p>
                                                <span className="ml-2 text-gray-600">
                                                    {isHoursExpanded ? "▲" : "▼"}
                                                </span>
                                            </div>
                                            {isHoursExpanded && (
                                                <ul className="text-sm text-gray-600 mt-2 space-y-2">
                                                    {selectedPlace.openingHours.map((hours, index) => (
                                                        <li key={index}>{hours}</li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                            {selectedPlace.phone && (
                                <div className="flex items-center">
                                    <span className="text-gray-600 mr-2">📞</span>
                                    <span className="text-sm">{selectedPlace.phone}</span>
                                </div>
                            )}
                            {selectedPlace.website && (
                                <div className="flex items-center">
                                    <span className="text-gray-600 mr-2">🌐</span>
                                    <a
                                        href={selectedPlace.website}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm text-blue-500 hover:underline"
                                    >
                                        {selectedPlace.website}
                                    </a>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Map */}
                <div className="flex-1 relative">
                    {isLoaded ? (
                        <GoogleMap
                            mapContainerStyle={{ width: "100%", height: "100%" }}
                            center={mapCenter || DEFAULT_CENTER}
                            zoom={zoom}
                            options={{
                                mapTypeControl: false,
                                streetViewControl: false,
                                fullscreenControl: false,
                                rotateControl: false,
                            }}
                            onClick={handleMapClick}
                            onLoad={(map) => {
                                mapRef.current = map;
                            }}
                            onZoomChanged={() => {
                                if (mapRef.current) setZoom(mapRef.current.getZoom() || ZOOM_DEFAULT);
                            }}
                        >
                            {selectedPlace?.location && <Marker position={selectedPlace.location} />}
                        </GoogleMap>
                    ) : (
                        <div className="flex items-center justify-center h-full">
                            <p>Loading map...</p>
                        </div>
                    )}
                </div>

                {/* Buttons */}
                <div className="absolute bottom-4 right-4 flex space-x-2">
                    <button
                        onClick={handleClose}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg shadow-md hover:bg-gray-300"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleApply}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg shadow-md hover:bg-blue-600"
                    >
                        Apply
                    </button>
                </div>
            </div>
        </div>
    );
}