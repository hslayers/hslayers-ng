export default ['config', function (config) {
    return {
        template: require('components/query/partials/infopanelmd.html'),
        // templateUrl: config.infopanel_template || `${config.hsl_path}components/layout/partials/infopanel${config.design || ''}.html`,
    };
}]