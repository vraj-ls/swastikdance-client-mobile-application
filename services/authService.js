import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';
import { API_URL } from '../constants/config';

// Storage keys
const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

class AuthService {
  constructor() {
    this.navigationRef = null;
  }

  // Set navigation reference for logout navigation
  setNavigationRef(ref) {
    this.navigationRef = ref;
  }
  // Login
  async login(email, password, role = 'customer', fcmToken = null) {
    try {
      console.log('AuthService: Making login request to:', `${API_URL}/login`);
      console.log('AuthService: Request data:', { email, role, fcmToken: fcmToken ? 'present' : 'null' });

      const payload = {
        email,
        password,
        role,
      };

      // Include FCM token if provided
      if (fcmToken) {
        payload.fcmToken = fcmToken;
      }

      const response = await axios.post(`${API_URL}/login`, payload);

      console.log('AuthService: Response status:', response.status);
      console.log('AuthService: Response data:', JSON.stringify(response.data, null, 2));

      if (response.data.success) {
        const { token, user } = response.data.payload;
        console.log('🔐 [AUTH] Login - Token received:', token ? `YES (length: ${token.length})` : 'NO');
        console.log('🔐 [AUTH] Login - Token preview:', token ? token.substring(0, 30) + '...' + token.substring(token.length - 30) : 'N/A');
        console.log('🔐 [AUTH] Login - User received:', user ? JSON.stringify(user, null, 2) : 'NO');
        
        // Decode and log token details
        if (token) {
          try {
            const decoded = this.getProfile(token);
            console.log('🔐 [AUTH] Login - Token decoded:', {
              id: decoded?.id,
              email: decoded?.email,
              role: decoded?.role,
              exp: decoded?.exp,
              expDate: decoded?.exp ? new Date(decoded.exp * 1000).toISOString() : 'N/A',
              iat: decoded?.iat,
              iatDate: decoded?.iat ? new Date(decoded.iat * 1000).toISOString() : 'N/A',
            });
          } catch (e) {
            console.error('🔐 [AUTH] Login - Error decoding token:', e);
          }
        }
        
        console.log('🔐 [AUTH] Login - Storing token and user...');
        await this.storeAuth(token, user);
        console.log('🔐 [AUTH] Login - Token and user stored successfully');
        
        // Verify storage
        const storedToken = await this.getToken();
        console.log('🔐 [AUTH] Login - Verification - Token stored?', !!storedToken);
        if (storedToken) {
          console.log('🔐 [AUTH] Login - Verification - Stored token matches?', storedToken === token);
        }
        
        return response.data;
      } else {
        console.error('AuthService: Login failed -', response.data.message);
        throw new Error(response.data.message || 'Login failed');
      }
    } catch (error) {
      console.error('AuthService: Login error:', error);
      console.error('AuthService: Error response:', error.response?.data);
      throw error.response?.data?.message || error.message || 'Login failed';
    }
  }

  // Register
  async register(userData) {
    try {
      console.log('AuthService: Making registration request to:', `${API_URL}/register`);
      console.log('AuthService: Registration data:', JSON.stringify(userData, null, 2));

      const response = await axios.post(`${API_URL}/register`, userData);

      console.log('AuthService: Registration response status:', response.status);
      console.log('AuthService: Registration response data:', JSON.stringify(response.data, null, 2));

      if (response.data.success) {
        const { token, user } = response.data.payload;
        console.log('AuthService: Registration successful, storing token and user...');
        await this.storeAuth(token, user);
        console.log('AuthService: Registration complete');
        return response.data;
      } else {
        console.error('AuthService: Registration failed -', response.data.message);
        throw new Error(response.data.message || 'Registration failed');
      }
    } catch (error) {
      console.error('AuthService: Registration error:', error);
      console.error('AuthService: Error response:', error.response?.data);
      throw error.response?.data?.message || error.message || 'Registration failed';
    }
  }

  // Forgot Password
  async forgotPassword(email) {
    try {
      const response = await axios.post(`${API_URL}/forgot-password`, {
        email,
      });

      return response.data;
    } catch (error) {
      throw error.response?.data?.message || error.message || 'Password reset failed';
    }
  }

