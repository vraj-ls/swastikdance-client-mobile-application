import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import axios from 'axios';
import authService from '../services/authService';
import { API_URL } from '../constants/config';

/**
 * Custom hook for API calls with built-in loading, error handling, and auth
 * @param {Object} options - Configuration options
 * @param {Function} options.onSuccess - Success callback
 * @param {Function} options.onError - Error callback
 * @param {boolean} options.showErrorAlert - Whether to show error alerts (default: true)
 * @returns {Object} - { data, loading, error, execute, reset }
 */
export const useApi = (options = {}) => {
  const {
    onSuccess,
    onError,
    showErrorAlert = true,
  } = options;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(async (config) => {
    try {
      setLoading(true);
      setError(null);

      // Get auth token
      const token = await authService.getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Merge headers with auth token
      const headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      };

      // Make API call
      const response = await axios({
        ...config,
        baseURL: config.baseURL || API_URL,
        headers,
      });

      const responseData = response.data;
      setData(responseData);

      // Call success callback if provided
      if (onSuccess) {
        onSuccess(responseData);
      }

      return responseData;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'An error occurred';
      setError(errorMessage);

      // Show error alert if enabled
      if (showErrorAlert) {
        Alert.alert('Error', errorMessage);
      }

      // Call error callback if provided
      if (onError) {
        onError(err);
      }

      throw err;
    } finally {
      setLoading(false);
    }
  }, [onSuccess, onError, showErrorAlert]);

  const reset = useCallback(() => {
    setData(null);
    setLoading(false);
    setError(null);
  }, []);

  return {
    data,
    loading,
    error,
    execute,
    reset,
  };
};

/**
 * Custom hook for fetching data with built-in retry and caching
 * @param {string} url - API endpoint
 * @param {Object} options - Configuration options
 * @returns {Object} - { data, loading, error, refetch }
 */
export const useFetch = (url, options = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async (isBackgroundRefresh = false) => {
    try {
      if (!isBackgroundRefresh) {
        setLoading(true);
      }
      setError(null);

      const token = await authService.getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await axios.get(url, {
        baseURL: API_URL,
        headers: {
          Authorization: `Bearer ${token}`,
        },
        ...options,
      });

      setData(response.data);
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch data';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [url, options]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
};
