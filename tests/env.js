// tests/env.js
process.env.MONGODB_URI = 'mongodb://localhost/test_ignored';
process.env.JWT_SECRET = 'test_secret_key_that_is_long_enough_123';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_key_that_is_long_enough_123';
process.env.JWT_EXPIRES_IN = '1d';
process.env.JWT_REFRESH_EXPIRES_IN = '7d';
