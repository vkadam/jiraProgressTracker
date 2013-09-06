define(['jquery', 'js/app'], function($, App) {

    function SnapshotForm($scope, $modalInstance) {
        $scope.snapshot = {
            maxResults: 999,
            snapshotTitle: ''
        };

        $scope.submit = function(snapshotForm) {
            if (snapshotForm.$valid) {
                $scope.filter.createSnapshot({
                    snapshotTitle: $scope.snapshot.snapshotTitle
                });
                $scope.close();
            } else {
                snapshotForm.showErrors = true;
            }
        };

        $scope.close = function() {
            $modalInstance.dismiss();
        };
    }

    function SnapshotModal($scope, $modal) {
        $scope.open = function() {
            $modal.open({
                templateUrl: 'views/filter/snapshot.html',
                controller: SnapshotForm,
                scope: $scope
            });
        };
    }

    App.controller('SnapshotModalController', SnapshotModal);
});
