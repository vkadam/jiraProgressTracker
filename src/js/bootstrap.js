require(['lib/requirejs/domReady!'], function(doc) {
    require(['angular', 'js/app', 'js/routes'], function(angular, app) {
        'use strict';
        return angular.bootstrap(doc, [app['name']]);
    });
});
