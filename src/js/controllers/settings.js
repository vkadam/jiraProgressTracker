define(['jquery', 'js-logger', 'js/app', 'js/base64',
    'js/factories/storage'
], function($, Logger, App, Base64, StorageFactory) {

    function JiraSettingsForm($scope, $element, $scope$apply) {
        var logger = Logger.get('JiraSettingsForm');

        $scope.userData = {
            userId: '',
            password: ''
        };

        $element.bind('$destroy', function() {
            $element.scope().$destroy();
        });

        function fetchData() {
            StorageFactory.get('Jira-UserName').always(function(userName) {
                $scope$apply($scope, function() {
                    $scope.userData.userId = userName;
                    $scope.userData.password = 'It5AS3cr3t';
                });
            });
        }

        fetchData();

        $scope.$on('modalSubmitClick', function() {
            if ($scope.jiraSettingsForm.$valid) {
                if ($scope.jiraSettingsForm.$dirty) {
                    logger.log('Saving setting to storage');
                    var base64Encode = Base64.encode($scope.userData.userId + ':' + $scope.userData.password);
                    StorageFactory.set('Jira-Credentials', base64Encode);
                    StorageFactory.set('Jira-UserName', $scope.userData.userId);
                }
                $scope.close();
            }
        });
    }
    App.controller('SettingsFormController', JiraSettingsForm);
});
