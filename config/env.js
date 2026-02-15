/**
 * Environment configuration validation
 * Ensures required env vars are present before server starts
 */

const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET'];

function validateEnv() {
  const missing = requiredEnvVars.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    console.error('Missing required environment variables:', missing.join(', '));
    process.exit(1);
  }
}

module.exports = { validateEnv };
