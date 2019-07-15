export default ['config', function (config) {
    return {
        template: require('components/layermanager/partials/dialog_removeall.html'),
        link: function (scope, element, attrs) {
            scope.removeAllModalVisible = true;
        }
    };
}]