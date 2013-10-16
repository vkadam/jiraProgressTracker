define(['jquery', 'logger', 'gsloader', 'moment',
    'js/models/jira-issue', 'js/factories/storage'
], function($, Logger, GSLoader, moment, JiraIssue, StorageFactory) {
    /**
     * Creates an instance of Filter
     *
     * @constructor
     * @this {Filter}
     * @param {Object} options: Filter options */

    var maxResults = 999;

    function Filter(options) {
        this.logger = Logger.get('Filter');
        $.extend(this, {
            name: options['filtername'],
            id: options['spreadsheetid'],
            jql: options['jql'],
            isActive: (options['active'] === 'Y'),
            startDate: moment.unix(options['startdate']).toDate(),
            endDate: moment.unix(options['enddate']).toDate(),
            snapshots: [],
            isLoaded: false
        });
    }

    Filter.prototype.fetch = function() {
        return GSLoader.loadSpreadsheet({
            id: this.id,
            context: this
        }).then(function(spreadsheet) {
            this.spreadsheet = spreadsheet;
            this.snapshots = spreadsheet.worksheets;
            $.each(this.snapshots, function(idx, snapshot) {
                snapshot.startDate = moment(snapshot.title).endOf('day').toDate();
            });
            this.snapshots.sort(function(a, b) {
                return a.startDate - b.startDate;
            });
            this.isLoaded = true;
            return this;
        });
    };

    Filter.prototype.createSnapshot = function(options) {
        var _this = this,
            deferred = $.Deferred();

        options = $.extend({
            snapshotTitle: null
        }, options);

        function getJiraIssuesAndCreateWorksheet(base64Encode) {
            _this.logger.debug('Getting jira issues, jql=', _this.jql);
            $.ajax({
                url: 'http://jira.cengage.com/rest/api/2/search',
                data: {
                    maxResults: maxResults,
                    jql: _this.jql
                },
                headers: {
                    'Authorization': 'Basic ' + base64Encode
                }
            }).then(function(data /*, textStatus, jqXHR*/ ) {
                var defObj = $.Deferred();
                try {
                    if (typeof(data) === 'string') {
                        data = JSON.parse(data);
                    }

                    var jiraIssues = [],
                        jiraIssue;
                    $.each(data.issues, function(idx, issue) {
                        jiraIssue = new JiraIssue(issue);
                        jiraIssues.push(jiraIssue.toArray());
                    });

                    _this.logger.debug('Received jira issues, total issue found = ', data.issues.length, 'Creating snapshot from it');
                    defObj.resolve(jiraIssues);
                } catch (e) {
                    defObj.reject({}, 'Exception while parsing jira issue response');
                }
                return defObj.promise();
            }).then(function(jiraIssues) {
                var headersTitles = [];
                $.each(JiraIssue.fields, function(key) {
                    headersTitles.push(key);
                });

                return _this.spreadsheet.createWorksheet({
                    title: options.snapshotTitle,
                    headers: headersTitles,
                    rowData: jiraIssues,
                    rows: jiraIssues.length + 1,
                    cols: headersTitles.length
                });
            }).then(function(wSheet) {
                _this.logger.debug('Snapshot', wSheet.title, 'created successfully in filter', _this.name);
                _this.snapshots.push(wSheet);
                deferred.resolve(wSheet);
            }, function(jqXHR, textStatus) {
                _this.logger.error(textStatus || jqXHR);
                deferred.reject({
                    message: textStatus || jqXHR
                });
            });
        }

        StorageFactory.get('Jira-Credentials').done(getJiraIssuesAndCreateWorksheet).fail(function() {
            var errors = {
                'jiraAuthentication': {
                    required: true
                }
            };
            deferred.reject(errors);
        });

        return deferred.promise();
    };

    /**
     * Returns jira server time
     * @return {Date} Date object of jira server time
     */

    function getJiraServerTime() {
        /* Cengage jira server is in EST */
        return moment().tz('America/Detroit');
    }

    /**
     * Return false if snapshot can not be generated. Else return date as snapshot title
     * @this {JiraTracker}
     * @return {Boolean/String} false if can not be generated else date string
     */
    Filter.prototype.canSnapshotBeGenerated = function() {
        var _this = this,
            result = false,
            todaysDate = getJiraServerTime(), //.format('MM-DD-YYYY');
            workStartTime = todaysDate.clone().startOf('hour').hour(8),
            workEndTime = todaysDate.clone().startOf('hour').hour(17);

        /** Get yesterday's date if server time hour is between 0-8 i.e. midnight to 8am
         * Get today's date if server time hour is between 17-24 i.e. 5pm to midnight
         * This is because, 8am to 5pm is working hour and snapshot shoudn't be created
         * for this time.
         */
        if (todaysDate.isBefore(workStartTime)) { // Before or on 8am
            todaysDate.subtract('days', 1);
        } else if (todaysDate.isAfter(workStartTime) && todaysDate.isBefore(workEndTime)) {
            return result;
        }
        todaysDate = todaysDate.format('MM-DD-YYYY');

        /* If Snapshot is not available for a date so can be generated */
        result = todaysDate;
        $.each(this.snapshots, function(idx, snapshot) {
            /* return is a break of $.each. Return false if snapshot is found for date */
            if (moment(todaysDate, 'MM-DD-YYYY').isSame(moment(snapshot.title, 'MM-DD-YYYY'))) {
                _this.logger.debug('Snapshot for', todaysDate, 'is available in filter', _this.name);
                result = false;
                return;
            }
        });
        return result;
    };

    return Filter;
});
