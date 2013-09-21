define(['jquery', 'logger', 'js/app', 'js/base64',
    'js/factories/storage'
], function($, Logger, App, Base64, StorageFactory) {

    function JiraSettingsForm($scope, $scope$apply, $modalInstance) {
        var logger = Logger.get('JiraSettingsForm');

        $scope.userData = {
            userId: '',
            password: ''
        };

        function fetchData() {
            StorageFactory.get('Jira-UserName').always(function(userName) {
                $scope$apply($scope, function() {
                    $scope.userData.userId = userName;
                    $scope.userData.password = 'It5AS3cr3t';
                });
            });
        }

        fetchData();

        $scope.submit = function(jiraSettingsForm) {
            if (jiraSettingsForm.$valid) {
                if (jiraSettingsForm.$dirty) {
                    logger.log('Saving setting to storage');
                    var base64Encode = Base64.encode($scope.userData.userId + ':' + $scope.userData.password);
                    StorageFactory.set('Jira-Credentials', base64Encode).done(function() {
                        StorageFactory.set('Jira-UserName', $scope.userData.userId);
                    });
                }
                $scope.close();
            }
        };

        $scope.close = function() {
            $modalInstance.dismiss();
        };
    }

    function JiraSettingsModal($scope, $modal) {
        $scope.open = function() {
            $modal.open({
                templateUrl: 'views/settings.html',
                controller: JiraSettingsForm
            });
        };
    }

    App.controller('SettingsModalController', JiraSettingsModal);
});
