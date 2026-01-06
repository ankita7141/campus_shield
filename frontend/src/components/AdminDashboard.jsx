import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Statistics from './Statistics';
import ReportList from './ReportList';

const AdminDashboard = ({ user }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [recentReports, setRecentReports] = useState([]);
  const [highPriority, setHighPriority] = useState([]);
  const [adminStats, setAdminStats] = useState(null);

  useEffect(() => {
    fetchDashboardData();
    
    // Refresh data every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch dashboard data
      const dashboardResponse = await api.getAdminDashboard();
      if (dashboardResponse.success) {
        setDashboardData(dashboardResponse.data);
        setRecentReports(dashboardResponse.data.recentReports || []);
        setHighPriority(dashboardResponse.data.highPriorityReports || []);
        setAdminStats(dashboardResponse.data.adminStats || {});
      }
      
      // Fetch statistics
      const statsResponse = await api.getStatistics();
      if (statsResponse.success) {
        setStats(statsResponse.data);
      }
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEmergencyAlert = () => {
    if (window.confirm('Send emergency alert to all admins and security personnel?')) {
      // In production, this would send actual emergency alerts
      alert('Emergency alert sent! All security personnel have been notified.');
    }
  };

  const handleQuickAction = (action) => {
    switch (action) {
      case 'new-report':
        navigate('/report');
        break;
      case 'view-all':
        navigate('/admin/reports');
        break;
      case 'export':
        exportReports();
        break;
      case 'settings':
        navigate('/admin/settings');
        break;
      default:
        break;
    }
  };

  const exportReports = () => {
    // Mock export functionality
    const dataStr = JSON.stringify(recentReports, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `campus-reports-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  if (loading && !dashboardData) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const quickActions = [
    { id: 'new-report', label: 'New Report', icon: 'fas fa-plus', color: 'indigo' },
    { id: 'view-all', label: 'View All Reports', icon: 'fas fa-list', color: 'blue' },
    { id: 'export', label: 'Export Data', icon: 'fas fa-download', color: 'green' },
    { id: 'settings', label: 'Settings', icon: 'fas fa-cog', color: 'gray' }
  ];

  const tabs = [
    { id: 'overview', label: 'Overview', icon: 'fas fa-tachometer-alt' },
    { id: 'reports', label: 'Reports', icon: 'fas fa-flag' },
    { id: 'statistics', label: 'Statistics', icon: 'fas fa-chart-bar' },
    { id: 'analytics', label: 'Analytics', icon: 'fas fa-chart-line' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
            <p className="opacity-90">
              Welcome back, <span className="font-semibold">{user?.name}</span>
              {user?.role && ` (${user.role})`}
            </p>
          </div>
          
          <div className="mt-4 md:mt-0">
            <button
              onClick={handleEmergencyAlert}
              className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition flex items-center"
            >
              <i className="fas fa-bell mr-2"></i>
              Emergency Alert
            </button>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6 hover-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Reports</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">
                {stats?.total || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
              <i className="fas fa-flag text-2xl text-indigo-600"></i>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-sm text-gray-600">
              <span className="text-green-600 font-semibold">
                {stats?.resolved || 0} resolved
              </span>
              {' '} • {' '}
              <span className="text-yellow-600 font-semibold">
                {stats?.pending || 0} pending
              </span>
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 hover-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Response Rate</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">
                {adminStats?.responseRate || '85%'}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <i className="fas fa-chart-line text-2xl text-green-600"></i>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-sm text-gray-600">
              Avg. response time: <span className="font-semibold">2.5 hours</span>
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 hover-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Assigned to You</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">
                {adminStats?.assignedToMe || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <i className="fas fa-user-check text-2xl text-blue-600"></i>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-sm text-gray-600">
              <span className="font-semibold">{highPriority.length}</span> high priority
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 hover-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Today's Reports</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">
                {recentReports.length}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <i className="fas fa-calendar-day text-2xl text-purple-600"></i>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-sm text-gray-600">
              Last 24 hours • Updated just now
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id 
                    ? 'border-indigo-500 text-indigo-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <i className={`${tab.icon} mr-2`}></i>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Quick Actions */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {quickActions.map(action => (
                    <button
                      key={action.id}
                      onClick={() => handleQuickAction(action.id)}
                      className={`p-4 rounded-lg border-2 border-${action.color}-200 bg-${action.color}-50 hover:bg-${action.color}-100 transition text-center`}
                    >
                      <i className={`${action.icon} text-2xl text-${action.color}-600 mb-2`}></i>
                      <p className="font-medium text-gray-800">{action.label}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* High Priority Reports */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">High Priority Reports</h3>
                  <button
                    onClick={() => navigate('/admin/reports?priority=high')}
                    className="text-sm text-indigo-600 hover:text-indigo-800"
                  >
                    View All →
                  </button>
                </div>
                
                {highPriority.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <i className="fas fa-check-circle text-3xl text-green-500 mb-3"></i>
                    <p className="text-gray-600">No high priority reports</p>
                    <p className="text-sm text-gray-500 mt-1">All clear!</p>
                  </div>
                ) : (
                  <div className="bg-red-50 border border-red-200 rounded-lg overflow-hidden">
                    {highPriority.map((report, index) => (
                      <div 
                        key={report._id || report.reportId} 
                        className={`p-4 ${index !== highPriority.length - 1 ? 'border-b border-red-200' : ''}`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center">
                              <div className="w-3 h-3 bg-red-500 rounded-full mr-3"></div>
                              <div>
                                <p className="font-semibold text-red-800">
                                  {report.reportId} • {report.category.replace('-', ' ')}
                                </p>
                                <p className="text-sm text-red-700 mt-1">
                                  {report.location?.address || 'Location not specified'}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">
                              {report.severity}
                            </span>
                            <button
                              onClick={() => navigate(`/report/${report._id || report.reportId}`)}
                              className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                            >
                              Review
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent Activity */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Activity</h3>
                <div className="space-y-4">
                  {recentReports.slice(0, 5).map(report => (
                    <div key={report._id || report.reportId} className="flex items-center p-3 bg-gray-50 rounded-lg">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                          <i className="fas fa-flag text-indigo-600"></i>
                        </div>
                      </div>
                      <div className="ml-4 flex-1">
                        <p className="font-medium text-gray-800">
                          New {report.category} report
                        </p>
                        <p className="text-sm text-gray-600">
                          {report.reportId} • {formatTimeAgo(report.createdAt)}
                        </p>
                      </div>
                      <div>
                        <span className={`px-2 py-1 text-xs rounded ${getStatusColor(report.status)}`}>
                          {report.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'reports' && (
            <ReportList 
              reports={recentReports} 
              showFilters={true}
              onReportUpdate={setRecentReports}
            />
          )}

          {activeTab === 'statistics' && (
            <Statistics data={stats} />
          )}

          {activeTab === 'analytics' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Advanced Analytics</h3>
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <i className="fas fa-chart-line text-4xl text-gray-400 mb-4"></i>
                <p className="text-gray-600">Advanced analytics coming soon</p>
                <p className="text-sm text-gray-500 mt-2">
                  This section will include predictive analysis, trends, and advanced reporting
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Emergency Contacts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Emergency Protocols</h3>
            <div className="space-y-4">
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <h4 className="font-semibold text-red-800 mb-2">Critical Incident Procedure</h4>
                <ol className="text-sm text-red-700 space-y-2 ml-4 list-decimal">
                  <li>Activate emergency alert system</li>
                  <li>Contact campus security (911) immediately</li>
                  <li>Dispatch nearest security personnel</li>
                  <li>Notify medical services if needed</li>
                  <li>Secure the area and prevent escalation</li>
                  <li>Document all actions taken</li>
                </ol>
              </div>
              
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h4 className="font-semibold text-yellow-800 mb-2">Standard Response Protocol</h4>
                <ol className="text-sm text-yellow-700 space-y-2 ml-4 list-decimal">
                  <li>Acknowledge report within 15 minutes</li>
                  <li>Assign to appropriate personnel</li>
                  <li>Investigate within 24 hours</li>
                  <li>Update status regularly</li>
                  <li>Provide feedback to reporter when appropriate</li>
                  <li>Document resolution and follow-up actions</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-b from-red-500 to-red-600 rounded-xl shadow-lg p-6 text-white">
          <h3 className="text-lg font-semibold mb-4">Emergency Contacts</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-red-400 rounded-lg">
              <div>
                <p className="font-semibold">Campus Security</p>
                <p className="text-sm opacity-90">24/7 Emergency Line</p>
              </div>
              <a 
                href="tel:911" 
                className="px-3 py-1 bg-white text-red-600 rounded hover:bg-red-50 transition"
              >
                Call 911
              </a>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-red-400 rounded-lg">
              <div>
                <p className="font-semibold">Medical Emergency</p>
                <p className="text-sm opacity-90">Ambulance & First Aid</p>
              </div>
              <a 
                href="tel:108" 
                className="px-3 py-1 bg-white text-red-600 rounded hover:bg-red-50 transition"
              >
                Call 108
              </a>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-red-400 rounded-lg">
              <div>
                <p className="font-semibold">Women's Helpline</p>
                <p className="text-sm opacity-90">Specialized Support</p>
              </div>
              <a 
                href="tel:1091" 
                className="px-3 py-1 bg-white text-red-600 rounded hover:bg-red-50 transition"
              >
                Call 1091
              </a>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-red-400 rounded-lg">
              <div>
                <p className="font-semibold">Police Control Room</p>
                <p className="text-sm opacity-90">Local Police Station</p>
              </div>
              <a 
                href="tel:100" 
                className="px-3 py-1 bg-white text-red-600 rounded hover:bg-red-50 transition"
              >
                Call 100
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper functions
const formatTimeAgo = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 60) {
    return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  } else {
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  }
};

const getStatusColor = (status) => {
  const colors = {
    pending: 'bg-yellow-100 text-yellow-800',
    'under-review': 'bg-blue-100 text-blue-800',
    resolved: 'bg-green-100 text-green-800',
    dismissed: 'bg-gray-100 text-gray-800'
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};

export default AdminDashboard;