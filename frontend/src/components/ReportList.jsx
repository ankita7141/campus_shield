import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const ReportList = ({ reports: initialReports, onReportUpdate, showFilters = true, limit = null }) => {
  const navigate = useNavigate();
  const [reports, setReports] = useState(initialReports || []);
  const [loading, setLoading] = useState(!initialReports);
  const [filters, setFilters] = useState({
    status: '',
    category: '',
    severity: '',
    search: '',
    dateFrom: '',
    dateTo: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (!initialReports) {
      fetchReports();
    } else {
      setReports(initialReports);
    }
  }, [initialReports, page, filters]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await api.getReports({
        page,
        limit: limit || 10,
        ...filters
      });
      
      if (response.success) {
        setReports(response.data);
        setTotalPages(response.totalPages || 1);
        
        if (onReportUpdate) {
          onReportUpdate(response.data);
        }
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1); // Reset to first page on filter change
  };

  const handleStatusUpdate = async (reportId, newStatus) => {
    try {
      const response = await api.updateReportStatus(reportId, newStatus);
      if (response.success) {
        // Update local state
        setReports(prev => prev.map(report => 
          report._id === reportId ? { ...report, status: newStatus } : report
        ));
        
        if (onReportUpdate) {
          onReportUpdate(reports);
        }
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      harassment: 'bg-red-100 text-red-800',
      'safety-threat': 'bg-orange-100 text-orange-800',
      misbehavior: 'bg-yellow-100 text-yellow-800',
      emergency: 'bg-red-50 text-red-700',
      other: 'bg-gray-100 text-gray-800'
    };
    return colors[category] || colors.other;
  };

  const getSeverityColor = (severity) => {
    const colors = {
      critical: 'bg-red-500',
      high: 'bg-orange-500',
      medium: 'bg-yellow-500',
      low: 'bg-green-500'
    };
    return colors[severity] || 'bg-gray-500';
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      'under-review': 'bg-blue-100 text-blue-800',
      resolved: 'bg-green-100 text-green-800',
      dismissed: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || colors.pending;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const truncateText = (text, maxLength = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const filteredReports = reports.filter(report => {
    if (filters.status && report.status !== filters.status) return false;
    if (filters.category && report.category !== filters.category) return false;
    if (filters.severity && report.severity !== filters.severity) return false;
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return (
        report.description.toLowerCase().includes(searchLower) ||
        report.reportId.toLowerCase().includes(searchLower) ||
        (report.location?.address && report.location.address.toLowerCase().includes(searchLower))
      );
    }
    if (filters.dateFrom) {
      const reportDate = new Date(report.createdAt);
      const fromDate = new Date(filters.dateFrom);
      if (reportDate < fromDate) return false;
    }
    if (filters.dateTo) {
      const reportDate = new Date(report.createdAt);
      const toDate = new Date(filters.dateTo);
      toDate.setHours(23, 59, 59, 999);
      if (reportDate > toDate) return false;
    }
    return true;
  });

  // Sort reports
  const sortedReports = [...filteredReports].sort((a, b) => {
    const aValue = a[filters.sortBy];
    const bValue = b[filters.sortBy];
    
    if (filters.sortBy === 'createdAt' || filters.sortBy === 'updatedAt') {
      return filters.sortOrder === 'desc' 
        ? new Date(bValue) - new Date(aValue)
        : new Date(aValue) - new Date(bValue);
    }
    
    return filters.sortOrder === 'desc'
      ? String(bValue).localeCompare(String(aValue))
      : String(aValue).localeCompare(String(bValue));
  });

  // Apply limit if specified
  const displayedReports = limit ? sortedReports.slice(0, limit) : sortedReports;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-gray-600">Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Incident Reports</h2>
            <p className="text-gray-600">
              {filteredReports.length} report{filteredReports.length !== 1 ? 's' : ''} found
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={fetchReports}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
            >
              <i className="fas fa-sync-alt mr-2"></i>
              Refresh
            </button>
            
            <button
              onClick={() => navigate('/report')}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
            >
              <i className="fas fa-plus mr-2"></i>
              New Report
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <input
                type="text"
                placeholder="Search reports..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg"
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="under-review">Under Review</option>
                <option value="resolved">Resolved</option>
                <option value="dismissed">Dismissed</option>
              </select>
            </div>

            {/* Category Filter */}
            <div>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg"
              >
                <option value="">All Categories</option>
                <option value="harassment">Harassment</option>
                <option value="safety-threat">Safety Threat</option>
                <option value="misbehavior">Misbehavior</option>
                <option value="emergency">Emergency</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Date Filters */}
            <div className="lg:col-span-2 grid grid-cols-2 gap-2">
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                className="p-3 border border-gray-300 rounded-lg"
                placeholder="From Date"
              />
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                className="p-3 border border-gray-300 rounded-lg"
                placeholder="To Date"
              />
            </div>
          </div>

          {/* Second row of filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            {/* Severity Filter */}
            <div>
              <select
                value={filters.severity}
                onChange={(e) => handleFilterChange('severity', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg"
              >
                <option value="">All Severity</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            {/* Sort By */}
            <div>
              <select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg"
              >
                <option value="createdAt">Sort by Date</option>
                <option value="priority">Sort by Priority</option>
                <option value="severity">Sort by Severity</option>
                <option value="category">Sort by Category</option>
              </select>
            </div>

            {/* Sort Order */}
            <div>
              <select
                value={filters.sortOrder}
                onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg"
              >
                <option value="desc">Newest First</option>
                <option value="asc">Oldest First</option>
              </select>
            </div>
          </div>

          {/* Active Filters */}
          {(filters.status || filters.category || filters.severity || filters.search || filters.dateFrom || filters.dateTo) && (
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="text-sm text-gray-600">Active filters:</span>
              
              {filters.status && (
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                  Status: {filters.status}
                  <button
                    onClick={() => handleFilterChange('status', '')}
                    className="ml-2 text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </span>
              )}
              
              {filters.category && (
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                  Category: {filters.category}
                  <button
                    onClick={() => handleFilterChange('category', '')}
                    className="ml-2 text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </span>
              )}
              
              {filters.severity && (
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                  Severity: {filters.severity}
                  <button
                    onClick={() => handleFilterChange('severity', '')}
                    className="ml-2 text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </span>
              )}
              
              {filters.search && (
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                  Search: {filters.search}
                  <button
                    onClick={() => handleFilterChange('search', '')}
                    className="ml-2 text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </span>
              )}
              
              {(filters.dateFrom || filters.dateTo) && (
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                  Date: {filters.dateFrom || 'Any'} to {filters.dateTo || 'Any'}
                  <button
                    onClick={() => {
                      handleFilterChange('dateFrom', '');
                      handleFilterChange('dateTo', '');
                    }}
                    className="ml-2 text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </span>
              )}
              
              <button
                onClick={() => setFilters({
                  status: '',
                  category: '',
                  severity: '',
                  search: '',
                  dateFrom: '',
                  dateTo: '',
                  sortBy: 'createdAt',
                  sortOrder: 'desc'
                })}
                className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm hover:bg-red-200"
              >
                Clear All
              </button>
            </div>
          )}
        </div>
      )}

      {/* Reports List */}
      <div className="overflow-x-auto">
        {displayedReports.length === 0 ? (
          <div className="p-12 text-center">
            <i className="fas fa-inbox text-4xl text-gray-400 mb-4"></i>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No Reports Found</h3>
            <p className="text-gray-500 mb-6">
              {Object.values(filters).some(f => f) 
                ? 'Try changing your filters' 
                : 'Be the first to report an incident'}
            </p>
            <button
              onClick={() => navigate('/report')}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
            >
              <i className="fas fa-plus mr-2"></i>
              Report First Incident
            </button>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Report Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category & Severity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date & Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {displayedReports.map((report) => (
                <tr 
                  key={report._id || report.reportId} 
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div>
                      <div className="flex items-center">
                        <div className={`w-3 h-3 rounded-full mr-3 ${getSeverityColor(report.severity)}`}></div>
                        <div>
                          <p className="font-mono font-semibold text-gray-900">
                            {report.reportId}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            {truncateText(report.description, 80)}
                          </p>
                          {report.location?.address && (
                            <p className="text-xs text-gray-500 mt-1">
                              <i className="fas fa-map-marker-alt mr-1"></i>
                              {report.location.address}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4">
                    <div className="space-y-2">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getCategoryColor(report.category)}`}>
                        {report.category.replace('-', ' ')}
                      </span>
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-gray-700 mr-2">
                          {report.severity.charAt(0).toUpperCase() + report.severity.slice(1)}
                        </span>
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-full rounded-full ${getSeverityColor(report.severity)}`}
                            style={{
                              width: report.severity === 'critical' ? '100%' :
                                     report.severity === 'high' ? '75%' :
                                     report.severity === 'medium' ? '50%' : '25%'
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4">
                    <div className="space-y-2">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(report.status)}`}>
                        {report.status.replace('-', ' ')}
                      </span>
                      {report.priority && (
                        <div className="flex items-center">
                          <span className="text-xs text-gray-600 mr-2">Priority:</span>
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map(level => (
                              <div
                                key={level}
                                className={`w-2 h-2 rounded-full mx-0.5 ${level <= report.priority ? 'bg-indigo-500' : 'bg-gray-300'}`}
                              ></div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {formatDate(report.createdAt)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {report.updatedAt !== report.createdAt && (
                        <span>Updated: {formatDate(report.updatedAt)}</span>
                      )}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => navigate(`/report/${report._id || report.reportId}`)}
                        className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded text-sm hover:bg-indigo-200 transition"
                      >
                        <i className="fas fa-eye mr-1"></i>
                        View
                      </button>
                      
                      <select
                        value={report.status}
                        onChange={(e) => handleStatusUpdate(report._id || report.reportId, e.target.value)}
                        className="px-2 py-1 border border-gray-300 rounded text-sm bg-white"
                      >
                        <option value="pending">Pending</option>
                        <option value="under-review">Under Review</option>
                        <option value="resolved">Resolved</option>
                        <option value="dismissed">Dismissed</option>
                      </select>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {!limit && totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing page {page} of {totalPages}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setPage(prev => Math.max(1, prev - 1))}
                disabled={page === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (page <= 3) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = page - 2 + i;
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`px-4 py-2 rounded-lg text-sm ${page === pageNum ? 'bg-indigo-600 text-white' : 'border border-gray-300 hover:bg-gray-50'}`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              
              <button
                onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Summary Statistics */}
      <div className="p-6 border-t border-gray-200 bg-gray-50">
        <h4 className="font-semibold text-gray-700 mb-3">Summary</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-2xl font-bold text-indigo-600">
              {filteredReports.length}
            </div>
            <div className="text-sm text-gray-600">Total Reports</div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-2xl font-bold text-yellow-600">
              {filteredReports.filter(r => r.status === 'pending').length}
            </div>
            <div className="text-sm text-gray-600">Pending</div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-2xl font-bold text-green-600">
              {filteredReports.filter(r => r.status === 'resolved').length}
            </div>
            <div className="text-sm text-gray-600">Resolved</div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-2xl font-bold text-red-600">
              {filteredReports.filter(r => r.severity === 'critical').length}
            </div>
            <div className="text-sm text-gray-600">Critical</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportList;