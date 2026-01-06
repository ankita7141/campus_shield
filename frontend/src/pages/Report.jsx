import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ReportForm from '../components/ReportForm';
import VoiceRecorder from '../components/VoiceRecorder';
import api from '../services/api';

const Report = ({ socket }) => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [audioBlob, setAudioBlob] = useState(null);
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [emergencyMode, setEmergencyMode] = useState(false);

  // Track user's current location
  useEffect(() => {
    // Request location permission
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log('Location accessed:', position.coords);
        },
        (error) => {
          console.warn('Location access denied:', error);
        }
      );
    }

    // Check for emergency mode in URL
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('emergency') === 'true') {
      setEmergencyMode(true);
      handleEmergencyAlert();
    }
  }, []);

  const handleEmergencyAlert = () => {
    // Play emergency sound
    const audio = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-alarm-digital-clock-beep-989.mp3');
    audio.play();
    
    // Show emergency overlay
    const overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 bg-red-600 z-50 flex items-center justify-center';
    overlay.innerHTML = `
      <div class="text-white text-center p-8">
        <div class="text-6xl mb-6 animate-pulse">🚨</div>
        <h2 class="text-3xl font-bold mb-4">EMERGENCY MODE</h2>
        <p class="text-xl mb-8">Security has been alerted. Help is on the way.</p>
        <div class="space-y-4">
          <a href="tel:911" class="block bg-white text-red-600 py-4 px-8 rounded-lg text-xl font-bold hover:bg-gray-100">
            <i class="fas fa-phone mr-3"></i> CALL SECURITY: 911
          </a>
          <button onclick="this.parentElement.parentElement.parentElement.remove()" 
            class="block bg-gray-800 text-white py-3 px-8 rounded-lg text-lg hover:bg-gray-900">
            I'm Safe - Close Alert
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(overlay);
  };

  const handleRecordingComplete = (blob) => {
    setAudioBlob(blob);
  };

  const handleNextStep = () => {
    if (step < 4) {
      setStep(step + 1);
    } else {
      // Submit the report
      handleSubmit();
    }
  };

  const handlePrevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    // In a real app, this would submit to the API
    alert('Report submitted successfully! Your report ID: REP' + Date.now());
    navigate('/');
  };

  const renderStepIndicator = () => (
    <div className="flex justify-center mb-8">
      <div className="flex items-center space-x-2">
        {[1, 2, 3, 4].map((stepNum) => (
          <React.Fragment key={stepNum}>
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step >= stepNum ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
              {stepNum}
            </div>
            {stepNum < 4 && (
              <div className={`w-12 h-1 ${step > stepNum ? 'bg-indigo-600' : 'bg-gray-200'}`}></div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">What type of incident occurred?</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { id: 'harassment', label: 'Harassment', icon: '🚫', color: 'red', description: 'Verbal, physical, or online harassment' },
                  { id: 'safety-threat', label: 'Safety Threat', icon: '⚠️', color: 'orange', description: 'Threats to personal safety' },
                  { id: 'misbehavior', label: 'Misbehavior', icon: '🚨', color: 'yellow', description: 'Disruptive or inappropriate behavior' },
                  { id: 'emergency', label: 'Emergency', icon: '🆘', color: 'red', description: 'Requires immediate attention' },
                  { id: 'theft', label: 'Theft', icon: '💰', color: 'blue', description: 'Stolen property or belongings' },
                  { id: 'other', label: 'Other', icon: '❓', color: 'gray', description: 'Other type of incident' },
                ].map(option => (
                  <button
                    key={option.id}
                    className={`p-6 rounded-xl border-2 text-left transition-all hover:scale-105 ${option.color === 'red' ? 'border-red-200 hover:border-red-300' : option.color === 'orange' ? 'border-orange-200 hover:border-orange-300' : option.color === 'yellow' ? 'border-yellow-200 hover:border-yellow-300' : 'border-gray-200 hover:border-gray-300'}`}
                    onClick={() => handleNextStep()}
                  >
                    <div className="flex items-start">
                      <span className="text-3xl mr-4">{option.icon}</span>
                      <div>
                        <h4 className="text-lg font-bold text-gray-800">{option.label}</h4>
                        <p className="text-sm text-gray-600 mt-2">{option.description}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Describe what happened</h3>
              <textarea
                className="w-full h-48 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Please provide as much detail as possible. Include date, time, location, people involved, and what exactly happened..."
              />
              <p className="text-sm text-gray-500 mt-2">Be specific and factual. Your description helps us respond appropriately.</p>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-gray-800 mb-3">Upload evidence (optional)</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <i className="fas fa-camera text-3xl text-gray-400 mb-3"></i>
                  <p className="text-gray-600">Add photos</p>
                  <p className="text-sm text-gray-500">Up to 5 images</p>
                </div>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <i className="fas fa-video text-3xl text-gray-400 mb-3"></i>
                  <p className="text-gray-600">Add video</p>
                  <p className="text-sm text-gray-500">Max 1 minute</p>
                </div>
              </div>
            </div>

            <VoiceRecorder
              onRecordingComplete={handleRecordingComplete}
              onRecordingStart={() => console.log('Recording started')}
              onRecordingStop={() => console.log('Recording stopped')}
            />
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Location details</h3>
              
              <div className="bg-gray-50 rounded-xl p-6 mb-6">
                <div className="flex items-center mb-4">
                  <i className="fas fa-map-marker-alt text-red-500 text-xl mr-3"></i>
                  <div>
                    <p className="font-semibold text-gray-800">Your current location</p>
                    <p className="text-gray-600">Campus Main Building, Floor 3</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Specific location</label>
                    <input
                      type="text"
                      className="w-full p-3 border border-gray-300 rounded-lg"
                      placeholder="e.g., Room 302, Near staircase, Cafeteria corner"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Building</label>
                      <select className="w-full p-3 border border-gray-300 rounded-lg">
                        <option>Select building</option>
                        <option>Academic Block A</option>
                        <option>Academic Block B</option>
                        <option>Library</option>
                        <option>Cafeteria</option>
                        <option>Hostel Building</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Floor</label>
                      <select className="w-full p-3 border border-gray-300 rounded-lg">
                        <option>Select floor</option>
                        <option>Ground Floor</option>
                        <option>1st Floor</option>
                        <option>2nd Floor</option>
                        <option>3rd Floor</option>
                        <option>4th Floor</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-800 flex items-center">
                  <i className="fas fa-info-circle mr-2"></i>
                  Your exact location is only used to dispatch help. It is not stored permanently.
                </p>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Personal details (optional)</h3>
              
              <div className="space-y-6">
                <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                  <input
                    type="checkbox"
                    id="anonymous"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    className="w-5 h-5 text-indigo-600 rounded"
                  />
                  <label htmlFor="anonymous" className="flex-1">
                    <p className="font-bold text-gray-800">Submit anonymously</p>
                    <p className="text-sm text-gray-600">
                      Your identity will not be recorded. This is recommended for sensitive reports.
                    </p>
                  </label>
                </div>

                {!isAnonymous && (
                  <div className="space-y-4 p-6 border border-gray-200 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                        <input type="text" className="w-full p-3 border border-gray-300 rounded-lg" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Student ID</label>
                        <input type="text" className="w-full p-3 border border-gray-300 rounded-lg" />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                        <input type="email" className="w-full p-3 border border-gray-300 rounded-lg" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                        <input type="tel" className="w-full p-3 border border-gray-300 rounded-lg" />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                      <select className="w-full p-3 border border-gray-300 rounded-lg">
                        <option>Select department</option>
                        <option>Computer Science</option>
                        <option>Electronics</option>
                        <option>Mechanical</option>
                        <option>Civil</option>
                        <option>Management</option>
                      </select>
                    </div>
                  </div>
                )}

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="font-bold text-yellow-800 mb-2 flex items-center">
                    <i className="fas fa-exclamation-triangle mr-2"></i>
                    Important Information
                  </h4>
                  <ul className="text-yellow-700 text-sm space-y-1">
                    <li>• All reports are treated with utmost confidentiality</li>
                    <li>• False reporting may lead to disciplinary action</li>
                    <li>• You may be contacted for follow-up if you provide contact details</li>
                    <li>• Your safety and privacy are our top priority</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Emergency Alert Bar */}
      {emergencyMode && (
        <div className="bg-red-600 text-white py-3 px-4 text-center">
          <div className="container mx-auto flex items-center justify-center">
            <i className="fas fa-exclamation-triangle mr-3 animate-pulse"></i>
            <span className="font-bold">EMERGENCY MODE ACTIVE - Security has been notified</span>
            <button
              onClick={() => setEmergencyMode(false)}
              className="ml-4 bg-white text-red-600 px-3 py-1 rounded text-sm font-semibold hover:bg-red-100"
            >
              Stop Emergency
            </button>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <button
            onClick={() => navigate(-1)}
            className="mb-6 text-indigo-600 hover:text-indigo-800 flex items-center"
          >
            <i className="fas fa-arrow-left mr-2"></i>
            Back to Home
          </button>

          {/* Main Card */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold mb-2">Report an Incident</h1>
                  <p className="opacity-90">Your report helps make our campus safer for everyone</p>
                </div>
                <div className="hidden md:block">
                  <div className="bg-white bg-opacity-20 rounded-full p-3">
                    <i className="fas fa-shield-alt text-3xl"></i>
                  </div>
                </div>
              </div>
            </div>

            {/* Progress Steps */}
            <div className="p-6 border-b">
              {renderStepIndicator()}
              <div className="text-center">
                <span className="text-lg font-semibold">
                  Step {step} of 4: {
                    step === 1 ? 'Incident Type' :
                    step === 2 ? 'Details & Evidence' :
                    step === 3 ? 'Location' :
                    'Personal Information'
                  }
                </span>
              </div>
            </div>

            {/* Form Content */}
            <div className="p-6 md:p-8">
              {renderStep()}
            </div>

            {/* Navigation Buttons */}
            <div className="p-6 border-t bg-gray-50">
              <div className="flex justify-between">
                {step > 1 ? (
                  <button
                    onClick={handlePrevStep}
                    className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                  >
                    <i className="fas fa-arrow-left mr-2"></i>
                    Previous
                  </button>
                ) : (
                  <div></div>
                )}
                
                {step < 4 ? (
                  <button
                    onClick={handleNextStep}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                  >
                    Next Step
                    <i className="fas fa-arrow-right ml-2"></i>
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-bold"
                  >
                    <i className="fas fa-paper-plane mr-2"></i>
                    Submit Report
                  </button>
                )}
              </div>
            </div>

            {/* Emergency Section */}
            <div className="bg-red-50 border-t border-red-200 p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between">
                <div className="flex items-center mb-4 md:mb-0">
                  <i className="fas fa-exclamation-triangle text-red-500 text-2xl mr-4"></i>
                  <div>
                    <h3 className="font-bold text-red-800">🚨 Emergency?</h3>
                    <p className="text-red-700">Need immediate assistance?</p>
                  </div>
                </div>
                <div className="flex space-x-4">
                  <a
                    href="tel:911"
                    className="bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 transition font-bold"
                  >
                    <i className="fas fa-phone mr-2"></i>
                    Call Security: 911
                  </a>
                  <button
                    onClick={() => setEmergencyMode(true)}
                    className="bg-white text-red-600 border border-red-300 px-6 py-3 rounded-lg hover:bg-red-50 transition"
                  >
                    <i className="fas fa-bell mr-2"></i>
                    Alert All Security
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Information Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="text-indigo-600 text-3xl mb-4">
                <i className="fas fa-user-shield"></i>
              </div>
              <h3 className="font-bold text-gray-800 mb-2">100% Anonymous</h3>
              <p className="text-gray-600">Your identity is protected. We never share your personal information.</p>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="text-green-600 text-3xl mb-4">
                <i className="fas fa-clock"></i>
              </div>
              <h3 className="font-bold text-gray-800 mb-2">Quick Response</h3>
              <p className="text-gray-600">Reports are reviewed within minutes. Emergency responses are immediate.</p>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="text-purple-600 text-3xl mb-4">
                <i className="fas fa-lock"></i>
              </div>
              <h3 className="font-bold text-gray-800 mb-2">Secure & Encrypted</h3>
              <p className="text-gray-600">All data is encrypted. Your information is safe with us.</p>
            </div>
          </div>

          {/* Additional ReportForm Component (Alternative) */}
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Or use the detailed form</h2>
            <ReportForm socket={socket} />
          </div>
        </div>
      </div>

      {/* Emergency Floating Button */}
      <button
        onClick={() => setEmergencyMode(true)}
        className="fixed bottom-6 right-6 bg-red-500 text-white p-5 rounded-full shadow-2xl hover:bg-red-600 transition transform hover:scale-110 z-50 animate-pulse"
      >
        <i className="fas fa-exclamation-triangle text-2xl"></i>
      </button>
    </div>
  );
};

export default Report;