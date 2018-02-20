var through = require('through2');

module.exports = function (file) {
    return through(function (buf, enc, next) {
        var file_contents = buf.toString('utf8');
        if(file_contents.indexOf('var hsl_path')>-1){
            
        }
        this.push(file_contents.replace("require(['core'], function(app) {", "require('../../components/core/core', function(app) {"));
        next();
    });
};