  // Get Profile
  async getUserProfile() {
    try {
      const response = await axios.get(`${API_URL}/profile`);

      if (response.data.success) {
        return response.data.payload;
      } else {
        throw new Error(response.data.message || 'Failed to fetch profile');
      }
    } catch (error) {
      console.error('AuthService: Get profile error:', error);
      throw error.response?.data?.message || error.message || 'Failed to fetch profile';
    }
  }

  // Update Profile
  async updateProfile(profileData) {
    try {
      const response = await axios.put(`${API_URL}/profile`, {
        email: profileData.email ? profileData.email.toLowerCase() : undefined,
        phone: profileData.phone,
        street: profileData.street,
        suburb: profileData.suburb,
        postcode: profileData.postcode,
      });

      if (response.data.success) {
        return response.data.payload;
      } else {
        throw new Error(response.data.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('AuthService: Update profile error:', error);
      throw error.response?.data?.message || error.message || 'Failed to update profile';
    }
  }

  // Change Password
  async changePassword(newPassword, confirmPassword) {
    try {
      const response = await axios.put(`${API_URL}/password`, {
        newPassword,
        confirmPassword,
      });

      if (response.data.success) {
        return response.data;
      } else {
        throw new Error(response.data.message || 'Failed to change password');
      }
    } catch (error) {
      console.error('AuthService: Change password error:', error);
      throw error.response?.data?.message || error.message || 'Failed to change password';
    }
  }

  // Add Student
  async addStudent(studentData) {
    try {
      const response = await axios.post(`${API_URL}/students`, {
        firstName: studentData.firstName,
        middleName: studentData.middleName || null,
        lastName: studentData.lastName,
        dob: studentData.dob,
        gender: studentData.gender,
        notes: studentData.notes || null,
      });

      if (response.data.success) {
        return response.data.payload;
      } else {
        throw new Error(response.data.message || 'Failed to add student');
      }
    } catch (error) {
      console.error('AuthService: Add student error:', error);
      throw error.response?.data?.message || error.message || 'Failed to add student';
    }
  }

  // Get Student by ID
  async getStudent(id) {
    try {
      const response = await axios.get(`${API_URL}/students/${id}`, {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
        },
      });

      if (response.data.success) {
        return response.data.payload;
      } else {
        throw new Error(response.data.message || 'Failed to fetch student');
      }
    } catch (error) {
      console.error('AuthService: Get student error:', error);
      throw error.response?.data?.message || error.message || 'Failed to fetch student';
    }
  }

  // Update Student
  async updateStudent(id, studentData) {
    try {
      const response = await axios.put(`${API_URL}/students/${id}`, {
        firstName: studentData.firstName,
        middleName: studentData.middleName || null,
        lastName: studentData.lastName,
        dob: studentData.dob,
        gender: studentData.gender,
        notes: studentData.notes || null,
      });

      if (response.data.success) {
        return response.data.payload;
      } else {
        throw new Error(response.data.message || 'Failed to update student');
      }
    } catch (error) {
      console.error('AuthService: Update student error:', error);
      throw error.response?.data?.message || error.message || 'Failed to update student';
    }
  }

  // Logout
  async logout() {
    try {
      await axios.post(`${API_URL}/logout`);
    } catch (error) {
      console.log('Logout API error:', error);
    } finally {
      // Import notificationService dynamically to avoid circular dependency
      const { default: notificationService } = await import('./notificationService');
      await notificationService.clearToken();
      await this.clearAuth();
      this.navigateToLogin();
    }
  }

  // Navigate to login screen
  navigateToLogin() {
    if (this.navigationRef?.isReady()) {
      console.log('Navigating to Login screen...');
      this.navigationRef.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } else {
      console.warn('Navigation ref not ready, cannot navigate to login');
    }
  }

  // Store auth data
  async storeAuth(token, user) {
    try {
      console.log('🔐 [AUTH] storeAuth - Storing token to AsyncStorage...');
      console.log('🔐 [AUTH] storeAuth - Token to store:', token ? `YES (length: ${token.length})` : 'NO');
      if (token) {
        console.log('🔐 [AUTH] storeAuth - Token preview:', token.substring(0, 30) + '...' + token.substring(token.length - 30));
      }
      
      await AsyncStorage.setItem(TOKEN_KEY, token);
      console.log('🔐 [AUTH] storeAuth - Token stored successfully');

      console.log('🔐 [AUTH] storeAuth - Storing user to AsyncStorage...');
      console.log('🔐 [AUTH] storeAuth - User to store:', user ? JSON.stringify(user, null, 2) : 'NO');
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
      console.log('🔐 [AUTH] storeAuth - User stored successfully');

      // Verify storage
      const storedToken = await AsyncStorage.getItem(TOKEN_KEY);
      const storedUser = await AsyncStorage.getItem(USER_KEY);
      console.log('🔐 [AUTH] storeAuth - Verification - Token stored:', !!storedToken);
      console.log('🔐 [AUTH] storeAuth - Verification - Token matches?', storedToken === token);
      console.log('🔐 [AUTH] storeAuth - Verification - User stored:', !!storedUser);
      
      if (storedToken) {
        console.log('🔐 [AUTH] storeAuth - Verification - Stored token preview:', storedToken.substring(0, 30) + '...' + storedToken.substring(storedToken.length - 30));
      }
    } catch (error) {
      console.error('🔐 [AUTH] storeAuth - Error storing auth data:', error);
      throw error;
    }
  }

  // Get token
  async getToken() {
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      console.log('🔐 [AUTH] getToken - Retrieved from storage:', token ? `YES (length: ${token.length})` : 'NO');
      if (token) {
        console.log('🔐 [AUTH] getToken - Token preview:', token.substring(0, 30) + '...' + token.substring(token.length - 30));
      }
      return token;
    } catch (error) {
      console.error('🔐 [AUTH] getToken - Error:', error);
      return null;
    }
  }

