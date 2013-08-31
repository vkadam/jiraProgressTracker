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
        });
});
