requirejs.config({
    'baseUrl': '',
    'paths': {
        'google-api-client': 'https://apis.google.com/js/client.js?onload=googleDriveClientLoaded',
        'angular': 'lib/angular/angular.min',
        'angular-route': 'lib/angular-route/angular-route.min',
        'angular-ui': 'lib/angular-ui/ui-bootstrap-tpls.min',
        'bootstrap': 'lib/bootstrap/bootstrap.min',
        'gsloader': 'lib/gsloader/gsloader.min',
        'jquery': 'lib/jquery/jquery.min',
        'lodash': 'lib/lodash/lodash.min',
        'logger': 'lib/logger/logger.min',
        'moment': 'lib/moment/moment.min'
    },
    'map': {
        '*': {
            'underscore': 'lodash',
            'js-logger': 'logger'
        }
    },
    'shim': {
        'gsloader': ['jquery', 'js-logger'],
        'bootstrap': ['jquery'],
        'google-api-client': {
            'exports': 'gapi'
        },
        'angular': {
            'exports': 'angular'
        },
        'angular-ui': ['angular'],
        'angular-route': ['angular'],
        'main': {
            'deps': [
                'logger'
            ],
            'init': function(Logger) {
                Logger.useDefaults();
            }
        }
    }
});
require(['main']);
