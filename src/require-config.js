requirejs.config({
    'baseUrl': '',
    'paths': {
        'google-api-client': 'https://apis.google.com/js/client.js?onload=googleDriveClientLoaded',
        'angular': 'lib/angular/angular.min',
        'angular-route': 'lib/angular-route/angular-route.min',
        'angular-ui': 'lib/angular-ui/ui-bootstrap-tpls.min',
        'bootstrap': 'lib/bootstrap/js/bootstrap.min',
        'gsloader': 'lib/gsloader/gsloader.min',
        'jquery': 'lib/jquery/jquery.min',
        'lodash': 'lib/lodash/lodash.min',
        'logger': 'lib/logger/logger.min',
        'moment': 'lib/moment/moment.min',
        'moment-timezone': 'lib/moment-timezone/moment-timezone.min'
    },
    'map': {
        '*': {
            'js-logger': 'logger',
            'underscore': 'lodash'
        }
    },
    'shim': {
        'google-api-client': {
            'exports': 'gapi'
        },
        'angular': {
            'exports': 'angular'
        },
        'angular-route': ['angular'],
        'angular-ui': ['angular'],
        'bootstrap': ['jquery'],
        'gsloader': ['jquery', 'js-logger'],
        'main': {
            'deps': ['logger'],
            'init': function(Logger) {
                Logger.useDefaults();
            }
        },
        'moment-timezone': ['moment']
    }
});
require(['main']);
