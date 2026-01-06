// Firebase configuration and service file

// Firebase configuration
const firebaseConfig = {
  apiKey:
    import.meta.env.VITE_FIREBASE_API_KEY ||
    "AIzaSyDummyKeyForDevelopment",

  authDomain:
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ||
    "campus-safety-dev.firebaseapp.com",

  projectId:
    import.meta.env.VITE_FIREBASE_PROJECT_ID ||
    "campus-safety-dev",

  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ||
    "campus-safety-dev.appspot.com",

  messagingSenderId:
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ||
    "123456789012",

  appId:
    import.meta.env.VITE_FIREBASE_APP_ID ||
    "1:123456789012:web:dummyappid",

  measurementId:
    import.meta.env.VITE_FIREBASE_MEASUREMENT_ID ||
    "G-DUMMYID",
};


// Mock Firebase service for development
class FirebaseService {
  constructor() {
    this.isInitialized = false;
    this.messaging = null;
    this.auth = null;
    this.firestore = null;
    this.storage = null;
  }

  // Initialize Firebase
  async init() {
    try {
      // Check if Firebase is available
      if (typeof window !== 'undefined' && window.firebase) {
        const firebase = window.firebase;
        
        // Initialize Firebase
        if (!firebase.apps.length) {
          firebase.initializeApp(firebaseConfig);
        }
        
        // Get services
        this.messaging = firebase.messaging();
        this.auth = firebase.auth();
        this.firestore = firebase.firestore();
        this.storage = firebase.storage();
        
        this.isInitialized = true;
        console.log('Firebase initialized successfully');
        
        // Request notification permission
        await this.requestNotificationPermission();
        
        return true;
      } else {
        console.warn('Firebase not available, using mock service');
        return false;
      }
    } catch (error) {
      console.error('Firebase initialization error:', error);
      return false;
    }
  }

  // Request notification permission
  async requestNotificationPermission() {
    try {
      if (this.messaging) {
        const permission = await Notification.requestPermission();
        
        if (permission === 'granted') {
          console.log('Notification permission granted');
          
          // Get FCM token
          const token = await this.messaging.getToken({
            vapidKey: process.env.REACT_APP_FIREBASE_VAPID_KEY || 'BLxLGvI7DummyVapidKey'
          });
          
          if (token) {
            console.log('FCM Token:', token);
            await this.saveTokenToServer(token);
            return token;
          }
        } else {
          console.log('Notification permission denied');
        }
      }
      return null;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return null;
    }
  }

  // Save FCM token to server
  async saveTokenToServer(token) {
    try {
      // In production, send token to your backend
      console.log('Saving FCM token to server:', token);
      
      // Mock API call
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (user.id) {
        // This would be an actual API call in production
        // await api.post('/users/fcm-token', { userId: user.id, token });
        console.log('Token saved for user:', user.id);
      }
      
      return true;
    } catch (error) {
      console.error('Error saving token:', error);
      return false;
    }
  }

  // Send push notification (mock for development)
  async sendNotification(title, body, data = {}) {
    if (!this.isInitialized) {
      console.warn('Firebase not initialized, using mock notification');
      return this.mockSendNotification(title, body, data);
    }

    try {
      // This would use Firebase Cloud Messaging in production
      // For now, we'll use the browser's Notification API
      if ('Notification' in window && Notification.permission === 'granted') {
        const notification = new Notification(title, {
          body,
          icon: '/logo.png',
          data,
          tag: 'campus-safety'
        });

        notification.onclick = () => {
          window.focus();
          notification.close();
          
          // Handle notification click
          if (data.url) {
            window.location.href = data.url;
          }
        };

        return { success: true, notification };
      }
      
      return { success: false, error: 'Notifications not permitted' };
    } catch (error) {
      console.error('Error sending notification:', error);
      return { success: false, error: error.message };
    }
  }

