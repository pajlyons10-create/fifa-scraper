const { join } = require('path');

/**
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
  // Forces Puppeteer to install Chrome directly inside your project folder
  cacheDirectory: join(__dirname, '.cache', 'puppeteer'),
};
