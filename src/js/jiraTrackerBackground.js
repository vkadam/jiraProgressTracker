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
            periodInMinutes: 60
        });

        chrome.alarms.onAlarm.addListener($.proxy(this.onAlarmListener, this));
    };

    /**
     * Alarm listenr for "watchSnapshot"
     * @this {BackgroundClass}
     */
    BackgroundClass.prototype.onAlarmListener = function() {
        var _this = this;

        if (!_this.inProgress && !JiraTracker.getSnapshotForToday()) {
            _this.logger.debug("Today's snapshot doesn't exists creating one");
            JiraTracker.createSnapshotForToday();
            _this.inProgress = true;

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
