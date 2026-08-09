/**
 * cPanel Passenger Entry Point Wrapper
 * ---------------------------------------------------------
 * Bypasses Passenger's strict CommonJS require() limitation by 
 * dynamically importing the ES Module index.js bundle.
 */
(async () => {
  try {
    await import('./index.js');
  } catch (error) {
    console.error('🔥 Passenger ES Module Import Failure:', error);
  }
})();
