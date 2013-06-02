steal.config({
	"root": "../",
	paths: {
		"jquery": "lib/jquery-1.8.2.js",
		"jquery/validate": "lib/jquery.validate-1.10.0.min.js",
		"underscore": "lib/underscore-1.4.2.min.js",
		"bootstrap": "lib/bootstrap/js/bootstrap.min.js",
		"js-logger": "lib/js-logger/src/logger.min.js",
		"moment": "lib/moment/min/moment.min.js",
		"handlebars": "lib/handlebars/dist/handlebars.runtime.js",
		"gsloader": "lib/gsloader/dist/gsloader.min.js",
		"google/client": "https://apis.google.com/js/client.js?onload=googleDriveClientLoaded"
	},
	map: {
		"*": {
			"jquery/jquery.js": "jquery",
			"jquery/validate/validate.js": "jquery/validate",
			"underscore/underscore.js": "underscore",
			"bootstrap/bootstrap.js": "bootstrap",
			"js-logger/js-logger.js": "js-logger",
			"moment/moment.js": "moment",
			"handlebars/handlebars.js": "handlebars",
			"gsloader/gsloader.js": "gsloader",
			"google/client/client.js": "google/client"
		}
	}
})