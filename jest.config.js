export default {
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/__tests__/**/*.js', '**/?(*.)+(spec|test).js'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/server.js',
    '!src/configs/**',
    '!src/providers/**',
    '!src/sockets/**',
    '!**/node_modules/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  verbose: true,
  testTimeout: 30000,
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  moduleNameMapper: {
    '^#configs/(.*)$': '<rootDir>/src/configs/$1',
    '^#constants/(.*)$': '<rootDir>/src/constants/$1',
    '^#controllers/(.*)$': '<rootDir>/src/controllers/$1',
    '^#middlewares/(.*)$': '<rootDir>/src/middlewares/$1',
    '^#models/(.*)$': '<rootDir>/src/models/$1',
    '^#providers/(.*)$': '<rootDir>/src/providers/$1',
    '^#repositories/(.*)$': '<rootDir>/src/repositories/$1',
    '^#routes/(.*)$': '<rootDir>/src/routes/$1',
    '^#services/(.*)$': '<rootDir>/src/services/$1',
    '^#sockets/(.*)$': '<rootDir>/src/sockets/$1',
    '^#utils/(.*)$': '<rootDir>/src/utils/$1',
    '^#validations/(.*)$': '<rootDir>/src/validations/$1'
  },
  transform: {},
  globalSetup: '<rootDir>/tests/globalSetup.js',
  globalTeardown: '<rootDir>/tests/globalTeardown.js'
}
