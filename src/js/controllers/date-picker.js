define(['jquery', 'moment', 'js/app'], function($, moment, App) {
    function DatePickerController($scope, $timeout) {
        $scope.isVisible = false;
        $scope.datepickerOptions = {
            'show-weeks': false
        };
        $scope.show = function() {
            $timeout(function() {
                $scope.isVisible = true;
            });
        };
    }
    App.controller('DatePickerController', DatePickerController);
});
