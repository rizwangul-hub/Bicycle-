/**
 * Vercel Serverless Function Entry Point
 * Pixx Bicycle Owner's Declaration System — Backend API
 *
 * Directly exports the Express application instance as required by Vercel Node runtime.
 */
require('dotenv').config();

// Ensure Vercel Serverless File Trace bundles PDFKit standard fonts
try {
  require('pdfkit/standard-fonts/Helvetica');
  require('pdfkit/standard-fonts/HelveticaBold');
  require('pdfkit/standard-fonts/Courier');
  require('pdfkit/standard-fonts/TimesRoman');
} catch (e) {
  // Traced at build-time by @vercel/nft
}

const app = require('../src/app');

module.exports = app;
