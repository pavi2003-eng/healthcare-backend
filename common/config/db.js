const mongoose = require('mongoose');

const connections = {};

/**
 * Returns a Mongoose connection for the given module name.
 * If a connection doesn't exist yet, it creates one.
 * The database URI can be overridden via environment variable:
 *   MONGO_URI_HEALTHCARE, MONGO_URI_STUDENT, etc.
 *
 * @param {string} moduleName - e.g., 'healthcare', 'student'
 * @returns {mongoose.Connection} Mongoose connection object
 */
const getDatabaseConnection = (moduleName) => {
  if (connections[moduleName]) {
    return connections[moduleName];
  }

  // Allow per‑module URI via environment variables
  const uriEnvVar = `MONGO_URI_${moduleName.toUpperCase()}`;
  const mongoURI = process.env[uriEnvVar] || `mongodb://127.0.0.1:27017/${moduleName}`;

  const conn = mongoose.createConnection(mongoURI);
  connections[moduleName] = conn;

  conn.on('connected', () => {
    console.log(`MongoDB connected: ${moduleName} (${mongoURI})`);
  });

  conn.on('error', (err) => {
    console.error(`MongoDB connection error (${moduleName}):`, err);
  });

  return conn;
};

module.exports = { getDatabaseConnection };