requirejs.config({
    baseUrl: '',
    paths: {
        'domReady': 'lib/requirejs/require-domReady',
        'jquery': 'lib/jquery-2.0.0',
        // 'jquery/validate': 'lib/jquery.validate.min',
        'angular': 'lib/angular/angular',
        'angular-route': 'lib/angular/angular-route',
        'angular-ui': 'lib/angular-ui/ui-bootstrap-tpls-0.6.0-SNAPSHOT',
        'underscore': 'lib/underscore-1.4.2.min',
        'bootstrap': 'lib/bootstrap/js/bootstrap.min',
        'js-logger': 'lib/js-logger/src/logger.min',
        'moment': 'lib/moment/min/moment.min',
        'gsloader': 'lib/gsloader/dist/gsloader',
        'google-api-client': 'https://apis.google.com/js/client.js?onload=googleDriveClientLoaded'
    },
    shim: {
        /*'jquery/validate': ['jquery'],
        'js/jira-validator': ['jquery/validate'],*/
        'gsloader': ['jquery'],
        'bootstrap': ['jquery'],
        'google-api-client': {
            'exports': 'gapi'
        },
        'underscore': {
            'exports': '_'
        },
        'angular': {
            'exports': 'angular'
        },
        'angularMocks': {
            'deps': ['angular'],
            'exports': 'angular.mock'
        },
        'angular-ui': {
            'deps': ['angular']
        },
        'angular-route': {
            'deps': ['angular']
        },
        'main': {
            'deps': ['js-logger'],
            'init': function(Logger) {
                Logger.useDefaults();
            }
        }
    }
});
require(['main']);