  // Get user
  async getUser() {
    try {
      const user = await AsyncStorage.getItem(USER_KEY);
      return user ? JSON.parse(user) : null;
    } catch (error) {
      console.error('Error getting user:', error);
      return null;
    }
  }

  // Check if logged in
  async isLoggedIn() {
    const token = await this.getToken();
    return !!token && !this.isTokenExpired(token);
  }

  // Check if token is expired
  isTokenExpired(token) {
    if (!token) {
      console.log('🔐 [AUTH] isTokenExpired - No token provided');
      return true;
    }
    try {
      const decoded = jwtDecode(token);
      console.log('🔐 [AUTH] isTokenExpired - Decoded token:', {
        exp: decoded.exp,
        dataExp: decoded.data?.exp,
        iat: decoded.iat,
        data: decoded.data ? Object.keys(decoded.data) : 'N/A',
      });
      
      const exp = decoded.exp || decoded.data?.exp;
      if (!exp) {
        console.log('🔐 [AUTH] isTokenExpired - No expiration found, considering valid');
        return false; // If no expiration, consider it valid
      }
      
      const expDate = new Date(exp * 1000);
      const now = Date.now();
      const isExpired = now >= exp * 1000;
      
      console.log('🔐 [AUTH] isTokenExpired - Expiration check:', {
        expTimestamp: exp,
        expDate: expDate.toISOString(),
        currentTimestamp: now,
        currentDate: new Date().toISOString(),
        isExpired,
        timeUntilExpiry: isExpired ? 'EXPIRED' : `${Math.floor((exp * 1000 - now) / 1000)} seconds`,
      });
      
      return isExpired;
    } catch (error) {
      console.error('🔐 [AUTH] isTokenExpired - Error decoding token:', error);
      console.error('🔐 [AUTH] isTokenExpired - Token that failed:', token.substring(0, 50) + '...');
      return true; // If we can't decode, consider it expired
    }
  }

