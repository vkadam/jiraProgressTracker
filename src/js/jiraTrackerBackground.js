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
        // this.activeRelease = null;
    };

    var Background = new BackgroundClass();

    /**
     * Initialization, creates the chrome.alarms for "watchSnapshot"
     * @this {BackgroundClass}
     */
    BackgroundClass.prototype.init = function() {

        chrome.alarms.create('watchSnapshot', {
            periodInMinutes: 10
        });

        chrome.alarms.onAlarm.addListener($.proxy(this.onAlarmListener, this));
    };

    BackgroundClass.prototype.onAlarmListener = function() {
        console.log("On Snapshot alarm istener...", snapshotAlarm, JiraTracker, Date());
    };

    $.extend(JiraTracker, {
        Background: Background
    });

}(window.JiraTracker, jQuery));
