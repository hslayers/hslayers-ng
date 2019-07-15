export default ['config', function (config) {
    return {
        template: require('components/compositions/partials/dialog_share.html'),
        link: function (scope, element, attrs) {
            scope.shareModalVisible = true;
        }
    };
}]