define(['angular', 'js/app',
    'js/controllers/settings', 'js/controllers/filter-group',
    'js/controllers/filter', 'js/controllers/filter-summary',
    'js/controllers/snapshot'
], function(angular, app) {
    'use strict';

    return app.config(['$routeProvider',
        function($routeProvider) {
            $routeProvider.when('/filter-group/:filterGroupId', {
                templateUrl: 'views/filter-group.html',
                controller: 'FilterGroupController'
            });
            $routeProvider.when('/filter-group/:filterGroupId/filter/:filterId', {
                templateUrl: 'views/filter/tabs.html',
                controller: 'FilterController'
            });
            $routeProvider.otherwise({
                redirectTo: '/filter-group/0AlpsUVqaDZHSdHdJc2R2emQ4MncwLW8zS2Fsa0NRaFE'
            });
        }
    ]);
});