  // Get token profile/decoded data
  getProfile(token) {
    if (!token) return null;
    try {
      const decoded = jwtDecode(token);
      return decoded.data || decoded;
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }

  // Clear auth data
  async clearAuth() {
    try {
      await AsyncStorage.removeItem(TOKEN_KEY);
      await AsyncStorage.removeItem(USER_KEY);
    } catch (error) {
      console.error('Error clearing auth data:', error);
    }
  }

  // Check and refresh token if needed (redirects to login if expired)
  async ensureValidToken() {
    const token = await this.getToken();
    console.log('🔐 [AUTH] ensureValidToken - Token exists?', !!token);
    
    if (!token) {
      console.log('🔐 [AUTH] ensureValidToken - No token found');
      return null;
    }
    
    const isExpired = this.isTokenExpired(token);
    console.log('🔐 [AUTH] ensureValidToken - Token expired?', isExpired);
    
    if (isExpired) {
      console.log('🔐 [AUTH] ensureValidToken - Token expired or missing, clearing auth...');
      const decoded = this.getProfile(token);
      if (decoded?.exp) {
        const expDate = new Date(decoded.exp * 1000);
        console.log('🔐 [AUTH] ensureValidToken - Token expired at:', expDate.toISOString());
        console.log('🔐 [AUTH] ensureValidToken - Current time:', new Date().toISOString());
        console.log('🔐 [AUTH] ensureValidToken - Time difference (ms):', Date.now() - (decoded.exp * 1000));
      }
      await this.clearAuth();
      return null;
    }
    
    console.log('🔐 [AUTH] ensureValidToken - Token is valid');
    return token;
  }

  // ========== INBOX METHODS ==========

  /**
   * Get user's inbox messages
   * @param {string} type - Filter by message type (EMAIL, SMS, PUSH)
   * @param {boolean} read - Filter by read status
   * @returns {Promise<Object>} - { messages: [], total: number, unreadCount: number }
   */
  async getInbox(type = null, read = null) {
    try {
      const params = {};
      if (type) params.type = type;
      if (read !== null) params.read = read;

      const response = await axios.get(`${API_URL}/inbox`, { params });

      if (response.data.success) {
        return response.data.payload;
      } else {
        throw new Error(response.data.message || 'Failed to fetch inbox');
      }
    } catch (error) {
      console.error('🔴 AuthService: Get inbox error:', error);
      throw error.response?.data?.message || error.message || 'Failed to fetch inbox';
    }
  }

  /**
   * Get single inbox message details
   * @param {string} id - Message ID
   * @returns {Promise<Object>} - Message object
   */
  async getMessage(id) {
    try {
      const response = await axios.get(`${API_URL}/inbox/${id}`);

      if (response.data.success) {
        return response.data.payload;
      } else {
        throw new Error(response.data.message || 'Failed to fetch message');
      }
    } catch (error) {
      console.error('🔴 AuthService: Get message error:', error);
      throw error.response?.data?.message || error.message || 'Failed to fetch message';
    }
  }

  /**
   * Mark message as read
   * @param {string} id - Message ID
   * @returns {Promise<boolean>}
   */
  async markMessageAsRead(id) {
    try {
      const response = await axios.put(`${API_URL}/inbox/${id}/read`);

      if (response.data.success) {
        return true;
      } else {
        throw new Error(response.data.message || 'Failed to mark as read');
      }
    } catch (error) {
      console.error('🔴 AuthService: Mark read error:', error);
      throw error.response?.data?.message || error.message || 'Failed to mark as read';
    }
  }

  /**
   * Mark message as unread
   * @param {string} id - Message ID
   * @returns {Promise<boolean>}
   */
  async markMessageAsUnread(id) {
    try {
      const response = await axios.put(`${API_URL}/inbox/${id}/unread`);

      if (response.data.success) {
        return true;
      } else {
        throw new Error(response.data.message || 'Failed to mark as unread');
      }
    } catch (error) {
      console.error('🔴 AuthService: Mark unread error:', error);
      throw error.response?.data?.message || error.message || 'Failed to mark as unread';
    }
  }

  /**
   * Delete message (soft delete)
   * @param {string} id - Message ID
   * @returns {Promise<boolean>}
   */
  async deleteMessage(id) {
    try {
      const response = await axios.delete(`${API_URL}/inbox/${id}`);

      if (response.data.success) {
        return true;
      } else {
        throw new Error(response.data.message || 'Failed to delete message');
      }
    } catch (error) {
      console.error('🔴 AuthService: Delete message error:', error);
      throw error.response?.data?.message || error.message || 'Failed to delete message';
    }
  }

  /**
   * Mark all messages as read
   * @returns {Promise<boolean>}
   */
  async markAllMessagesAsRead() {
    try {
      const response = await axios.post(`${API_URL}/inbox/mark-all-read`);

      if (response.data.success) {
        return true;
      } else {
        throw new Error(response.data.message || 'Failed to mark all as read');
      }
    } catch (error) {
      console.error('🔴 AuthService: Mark all read error:', error);
      throw error.response?.data?.message || error.message || 'Failed to mark all as read';
    }
  }
}

// Create instance
const authService = new AuthService();

// Setup axios interceptor for automatic token refresh handling
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  failedQueue = [];
};

