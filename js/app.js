'use strict';

angular.module('hs', [
    'ngRoute',
    'hs.layermanager',
    'hs.map',
    'hs.ows',
    'hs.query',
    'hs.print',
    'hs.permalink'
]).controller('Main', ['$scope',
    function($scope) {
       console.log("Main called");
    }
]);;