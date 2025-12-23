const debug_colors = {
  reset: '\x1b[0m',
  err: '\x1b[31m',
  proctracker: '\x1b[36m', // cyan, for background processes
  repo: '\x1b[35m', // purple, for database connected modules
  server: '\x1b[33m', // yellow, for server control processes
  service: '\x1b[32m', // green, for service layer modules
};

module.exports = { debug_colors };
