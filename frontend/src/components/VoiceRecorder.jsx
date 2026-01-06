import React, { useState, useRef, useEffect } from 'react';

const VoiceRecorder = ({ onRecordingComplete, onRecordingStart, onRecordingStop }) => {
  const [recording, setRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const microphoneRef = useRef(null);

  useEffect(() => {
    // Check for microphone permission
    checkMicrophonePermission();
    
    return () => {
      // Cleanup
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const checkMicrophonePermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      setPermissionGranted(true);
    } catch (error) {
      console.error('Microphone permission denied:', error);
      setPermissionGranted(false);
    }
  };

  const startRecording = async () => {
    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      });

      // Setup audio analysis for visualizer
      setupAudioAnalysis(stream);

      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      // Handle data available
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      // Handle recording stop
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { 
          type: 'audio/webm;codecs=opus' 
        });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        setAudioBlob(audioBlob);
        setAudioUrl(audioUrl);
        
        if (onRecordingComplete) {
          onRecordingComplete(audioBlob);
        }
        
        // Cleanup
        stream.getTracks().forEach(track => track.stop());
        if (audioContextRef.current) {
          audioContextRef.current.close();
        }
        
        clearInterval(timerRef.current);
        setRecordingTime(0);
      };

      // Start recording
      mediaRecorder.start(100); // Collect data every 100ms
      setRecording(true);
      
      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      // Callback
      if (onRecordingStart) {
        onRecordingStart();
      }

    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const setupAudioAnalysis = (stream) => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audioContextRef.current = new AudioContext();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      
      analyserRef.current.fftSize = 256;
      source.connect(analyserRef.current);
      
      // Start analyzing audio levels
      analyzeAudioLevel();
    } catch (error) {
      console.error('Error setting up audio analysis:', error);
    }
  };

  const analyzeAudioLevel = () => {
    const analyze = () => {
      if (!analyserRef.current) return;
      
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      analyserRef.current.getByteFrequencyData(dataArray);
      
      // Calculate average volume
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }
      const average = sum / dataArray.length;
      
      // Normalize to 0-100
      const level = Math.min(100, Math.max(0, (average / 128) * 100));
      setAudioLevel(level);
      
      requestAnimationFrame(analyze);
    };
    
    analyze();
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setRecording(false);
      
      if (onRecordingStop) {
        onRecordingStop();
      }
    }
  };

  const deleteRecording = () => {
    setAudioUrl(null);
    setAudioBlob(null);
    setAudioLevel(0);
    
    // Revoke object URL to free memory
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const requestPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      setPermissionGranted(true);
      alert('Microphone permission granted! You can now record.');
    } catch (error) {
      alert('Please allow microphone access in your browser settings.');
    }
  };

  if (!permissionGranted) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
        <i className="fas fa-microphone-slash text-3xl text-yellow-500 mb-4"></i>
        <h3 className="text-lg font-semibold text-yellow-800 mb-2">
          Microphone Access Required
        </h3>
        <p className="text-yellow-700 mb-4">
          To record audio evidence, please allow microphone access.
        </p>
        <button
          onClick={requestPermission}
          className="bg-yellow-500 text-white px-6 py-3 rounded-lg hover:bg-yellow-600 transition"
        >
          <i className="fas fa-microphone mr-2"></i>
          Allow Microphone Access
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-800">Voice Recording</h3>
          <p className="text-gray-600">Record audio evidence (optional)</p>
        </div>
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${recording ? 'bg-red-500 animate-pulse' : 'bg-gray-300'}`}></div>
          <span className="text-sm font-medium">
            {recording ? 'Recording...' : 'Ready to record'}
          </span>
        </div>
      </div>

      {/* Recording Controls */}
      <div className="space-y-6">
        {/* Recording Button */}
        <div className="text-center">
          {!recording && !audioUrl ? (
            <button
              onClick={startRecording}
              className="bg-indigo-600 text-white px-8 py-4 rounded-full hover:bg-indigo-700 transition transform hover:scale-105"
            >
              <i className="fas fa-microphone text-2xl"></i>
              <p className="mt-2 font-semibold">Start Recording</p>
            </button>
          ) : recording ? (
            <div className="space-y-4">
              <button
                onClick={stopRecording}
                className="bg-red-600 text-white px-8 py-4 rounded-full hover:bg-red-700 transition"
              >
                <i className="fas fa-stop text-2xl"></i>
                <p className="mt-2 font-semibold">Stop Recording</p>
              </button>
              
              {/* Recording Timer */}
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-800">
                  {formatTime(recordingTime)}
                </div>
                <p className="text-sm text-gray-600 mt-1">Recording time</p>
              </div>
              
              {/* Audio Level Visualizer */}
              <div className="mt-4">
                <div className="flex items-center justify-center space-x-1 h-12">
                  {Array.from({ length: 20 }).map((_, i) => {
                    const isActive = i < (audioLevel / 5);
                    return (
                      <div
                        key={i}
                        className={`w-2 rounded-full transition-all duration-100 ${
                          isActive ? 'bg-red-500' : 'bg-gray-200'
                        }`}
                        style={{ 
                          height: `${(i + 1) * 5}px`,
                          opacity: isActive ? 1 : 0.3
                        }}
                      ></div>
                    );
                  })}
                </div>
                <p className="text-sm text-gray-600 text-center mt-2">
                  Audio level: {Math.round(audioLevel)}%
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Audio Player */}
              <div className="bg-gray-50 rounded-lg p-4">
                <audio
                  src={audioUrl}
                  controls
                  className="w-full"
                  controlsList="nodownload"
                />
              </div>
              
              {/* Action Buttons */}
              <div className="flex justify-center space-x-4">
                <button
                  onClick={deleteRecording}
                  className="bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 transition"
                >
                  <i className="fas fa-trash mr-2"></i>
                  Delete Recording
                </button>
                <button
                  onClick={startRecording}
                  className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition"
                >
                  <i className="fas fa-redo mr-2"></i>
                  Record Again
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-800 mb-2 flex items-center">
            <i className="fas fa-info-circle mr-2"></i>
            Recording Guidelines
          </h4>
          <ul className="text-blue-700 text-sm space-y-1">
            <li>• Record in a quiet environment for better audio quality</li>
            <li>• Hold the device close to your mouth for clear recording</li>
            <li>• Maximum recording time: 5 minutes</li>
            <li>• Your recording will be stored securely and anonymously</li>
            <li>• You can delete and re-record if needed</li>
          </ul>
        </div>

        {/* Recording Tips */}
        {!recording && !audioUrl && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <i className="fas fa-volume-up text-2xl text-indigo-600 mb-3"></i>
              <p className="font-medium text-gray-800">Speak Clearly</p>
              <p className="text-sm text-gray-600">Enunciate your words clearly</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <i className="fas fa-shield-alt text-2xl text-indigo-600 mb-3"></i>
              <p className="font-medium text-gray-800">Stay Anonymous</p>
              <p className="text-sm text-gray-600">Don't mention personal information</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <i className="fas fa-clock text-2xl text-indigo-600 mb-3"></i>
              <p className="font-medium text-gray-800">Be Concise</p>
              <p className="text-sm text-gray-600">Stick to the important details</p>
            </div>
          </div>
        )}

        {/* Legal Disclaimer */}
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            <i className="fas fa-exclamation-triangle mr-2"></i>
            <strong>Legal Notice:</strong> By recording audio, you consent to this recording being used 
            as evidence. False reporting may lead to disciplinary action. Your recording is stored 
            securely and will only be accessed by authorized personnel.
          </p>
        </div>
      </div>
    </div>
  );
};

export default VoiceRecorder;