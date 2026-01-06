import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

const AdminLogin = ({ onLogin }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError(''); // Clear error on change
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Basic validation
    if (!formData.email || !formData.password) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }

    try {
      // In production, this would be an API call
      // For now, we'll use mock authentication
      
      // Mock admin credentials (in production, validate against backend)
      const mockAdmin = {
        email: 'admin@campus.edu',
        password: 'admin123',
        name: 'Campus Admin',
        role: 'admin',
        department: 'Security',
        token: 'mock-jwt-token-123456'
      };

      if (formData.email === mockAdmin.email && formData.password === mockAdmin.password) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Call parent login handler
        onLogin(mockAdmin.token, {
          id: 'admin001',
          name: mockAdmin.name,
          email: mockAdmin.email,
          role: mockAdmin.role,
          department: mockAdmin.department,
          permissions: {
            viewReports: true,
            editReports: true,
            deleteReports: true,
            assignReports: true,
            manageAdmins: true
          }
        });
        
        // Navigate to admin panel
        navigate('/admin');
      } else {
        throw new Error('Invalid credentials. Use admin@campus.edu / admin123');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError(error.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    const email = prompt('Enter your admin email to reset password:');
    if (email) {
      alert(`Password reset link sent to ${email} (mock)`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-2xl mb-4">
            <i className="fas fa-shield-alt text-3xl text-white"></i>
          </div>
          <h1 className="text-3xl font-bold text-white">Campus Safety</h1>
          <p className="text-gray-400 mt-2">Admin Portal</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-800">Admin Login</h2>
              <p className="text-gray-600 mt-2">Access the admin dashboard</p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center">
                  <i className="fas fa-exclamation-circle text-red-500 mr-3"></i>
                  <p className="text-red-700">{error}</p>
                </div>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit}>
              {/* Email */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Admin Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <i className="fas fa-envelope text-gray-400"></i>
                  </div>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="admin@campus.edu"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-sm text-indigo-600 hover:text-indigo-800"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <i className="fas fa-lock text-gray-400"></i>
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'} text-gray-400 hover:text-gray-600`}></i>
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="mb-8">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded border-gray-300"
                  />
                  <span className="ml-2 text-gray-700">Remember this device</span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-4 px-6 rounded-lg font-bold transition ${
                  loading 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                }`}
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <span className="spinner mr-3"></span>
                    Signing in...
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    <i className="fas fa-sign-in-alt mr-3"></i>
                    Sign In to Dashboard
                  </span>
                )}
              </button>
            </form>

            {/* Demo Credentials */}
            <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2 flex items-center">
                <i className="fas fa-info-circle mr-2"></i>
                Demo Credentials
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex">
                  <span className="text-blue-700 font-medium w-20">Email:</span>
                  <span className="text-blue-900">admin@campus.edu</span>
                </div>
                <div className="flex">
                  <span className="text-blue-700 font-medium w-20">Password:</span>
                  <span className="text-blue-900">admin123</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-8 py-6 bg-gray-50 border-t border-gray-200">
            <div className="text-center">
              <p className="text-gray-600 text-sm">
                Not an admin?{' '}
                <Link to="/" className="text-indigo-600 hover:text-indigo-800 font-medium">
                  Return to home page
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center text-gray-400 text-sm">
            <i className="fas fa-shield-alt mr-2"></i>
            <span>Secure admin portal • Access logged and monitored</span>
          </div>
          <div className="mt-4 flex items-center justify-center space-x-6">
            <div className="text-xs text-gray-500">
              <i className="fas fa-lock mr-1"></i> SSL Encrypted
            </div>
            <div className="text-xs text-gray-500">
              <i className="fas fa-user-check mr-1"></i> 2FA Ready
            </div>
            <div className="text-xs text-gray-500">
              <i className="fas fa-history mr-1"></i> Activity Logged
            </div>
          </div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="fixed top-0 left-0 w-full h-full -z-10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 rounded-full filter blur-3xl opacity-20"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500 rounded-full filter blur-3xl opacity-20"></div>
      </div>
    </div>
  );
};

export default AdminLogin;