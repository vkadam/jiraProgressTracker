define(['jquery', 'js/app'], function($, App) {
    function ModalController($scope) {
        $scope.open = function() {
            $scope.shouldBeOpen = true;
        };

        $scope.close = function() {
            $scope.shouldBeOpen = false;
        };

        $scope.submit = function() {
            $scope.$broadcast('modalSubmitClick');
        }

        $scope.opts = {
            backdropFade: true,
            dialogFade: true
        };
    }
    App.controller('ModalController', ModalController);
})