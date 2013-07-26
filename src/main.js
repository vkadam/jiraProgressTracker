/*
 * Authorize and load gsloader.drive.load/gapi.client.load("drive", "v2", this.onLoad);
 * TODO: Decouple it to authorize and the load rather than client loading to authorize
 */
/**
 * Called when the google drive client library is loaded.
 */
window.googleDriveClientLoaded = function() {
    var GSLoaderAuth = require("js/plugins/gsloader-auth"),
        GSLoaderDrive = require("js/plugins/gsloader-drive");

    GSLoaderAuth.setClientId("1074663392007.apps.googleusercontent.com").onLoad(GSLoaderDrive.load, GSLoaderDrive);
};

require(["jquery", "js/jira-tracker", "js/models/jira-chrome-storage",
    "js/jira-settings"
], function($, JiraTracker, ChromeStorage, JiraSettings) {
    /* TODO: move storage as setter method or constructor parameter
     * once JiraTracker singleton instace is removed and
     * Background.js communicate via messaging rather than using singleton object */
    var chromeStorage = new ChromeStorage("JiraTracker");
    JiraTracker.init({
        storage: chromeStorage
    });
    new JiraSettings({
        storage: chromeStorage
    });
    $(".load-release").click($.proxy(JiraTracker.loadRelease, JiraTracker));
    $(".create-release").click($.proxy(JiraTracker.createBaseline, JiraTracker));
    $(".create-snapshot").click($.proxy(JiraTracker.createSnapshot, JiraTracker));
    $(".compare-snapshot").click($.proxy(JiraTracker.compareSnapshot, JiraTracker));
});
