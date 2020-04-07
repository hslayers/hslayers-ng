export default [
  'config',
  function (config) {
    return {
      replace: true,
      template: require('./partials/right-panel.html'),
    };
  },
];