  // Mock notification for development
  mockSendNotification(title, body, data = {}) {
    console.log('📱 Mock Notification:');
    console.log('📢 Title:', title);
    console.log('📝 Body:', body);
    console.log('📊 Data:', data);
    
    // Create a mock notification element
    if (typeof window !== 'undefined') {
      const notification = document.createElement('div');
      notification.className = 'fixed top-4 right-4 bg-indigo-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-slide-in';
      notification.innerHTML = `
        <div class="flex items-center">
          <i class="fas fa-bell mr-3"></i>
          <div>
            <p class="font-semibold">${title}</p>
            <p class="text-sm opacity-90">${body}</p>
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
    }
    
    return { success: true, mock: true };
  }

  // Subscribe to topic
  async subscribeToTopic(topic) {
    try {
      if (this.messaging) {
        // This would use Firebase Cloud Messaging in production
        console.log(`Subscribed to topic: ${topic}`);
        return { success: true, topic };
      }
      return { success: false, error: 'Firebase not available' };
    } catch (error) {
      console.error('Error subscribing to topic:', error);
      return { success: false, error: error.message };
    }
  }

  // Unsubscribe from topic
  async unsubscribeFromTopic(topic) {
    try {
      if (this.messaging) {
        // This would use Firebase Cloud Messaging in production
        console.log(`Unsubscribed from topic: ${topic}`);
        return { success: true, topic };
      }
      return { success: false, error: 'Firebase not available' };
    } catch (error) {
      console.error('Error unsubscribing from topic:', error);
      return { success: false, error: error.message };
    }
  }

  // Emergency alert - sends notification to all subscribed devices
  async sendEmergencyAlert(report) {
    const title = `🚨 Emergency: ${report.category.toUpperCase()}`;
    const body = `Emergency reported at ${report.location?.address || 'unknown location'}. Immediate attention required.`;
    
    const data = {
      type: 'emergency',
      reportId: report.reportId,
      category: report.category,
      severity: report.severity,
      location: report.location,
      timestamp: new Date().toISOString()
    };
    
    // Send to all admins (in production, this would use FCM topics)
    const result = await this.sendNotification(title, body, data);
    
    // Also send to emergency channel
    await this.subscribeToTopic('emergency');
    
    return result;
  }

  // Upload file to Firebase Storage
  async uploadFile(file, path = 'reports/') {
    try {
      if (this.storage && this.isInitialized) {
        const storageRef = this.storage.ref();
        const fileRef = storageRef.child(path + Date.now() + '_' + file.name);
        const snapshot = await fileRef.put(file);
        const downloadURL = await snapshot.ref.getDownloadURL();
        return { success: true, url: downloadURL };
      } else {
        // Mock upload for development
        console.log('Mock file upload:', file.name);
        const mockUrl = URL.createObjectURL(file);
        return { success: true, url: mockUrl, mock: true };
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      return { success: false, error: error.message };
    }
  }

  // Delete file from Firebase Storage
  async deleteFile(url) {
    try {
      if (this.storage && this.isInitialized && !url.includes('blob:')) {
        const storageRef = this.storage.refFromURL(url);
        await storageRef.delete();
        return { success: true };
      }
      return { success: true, mock: true };
    } catch (error) {
      console.error('Error deleting file:', error);
      return { success: false, error: error.message };
    }
  }

  // Analytics - track events
  trackEvent(eventName, eventData = {}) {
    try {
      if (this.isInitialized && window.firebase?.analytics) {
        window.firebase.analytics().logEvent(eventName, eventData);
      } else {
        console.log('📊 Analytics Event:', eventName, eventData);
      }
    } catch (error) {
      console.error('Error tracking event:', error);
    }
  }

  // Authentication methods
  async login(email, password) {
    try {
      if (this.auth && this.isInitialized) {
        const result = await this.auth.signInWithEmailAndPassword(email, password);
        return { success: true, user: result.user };
      } else {
        // Mock login for development
        console.log('Mock login:', email);
        return { 
          success: true, 
          user: { 
            uid: 'mock-user-id',
            email: email,
            displayName: 'Mock User'
          },
          mock: true 
        };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message };
    }
  }

  async logout() {
    try {
      if (this.auth && this.isInitialized) {
        await this.auth.signOut();
      }
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false, error: error.message };
    }
  }
}

// Create singleton instance
const firebaseService = new FirebaseService();

// Initialize Firebase when module loads
export const initFirebase = async () => {
  const initialized = await firebaseService.init();
  
  if (!initialized) {
    console.log('Using mock Firebase service for development');
    
    // Set up mock message handler
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        console.log('Service worker message:', event.data);
        
        // Handle push notification
        if (event.data && event.data.type === 'PUSH_RECEIVED') {
          const { title, body, data } = event.data.payload;
          firebaseService.mockSendNotification(title, body, data);
        }
      });
    }
  }
  
  return initialized;
};

// Export the service instance
export default firebaseService;