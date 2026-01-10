import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { io } from 'socket.io-client';

// Import components
import Home from './pages/Home';
import Report from './pages/Report';
import AdminLogin from './pages/AdminLogin';
import AdminPanel from './pages/AdminPanel';

// Import services
import api from './services/api';
import { auth, db, storage } from './services/firebase.js';

// Initialize API
api.init();

// **Socket.io live backend** (Render URL)
const socket = io(import.meta.env.VITE_API_URL.replace('/api',''));

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (token && userData) {
      setIsAuthenticated(true);
      setUser(JSON.parse(userData));
      api.setToken(token);
    }

    socket.on('connect', () => console.log('Connected to socket server'));

    socket.on('report-notification', (data) => addNotification({
      type: 'info',
      title: 'New Report',
      message: `New ${data.category} report submitted`,
      data
    }));

    socket.on('status-changed', (data) => addNotification({
      type: 'success',
      title: 'Status Updated',
      message: `Report ${data.reportId} status changed to ${data.status}`,
      data
    }));

    setLoading(false);

    return () => {
      socket.off('connect');
      socket.off('report-notification');
      socket.off('status-changed');
    };
  }, []);

  const addNotification = (notification) => {
    const newNotification = { ...notification, id: Date.now(), timestamp: new Date() };
    setNotifications(prev => [newNotification, ...prev.slice(0, 4)]);
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== newNotification.id)), 5000);
  };

  const handleLogin = (token, userData) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    api.setToken(token);
    setIsAuthenticated(true);
    setUser(userData);
    addNotification({ type: 'success', title: 'Login Successful', message: `Welcome ${userData.name}` });
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    api.setToken(null);
    setIsAuthenticated(false);
    setUser(null);
    addNotification({ type: 'info', title: 'Logged Out', message: 'You have been logged out successfully' });
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div>Loading...</div></div>;

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        {/* Navigation */}
        <nav className="bg-white shadow-lg">
          <div className="container mx-auto px-4 flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center"><i className="fas fa-shield-alt text-white text-xl"></i></div>
              <span className="text-xl font-bold text-gray-800">Campus Safety</span>
            </Link>
            <div className="hidden md:flex items-center space-x-8">
              <Link to="/" className="text-gray-700 hover:text-indigo-600 font-medium">Home</Link>
              <Link to="/report" className="text-gray-700 hover:text-indigo-600 font-medium">Report Incident</Link>
              {isAuthenticated ? (
                <>
                  <Link to="/admin" className="text-gray-700 hover:text-indigo-600 font-medium">Admin Panel</Link>
                  <button onClick={handleLogout} className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600">Logout</button>
                </>
              ) : (
                <Link to="/admin/login" className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">Admin Login</Link>
              )}
            </div>
          </div>
        </nav>

        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Home socket={socket} />} />
            <Route path="/report" element={<Report socket={socket} />} />
            <Route path="/admin/login" element={isAuthenticated ? <Navigate to="/admin" /> : <AdminLogin onLogin={handleLogin} />} />
            <Route path="/admin" element={isAuthenticated ? <AdminPanel user={user} socket={socket} /> : <Navigate to="/admin/login" />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
