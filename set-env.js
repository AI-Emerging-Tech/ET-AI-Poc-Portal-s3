// set-env.js
const fs = require('fs');
const os = require('os');
const path = require('path');

// Get the current Linux username
const linuxUser = os.userInfo().username;

// Create the REACT_APP_API_BASE_URL environment variable
const envContent = `NEXT_PUBLIC_USERNAME=${linuxUser}`;

// Write the environment variable to a .env file
fs.writeFileSync(path.join(__dirname, '.env.local'), envContent);