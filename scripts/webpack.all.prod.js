const bootstrapConfig = require('./webpack.prod');
const materialConfig = require('./webpack.material.prod');

module.exports = [
    bootstrapConfig, materialConfig      
];