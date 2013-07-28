requirejs.config({
    "baseUrl": "",
    "paths": {
        "jquery": "lib/jquery-2.0.0",
        "jquery/validate": "lib/jquery.validate.min",
        "underscore": "lib/underscore-1.4.2.min",
        "bootstrap": "lib/bootstrap/js/bootstrap.min",
        "js-logger": "lib/js-logger/src/logger.min",
        "moment": "lib/moment/min/moment.min",
        "handlebars": "lib/handlebars/dist/handlebars.runtime",
        "gsloader": "lib/gsloader/dist/gsloader",
        "google-api-client": "https://apis.google.com/js/client.js?onload=googleDriveClientLoaded"
    },
    "shim": {
        "jquery/validate": ["jquery"],
        "js/jira-validator": ["jquery/validate"],
        "js/jira-settings": ["bootstrap"],
        "gsloader": ["jquery"],
        "google-api-client": {
            "exports": "gapi"
        },
        "underscore": {
            "exports": "_"
        },
        "main": {
            "deps": ["js-logger"],
            "init": function(Logger) {
                Logger.useDefaults();
            }
        }
    }
});
requirejs(["main"]);
