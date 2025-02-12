const { execSync } = require('child_process');
const path = require('path');

// Paths relative to test-app directory
const ICONS_FILE = path.join(__dirname, './custom-icons.txt');
const OUTPUT_FILE = path.join(__dirname, './custom-fa-icons.css');
const SCRIPT_PATH = path.join(__dirname, '../../dist/hslayers/css/icons/create-fa-icons.py');

try {
  console.log('Generating custom Font Awesome icons subset...');

  // Run the Python script
  const command = `python "${SCRIPT_PATH}" --icons-file "${ICONS_FILE}" --output-file "${OUTPUT_FILE}"`;
  execSync(command, { stdio: 'inherit' });

  console.log('\nDone! To use the custom icons:');
  console.log('1. Import the generated CSS in your styles.scss:');
  console.log('@use "./custom-fa-icons.css";');

} catch (error) {
  console.error('Error generating icons:', error.message);
  process.exit(1);
} 
