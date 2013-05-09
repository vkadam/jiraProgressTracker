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
    };

    var Background = new BackgroundClass();

    /**
     * Initialization, creates the chrome.alarms for "watchSnapshot" and adds listener for it
     * @this {BackgroundClass}
     */
    BackgroundClass.prototype.init = function() {
        this.logger.debug("Creating watchSnapshot chrome alarm");

        chrome.alarms.create('watchSnapshot', {
            periodInMinutes: 10
        });

        chrome.alarms.onAlarm.addListener($.proxy(this.onAlarmListener, this));
    };

    /**
     * Alarm listenr for "watchSnapshot"
     * @this {BackgroundClass}
     */
    BackgroundClass.prototype.onAlarmListener = function() {
        this.logger.debug("Inside alarm listener, checking for today's snapshot");
        if (!JiraTracker.getSnapshotForToday()) {
            this.logger.debug("Today's snapshot doesn't exists creating one");
            JiraTracker.createSnapshotForToday();

            /*this.logger.debug("Sending chrome.runtime message", Date());
            var _this = this;
            var port = chrome.runtime.connect("jlgedebcjnapdcpffnppjjededbakaje");

            port.postMessage({
                counter: 1
            });
            port.onMessage.addListener(function getResp(response) {
                _this.logger.debug("Inside onMessage response callback", Date());
            });*/
        }
    };

    $.extend(JiraTracker, {
        Background: Background
    });

}(window.JiraTracker, jQuery));

$(function() {
    JiraTracker.Background.init();
});
