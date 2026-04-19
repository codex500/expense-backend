/**
 * Failsafe entry point for cloud deployments (Render/Heroku/etc)
 * Proxies the request to the compiled dist/index.js
 */
require('./dist/index.js');
