// Configuration for Mobile App
// IMPORTANT: Update these URLs based on your environment

// For local development on physical device or emulator:
// 1. Find your computer's IP address:
//    - Mac/Linux: Open Terminal and run: ifconfig | grep "inet "
//    - Windows: Open Command Prompt and run: ipconfig
//    - Look for something like: 192.168.1.100 or 10.0.0.5
//
// 2. Replace 'localhost' below with your IP address
// 3. Make sure your server and web client are running
// 4. Make sure your phone/emulator is on the same network

const Config = {
  // Backend API URL - where your Express server is running
  // IMPORTANT: Replace with your computer's IP address (found below)
  API_URL: "http://192.168.1.8:3001/mobile",

  // Web App URL - where your React web client is running
  // IMPORTANT: Replace with your computer's IP address (found below)
  WEB_APP_URL: "http://192.168.1.8:3002",

  // Your computer's IP address is: 192.168.1.8
  // If this doesn't work, find it manually:
  // - Mac/Linux: ifconfig | grep "inet "
  // - Windows: ipconfig

  // Production URLs (uncomment when deploying):
  // API_URL: 'https://api.swastikdance.com.au/mobile',
  // WEB_APP_URL: 'https://app.swastikdance.com.au',
};

export default Config;
