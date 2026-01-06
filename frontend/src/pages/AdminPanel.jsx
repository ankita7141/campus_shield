import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminDashboard from '../components/AdminDashboard';
import ReportList from '../components/ReportList';
import Statistics from '../components/Statistics';
import api from '../services/api';

const AdminPanel = ({ user, socket }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState([]);
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState([
    { id: 1, type: 'warning', message: '3 high priority reports need attention', time: '5 min ago' },
    { id: 2, type: 'info', message: 'New harassment report submitted', time: '15 min ago' },
    { id: 3, type: 'success', message: 'Report #REP202400123 resolved', time: '1 hour ago' }
  ]);

  useEffect(() => {
    if (!user) {
      navigate('/admin/login');
      return;
    }

    fetchData();
    
    // Socket listeners
    if (socket) {
      socket.on('report-notification', handleNewReport);
      socket.on('status-changed', handleStatusUpdate);
    }

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);

    return () => {
      if (socket) {
        socket.off('report-notification');
        socket.off('status-changed');
      }
      clearInterval(interval);
    };
  }, [user, navigate, socket]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch reports
      const reportsResponse = await api.getReports({ limit: 50 });
      if (reportsResponse.success) {
        setReports(reportsResponse.data || []);
      }
      
      // Fetch statistics
      const statsResponse = await api.getStatistics();
      if (statsResponse.success) {
        setStats(statsResponse.data);
      }
      
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewReport = (report) => {
    setReports(prev => [report, ...prev]);
    addNotification('info', `New ${report.category} report submitted`);
  };

  const handleStatusUpdate = (report) => {
    setReports(prev => prev.map(r => r._id === report._id ? report : r));
    addNotification('success', `Report ${report.reportId} updated to ${report.status}`);
  };

  const addNotification = (type, message) => {
    const newNotification = {
      id: Date.now(),
      type,
      message,
      time: 'Just now'
    };
    
    setNotifications(prev => [newNotification, ...prev.slice(0, 4)]);
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/admin/login');
    }
  };

  const handleEmergencyAlert = () => {
    if (window.confirm('Send emergency alert to all security personnel?')) {
      // In production, this would trigger actual emergency protocols
      alert('Emergency alert sent! All security teams notified.');
      addNotification('warning', 'Emergency alert activated');
    }
  };

  const handleExport = (format) => {
    const dataStr = JSON.stringify(reports, null, 2);
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
    const exportFileDefaultName = `campus-reports-${new Date().toISOString().split('T')[0]}.${format}`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    addNotification('success', `Reports exported as ${format.toUpperCase()}`);
  };

  const adminMenu = [
    { id: 'dashboard', label: 'Dashboard', icon: 'fas fa-tachometer-alt', color: 'indigo' },
    { id: 'reports', label: 'Reports', icon: 'fas fa-flag', color: 'blue' },
    { id: 'statistics', label: 'Statistics', icon: 'fas fa-chart-bar', color: 'green' },
    { id: 'analytics', label: 'Analytics', icon: 'fas fa-chart-line', color: 'purple' },
    { id: 'users', label: 'Users', icon: 'fas fa-users', color: 'pink' },
    { id: 'settings', label: 'Settings', icon: 'fas fa-cog', color: 'gray' }
  ];

  const adminActions = [
    { label: 'New Report', icon: 'fas fa-plus', onClick: () => navigate('/report') },
    { label: 'Export Data', icon: 'fas fa-download', onClick: () => handleExport('json') },
    { label: 'Emergency', icon: 'fas fa-bell', onClick: handleEmergencyAlert },
    { label: 'Refresh', icon: 'fas fa-sync-alt', onClick: fetchData }
  ];

  if (loading && !reports.length) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <nav className="bg-white shadow-lg fixed top-0 left-0 right-0 z-30">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Left side */}
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="md:hidden text-gray-600 mr-4"
              >
                <i className="fas fa-bars text-xl"></i>
              </button>
              
              <div className="flex items-center">
                <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center mr-3">
                  <i className="fas fa-shield-alt text-white"></i>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-800">Admin Panel</h1>
                  <p className="text-xs text-gray-600">Campus Safety Platform</p>
                </div>
              </div>
            </div>

            {/* Center - Search */}
            <div className="hidden md:block flex-1 max-w-2xl mx-8">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <i className="fas fa-search text-gray-400"></i>
                </div>
                <input
                  type="text"
                  placeholder="Search reports, users, or locations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Right side */}
            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <div className="relative">
                <button className="relative p-2 text-gray-600 hover:text-gray-900">
                  <i className="fas fa-bell text-xl"></i>
                  {notifications.length > 0 && (
                    <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
                  )}
                </button>
                
                {/* Notifications Dropdown */}
                <div className="hidden absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl z-50 border border-gray-200">
                  <div className="p-4 border-b">
                    <h3 className="font-bold text-gray-800">Notifications</h3>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.map(notification => (
                      <div key={notification.id} className={`p-4 border-b hover:bg-gray-50 ${
                        notification.type === 'warning' ? 'bg-yellow-50' :
                        notification.type === 'success' ? 'bg-green-50' : ''
                      }`}>
                        <div className="flex items-start">
                          <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
                            notification.type === 'warning' ? 'bg-yellow-100 text-yellow-600' :
                            notification.type === 'success' ? 'bg-green-100 text-green-600' :
                            'bg-blue-100 text-blue-600'
                          }`}>
                            <i className={`fas fa-${
                              notification.type === 'warning' ? 'exclamation-triangle' :
                              notification.type === 'success' ? 'check-circle' : 'info-circle'
                            }`}></i>
                          </div>
                          <div className="flex-1">
                            <p className="text-gray-800">{notification.message}</p>
                            <p className="text-sm text-gray-500 mt-1">{notification.time}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-3 bg-gray-50 text-center">
                    <button 
                      onClick={() => setNotifications([])}
                      className="text-sm text-gray-600 hover:text-gray-800"
                    >
                      Clear All
                    </button>
                  </div>
                </div>
              </div>

              {/* User Profile */}
              <div className="relative">
                <button className="flex items-center space-x-3 p-2">
                  <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                    {user?.name?.charAt(0) || 'A'}
                  </div>
                  <div className="hidden md:block text-left">
                    <p className="font-medium text-gray-800">{user?.name}</p>
                    <p className="text-sm text-gray-600">{user?.role}</p>
                  </div>
                  <i className="fas fa-chevron-down text-gray-400"></i>
                </button>
                
                {/* Profile Dropdown */}
                <div className="hidden absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl z-50 border border-gray-200">
                  <div className="p-4 border-b">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xl mr-3">
                        {user?.name?.charAt(0) || 'A'}
                      </div>
                      <div>
                        <p className="font-bold text-gray-800">{user?.name}</p>
                        <p className="text-sm text-gray-600">{user?.email}</p>
                        <p className="text-xs text-gray-500">{user?.department}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-2">
                    <a href="#" className="flex items-center p-3 text-gray-700 hover:bg-gray-100 rounded-lg">
                      <i className="fas fa-user mr-3 text-gray-400"></i>
                      <span>My Profile</span>
                    </a>
                    <a href="#" className="flex items-center p-3 text-gray-700 hover:bg-gray-100 rounded-lg">
                      <i className="fas fa-cog mr-3 text-gray-400"></i>
                      <span>Account Settings</span>
                    </a>
                    <a href="#" className="flex items-center p-3 text-gray-700 hover:bg-gray-100 rounded-lg">
                      <i className="fas fa-shield-alt mr-3 text-gray-400"></i>
                      <span>Security</span>
                    </a>
                  </div>
                  
                  <div className="p-3 border-t">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center justify-center p-3 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
                    >
                      <i className="fas fa-sign-out-alt mr-2"></i>
                      Logout
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Sidebar (Mobile) */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 z-40 md:hidden">
          <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-xl z-50">
            <div className="p-6">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center mr-3">
                    <i className="fas fa-shield-alt text-white"></i>
                  </div>
                  <div>
                    <h2 className="font-bold text-gray-800">Admin Panel</h2>
                    <p className="text-xs text-gray-600">Campus Safety</p>
                  </div>
                </div>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="text-gray-600"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
              
              {/* Mobile Menu */}
              <nav className="space-y-2">
                {adminMenu.map(item => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center p-3 rounded-lg ${
                      activeTab === item.id
                        ? `bg-${item.color}-100 text-${item.color}-700`
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <i className={`${item.icon} mr-3`}></i>
                    {item.label}
                  </button>
                ))}
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="pt-16">
        <div className="container mx-auto px-4 py-6">
          {/* Quick Actions */}
          <div className="mb-6">
            <div className="flex flex-wrap gap-3">
              {adminActions.map((action, index) => (
                <button
                  key={index}
                  onClick={action.onClick}
                  className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  <i className={`${action.icon} mr-2`}></i>
                  {action.label}
                </button>
              ))}
              
              <div className="flex-1"></div>
              
              {/* Export Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleExport('pdf')}
                  className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100"
                >
                  <i className="fas fa-file-pdf mr-2"></i> PDF
                </button>
                <button
                  onClick={() => handleExport('csv')}
                  className="px-4 py-2 bg-green-50 text-green-600 border border-green-200 rounded-lg hover:bg-green-100"
                >
                  <i className="fas fa-file-csv mr-2"></i> CSV
                </button>
                <button
                  onClick={() => handleExport('excel')}
                  className="px-4 py-2 bg-blue-50 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-100"
                >
                  <i className="fas fa-file-excel mr-2"></i> Excel
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-6">
            {/* Left Sidebar (Desktop) */}
            <div className="hidden lg:block w-64 flex-shrink-0">
              <div className="bg-white rounded-xl shadow-lg p-6 sticky top-24">
                <div className="mb-8">
                  <h3 className="font-bold text-gray-800 mb-4">Admin Menu</h3>
                  <nav className="space-y-2">
                    {adminMenu.map(item => (
                      <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`w-full flex items-center p-3 rounded-lg text-left ${
                          activeTab === item.id
                            ? `bg-${item.color}-100 text-${item.color}-700`
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <i className={`${item.icon} mr-3`}></i>
                        {item.label}
                        {item.id === 'reports' && (
                          <span className="ml-auto bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                            {reports.filter(r => r.status === 'pending').length}
                          </span>
                        )}
                      </button>
                    ))}
                  </nav>
                </div>

                {/* Quick Stats */}
                <div className="border-t pt-6">
                  <h3 className="font-bold text-gray-800 mb-4">Quick Stats</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Total Reports</span>
                      <span className="font-bold text-gray-800">{reports.length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Pending</span>
                      <span className="font-bold text-yellow-600">
                        {reports.filter(r => r.status === 'pending').length}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Resolved</span>
                      <span className="font-bold text-green-600">
                        {reports.filter(r => r.status === 'resolved').length}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Critical</span>
                      <span className="font-bold text-red-600">
                        {reports.filter(r => r.severity === 'critical').length}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Emergency Contact */}
                <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <h4 className="font-bold text-red-800 mb-2">🚨 Emergency</h4>
                  <p className="text-sm text-red-700 mb-3">
                    For immediate assistance
                  </p>
                  <button
                    onClick={handleEmergencyAlert}
                    className="w-full bg-red-500 text-white py-2 rounded-lg hover:bg-red-600"
                  >
                    <i className="fas fa-bell mr-2"></i>
                    Alert All Security
                  </button>
                </div>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1">
              {activeTab === 'dashboard' && (
                <AdminDashboard user={user} />
              )}
              
              {activeTab === 'reports' && (
                <ReportList 
                  reports={reports}
                  showFilters={true}
                  onReportUpdate={setReports}
                />
              )}
              
              {activeTab === 'statistics' && (
                <Statistics data={stats} />
              )}
              
              {activeTab === 'analytics' && (
                <div className="bg-white rounded-xl shadow-lg p-8">
                  <div className="text-center py-12">
                    <i className="fas fa-chart-line text-5xl text-gray-300 mb-6"></i>
                    <h3 className="text-2xl font-bold text-gray-800 mb-4">Advanced Analytics</h3>
                    <p className="text-gray-600 mb-6">
                      Predictive analysis, trend forecasting, and advanced reporting tools
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl">
                        <i className="fas fa-brain text-3xl text-blue-600 mb-4"></i>
                        <h4 className="font-bold text-gray-800 mb-2">Predictive Analysis</h4>
                        <p className="text-sm text-gray-600">Identify potential hotspots before incidents occur</p>
                      </div>
                      <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl">
                        <i className="fas fa-chart-area text-3xl text-green-600 mb-4"></i>
                        <h4 className="font-bold text-gray-800 mb-2">Trend Forecasting</h4>
                        <p className="text-sm text-gray-600">Analyze patterns and predict future incidents</p>
                      </div>
                      <div className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl">
                        <i className="fas fa-robot text-3xl text-purple-600 mb-4"></i>
                        <h4 className="font-bold text-gray-800 mb-2">AI Insights</h4>
                        <p className="text-sm text-gray-600">Get AI-powered recommendations for safety improvements</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {activeTab === 'users' && (
                <div className="bg-white rounded-xl shadow-lg p-8">
                  <div className="text-center py-12">
                    <i className="fas fa-users text-5xl text-gray-300 mb-6"></i>
                    <h3 className="text-2xl font-bold text-gray-800 mb-4">User Management</h3>
                    <p className="text-gray-600 mb-6">
                      Manage admin users, permissions, and access controls
                    </p>
                    <div className="max-w-2xl mx-auto">
                      <div className="bg-gray-50 rounded-xl p-6">
                        <h4 className="font-bold text-gray-800 mb-4">Current Admins</h4>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
                            <div className="flex items-center">
                              <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center mr-4">
                                <i className="fas fa-user text-indigo-600"></i>
                              </div>
                              <div>
                                <p className="font-medium text-gray-800">Campus Admin</p>
                                <p className="text-sm text-gray-600">admin@campus.edu</p>
                              </div>
                            </div>
                            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                              Super Admin
                            </span>
                          </div>
                          
                          <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
                            <div className="flex items-center">
                              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                                <i className="fas fa-user text-blue-600"></i>
                              </div>
                              <div>
                                <p className="font-medium text-gray-800">Security Head</p>
                                <p className="text-sm text-gray-600">security@campus.edu</p>
                              </div>
                            </div>
                            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                              Admin
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {activeTab === 'settings' && (
                <div className="bg-white rounded-xl shadow-lg p-8">
                  <div className="text-center py-12">
                    <i className="fas fa-cog text-5xl text-gray-300 mb-6"></i>
                    <h3 className="text-2xl font-bold text-gray-800 mb-4">System Settings</h3>
                    <p className="text-gray-600 mb-6">
                      Configure platform settings, notifications, and security options
                    </p>
                    <div className="max-w-2xl mx-auto">
                      <div className="bg-gray-50 rounded-xl p-6 space-y-6">
                        <div>
                          <h4 className="font-bold text-gray-800 mb-4">Notification Settings</h4>
                          <div className="space-y-3">
                            <label className="flex items-center">
                              <input type="checkbox" className="mr-3" defaultChecked />
                              <span>Email notifications for new reports</span>
                            </label>
                            <label className="flex items-center">
                              <input type="checkbox" className="mr-3" defaultChecked />
                              <span>SMS alerts for critical incidents</span>
                            </label>
                            <label className="flex items-center">
                              <input type="checkbox" className="mr-3" />
                              <span>Daily summary reports</span>
                            </label>
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="font-bold text-gray-800 mb-4">Security Settings</h4>
                          <div className="space-y-3">
                            <label className="flex items-center">
                              <input type="checkbox" className="mr-3" defaultChecked />
                              <span>Require 2-factor authentication</span>
                            </label>
                            <label className="flex items-center">
                              <input type="checkbox" className="mr-3" />
                              <span>Auto-logout after 30 minutes</span>
                            </label>
                            <label className="flex items-center">
                              <input type="checkbox" className="mr-3" defaultChecked />
                              <span>IP address tracking</span>
                            </label>
                          </div>
                        </div>
                        
                        <button className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700">
                          Save Settings
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Emergency Floating Button */}
      <button
        onClick={handleEmergencyAlert}
        className="fixed bottom-6 right-6 bg-red-500 text-white p-4 rounded-full shadow-xl hover:bg-red-600 transition transform hover:scale-110 z-40"
      >
        <i className="fas fa-exclamation-triangle text-2xl"></i>
      </button>
    </div>
  );
};

export default AdminPanel;