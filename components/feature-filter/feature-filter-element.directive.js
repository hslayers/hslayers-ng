export default ['config', '$compile', function (config, $compile) {
    // console.log($state);
    return {
        // templateUrl: `${config.hsl_path}components/feature-filter/partials/${$state.type}${config.design || ''}.html`,
        template: '<ng-include src="getTemplateUrl()"/>',
        scope: {
            filter: "="
        },
        // link: function(scope, element, attrs) {
        //     element.html(`${hsl_path}components/feature-filter/partials/${scope.filter.type}${config.design || ''}.html`).show();
        //     $compile(element.contents())(scope);
        // },
        controller: function ($scope) {
            $scope.getTemplateUrl = function () {
                if (config.design == 'md') {
                    switch ($scope.filter.type) {
                        case 'fieldset':
                            return `components/feature-filter/partials/fieldsetmd.html`;
                        case 'slider':
                            return `components/feature-filter/partials/slidermd.html`;
                    }

                } else {
                    switch ($scope.filter.type) {
                        case 'fieldset':
                            return `components/feature-filter/partials/fieldset.html`;
                        case 'slider':
                            return `components/feature-filter/partials/slider.html`;
                    }
                }

            };
        },
        // templateUrl: function(el, attrs) {
        //     return `${config.hsl_path}components/feature-filter/partials/${attrs.filter.type}md.html`
        // },
        // link: function(scope, element, attrs) {
        //     scope.filter = scope.$eval(attrs.filter);
        // },
        // template: require('components/feature-filter/partials/{{filter.type}}md.html'),
    };
}]