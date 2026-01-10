import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';

// Import components
import Home from './pages/Home';
import Report from './pages/Report';
import AdminLogin from './pages/AdminLogin';
import AdminPanel from './pages/AdminPanel';

// Import services
import api from './services/api';
import { auth, db, storage } from './services/firebase.js';






// Initialize services
api.init();
const socket = io(`${import.meta.env.VITE_API_URL.replace('/api','')}`);

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      setIsAuthenticated(true);
      setUser(JSON.parse(userData));
      api.setToken(token);
    }


    
    // Setup socket listeners
    socket.on('connect', () => {
      console.log('Connected to socket server');
    });

    socket.on('report-notification', (data) => {
      addNotification({
        type: 'info',
        title: 'New Report',
        message: `New ${data.category} report submitted`,
        data
      });
    });

    socket.on('status-changed', (data) => {
      addNotification({
        type: 'success',
        title: 'Status Updated',
        message: `Report ${data.reportId} status changed to ${data.status}`,
        data
      });
    });

    setLoading(false);

    // Cleanup
    return () => {
      socket.off('connect');
      socket.off('report-notification');
      socket.off('status-changed');
    };
  }, []);

  const addNotification = (notification) => {
    const newNotification = {
      ...notification,
      id: Date.now(),
      timestamp: new Date()
    };
    
    setNotifications(prev => [newNotification, ...prev.slice(0, 4)]);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== newNotification.id));
    }, 5000);
  };

  const handleLogin = (token, userData) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    api.setToken(token);
    setIsAuthenticated(true);
    setUser(userData);
    addNotification({
      type: 'success',
      title: 'Login Successful',
      message: `Welcome ${userData.name}`
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    api.setToken(null);
    setIsAuthenticated(false);
    setUser(null);
    addNotification({
      type: 'info',
      title: 'Logged Out',
      message: 'You have been logged out successfully'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Campus Safety Platform...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        {/* Navigation */}
        <nav className="bg-white shadow-lg">
          <div className="container mx-auto px-4">
            <div className="flex justify-between items-center h-16">
              {/* Logo */}
              <Link to="/" className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
                  <i className="fas fa-shield-alt text-white text-xl"></i>
                </div>
                <span className="text-xl font-bold text-gray-800">Campus Safety</span>
              </Link>

              {/* Navigation Links */}
              <div className="hidden md:flex items-center space-x-8">
                <Link to="/" className="text-gray-700 hover:text-indigo-600 font-medium">
                  <i className="fas fa-home mr-2"></i> Home
                </Link>
                <Link to="/report" className="text-gray-700 hover:text-indigo-600 font-medium">
                  <i className="fas fa-flag mr-2"></i> Report Incident
                </Link>
                
                {isAuthenticated ? (
                  <>
                    <Link to="/admin" className="text-gray-700 hover:text-indigo-600 font-medium">
                      <i className="fas fa-tachometer-alt mr-2"></i> Admin Panel
                    </Link>
                    <div className="flex items-center space-x-4">
                      <span className="text-gray-600">
                        <i className="fas fa-user mr-2"></i> {user?.name}
                      </span>
                      <button
                        onClick={handleLogout}
                        className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
                      >
                        <i className="fas fa-sign-out-alt mr-2"></i> Logout
                      </button>
                    </div>
                  </>
                ) : (
                  <Link to="/admin/login" className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition">
                    <i className="fas fa-lock mr-2"></i> Admin Login
                  </Link>
                )}
              </div>

              {/* Mobile menu button */}
              <button className="md:hidden text-gray-700">
                <i className="fas fa-bars text-xl"></i>
              </button>
            </div>
          </div>
        </nav>

        {/* Notifications */}
        <div className="fixed top-20 right-4 z-50 space-y-2">
          {notifications.map(notification => (
            <div
              key={notification.id}
              className={`toast toast-${notification.type === 'success' ? 'success' : notification.type === 'error' ? 'error' : 'warning'} fade-in`}
            >
              <div className="flex items-center">
                <i className={`fas fa-${notification.type === 'success' ? 'check-circle' : notification.type === 'error' ? 'exclamation-circle' : 'info-circle'} mr-2`}></i>
                <div>
                  <p className="font-semibold">{notification.title}</p>
                  <p className="text-sm opacity-90">{notification.message}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Home socket={socket} />} />
            <Route path="/report" element={<Report socket={socket} />} />
            <Route 
              path="/admin/login" 
              element={
                isAuthenticated ? 
                <Navigate to="/admin" /> : 
                <AdminLogin onLogin={handleLogin} />
              } 
            />
            <Route 
              path="/admin" 
              element={
                isAuthenticated ? 
                <AdminPanel user={user} socket={socket} /> : 
                <Navigate to="/admin/login" />
              } 
            />
          </Routes>
        </main>

        {/* Footer */}
        <footer className="bg-gray-800 text-white py-8 mt-12">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <h3 className="text-xl font-bold mb-4">Campus Safety Platform</h3>
                <p className="text-gray-400">
                  Your safety is our priority. Report incidents anonymously and get help when you need it.
                </p>
              </div>
              
              <div>
                <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
                <ul className="space-y-2">
                  <li><Link to="/" className="text-gray-400 hover:text-white">Home</Link></li>
                  <li><Link to="/report" className="text-gray-400 hover:text-white">Report Incident</Link></li>
                  <li><a href="#" className="text-gray-400 hover:text-white">Safety Guidelines</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-white">Privacy Policy</a></li>
                </ul>
              </div>
              
              <div>
                <h4 className="text-lg font-semibold mb-4">Emergency Contacts</h4>
                <ul className="space-y-2 text-gray-400">
                  <li><i className="fas fa-phone mr-2"></i> Campus Security: 911</li>
                  <li><i className="fas fa-phone mr-2"></i> Women's Helpline: 1091</li>
                  <li><i className="fas fa-phone mr-2"></i> Police: 100</li>
                  <li><i className="fas fa-ambulance mr-2"></i> Medical: 108</li>
                </ul>
              </div>
            </div>
            
            <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
              <p>&copy; {new Date().getFullYear()} Campus Safety Platform. All rights reserved.</p>
              <p className="mt-2 text-sm">Report anonymously. Stay safe.</p>
            </div>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;