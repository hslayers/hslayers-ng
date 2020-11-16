import '../app.module';
let context = require.context('./', true, /\.spec\.ts/);
context.keys().forEach(context);

context = require.context('../components', true, /\.spec\.ts/);
context.keys().forEach(context);
