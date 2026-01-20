// jest.config.js
module.exports = {
  // 1. The Environment
  testEnvironment: "node", // Use 'jsdom' if testing Frontend (React/Vue)

  // 2. Setup Files
  // Run this file BEFORE every single test file.
  // Good for connecting to a Test DB or loading .env.test
  setupFilesAfterEnv: ["./jest.setup.js"],

  // 3. Coverage
  // If true, it generates a report showing which lines of code aren't tested
  collectCoverage: true,
  coverageDirectory: "coverage",

  // 4. Ignore these folders (don't test node_modules)
  testPathIgnorePatterns: ["/node_modules/"],

  // 5. Timeout
  // If a test takes longer than 10s, fail it (default is 5s)
  testTimeout: 10000,
};
