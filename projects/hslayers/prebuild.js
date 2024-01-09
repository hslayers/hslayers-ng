const util = require('util');
const fs = require('fs');
const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);

/**
 *
 */
async function changeImpressumHslVersion() {
  // File destination.txt will be created or overwritten by default.
  const packageJson = JSON.parse(
    await readFile('projects/hslayers/package.json', 'utf8')
  );

  let impressumSrc = await readFile('projects/hslayers/components/sidebar/impressum.component.ts', 'utf8')

  impressumSrc = impressumSrc.replace(/this.version.=.'.*?'/, `this.version = '${packageJson.version}\'`);
  await writeFile(
    'projects/hslayers/components/sidebar/impressum.component.ts',
    impressumSrc
  );
}

changeImpressumHslVersion();
