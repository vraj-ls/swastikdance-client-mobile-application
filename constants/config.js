/**
 * Application configuration constants
 */

// S3 bucket URL for media assets
export const S3_BUCKET_URL = "https://swastikdance-app-bucket.s3.ap-southeast-2.amazonaws.com";

// Server URLs
export const API_URL =
  "https://server-swastikdance.asterisk.logicsync.net/mobile";
export const WEB_APP_URL = "https://customer-swastikdance.appunder.dev";
// export const WEB_APP_URL = "http://192.168.1.11:3002";
// export const API_URL = "http://192.168.1.11:3001/mobile";

// 192.168.1.5
// API endpoints
export const API_ENDPOINTS = {
  LOGIN: "/login",
  REGISTER: "/register",
  FORGOT_PASSWORD: "/forgot-password",
  CHANGE_PASSWORD: "/change-password",
  PROFILE: "/profile",
  STUDENTS: "/students",
  AWAITING_PAYMENTS: "/awaiting-payments",
  TRANSACTIONS: "/transactions",
  NOTIFICATIONS: "/notifications",
};

// Refresh intervals (in milliseconds)
export const REFRESH_INTERVALS = {
  DASHBOARD: 60000, // 1 minute
  NOTIFICATIONS: 30000, // 30 seconds
};

// Pagination
export const PAGINATION = {
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
  AWAITING_PAYMENTS_LIMIT: 5,
};

// Validation
export const VALIDATION = {
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 128,
  NAME_MAX_LENGTH: 50,
  EMAIL_MAX_LENGTH: 255,
  PHONE_MIN_LENGTH: 8,
  PHONE_MAX_LENGTH: 10,
  MIN_AGE: 0,
  MAX_AGE: 120,
};

// Transaction types
export const TRANSACTION_TYPES = {
  ENROLMENT: "Enrolment",
  PASS: "Pass",
  ORDER: "Order",
  ADMISSION: "Admission",
};

// Route titles for WebView
export const ROUTE_TITLES = {
  "/enrolment": "Class Enrolment",
  "/pass": "Class Pass",
  "/order": "Products Order",
  "/admission": "Workshop Admission",
  "/transactions": "Transactions",
  "": "Swastik Dance",
};

// Gender options
export const GENDER_OPTIONS = ["Female", "Male"];

// HTTP status codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
};

// Storage keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: "auth_token",
  USER_PROFILE: "auth_user",
  FCM_TOKEN: "fcm_token",
  DEVICE_TOKEN: "deviceToken",
};

// Platform-specific constants
export const PLATFORM_CONSTANTS = {
  TAB_BAR_HEIGHT_IOS: 49,
  TAB_BAR_HEIGHT_ANDROID: 56,
  FAB_OFFSET: 32,
};
