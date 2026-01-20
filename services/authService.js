import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Config from '../config';

const API_URL = Config.API_URL;

// Storage keys
const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

class AuthService {
  // Login
  async login(email, password, role = 'customer') {
    try {
      console.log('AuthService: Making login request to:', `${API_URL}/login`);
      console.log('AuthService: Request data:', { email, role });

      const response = await axios.post(`${API_URL}/login`, {
        email,
        password,
        role,
      });

      console.log('AuthService: Response status:', response.status);
      console.log('AuthService: Response data:', JSON.stringify(response.data, null, 2));

      if (response.data.success) {
        const { token, user } = response.data.payload;
        console.log('AuthService: Storing token and user...');
        await this.storeAuth(token, user);
        console.log('AuthService: Token and user stored successfully');
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

  // Logout
  async logout() {
    try {
      await axios.post(`${API_URL}/logout`);
    } catch (error) {
      console.log('Logout API error:', error);
    } finally {
      await this.clearAuth();
    }
  }

  // Store auth data
  async storeAuth(token, user) {
    try {
      console.log('AuthService: Storing token to AsyncStorage...');
      await AsyncStorage.setItem(TOKEN_KEY, token);
      console.log('AuthService: Token stored successfully');

      console.log('AuthService: Storing user to AsyncStorage...');
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
      console.log('AuthService: User stored successfully');

      // Verify storage
      const storedToken = await AsyncStorage.getItem(TOKEN_KEY);
      const storedUser = await AsyncStorage.getItem(USER_KEY);
      console.log('AuthService: Verification - Token stored:', !!storedToken);
      console.log('AuthService: Verification - User stored:', !!storedUser);
    } catch (error) {
      console.error('AuthService: Error storing auth data:', error);
      throw error;
    }
  }

  // Get token
  async getToken() {
    try {
      return await AsyncStorage.getItem(TOKEN_KEY);
    } catch (error) {
      console.error('Error getting token:', error);
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
    return !!token;
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
}

export default new AuthService();
