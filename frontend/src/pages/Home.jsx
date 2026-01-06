import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ReportMap from '../components/ReportMap';
import ReportList from '../components/ReportList';
import Statistics from '../components/Statistics';
import api from '../services/api';

const Home = ({ socket }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState([]);
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [emergencyMode, setEmergencyMode] = useState(false);

  useEffect(() => {
    fetchData();
    
    // Socket listeners for real-time updates
    if (socket) {
      socket.on('report-notification', (data) => {
        // Add new report to the beginning of the list
        setReports(prev => [data, ...prev]);
        
        // Show notification
        showNotification(`New ${data.category} report submitted`);
      });
      
      socket.on('status-changed', (data) => {
        // Update report status
        setReports(prev => prev.map(report => 
          report._id === data._id ? data : report
        ));
      });
    }
    
    // Cleanup
    return () => {
      if (socket) {
        socket.off('report-notification');
        socket.off('status-changed');
      }
    };
  }, [socket]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch recent reports
      const reportsResponse = await api.getReports({ limit: 10 });
      if (reportsResponse.success) {
        setReports(reportsResponse.data || []);
      }
      
      // Fetch statistics
      const statsResponse = await api.getStatistics();
      if (statsResponse.success) {
        setStats(statsResponse.data);
      }
      
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (message) => {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-indigo-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-slide-in';
    notification.innerHTML = `
      <div class="flex items-center">
        <i class="fas fa-bell mr-3"></i>
        <div>
          <p class="font-semibold">New Incident Report</p>
          <p class="text-sm opacity-90">${message}</p>
        </div>
        <button onclick="this.parentElement.parentElement.remove()" class="ml-4 text-white opacity-75 hover:opacity-100">
          <i class="fas fa-times"></i>
        </button>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, 5000);
  };

  const handleEmergency = () => {
    setEmergencyMode(true);
    
    // Play emergency sound (optional)
    const audio = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-alarm-digital-clock-beep-989.mp3');
    audio.play();
    
    // Show emergency modal
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-red-600 bg-opacity-90 z-50 flex items-center justify-center';
    modal.innerHTML = `
      <div class="bg-white rounded-2xl p-8 max-w-md text-center animate-pulse">
        <div class="text-6xl mb-4">🚨</div>
        <h2 class="text-2xl font-bold text-red-600 mb-4">EMERGENCY MODE ACTIVATED</h2>
        <p class="text-gray-700 mb-6">All security personnel have been alerted. Help is on the way.</p>
        <div class="space-y-4">
          <a href="tel:911" class="block bg-red-600 text-white py-3 rounded-lg font-bold hover:bg-red-700">
            <i class="fas fa-phone mr-2"></i> Call Campus Security (911)
          </a>
          <button onclick="this.parentElement.parentElement.parentElement.remove(); document.getElementById('emergency-stop').click();" 
            class="block bg-gray-600 text-white py-3 rounded-lg font-bold hover:bg-gray-700 w-full">
            Cancel Emergency
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add stop button to page
    const stopBtn = document.createElement('button');
    stopBtn.id = 'emergency-stop';
    stopBtn.className = 'hidden';
    stopBtn.onclick = () => {
      setEmergencyMode(false);
      if (modal.parentElement) {
        modal.remove();
      }
    };
    document.body.appendChild(stopBtn);
  };

  if (loading && !reports.length) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Campus Safety Platform...</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: 'fas fa-home' },
    { id: 'map', label: 'Incident Map', icon: 'fas fa-map' },
    { id: 'reports', label: 'Recent Reports', icon: 'fas fa-list' },
    { id: 'statistics', label: 'Statistics', icon: 'fas fa-chart-bar' },
    { id: 'safety', label: 'Safety Tips', icon: 'fas fa-shield-alt' }
  ];

  const safetyTips = [
    {
      title: 'Stay Aware',
      description: 'Always be aware of your surroundings, especially when walking alone at night.',
      icon: 'fas fa-eye'
    },
    {
      title: 'Trust Your Instincts',
      description: 'If something feels wrong, it probably is. Remove yourself from the situation immediately.',
      icon: 'fas fa-heart'
    },
    {
      title: 'Use the Buddy System',
      description: 'When possible, travel with friends or classmates, especially after dark.',
      icon: 'fas fa-user-friends'
    },
    {
      title: 'Know Emergency Numbers',
      description: 'Save campus security (911) and other emergency numbers in your phone.',
      icon: 'fas fa-phone'
    },
    {
      title: 'Report Suspicious Activity',
      description: 'If you see something suspicious, report it immediately using this platform.',
      icon: 'fas fa-flag'
    },
    {
      title: 'Use Well-lit Paths',
      description: 'Stick to well-lit and populated areas when walking around campus at night.',
      icon: 'fas fa-lightbulb'
    }
  ];

  const emergencyContacts = [
    { name: 'Campus Security', number: '911', color: 'red' },
    { name: 'Women\'s Helpline', number: '1091', color: 'pink' },
    { name: 'Police', number: '100', color: 'blue' },
    { name: 'Medical Emergency', number: '108', color: 'green' }
  ];

  return (
    <div className={`min-h-screen ${emergencyMode ? 'bg-red-50' : ''}`}>
      {/* Emergency Alert Banner */}
      {emergencyMode && (
        <div className="bg-red-600 text-white py-3 px-4 text-center animate-pulse">
          <div className="container mx-auto flex items-center justify-center">
            <i className="fas fa-exclamation-triangle mr-3 text-xl"></i>
            <span className="font-bold">EMERGENCY MODE ACTIVE - All security personnel alerted</span>
            <button
              onClick={() => setEmergencyMode(false)}
              className="ml-4 bg-white text-red-600 px-3 py-1 rounded text-sm font-semibold hover:bg-red-100"
            >
              Stop Emergency
            </button>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="relative container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-3xl mx-auto text-center text-white">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 animate-fade-in">
              Your Safety Matters
            </h1>
            <p className="text-xl md:text-2xl mb-8 opacity-90">
              Report incidents anonymously. Get help when you need it. Make our campus safer for everyone.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/report"
                className="bg-white text-indigo-600 px-8 py-4 rounded-lg text-lg font-bold hover:bg-gray-100 transition transform hover:scale-105 shadow-lg"
              >
                <i className="fas fa-flag mr-2"></i>
                Report an Incident
              </Link>
              <button
                onClick={handleEmergency}
                className="bg-red-500 text-white px-8 py-4 rounded-lg text-lg font-bold hover:bg-red-600 transition transform hover:scale-105 shadow-lg"
              >
                <i className="fas fa-exclamation-triangle mr-2"></i>
                Emergency Alert
              </button>
            </div>
          </div>
        </div>
        
        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320">
            <path fill="#ffffff" fillOpacity="1" d="M0,160L48,176C96,192,192,224,288,213.3C384,203,480,149,576,138.7C672,128,768,160,864,170.7C960,181,1056,171,1152,149.3C1248,128,1344,96,1392,80L1440,64L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
          </svg>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 -mt-20 relative z-10">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-white rounded-xl shadow-lg p-6 text-center hover-card">
            <div className="text-3xl font-bold text-indigo-600">
              {stats?.total || 0}
            </div>
            <div className="text-gray-600">Total Reports</div>
            <div className="mt-2 text-sm text-gray-500">
              Since platform launch
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6 text-center hover-card">
            <div className="text-3xl font-bold text-green-600">
              {stats?.resolved || 0}
            </div>
            <div className="text-gray-600">Resolved</div>
            <div className="mt-2 text-sm text-gray-500">
              Successfully handled
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6 text-center hover-card">
            <div className="text-3xl font-bold text-yellow-600">
              {stats?.pending || 0}
            </div>
            <div className="text-gray-600">Pending</div>
            <div className="mt-2 text-sm text-gray-500">
              Under review
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6 text-center hover-card">
            <div className="text-3xl font-bold text-red-600">
              {reports.filter(r => r.severity === 'critical').length}
            </div>
            <div className="text-gray-600">Critical</div>
            <div className="mt-2 text-sm text-gray-500">
              Urgent attention needed
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="bg-white rounded-xl shadow-lg mb-8 overflow-hidden">
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
        </div>

        {/* Tab Content */}
        <div className="mb-12">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column - Quick Report & Emergency */}
              <div className="lg:col-span-1 space-y-8">
                {/* Quick Report Card */}
                <div className="bg-white rounded-xl shadow-lg p-6 hover-card">
                  <h3 className="text-xl font-bold text-gray-800 mb-4">
                    Quick Report
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Report an incident in just a few clicks. Your identity is protected.
                  </p>
                  <Link
                    to="/report"
                    className="block w-full bg-indigo-600 text-white py-3 rounded-lg text-center font-semibold hover:bg-indigo-700 transition mb-4"
                  >
                    <i className="fas fa-edit mr-2"></i>
                    File a Report
                  </Link>
                  <div className="text-sm text-gray-500 text-center">
                    Average time: 3 minutes • 100% anonymous
                  </div>
                </div>

                {/* Emergency Contacts */}
                <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg p-6 text-white">
                  <h3 className="text-xl font-bold mb-6 flex items-center">
                    <i className="fas fa-exclamation-triangle mr-3"></i>
                    Emergency Contacts
                  </h3>
                  <div className="space-y-4">
                    {emergencyContacts.map(contact => (
                      <div key={contact.name} className="flex items-center justify-between p-3 bg-red-400 rounded-lg">
                        <div>
                          <p className="font-semibold">{contact.name}</p>
                          <p className="text-sm opacity-90">Available 24/7</p>
                        </div>
                        <a 
                          href={`tel:${contact.number}`}
                          className="px-4 py-2 bg-white text-red-600 rounded font-bold hover:bg-red-50 transition"
                        >
                          {contact.number}
                        </a>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white rounded-xl shadow-lg p-6 hover-card">
                  <h3 className="text-xl font-bold text-gray-800 mb-4">
                    Recent Activity
                  </h3>
                  <div className="space-y-4">
                    {reports.slice(0, 3).map(report => (
                      <div key={report._id} className="flex items-center p-3 bg-gray-50 rounded-lg">
                        <div className="flex-shrink-0">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            report.category === 'harassment' ? 'bg-red-100 text-red-600' :
                            report.category === 'safety-threat' ? 'bg-orange-100 text-orange-600' :
                            report.category === 'emergency' ? 'bg-red-50 text-red-700' :
                            'bg-blue-100 text-blue-600'
                          }`}>
                            <i className="fas fa-flag"></i>
                          </div>
                        </div>
                        <div className="ml-4 flex-1">
                          <p className="font-medium text-gray-800">
                            {report.category.replace('-', ' ')}
                          </p>
                          <p className="text-sm text-gray-600">
                            {new Date(report.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </p>
                        </div>
                        <div>
                          <span className={`px-2 py-1 text-xs rounded ${
                            report.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            report.status === 'resolved' ? 'bg-green-100 text-green-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {report.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => setActiveTab('reports')}
                    className="w-full mt-4 text-center text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                    View All Activity →
                  </button>
                </div>
              </div>

              {/* Middle Column - Statistics Preview */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-xl shadow-lg p-6 hover-card mb-8">
                  <h3 className="text-xl font-bold text-gray-800 mb-6">
                    Incident Statistics
                  </h3>
                  <Statistics data={stats} timeframe="7days" />
                </div>

                {/* Safety Tips */}
                <div className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl shadow-lg p-6 text-white">
                  <h3 className="text-xl font-bold mb-6 flex items-center">
                    <i className="fas fa-shield-alt mr-3"></i>
                    Campus Safety Tips
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {safetyTips.slice(0, 4).map((tip, index) => (
                      <div key={index} className="bg-white bg-opacity-20 p-4 rounded-lg backdrop-blur-sm">
                        <div className="flex items-center mb-3">
                          <div className="w-10 h-10 rounded-full bg-white bg-opacity-30 flex items-center justify-center mr-3">
                            <i className={`${tip.icon} text-white`}></i>
                          </div>
                          <h4 className="font-bold">{tip.title}</h4>
                        </div>
                        <p className="text-sm opacity-90">{tip.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'map' && (
            <ReportMap reports={reports} height="600px" />
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

          {activeTab === 'safety' && (
            <div className="space-y-8">
              {/* Safety Guidelines */}
              <div className="bg-white rounded-xl shadow-lg p-6 hover-card">
                <h3 className="text-2xl font-bold text-gray-800 mb-6">
                  Campus Safety Guidelines
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {safetyTips.map((tip, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-6 text-center">
                      <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center mx-auto mb-4">
                        <i className={`${tip.icon} text-2xl text-indigo-600`}></i>
                      </div>
                      <h4 className="text-lg font-bold text-gray-800 mb-3">{tip.title}</h4>
                      <p className="text-gray-600">{tip.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Emergency Procedures */}
              <div className="bg-gradient-to-br from-red-500 to-orange-500 rounded-xl shadow-lg p-8 text-white">
                <h3 className="text-2xl font-bold mb-8 text-center">
                  Emergency Procedures
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white bg-opacity-20 p-6 rounded-lg backdrop-blur-sm">
                    <div className="text-4xl mb-4">1</div>
                    <h4 className="font-bold text-xl mb-3">Stay Calm</h4>
                    <p>Take a deep breath and assess the situation. Panic can make things worse.</p>
                  </div>
                  <div className="bg-white bg-opacity-20 p-6 rounded-lg backdrop-blur-sm">
                    <div className="text-4xl mb-4">2</div>
                    <h4 className="font-bold text-xl mb-3">Call for Help</h4>
                    <p>Dial 911 immediately for campus security. Provide clear location details.</p>
                  </div>
                  <div className="bg-white bg-opacity-20 p-6 rounded-lg backdrop-blur-sm">
                    <div className="text-4xl mb-4">3</div>
                    <h4 className="font-bold text-xl mb-3">Report & Document</h4>
                    <p>Use this platform to report the incident. Take photos if safe to do so.</p>
                  </div>
                </div>
              </div>

              {/* Self-Defense Resources */}
              <div className="bg-white rounded-xl shadow-lg p-6 hover-card">
                <h3 className="text-2xl font-bold text-gray-800 mb-6">
                  Self-Defense Resources
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h4 className="text-lg font-bold text-gray-800 mb-4">On-Campus Workshops</h4>
                    <ul className="space-y-3 text-gray-600">
                      <li className="flex items-start">
                        <i className="fas fa-check text-green-500 mt-1 mr-3"></i>
                        <span>Basic self-defense classes every Friday</span>
                      </li>
                      <li className="flex items-start">
                        <i className="fas fa-check text-green-500 mt-1 mr-3"></i>
                        <span>Women's safety workshops twice a month</span>
                      </li>
                      <li className="flex items-start">
                        <i className="fas fa-check text-green-500 mt-1 mr-3"></i>
                        <span>Emergency response training sessions</span>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-gray-800 mb-4">Safety Apps</h4>
                    <ul className="space-y-3 text-gray-600">
                      <li className="flex items-start">
                        <i className="fas fa-mobile-alt text-blue-500 mt-1 mr-3"></i>
                        <span>Install emergency alert apps on your phone</span>
                      </li>
                      <li className="flex items-start">
                        <i className="fas fa-share-alt text-purple-500 mt-1 mr-3"></i>
                        <span>Share your location with trusted friends</span>
                      </li>
                      <li className="flex items-start">
                        <i className="fas fa-bell text-yellow-500 mt=1 mr-3"></i>
                        <span>Set up emergency contact shortcuts</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Trust & Security Section */}
        <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-2xl p-8 text-white mb-12">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6">Your Privacy & Security</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-3">
                <div className="text-4xl mb-4">🔒</div>
                <h3 className="text-xl font-bold">100% Anonymous</h3>
                <p className="opacity-90">Your identity is never recorded or shared</p>
              </div>
              <div className="space-y-3">
                <div className="text-4xl mb-4">⚡</div>
                <h3 className="text-xl font-bold">Immediate Response</h3>
                <p className="opacity-90">Reports are reviewed within minutes</p>
              </div>
              <div className="space-y-3">
                <div className="text-4xl mb-4">🛡️</div>
                <h3 className="text-xl font-bold">Military-grade Security</h3>
                <p className="opacity-90">All data is encrypted and protected</p>
              </div>
            </div>
          </div>
        </div>

        {/* Testimonials */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">
            What Students Are Saying
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                text: "This platform helped me report harassment anonymously. The response was immediate and professional.",
                author: "Computer Science Student",
                role: "3rd Year"
              },
              {
                text: "I felt safe knowing I could report incidents without revealing my identity. The campus is becoming safer.",
                author: "Electronics Student",
                role: "2nd Year"
              },
              {
                text: "Quick response to my safety concern. The admin team was supportive throughout the process.",
                author: "Management Student",
                role: "4th Year"
              }
            ].map((testimonial, index) => (
              <div key={index} className="bg-white rounded-xl shadow-lg p-6 hover-card">
                <div className="text-yellow-400 mb-4">
                  {'★'.repeat(5)}
                </div>
                <p className="text-gray-600 italic mb-6">"{testimonial.text}"</p>
                <div>
                  <p className="font-bold text-gray-800">{testimonial.author}</p>
                  <p className="text-sm text-gray-500">{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Emergency Floating Button */}
      <button
        onClick={handleEmergency}
        className="fixed bottom-6 right-6 bg-red-500 text-white p-4 rounded-full shadow-lg hover:bg-red-600 transition transform hover:scale-110 z-40"
      >
        <i className="fas fa-exclamation-triangle text-2xl"></i>
      </button>
    </div>
  );
};

export default Home;