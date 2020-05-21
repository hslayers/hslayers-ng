var fs = require('fs');
var postcss = require('postcss');
var prefixer = require('postcss-prefix-selector');

var css = fs.readFileSync('node_modules/bootstrap/dist/css/bootstrap.css', 'utf8').toString();

var out = postcss()
    .use(prefixer({
        prefix: '.bsi'
    }))
    .process(css).then(function (result) {
        fs.writeFileSync('node_modules/bootstrap/dist/css/bootstrap.isolated.css', result.css);
        console.log('bootstrap.isolated.css file created in node_modules/bootstrap/dist/css directory');
    })


