define(['jquery', 'logger', 'js/factories/filter-group'], function($, Logger, FilterGroupFactory) {
    /*global chrome:false*/

    var background = {},
        logger = Logger.get('Background');

    /**
     * Initialization, creates the chrome.alarms for 'watchSnapshot' and adds listener for it
     */
    background.init = function() {
        logger.debug('Creating watchSnapshot chrome alarm');

        chrome.alarms.create('watchSnapshot', {
            periodInMinutes: 30
        });

        chrome.alarms.onAlarm.addListener(onAlarmListener);
    };

    function checkAndCreateSnapshot(filter) {
        var snapshotTitle = filter.canSnapshotBeGenerated();
        if (snapshotTitle) {
            filter.createSnapshot({
                snapshotTitle: snapshotTitle
            });
        }
    }

    /**
     * Alarm listenr for 'watchSnapshot'
     */

    function onAlarmListener() {
        FilterGroupFactory.get('0AlpsUVqaDZHSdHdJc2R2emQ4MncwLW8zS2Fsa0NRaFE', true)
            .done(function(filters) {
                $.each(filters, function(filterId, filter) {
                    if (filter.isActive) {
                        if (!filter.isLoaded) {
                            filter.fetch().done(checkAndCreateSnapshot);
                        } else {
                            checkAndCreateSnapshot(filter);
                        }
                    }
                });
            });
    }
    return background;
});
