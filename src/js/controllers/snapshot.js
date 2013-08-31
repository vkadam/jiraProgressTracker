define(['jquery', 'js/app'], function($, App) {

    function SnapshotForm($scope, $element) {
        $scope.maxResults = 999;
        $scope.snapshotTitle = '';

        $element.bind('$destroy', function() {
            $element.scope().$destroy();
        });

        $scope.$on('modalSubmitClick', function() {
            if ($scope.snapshotForm.$valid) {
                $scope.filter.createSnapshot({
                    snapshotTitle: $scope.snapshotTitle
                });
                $scope.close();
            } else {
                $scope.snapshotForm.showErrors = true;
            }
        });
    }

    App.controller('SnapshotFormController', SnapshotForm);
});
