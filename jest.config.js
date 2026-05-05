// jest.config.js
export default {
  testEnvironment: 'node',
  transform: {},
  testMatch: ['**/tests/**/*.test.js'],
  setupFiles: ['./tests/env.js', './tests/setup.js'],
  coverageThreshold: {
    global: {
      lines: 70,
      functions: 70,
      branches: 70,
      statements: 70,
    },
  },
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/tests/',
    'src/services/pdf.service.js',
    'src/services/notification.service.js',
    'src/services/storage.service.js',
  ],
};;
