define(['jquery', 'js/app', 'js/factories/filter-group'], function($, App, FilterGroupFactory) {
    function FilterGroup($scope, $routeParams, $scope$apply) {
        $scope.filters = [];
        $scope.id = $routeParams.filterGroupId;

        FilterGroupFactory.get($scope.id).done(function(filters) {
            $scope$apply($scope, function() {
                $scope.filters = filters;
            });
        });
    }
    App.controller('FilterGroupController', FilterGroup);
});
