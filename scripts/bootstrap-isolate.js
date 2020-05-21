const fs = require('fs');
const postcss = require('postcss');
const prefixer = require('postcss-prefix-selector');

const css = fs
  .readFileSync('node_modules/bootstrap/dist/css/bootstrap.css', 'utf8')
  .toString();

const out = postcss()
  .use(
    prefixer({
      prefix: '.bsi',
    })
  )
  .process(css, {from: undefined})
  .then((result) => {
    fs.writeFileSync(
      'node_modules/bootstrap/dist/css/bootstrap.isolated.css',
      result.css
    );
    console.log(
      'bootstrap.isolated.css file created in node_modules/bootstrap/dist/css directory'
    );
  });
