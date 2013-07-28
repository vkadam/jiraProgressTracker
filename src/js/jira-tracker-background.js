define(["jquery", "js-logger", "js/jira-tracker"], function($, Logger, JiraTracker) {
    /*global chrome:false*/
    /**
     * Creates an instance of Background
     *
     * @constructor
     * @this {Background}
     */
    var Background = function() {
        this.logger = Logger.get("Background");
        this.inProgress = false;
    };

    /**
     * Initialization, creates the chrome.alarms for "watchSnapshot" and adds listener for it
     * @this {Background}
     */
    Background.prototype.init = function() {
        this.logger.debug("Creating watchSnapshot chrome alarm");

        chrome.alarms.create('watchSnapshot', {
            periodInMinutes: 30
        });

        chrome.alarms.onAlarm.addListener($.proxy(this.onAlarmListener, this));
    };

    /**
     * Alarm listenr for "watchSnapshot"
     * @this {Background}
     */
    Background.prototype.onAlarmListener = function() {
        var _this = this;
        // _this.logger.debug("Inside onAlarmListener");
        /*// _this.logger.debug("Sending message for JiraProgressTracker extension");
		chrome.runtime.sendMessage({
			greeting: "hello"
		}, function(response) {
			// _this.logger.debug("Response is", chrome.runtime.lastError, response, arguments);
		});*/

        var newSnapshotTitle = JiraTracker.canSnapshotBeGenerated();
        if (!_this.inProgress && newSnapshotTitle) {
            _this.logger.debug("Snapshot for", newSnapshotTitle, "doesn't exists creating one");
            JiraTracker.createSnapshot(null, newSnapshotTitle).always(function() {
                // _this.logger.debug("Snapshot for", newSnapshotTitle, "created", wSheet);
                _this.inProgress = false;
            });
            _this.inProgress = true;
        }
    };

    return Background;
});
