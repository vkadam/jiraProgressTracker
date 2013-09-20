define(['jquery', 'js/app', 'js/factories/filter', 'bootstrap'], function($, App, FilterFactory) {

    function FilterController($scope, $routeParams, $scope$apply) {
        $scope.filterGroupId = $routeParams.filterGroupId;
        $scope.filterId = $routeParams.filterId;
        $scope.filter = {};

        FilterFactory.get($scope.filterId, $scope.filterGroupId).done(function(filter) {
            $scope$apply($scope, function() {
                $scope.filter = filter;
            });
            if (filter && !filter.isLoaded) {
                filter.fetch().done(function() {
                    $scope$apply($scope, function() {
                        $scope.filter = filter;
                    });
                });
            }
        });
    }
    App.controller('FilterController', FilterController);
});
