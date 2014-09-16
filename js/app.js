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
    'hs.lodexplorer'
]).controller('Main', ['$scope',
    function($scope) {
       if(console) console.log("Main called");
    }
]);;