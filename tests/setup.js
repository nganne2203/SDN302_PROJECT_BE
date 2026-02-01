import mongoose from 'mongoose'

// Setup before all tests
beforeAll(async () => {
  // Connection already set in globalSetup
})

// Cleanup after each test
afterEach(async () => {
  const collections = mongoose.connection.collections
  for (const key in collections) {
    await collections[key].deleteMany({})
  }
})

// Cleanup after all tests
afterAll(async () => {
  await mongoose.connection.close()
})

// Suppress console logs during tests (optional)
// Note: Uncomment if you want to suppress logs
/*
const originalConsole = global.console
global.console = {
  ...console,
  log: () => {},
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: originalConsole.error // Keep error for debugging
}
*/
