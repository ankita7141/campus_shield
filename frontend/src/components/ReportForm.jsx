import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import locationService from '../services/location';

const ReportForm = ({ socket }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [step, setStep] = useState(1);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioChunks, setAudioChunks] = useState([]);
  const audioRef = useRef(null);
  
  const [formData, setFormData] = useState({
    description: '',
    category: 'harassment',
    severity: 'medium',
    location: {
      lat: null,
      lng: null,
      address: '',
      building: '',
      floor: '',
      room: ''
    },
    isAnonymous: true,
    reporterInfo: {
      gender: 'prefer-not-to-say',
      department: '',
      year: '',
      contact: ''
    },
    images: [],
    audio: null
  });

  const categories = [
    { value: 'harassment', label: 'Harassment', icon: '🚫', color: 'red' },
    { value: 'safety-threat', label: 'Safety Threat', icon: '⚠️', color: 'orange' },
    { value: 'misbehavior', label: 'Misbehavior', icon: '🚨', color: 'yellow' },
    { value: 'emergency', label: 'Emergency', icon: '🆘', color: 'red' },
    { value: 'other', label: 'Other', icon: '❓', color: 'gray' }
  ];

  const severities = [
    { value: 'low', label: 'Low', color: 'green' },
    { value: 'medium', label: 'Medium', color: 'yellow' },
    { value: 'high', label: 'High', color: 'orange' },
    { value: 'critical', label: 'Critical', color: 'red' }
  ];

  const departments = [
    'Computer Science', 'Electronics', 'Mechanical', 'Civil', 
    'Electrical', 'Chemical', 'Biotechnology', 'Management',
    'Commerce', 'Arts', 'Science', 'Law', 'Medical', 'Other'
  ];

  const years = ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year', 'Post Graduate'];

  useEffect(() => {
    // Get current location
    getCurrentLocation();
    
    // Cleanup audio recording
    return () => {
      if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
      }
    };
  }, []);

  const getCurrentLocation = async () => {
    try {
      const position = await locationService.getCurrentPosition();
    const address = await locationService.getAddressFromCoords(position.lat, position.lng);

      
      setFormData(prev => ({
        ...prev,
        location: {
          lat: position.lat,
          lng: position.lng,
          address: address || 'Your current location',
          building: '',
          floor: '',
          room: ''
        }
      }));
    } catch (error) {
      console.error('Error getting location:', error);
      // Use default location (campus coordinates)
      setFormData(prev => ({
        ...prev,
        location: {
          lat: 28.6139,
          lng: 77.2090,
          address: 'Campus Main Gate',
          building: '',
          floor: '',
          room: ''
        }
      }));
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    
    if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else if (type === 'file') {
      const selectedImages = Array.from(files);
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...selectedImages].slice(0, 5) // Limit to 5 images
      }));
    } else if (name.startsWith('location.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        location: {
          ...prev.location,
          [field]: value
        }
      }));
    } else if (name.startsWith('reporterInfo.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        reporterInfo: {
          ...prev.reporterInfo,
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          setAudioChunks(prev => [...prev, e.data]);
        }
      };
      
      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        setFormData(prev => ({
          ...prev,
          audio: audioBlob
        }));
        
        if (audioRef.current) {
          audioRef.current.src = audioUrl;
        }
        
        stream.getTracks().forEach(track => track.stop());
      };
      
      recorder.start();
      setMediaRecorder(recorder);
      setRecording(true);
      
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      setRecording(false);
    }
  };

  const removeImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const removeAudio = () => {
    setFormData(prev => ({
      ...prev,
      audio: null
    }));
    setAudioChunks([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formDataToSend = new FormData();
      
      // Add text fields
      formDataToSend.append('description', formData.description);
      formDataToSend.append('category', formData.category);
      formDataToSend.append('severity', formData.severity);
      formDataToSend.append('lat', formData.location.lat);
      formDataToSend.append('lng', formData.location.lng);
      formDataToSend.append('address', formData.location.address);
      formDataToSend.append('building', formData.location.building || '');
      formDataToSend.append('floor', formData.location.floor || '');
      formDataToSend.append('room', formData.location.room || '');
      formDataToSend.append('isAnonymous', formData.isAnonymous);
      formDataToSend.append('gender', formData.reporterInfo.gender);
      formDataToSend.append('department', formData.reporterInfo.department);
      formDataToSend.append('year', formData.reporterInfo.year);
      formDataToSend.append('contact', formData.reporterInfo.contact || '');

      // Add images
      formData.images.forEach((image, index) => {
        formDataToSend.append('images', image);
      });

      // Add audio if exists
      if (formData.audio) {
        formDataToSend.append('audio', formData.audio, 'recording.webm');
      }

      const response = await api.submitReport(formDataToSend);
      
      if (response.success) {
        // Emit socket event
        if (socket) {
          socket.emit('new-report', response.data);
        }
        
        // Show success message
        alert(`✅ Report submitted successfully!\nReport ID: ${response.data.reportId}`);
        
        // Reset form
        setFormData({
          description: '',
          category: 'harassment',
          severity: 'medium',
          location: {
            lat: formData.location.lat,
            lng: formData.location.lng,
            address: formData.location.address,
            building: '',
            floor: '',
            room: ''
          },
          isAnonymous: true,
          reporterInfo: {
            gender: 'prefer-not-to-say',
            department: '',
            year: '',
            contact: ''
          },
          images: [],
          audio: null
        });
        
        setStep(1);
        navigate('/');
      }
    } catch (error) {
      console.error('Error submitting report:', error);
      alert(`❌ Error: ${error.response?.data?.error || 'Failed to submit report'}`);
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (step === 1 && (!formData.description || formData.description.length < 10)) {
      alert('Please provide a description of at least 10 characters');
      return;
    }
    setStep(step + 1);
  };

  const prevStep = () => {
    setStep(step - 1);
  };

  const renderStepIndicator = () => (
    <div className="flex justify-center mb-8">
      <div className="flex items-center space-x-4">
        {[1, 2, 3].map((stepNum) => (
          <React.Fragment key={stepNum}>
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step >= stepNum ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
              {stepNum}
            </div>
            {stepNum < 3 && (
              <div className={`w-16 h-1 ${step > stepNum ? 'bg-indigo-600' : 'bg-gray-200'}`}></div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">What happened?</h3>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          className="w-full h-40 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="Please describe the incident in detail..."
          required
        />
        <p className="text-sm text-gray-500 mt-2">
          {formData.description.length}/10 characters minimum
        </p>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Category</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {categories.map((cat) => (
            <button
              key={cat.value}
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, category: cat.value }))}
              className={`p-3 rounded-lg border-2 flex flex-col items-center justify-center transition-all ${formData.category === cat.value ? `border-${cat.color}-500 bg-${cat.color}-50` : 'border-gray-200 hover:border-gray-300'}`}
            >
              <span className="text-2xl mb-2">{cat.icon}</span>
              <span className="text-sm font-medium">{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Severity Level</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {severities.map((sev) => (
            <button
              key={sev.value}
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, severity: sev.value }))}
              className={`p-3 rounded-lg border-2 flex items-center justify-center transition-all ${formData.severity === sev.value ? `border-${sev.color}-500 bg-${sev.color}-50` : 'border-gray-200 hover:border-gray-300'}`}
            >
              <div className={`w-3 h-3 rounded-full bg-${sev.color}-500 mr-2`}></div>
              <span className="font-medium">{sev.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-between">
        <div></div>
        <button
          type="button"
          onClick={nextStep}
          className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition"
        >
          Next: Location Details →
        </button>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Location Details</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current Location
            </label>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-gray-600">{formData.location.address}</p>
              <p className="text-sm text-gray-500 mt-1">
                Coordinates: {formData.location.lat?.toFixed(6)}, {formData.location.lng?.toFixed(6)}
              </p>
              <button
                type="button"
                onClick={getCurrentLocation}
                className="mt-2 text-indigo-600 hover:text-indigo-800 text-sm"
              >
                <i className="fas fa-sync-alt mr-1"></i> Update Location
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Building
              </label>
              <input
                type="text"
                name="location.building"
                value={formData.location.building}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg"
                placeholder="e.g., Academic Block"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Floor
              </label>
              <input
                type="text"
                name="location.floor"
                value={formData.location.floor}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg"
                placeholder="e.g., 2nd Floor"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Room/Area
              </label>
              <input
                type="text"
                name="location.room"
                value={formData.location.room}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg"
                placeholder="e.g., Room 201 or Cafeteria"
              />
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Media Evidence (Optional)</h3>
        
        <div className="space-y-6">
          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Images (Max 5)
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleChange}
                className="hidden"
                id="image-upload"
              />
              <label htmlFor="image-upload" className="cursor-pointer">
                <i className="fas fa-camera text-3xl text-gray-400 mb-3"></i>
                <p className="text-gray-600">Click to upload images</p>
                <p className="text-sm text-gray-500 mt-1">PNG, JPG, GIF up to 5MB each</p>
              </label>
            </div>
            
            {/* Preview Images */}
            {formData.images.length > 0 && (
              <div className="mt-4">
                <p className="text-sm text-gray-600 mb-2">
                  {formData.images.length} image(s) selected
                </p>
                <div className="flex flex-wrap gap-2">
                  {formData.images.map((image, index) => (
                    <div key={index} className="relative">
                      <img
                        src={URL.createObjectURL(image)}
                        alt={`Preview ${index + 1}`}
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                      >
                        <i className="fas fa-times text-xs"></i>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Audio Recording */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Audio Recording
            </label>
            <div className="space-y-3">
              <div className="flex items-center space-x-4">
                <button
                  type="button"
                  onClick={recording ? stopRecording : startRecording}
                  className={`px-4 py-2 rounded-lg flex items-center ${recording ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-600 hover:bg-gray-700'} text-white`}
                >
                  <i className={`fas fa-${recording ? 'stop' : 'microphone'} mr-2`}></i>
                  {recording ? 'Stop Recording' : 'Start Recording'}
                </button>
                
                {formData.audio && (
                  <button
                    type="button"
                    onClick={removeAudio}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                  >
                    <i className="fas fa-trash mr-2"></i> Remove Audio
                  </button>
                )}
              </div>
              
              {recording && (
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-red-500 font-medium">Recording...</span>
                </div>
              )}
              
              {formData.audio && (
                <div className="mt-2">
                  <audio ref={audioRef} controls className="w-full" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        <button
          type="button"
          onClick={prevStep}
          className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
        >
          ← Back
        </button>
        <button
          type="button"
          onClick={nextStep}
          className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition"
        >
          Next: Personal Details →
        </button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Personal Details (Optional)</h3>
        
        <div className="space-y-4">
          <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
            <input
              type="checkbox"
              id="anonymous"
              name="isAnonymous"
              checked={formData.isAnonymous}
              onChange={handleChange}
              className="w-5 h-5 text-indigo-600 rounded"
            />
            <label htmlFor="anonymous" className="flex-1">
              <p className="font-medium">Submit anonymously</p>
              <p className="text-sm text-gray-600">
                Your identity will not be recorded or shared with anyone
              </p>
            </label>
          </div>

          {!formData.isAnonymous && (
            <div className="space-y-4 p-4 border border-gray-200 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Gender
                  </label>
                  <select
                    name="reporterInfo.gender"
                    value={formData.reporterInfo.gender}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-lg"
                  >
                    <option value="prefer-not-to-say">Prefer not to say</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Department
                  </label>
                  <select
                    name="reporterInfo.department"
                    value={formData.reporterInfo.department}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-lg"
                  >
                    <option value="">Select Department</option>
                    {departments.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Year
                  </label>
                  <select
                    name="reporterInfo.year"
                    value={formData.reporterInfo.year}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-lg"
                  >
                    <option value="">Select Year</option>
                    {years.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Number (Optional)
                  </label>
                  <input
                    type="tel"
                    name="reporterInfo.contact"
                    value={formData.reporterInfo.contact}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-lg"
                    placeholder="10-digit number"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-800 mb-2 flex items-center">
          <i className="fas fa-info-circle mr-2"></i> Important Information
        </h4>
        <ul className="text-blue-700 text-sm space-y-1">
          <li>• Your report is completely confidential</li>
          <li>• Campus security will review your report within 24 hours</li>
          <li>• In case of emergency, call 911 immediately</li>
          <li>• False reporting may lead to disciplinary action</li>
        </ul>
      </div>

      <div className="flex justify-between">
        <button
          type="button"
          onClick={prevStep}
          className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
        >
          ← Back
        </button>
        <button
          type="submit"
          disabled={loading}
          className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <i className="fas fa-spinner fa-spin mr-2"></i>
              Submitting...
            </>
          ) : (
            <>
              <i className="fas fa-paper-plane mr-2"></i>
              Submit Report
            </>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6">
          <h1 className="text-3xl font-bold mb-2">Report an Incident</h1>
          <p className="opacity-90">Your safety matters. Report anonymously or with your details.</p>
        </div>

        {/* Progress Steps */}
        <div className="p-6 border-b">
          {renderStepIndicator()}
          <div className="text-center">
            <span className="text-lg font-semibold">
              Step {step}: {step === 1 ? 'Incident Details' : step === 2 ? 'Location & Evidence' : 'Personal Information'}
            </span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
        </form>

        {/* Emergency Contact */}
        <div className="bg-red-50 border-t border-red-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <i className="fas fa-exclamation-triangle text-red-500 text-xl mr-3"></i>
              <div>
                <p className="font-semibold text-red-800">🚨 Emergency?</p>
                <p className="text-sm text-red-700">Call Campus Security: 911</p>
              </div>
            </div>
            <button
              type="button"
              className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
              onClick={() => window.location.href = 'tel:911'}
            >
              <i className="fas fa-phone mr-2"></i> Call Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportForm;