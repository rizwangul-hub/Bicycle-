/**
 * Vercel Serverless Function Entry Point
 * Pixx Bicycle Owner's Declaration System — Backend API
 *
 * Directly exports the Express application instance as required by Vercel Node runtime.
 */
require('dotenv').config();

const app = require('../src/app');

module.exports = app;
