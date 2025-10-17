const colors = {
  primary: "#2E7D32",   // green
  primaryAccent: "#81C784",
  danger: "#C62828",
  warning: "#ED6C02",
  surface: "#0F1A13",
  surfaceAlt: "#1E2A22",
  text: "#E8F5E9",
  muted: "#9E9E9E"
};

const debug_colors = {
  reset: '\x1b[0m',
  err: '\x1b[31m',
  proctracker: '\x1b[36m', // cyan, for background processes
  repo: '\x1b[35m', // purple, for database connected modules
  server: '\x1b[33m', // yellow, for server control processes
};

module.exports = {colors, debug_colors};


