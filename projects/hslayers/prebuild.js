const util = require('util');
const fs = require('fs');
const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);

/**
 *
 */
async function copyPackageJson() {
  // File destination.txt will be created or overwritten by default.
  const packageJson = JSON.parse(
    await readFile('projects/hslayers/package.json', 'utf8')
  );
  delete packageJson.peerDependencies;
  delete packageJson.scripts;
  delete packageJson.devDependencies;
  delete packageJson.dependencies;
  await writeFile(
    'projects/hslayers/src/package.json',
    JSON.stringify(packageJson, '', 2)
  );
  console.log('package.json was stripped and copied to src');
}

copyPackageJson();
