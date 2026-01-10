import React, { useState, useEffect } from 'react';
import { GoogleMap, LoadScript, Marker, InfoWindow } from '@react-google-maps/api';

const ReportMap = ({ reports, height = '500px' }) => {
  const [selectedReport, setSelectedReport] = useState(null);
  const [mapCenter, setMapCenter] = useState({ lat: 28.6139, lng: 77.2090 });
  const [mapZoom, setMapZoom] = useState(15);
  const [map, setMap] = useState(null);

  // Map container style
  const containerStyle = {
    width: '100%',
    height: height,
    borderRadius: '12px',
    overflow: 'hidden'
  };

  // Default center (Delhi coordinates)
  const center = {
    lat: 28.6139,
    lng: 77.2090
  };

  // Get marker color based on category
  const getMarkerColor = (category) => {
    const colors = {
      harassment: '#EF4444', // Red
      'safety-threat': '#F97316', // Orange
      misbehavior: '#EAB308', // Yellow
      emergency: '#DC2626', // Dark Red
      other: '#6B7280' // Gray
    };
    return colors[category] || '#6B7280';
  };

  // Get marker icon based on category
  const getMarkerIcon = (category, severity) => {
    // Create a custom SVG marker
    const color = getMarkerColor(category);
    const size = severity === 'critical' ? 40 : severity === 'high' ? 35 : 30;
    
    return {
      path: 'M 0,0 C -2,-20 -10,-22 -10,-30 A 10,10 0 1,1 10,-30 C 10,-22 2,-20 0,0 z',
      fillColor: color,
      fillOpacity: 0.8,
      strokeColor: '#FFFFFF',
      strokeWeight: 2,
      scale: size / 40,
      labelOrigin: new window.google.maps.Point(0, -25)
    };
  };

  // Get status badge color
  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      'under-review': 'bg-blue-100 text-blue-800',
      resolved: 'bg-green-100 text-green-800',
      dismissed: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  // Filter reports by category
  const [filter, setFilter] = useState('all');
  const filteredReports = filter === 'all' 
    ? reports 
    : reports.filter(report => report.category === filter);

  // Calculate map bounds to fit all markers
  useEffect(() => {
    if (map && filteredReports.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      
      filteredReports.forEach(report => {
        if (report.location && report.location.lat && report.location.lng) {
          bounds.extend({
            lat: report.location.lat,
            lng: report.location.lng
          });
        }
      });
      
      map.fitBounds(bounds);
      
      // Don't zoom too far out
      const zoom = map.getZoom();
      if (zoom > 18) map.setZoom(18);
      if (zoom < 12) map.setZoom(12);
    }
  }, [map, filteredReports]);

  // Load Google Maps script
  const libraries = ['places'];

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      {/* Header with filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Incidents Map</h2>
          <p className="text-gray-600">Visual representation of reported incidents</p>
        </div>
        
        <div className="mt-4 md:mt-0 flex flex-wrap gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg ${filter === 'all' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            All ({reports.length})
          </button>
          <button
            onClick={() => setFilter('harassment')}
            className={`px-4 py-2 rounded-lg ${filter === 'harassment' ? 'bg-red-600 text-white' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}
          >
            Harassment ({reports.filter(r => r.category === 'harassment').length})
          </button>
          <button
            onClick={() => setFilter('safety-threat')}
            className={`px-4 py-2 rounded-lg ${filter === 'safety-threat' ? 'bg-orange-600 text-white' : 'bg-orange-100 text-orange-700 hover:bg-orange-200'}`}
          >
            Safety ({reports.filter(r => r.category === 'safety-threat').length})
          </button>
          <button
            onClick={() => setFilter('emergency')}
            className={`px-4 py-2 rounded-lg ${filter === 'emergency' ? 'bg-red-700 text-white' : 'bg-red-50 text-red-800 hover:bg-red-100'}`}
          >
            Emergency ({reports.filter(r => r.category === 'emergency').length})
          </button>
        </div>
      </div>

      {/* Map Container */}
      <div className="mb-6">
        <LoadScript
          googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'YOUR_API_KEY'}

          libraries={libraries}
        >
          <GoogleMap
            mapContainerStyle={containerStyle}
            center={center}
            zoom={mapZoom}
            onLoad={mapInstance => setMap(mapInstance)}
            options={{
              streetViewControl: false,
              mapTypeControl: false,
              fullscreenControl: true,
              zoomControl: true,
              styles: [
                {
                  featureType: 'poi',
                  elementType: 'labels',
                  stylers: [{ visibility: 'off' }]
                }
              ]
            }}
          >
            {/* Markers for each report */}
            {filteredReports.map((report) => {
              if (!report.location || !report.location.lat || !report.location.lng) return null;
              
              return (
                <Marker
                  key={report._id || report.reportId}
                  position={{
                    lat: report.location.lat,
                    lng: report.location.lng
                  }}
                  onClick={() => setSelectedReport(report)}
                  icon={getMarkerIcon(report.category, report.severity)}
                  label={{
                    text: report.severity === 'critical' ? '🚨' : 
                          report.severity === 'high' ? '⚠️' : '',
                    color: '#FFFFFF',
                    fontSize: '14px',
                    fontWeight: 'bold'
                  }}
                  animation={report.severity === 'critical' ? window.google.maps.Animation.BOUNCE : 
                            report.severity === 'high' ? window.google.maps.Animation.DROP : null}
                />
              );
            })}

            {/* InfoWindow for selected report */}
            {selectedReport && (
              <InfoWindow
                position={{
                  lat: selectedReport.location.lat,
                  lng: selectedReport.location.lng
                }}
                onCloseClick={() => setSelectedReport(null)}
              >
                <div className="p-2 max-w-xs">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className={`inline-block px-2 py-1 text-xs rounded-full ${getStatusColor(selectedReport.status)}`}>
                        {selectedReport.status}
                      </span>
                      <span className={`ml-2 inline-block px-2 py-1 text-xs rounded-full ${
                        selectedReport.severity === 'critical' ? 'bg-red-100 text-red-800' :
                        selectedReport.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                        selectedReport.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {selectedReport.severity}
                      </span>
                    </div>
                    <button
                      onClick={() => setSelectedReport(null)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                  
                  <h3 className="font-bold text-lg capitalize mb-1">
                    {selectedReport.category.replace('-', ' ')}
                  </h3>
                  
                  <p className="text-sm text-gray-600 mb-2">
                    {selectedReport.description.substring(0, 100)}...
                  </p>
                  
                  <div className="text-xs text-gray-500 space-y-1">
                    <p>
                      <i className="fas fa-map-marker-alt mr-1"></i>
                      {selectedReport.location.address || 'Location not specified'}
                    </p>
                    <p>
                      <i className="fas fa-clock mr-1"></i>
                      {new Date(selectedReport.createdAt).toLocaleDateString()} at{' '}
                      {new Date(selectedReport.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </p>
                    <p>
                      <i className="fas fa-id-card mr-1"></i>
                      Report ID: {selectedReport.reportId}
                    </p>
                  </div>
                  
                  <button
                    onClick={() => window.open(`/report/${selectedReport._id}`, '_blank')}
                    className="mt-3 w-full bg-indigo-600 text-white py-1 px-3 rounded text-sm hover:bg-indigo-700 transition"
                  >
                    View Details
                  </button>
                </div>
              </InfoWindow>
            )}
          </GoogleMap>
        </LoadScript>
      </div>

      {/* Legend */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-semibold text-gray-700 mb-3">Map Legend</h4>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-red-500 rounded-full mr-2"></div>
            <span className="text-sm">Harassment</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-orange-500 rounded-full mr-2"></div>
            <span className="text-sm">Safety Threat</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-yellow-500 rounded-full mr-2"></div>
            <span className="text-sm">Misbehavior</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-red-700 rounded-full mr-2"></div>
            <span className="text-sm">Emergency</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-gray-500 rounded-full mr-2"></div>
            <span className="text-sm">Other</span>
          </div>
        </div>
        
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="flex items-center">
            <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center mr-2">
              <span className="text-white text-xs">🚨</span>
            </div>
            <span className="text-sm">Critical Severity</span>
          </div>
          <div className="flex items-center">
            <div className="w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center mr-2">
              <span className="text-white text-xs">⚠️</span>
            </div>
            <span className="text-sm">High Severity</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-yellow-500 rounded-full mr-2"></div>
            <span className="text-sm">Medium Severity</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
            <span className="text-sm">Low Severity</span>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-indigo-600">{reports.length}</div>
          <div className="text-sm text-gray-600">Total Reports</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-yellow-600">
            {reports.filter(r => r.status === 'pending').length}
          </div>
          <div className="text-sm text-gray-600">Pending</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-600">
            {reports.filter(r => r.status === 'resolved').length}
          </div>
          <div className="text-sm text-gray-600">Resolved</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-red-600">
            {reports.filter(r => r.category === 'emergency').length}
          </div>
          <div className="text-sm text-gray-600">Emergencies</div>
        </div>
      </div>
    </div>
  );
};

export default ReportMap;