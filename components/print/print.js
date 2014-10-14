angular.module('hs.print', [])
    .directive('printdialog', function() {
        return {
            templateUrl: 'components/print/partials/printdialog.html'
        };
    })

.controller('Print', ['$scope',
    function($scope) {
        $scope.canvas_serialized = "";
        $scope.print_visible = false;
        
        $scope.showPrint = function(){
            $scope.print_visible = !$scope.print_visible;
        }
        
        $scope.print = function(){
                var canvas = canvas=document.getElementsByTagName("canvas")[0];
                 var win=window.open();
                 win.document.write("<h2>"+$scope.title+"</h2>");
                 win.document.write("<br><img src='"+canvas.toDataURL()+"'/>");
                 win.print();
                 win.location.reload();
        }
    }
]);