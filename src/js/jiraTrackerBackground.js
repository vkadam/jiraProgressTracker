/**
 * @author Vishal Kadam https://github.com/vkadam
 */

(function(JiraTracker, $) {

    /**
     * Creates an instance of BackgroundClass.
     *
     * @constructor
     * @this {BackgroundClass}
     */
    var BackgroundClass = function() {
        Logger.useDefaults(Logger.DEBUG);
        this.logger = Logger.get("jiraTrackerBackground");
        this.inProgress = false;
    };

    var Background = new BackgroundClass();

    /**
     * Initialization, creates the chrome.alarms for "watchSnapshot" and adds listener for it
     * @this {BackgroundClass}
     */
    BackgroundClass.prototype.init = function() {
        this.logger.debug("Creating watchSnapshot chrome alarm");

        chrome.alarms.create('watchSnapshot', {
            periodInMinutes: 30
        });

        chrome.alarms.onAlarm.addListener($.proxy(this.onAlarmListener, this));
    };

    /**
     * Alarm listenr for "watchSnapshot"
     * @this {BackgroundClass}
     */
    BackgroundClass.prototype.onAlarmListener = function() {
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

    $.extend(JiraTracker, {
        Background: Background
    });

}(window.JiraTracker, jQuery));

$(function() {
    JiraTracker.Background.init();
});
