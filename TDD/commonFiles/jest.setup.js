// jest.setup.js
const dotenv = require("dotenv");

// Load the test-specific environment variables
dotenv.config({ path: "./.env.test" });

// Global Mocking (Optional)
// Example: Silence console.log during tests so your terminal stays clean
global.console = {
  ...console,
  log: jest.fn(), // Mock log to do nothing
  error: console.error, // Keep errors visible
};
