/**
 * Location Service for geolocation and mapping functionality
 * Handles GPS, geocoding, and location-based operations
 */

export class LocationService {
  constructor() {
    this.currentLocation = null;
    this.watchId = null;
    this.geocoder = null;
    this.isWatching = false;
    
    // Default campus coordinates (can be configured per institution)
    this.defaultLocation = {
      lat: 28.6139, // Delhi coordinates as example
      lng: 77.2090,
      address: 'Campus Main Gate',
      accuracy: 100,
      timestamp: Date.now()
    };
  }

  /**
   * Get current user position
   * @returns {Promise<Object>} Location object with lat, lng, accuracy, etc.
   */
  async getCurrentPosition() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        console.warn('Geolocation not supported, using default location');
        resolve(this.defaultLocation);
        return;
      }

      const options = {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      };

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            altitude: position.coords.altitude,
            altitudeAccuracy: position.coords.altitudeAccuracy,
            heading: position.coords.heading,
            speed: position.coords.speed,
            timestamp: position.timestamp
          };
          
          this.currentLocation = location;
          
          // Try to get address from coordinates
          try {
            const address = await this.getAddressFromCoords(location.lat, location.lng);
            location.address = address;
          } catch (error) {
            console.warn('Could not get address:', error);
            location.address = `Location: ${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`;
          }
          
          resolve(location);
        },
        (error) => {
          console.warn('Geolocation error:', this.getGeolocationError(error));
          
          // Enhanced error handling with user feedback
          let errorMessage = 'Unable to get location';
          switch(error.code) {
            case 1:
              errorMessage = 'Location access denied. Please enable location services.';
              break;
            case 2:
              errorMessage = 'Location unavailable. Please check your network connection.';
              break;
            case 3:
              errorMessage = 'Location request timeout. Please try again.';
              break;
          }
          
          // Return default location with error info
          resolve({
            ...this.defaultLocation,
            error: errorMessage,
            fromCache: true
          });
        },
        options
      );
    });
  }

  /**
   * Start continuous location watching
   * @param {Function} onSuccess - Callback for successful location updates
   * @param {Function} onError - Callback for errors
   * @returns {number} Watch ID
   */
  startWatchingPosition(onSuccess, onError) {
    if (!navigator.geolocation) {
      onError(new Error('Geolocation not supported'));
      return null;
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 30000
    };

    this.watchId = navigator.geolocation.watchPosition(
      async (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
          speed: position.coords.speed,
          heading: position.coords.heading
        };
        
        this.currentLocation = location;
        this.isWatching = true;
        
        // Get address if not in high-speed movement
        if (!position.coords.speed || position.coords.speed < 5) {
          try {
            location.address = await this.getAddressFromCoords(location.lat, location.lng);
          } catch (error) {
            console.warn('Address lookup failed:', error);
          }
        }
        
        onSuccess(location);
      },
      (error) => {
        console.error('Location watch error:', error);
        this.isWatching = false;
        onError(error);
      },
      options
    );

    return this.watchId;
  }

  /**
   * Stop watching location
   */
  stopWatchingPosition() {
    if (this.watchId && navigator.geolocation) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
      this.isWatching = false;
    }
  }

  /**
   * Get address from coordinates using Reverse Geocoding
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @returns {Promise<string>} Formatted address
   */
  async getAddressFromCoords(lat, lng) {
    if (!window.google || !window.google.maps) {
      throw new Error('Google Maps API not loaded');
    }

    if (!this.geocoder) {
      this.geocoder = new window.google.maps.Geocoder();
    }

    return new Promise((resolve, reject) => {
      const latLng = new window.google.maps.LatLng(lat, lng);
      
      this.geocoder.geocode({ location: latLng }, (results, status) => {
        if (status === 'OK') {
          if (results[0]) {
            // Extract relevant parts of address
            const address = this.extractCampusAddress(results[0]);
            resolve(address);
          } else {
            reject(new Error('No results found'));
          }
        } else {
          reject(new Error('Geocoder failed: ' + status));
        }
      });
    });
  }

  /**
   * Extract campus-relevant address information
   * @param {Object} geocodeResult - Google Maps geocode result
   * @returns {string} Formatted address
   */
  extractCampusAddress(geocodeResult) {
    const addressComponents = geocodeResult.address_components;
    let building = '';
    let street = '';
    let area = '';
    let city = '';
    
    addressComponents.forEach(component => {
      if (component.types.includes('premise')) {
        building = component.long_name;
      } else if (component.types.includes('route')) {
        street = component.long_name;
      } else if (component.types.includes('sublocality') || component.types.includes('neighborhood')) {
        area = component.long_name;
      } else if (component.types.includes('locality')) {
        city = component.long_name;
      }
    });
    
    // Construct readable address
    const parts = [];
    if (building) parts.push(building);
    if (street) parts.push(street);
    if (area) parts.push(area);
    if (city) parts.push(city);
    
    return parts.length > 0 ? parts.join(', ') : geocodeResult.formatted_address;
  }

  /**
   * Get coordinates from address (Forward Geocoding)
   * @param {string} address - Address string
   * @returns {Promise<Object>} Coordinates object
   */
  async getCoordsFromAddress(address) {
    if (!window.google || !window.google.maps) {
      throw new Error('Google Maps API not loaded');
    }

    if (!this.geocoder) {
      this.geocoder = new window.google.maps.Geocoder();
    }

    return new Promise((resolve, reject) => {
      this.geocoder.geocode({ address }, (results, status) => {
        if (status === 'OK') {
          const location = results[0].geometry.location;
          resolve({
            lat: location.lat(),
            lng: location.lng(),
            address: results[0].formatted_address,
            placeId: results[0].place_id
          });
        } else {
          reject(new Error('Geocode failed: ' + status));
        }
      });
    });
  }

  /**
   * Calculate distance between two points in meters
   * @param {Object} point1 - {lat, lng}
   * @param {Object} point2 - {lat, lng}
   * @returns {number} Distance in meters
   */
  calculateDistance(point1, point2) {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = point1.lat * Math.PI / 180;
    const φ2 = point2.lat * Math.PI / 180;
    const Δφ = (point2.lat - point1.lat) * Math.PI / 180;
    const Δλ = (point2.lng - point1.lng) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance in meters
  }

  /**
   * Check if location is within campus boundaries
   * @param {Object} location - {lat, lng}
   * @param {Array} campusBoundary - Array of {lat, lng} points forming polygon
   * @returns {boolean} True if inside campus
   */
  isWithinCampus(location, campusBoundary) {
    // Simple bounding box check first for performance
    const bounds = this.getBounds(campusBoundary);
    if (!this.isInBounds(location, bounds)) {
      return false;
    }
    
    // Ray casting algorithm for polygon inclusion
    return this.isPointInPolygon(location, campusBoundary);
  }

  /**
   * Get bounding box from polygon points
   */
  getBounds(points) {
    const lats = points.map(p => p.lat);
    const lngs = points.map(p => p.lng);
    
    return {
      minLat: Math.min(...lats),
      maxLat: Math.max(...lats),
      minLng: Math.min(...lngs),
      maxLng: Math.max(...lngs)
    };
  }

  /**
   * Check if point is within bounds
   */
  isInBounds(point, bounds) {
    return point.lat >= bounds.minLat && point.lat <= bounds.maxLat &&
           point.lng >= bounds.minLng && point.lng <= bounds.maxLng;
  }

  /**
   * Ray casting algorithm for point in polygon
   */
  isPointInPolygon(point, polygon) {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].lat, yi = polygon[i].lng;
      const xj = polygon[j].lat, yj = polygon[j].lng;
      
      const intersect = ((yi > point.lng) !== (yj > point.lng)) &&
        (point.lat < (xj - xi) * (point.lng - yi) / (yj - yi) + xi);
      
      if (intersect) inside = !inside;
    }
    return inside;
  }

  /**
   * Get approximate location accuracy description
   * @param {number} accuracy - Accuracy in meters
   * @returns {string} Human-readable accuracy
   */
  getAccuracyDescription(accuracy) {
    if (accuracy < 10) return 'High Accuracy (within 10m)';
    if (accuracy < 50) return 'Good Accuracy (within 50m)';
    if (accuracy < 100) return 'Moderate Accuracy (within 100m)';
    if (accuracy < 500) return 'Low Accuracy (within 500m)';
    return 'Very Low Accuracy (over 500m)';
  }

  /**
   * Get formatted location string
   * @param {Object} location - Location object
   * @returns {string} Formatted string
   */
  formatLocation(location) {
    if (!location) return 'Location not available';
    
    const lat = location.lat?.toFixed(6) || 'N/A';
    const lng = location.lng?.toFixed(6) || 'N/A';
    const accuracy = location.accuracy ? this.getAccuracyDescription(location.accuracy) : 'Unknown accuracy';
    
    return location.address 
      ? `${location.address} (${accuracy})`
      : `Coordinates: ${lat}, ${lng} (${accuracy})`;
  }

  /**
   * Get human-readable geolocation error
   */
  getGeolocationError(error) {
    switch(error.code) {
      case 1:
        return 'PERMISSION_DENIED: User denied location access';
      case 2:
        return 'POSITION_UNAVAILABLE: Location information unavailable';
      case 3:
        return 'TIMEOUT: Location request timed out';
      default:
        return `UNKNOWN_ERROR: ${error.message}`;
    }
  }

  /**
   * Check if location services are available
   * @returns {boolean} True if available
   */
  static isLocationAvailable() {
    return 'geolocation' in navigator;
  }

  /**
   * Request location permissions
   * @returns {Promise<boolean>} True if granted
   */
  static async requestPermission() {
    if (!navigator.permissions) {
      // Some browsers don't support permissions API
      return true;
    }
    
    try {
      const result = await navigator.permissions.query({ name: 'geolocation' });
      return result.state === 'granted';
    } catch (error) {
      console.warn('Permissions API not supported:', error);
      return true; // Assume granted for older browsers
    }
  }

  /**
   * Get device location capabilities
   * @returns {Object} Capabilities object
   */
  static getLocationCapabilities() {
    return {
      hasGeolocation: 'geolocation' in navigator,
      hasPermissionsAPI: 'permissions' in navigator,
      hasHighAccuracy: true, // Most modern devices support
      canWatch: 'geolocation' in navigator
    };
  }
}

// Create singleton instance
const locationService = new LocationService();
export default locationService;