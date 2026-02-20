// src/common/utils/asyncHandler.js
/**
 * Wraps an async route handler to eliminate try/catch blocks.
 * Any rejected promise will be forwarded to Express error handler.
 *
 * @param {Function} fn - Async controller function
 * @returns {Function} Express middleware function
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;