const fs = require('fs');
const path = require('path');
const sass = require('sass');

// Paths to your SCSS files
const inputFilePath = path.resolve(__dirname, './hslayers-ng.scss');
const outputCssFilePath = path.resolve('dist/hslayers/css/hslayers-ng-wo-bootstrap.css');

// Define the range of lines to remove (e.g., lines 41 to 75)
const linesToRemoveStart = 29;
const linesToRemoveEnd = 64;

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
let modifiedContent = removeLines(data, linesToRemoveStart, linesToRemoveEnd);

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