// Request interceptor - add token to headers
axios.interceptors.request.use(
  async (config) => {
    // Skip token check for login/register/forgot-password endpoints
    if (config.url?.includes('/login') || 
        config.url?.includes('/register') || 
        config.url?.includes('/forgot-password')) {
      console.log('🔵 [AXIOS REQUEST] Skipping token for:', config.url);
      return config;
    }

    console.log('🔵 [AXIOS REQUEST] Starting request to:', config.url);
    console.log('🔵 [AXIOS REQUEST] Method:', config.method?.toUpperCase());
    console.log('🔵 [AXIOS REQUEST] Base URL:', config.baseURL);
    console.log('🔵 [AXIOS REQUEST] Full URL:', config.url);
    console.log('🔵 [AXIOS REQUEST] Query params:', config.params);
    console.log('🔵 [AXIOS REQUEST] Request data:', config.data);

    const rawToken = await authService.getToken();
    console.log('🔵 [AXIOS REQUEST] Raw token from storage:', rawToken ? `YES (length: ${rawToken.length})` : 'NO');
    if (rawToken) {
      console.log('🔵 [AXIOS REQUEST] Token preview:', rawToken.substring(0, 20) + '...' + rawToken.substring(rawToken.length - 20));
      
      // Check if token is expired
      const isExpired = authService.isTokenExpired(rawToken);
      console.log('🔵 [AXIOS REQUEST] Token expired?', isExpired);
      
      if (!isExpired) {
        try {
          const decoded = authService.getProfile(rawToken);
          console.log('🔵 [AXIOS REQUEST] Token decoded successfully:', {
            id: decoded?.id,
            email: decoded?.email,
            role: decoded?.role,
            exp: decoded?.exp,
            expDate: decoded?.exp ? new Date(decoded.exp * 1000).toISOString() : 'N/A',
          });
        } catch (e) {
          console.error('🔵 [AXIOS REQUEST] Error decoding token:', e);
        }
      }
    }

    const token = await authService.ensureValidToken();
    console.log('🔵 [AXIOS REQUEST] Valid token available?', token ? 'YES' : 'NO');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('🔵 [AXIOS REQUEST] Authorization header set:', `Bearer ${token.substring(0, 20)}...`);
    } else {
      // Token is expired or missing - this will be handled by response interceptor
      console.warn('🔵 [AXIOS REQUEST] No valid token available for request');
    }
    
    console.log('🔵 [AXIOS REQUEST] Final headers:', {
      ...config.headers,
      Authorization: config.headers.Authorization ? `${config.headers.Authorization.substring(0, 30)}...` : 'NOT SET',
    });
    
    return config;
  },
  (error) => {
    console.error('🔴 [AXIOS REQUEST ERROR]', error);
    return Promise.reject(error);
  }
);

// Response interceptor - handle 401 errors
axios.interceptors.response.use(
  (response) => {
    console.log('🟢 [AXIOS RESPONSE] Success:', {
      url: response.config.url,
      status: response.status,
      statusText: response.statusText,
      dataKeys: response.data ? Object.keys(response.data) : 'N/A',
    });
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    console.log('🔴 [AXIOS RESPONSE ERROR]', {
      url: originalRequest?.url,
      method: originalRequest?.method,
      status: error.response?.status,
      statusText: error.response?.statusText,
      message: error.message,
      responseData: error.response?.data,
      headers: error.response?.headers,
    });

    // If error is 401 and we haven't already tried to refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(token => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return axios(originalRequest);
          })
          .catch(err => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      // Clear auth and return error - user needs to login again
      // (No refresh token endpoint available)
      console.log('401 Unauthorized - Clearing auth and redirecting to login');
      await authService.clearAuth();
      authService.navigateToLogin();
      processQueue(new Error('Token expired. Please login again.'), null);
      isRefreshing = false;

      // Return the original error - the component should handle redirecting to login
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);

export default authService;
