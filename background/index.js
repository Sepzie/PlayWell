const { startTracking, stopTracking } = require('./gameTracker.js');
const { connectDb, disconnectDb } = require('./dbService.js');

function startBackground() {
  console.log('Starting background process...');
  
  // TODO: Wire gameTracker + dbService later
  // For now, just placeholder initialization
  
  // Example of how this will be wired later:
  // connectDb();
  // startTracking();
  
  console.log('Background process started (placeholder)');
}

function stopBackground() {
  console.log('Stopping background process...');
  
  // TODO: Implement proper cleanup
  // stopTracking();
  // disconnectDb();
  
  console.log('Background process stopped (placeholder)');
}

module.exports = { startBackground, stopBackground };

