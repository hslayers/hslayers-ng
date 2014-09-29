'use strict';

angular.module('hs', [
    'ngRoute',
    'hs.layermanager',
    'hs.map',
    'hs.ows',
    'hs.query',
    'hs.search',
    'hs.print',
    'hs.permalink',
    'hs.lodexplorer',
    'hs.toolbar'
]).controller('Main', ['$scope', 'ToolbarService',
    function($scope, ToolbarService) {
       console.log("Main called");
       $scope.ToolbarService = ToolbarService;
    }
]);;