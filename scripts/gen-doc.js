/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require('fs');
const path = require('path');
// 'handlebars' and 'marked' are dependencies of 'compodoc'
// so as long as we use compodoc
// these are installed in node_modules automagically
const Handlebars = require('handlebars');
const marked = require('marked');

// Load README.md
const readmeMd = fs.readFileSync(
  path.resolve(__dirname, '../README.md'),
  'utf-8'
);

// Parse Markdown syntax to HTML syntax
const readmeHtml = marked.marked(readmeMd);

// Load Handlebars-style template to be filled
const index = fs.readFileSync(
  path.resolve(__dirname, './docs_index_template.html'),
  'utf-8'
);

// Compile Handlebars-style template to function
const indexTemplate = Handlebars.compile(index, {
  preventIndent: true,
  noEscape: true,
  strict: true,
});

// Fill-in the index template with readme
const indexExtended = indexTemplate({'readme': readmeHtml});

// Save the filled-in index to drive
fs.writeFileSync(path.resolve(__dirname, '../docs/index.html'), indexExtended);

console.log('Documentation common homepage generated');
