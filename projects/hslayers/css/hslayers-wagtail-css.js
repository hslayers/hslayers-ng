/**
 * This script compiles the HSLayers SCSS file to CSS without the Bootstrap imports and FONT AWESOME ICONS.
 * This setup is necessary for the use on the Wagtail (preventing bootstrap duplication, icon overriding)
 * The compiled CSS is saved to the dist folder.
 */
const fs = require('fs');
const path = require('path');
const sass = require('sass');

// Paths to your SCSS files
const inputFilePath = path.resolve(__dirname, './hslayers-ng.scss');
const outputCssFilePath = path.resolve('dist/hslayers/css/hslayers-ng-wagtail.css');


// Function to remove specific lines from the content
function removeLines(content, startLine, endLine) {
  const lines = content.split('\n');
  // Adjust for zero-based index
  lines.splice(startLine - 1, endLine - startLine + 1);
  return lines.join('\n');
}

const data = fs.readFileSync(inputFilePath,
  { encoding: 'utf8', flag: 'r' });

// Remove the lines containing Bootstrap imports
let modifiedContent = removeLines(data, 33, 68); //Components
modifiedContent = removeLines(modifiedContent, 16, 20); //Maps, mixins etx
modifiedContent = removeLines(modifiedContent, 2, 3) //ICONS

// Compile the modified SCSS content to CSS
const result = sass.compileString(modifiedContent, {
  loadPaths: [
    'node_modules', // Load path for Sass to find Bootstrap in node_modules
    path.resolve(__dirname) // Ensure the script's directory is in the load paths
  ],
  outputStyle: 'compressed',
});

// Write the compiled CSS to the output file
fs.writeFileSync(outputCssFilePath, result.css);
console.log('CSS file compiled successfully without Bootstrap imports!');
