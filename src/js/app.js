define(['angular', 'angular-route', 'angular-ui'], function(angular) {
    'use strict';
    return angular.module('jira-tracker-app', ['ngRoute', 'ui.bootstrap'])
        .config(function($compileProvider) {
            $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|file|chrome-extension):/);
        }).value('$scope$apply', function($scope, callback) {
            if ($scope.$$phase) {
                callback();
            } else {
                $scope.$apply(callback);
            }
        }).filter('objectToArray', function() {
            return function(input) {
                if (!angular.isObject(input)) {
                    return input;
                }

                var objectArray = [];
                for (var objectKey in input) {
                    objectArray.push(input[objectKey]);
                }

                return objectArray;
            };
        });
});
