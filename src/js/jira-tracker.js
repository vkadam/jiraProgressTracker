define(["jquery", "underscore", "js-logger", "dist/jira-tracker-templates",
    "gsloader", "js/moment-zone", "js/models/jira-issue",
    "js/jira-validator", "js/comparator/snapshot", "js/models/jira-storage",
    "js/models/filter", "js/handlebars-helpers"
], function($, _, Logger, JiraTrackerTemplates,
    GSLoader, moment, JiraIssue,
    Validator, Snapshot, Storage, Filter) {

    /**
     * Creates an instance of JiraTracker.
     *
     * @constructor
     * @this {JiraTracker}
     */

    var currentFilter = null;
    var JiraTracker = function(id) {
        /* Spreadsheet id which stores all filter list */
        this.id = id;
        this.filters = [];
        this.storage = new Storage();
        this.logger = Logger.get("jiraTracker");
    };

    var JIRA_SETUP_WORKSHEET_TITLE = "Setup",
        BASELINE_SNAPSHOT = "Baseline",
        JIRA_SETUP_WORKSHEET_JQL = "jira-jql";

    JiraTracker.prototype.getCurrentFilter = function() {
        return currentFilter;
    };

    /**
     * Fetch spreadsheet for JiraTracker.id and populates filters array
     * @this {JiraTracker}
     */
    JiraTracker.prototype.fetchFilters = function() {
        var _this = this,
            deferred = $.Deferred();
        _this.filters = [];

        function errorCallBack(errorMessage, sSheet) {
            deferred.rejectWith(_this, [{
                    "message": errorMessage,
                    "spreadsheet": sSheet
            }]);
        }

        GSLoader.loadSpreadsheet({
            id: this.id,
            wanted: ["Filters"]
        }).done(function(sSheet) {
            var wSheet = sSheet.getWorksheet("Filters");
            if (wSheet) {
                $.each(wSheet.rows, function(idx, row) {
                    _this.filters.push(new Filter(row));
                });
                deferred.resolveWith(_this, [_this.filters]);
            } else {
                errorCallBack("Filters worksheet not available", sSheet);
            }
        }).fail(errorCallBack);

        return deferred.promise();
    };

    /**
     * Initialization
     * @this {JiraTracker}
     * @return {Object} The deferred request object if release id is available in cache
     */
    JiraTracker.prototype.init = function(options) {
        $.extend(this, options);
        this.fetchFilters();
        this.injectUI().loadReleaseFromStorage();

        // /*
        // * Authorize and load gsloader.drive.load/gapi.client.load("drive", "v2", this.onLoad);
        // * TODO: Decouple it to authorize and the load rather than client loading to authorize
        // */
        // var GSLoaderAuth = require("js/plugins/gsloader-auth"),
        // GSLoaderDrive = require("js/plugins/gsloader-drive");

        // GSLoaderAuth.setClientId("1074663392007.apps.googleusercontent.com").onLoad(GSLoaderDrive.load, GSLoaderDrive);

        /*chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
                console.log(sender.tab ?
                    "from a background script:" + sender.tab.url :
                    "from the extension");
                if (request.greeting == "hello") {
                    sendResponse({
                        farewell: "goodbye"
                    });
                };
            });*/
    };

    /**
     * Inject ui into container div
     * @this {JiraTracker}
     * @return {JiraTracker} Instance of JiraTracker
     */
    JiraTracker.prototype.injectUI = function() {
        //        .append(JiraTrackerTemplates["src/views/jira-credentials.hbs"]())
        $("#jira-container").append(JiraTrackerTemplates["src/views/jira-tracker-form.hbs"]());
        return this;
    };

    /**
     * Populates last used values from storage (if any)
     * @this {JiraTracker}
     * @return {Object} The deferred request object if release id is available in cache
     */
    JiraTracker.prototype.loadReleaseFromStorage = function(evt) {
        var _this = this,
            deferred = $.Deferred(),
            lrfsReq = {};
        // Attach deferred method to return object 
        deferred.promise(lrfsReq);

        _this.logger.debug("Getting last saved state from sync storage");

        this.storage.get("releaseId").done(function(releaseId) {
            if (!_.isEmpty(releaseId)) {
                _this.logger.debug("Last loaded release was", releaseId, "loading is again...");
                _this.loadRelease(evt, releaseId).done(function(sSheet) {
                    _this.logger.debug("Release loaded from last saved state...", sSheet);
                    deferred.resolveWith(_this, [sSheet]);
                }).fail(function(errorMessage, sSheet) {
                    deferred.rejectWith(_this, [{
                            message: errorMessage,
                            spreadsheet: sSheet
                    }]);
                });
            }
        });
        return lrfsReq;
    };

    /**
     * Loads release by specified release id or value of releaseId element.
     * @this {JiraTracker}
     * @param {String=} Optional release id. If not passed value of releaseId element will be used
     * @return {Object} The deferred request object
     */
    JiraTracker.prototype.loadRelease = function(env, releaseId) {
        // If release id is passed set it to element. 
        var _this = this;
        if (releaseId) {
            $("#releaseId").val(releaseId);
        }
        releaseId = $("#releaseId").val();
        this.logger.debug("Loading release with id", releaseId);

        var deferred = Validator.get("LOAD_RELEASE").validate({
            context: this
        });

        function validationSuccess() {
            // Add callback to update active release value
            GSLoader.loadSpreadsheet({
                id: releaseId,
                wanted: ["Setup"]
            }).then($.proxy(_this, "onReleaseChange")).then(function(sSheet) {
                deferred.resolveWith(_this, [sSheet]);
            }, function(errorMessage, sSheet) {
                deferred.rejectWith(_this, [{
                        message: errorMessage,
                        spreadsheet: sSheet
                }]);
            });
        }

        deferred.progress(validationSuccess);
        return deferred.promise();
    };

    JiraTracker.prototype.getWorksheet = function(title) {
        var _this = this;
        var matchingWorksheet;
        var currentFilter = _this.getCurrentFilter();
        var worksheets = currentFilter.worksheets;
        $.each(worksheets, function(idx, worksheet) {
            if (worksheet.title === title) {
                matchingWorksheet = worksheet;
                return false;
            }

        });
        return matchingWorksheet;
    };

    JiraTracker.prototype.findEndOfWeekSheet = function(dt) {

        var _this = this;
        var i = 0;
        //var sheet = null;
        while (i < 7) {
            var sheet = _this.getWorksheet((dt.clone().subtract("day", i).format("MM-DD-YYYY")));
            if (sheet) {
                return sheet;
            }
            i = i + 1;
        }
        return null;
    };

    JiraTracker.prototype.compareSnapshot = function() {
        var _this = this;
        var today = moment();
        var filterSS = _this.getCurrentFilter();
        var baselineWS = filterSS.getWorksheet(BASELINE_SNAPSHOT); //TODO Baseline snapshot should capture the date
        var latestWS = _this.getCurrentFilter().worksheets[_this.getCurrentFilter().worksheets.length - 1];
        var weekb4lastWS = _this.findEndOfWeekSheet(today.clone().startOf("week").subtract("day", 7));
        var lastWeekWS = _this.findEndOfWeekSheet(today.startOf("week"));

        $.when((baselineWS ? baselineWS.fetch() : $.Deferred().resolve()), (latestWS ? latestWS.fetch() : $.Deferred().resolve()), (weekb4lastWS ? weekb4lastWS.fetch() : $.Deferred().resolve()), (lastWeekWS ? lastWeekWS.fetch() : $.Deferred().resolve()))
            .done(function() {

            var inputJson = {
                baseline: _this.getSnapshotSummary(baselineWS),
                lastWeekSnapshot: _this.getSnapshotSummary(lastWeekWS),
                weekb4lastSnapshot: _this.getSnapshotSummary(weekb4lastWS),
                latest: _this.getSnapshotSummary(latestWS)
            };

            $(".summary-group").html(JiraTrackerTemplates["src/views/summary-form.hbs"](inputJson));
        });
    };

    JiraTracker.prototype.getSnapshotSummary = function(sheet) {
        if (!sheet) {
            return [];
        }
        var snapshot = new Snapshot(sheet.rows);
        return {
            date: sheet.title,
            data: snapshot.summarize()
        };

    };

    JiraTracker.prototype.createBaseline = function(evt, baselineTitle) {
        var _this = this;
        if (baselineTitle) {
            $("#releaseTitle").val(baselineTitle);
        }
        baselineTitle = $("#releaseTitle").val();

        var deferred = Validator.get("CREATE_BASELINE").validate({
            context: this
        });

        function validationSuccess() {
            // Create new spreadsheet using GSLoader
            _this.logger.debug("Creating spreadsheet with title =", baselineTitle);
            GSLoader.createSpreadsheet({
                title: baselineTitle
                /* Add callback to update active release value */
            }).then($.proxy(_this, "onReleaseChange")).then(function() {
                // Rename Sheet 1 worksheet to Setup
                return _this.getCurrentFilter().worksheets[0].rename("Setup");
            }).then(function() {
                var releaseSettings = [
                    [JIRA_SETUP_WORKSHEET_JQL],
                                                                                     [$("#jiraJQL").val()]
                ];
                // Adds release details into setup worksheet
                _this.logger.debug("Saving release settings into setup worksheet");
                return _this.getCurrentFilter().worksheets[0].addRows(releaseSettings);
            }).then(function() {
                _this.logger.debug("Release settings saved successfully");
                // Once Spreadsheet is created successfully, create a baseline snapshot
                return _this.createSnapshot(evt, "Baseline");
            }).then(function() {
                // Once Baseline is created successfully, execute callbacks
                deferred.resolveWith(_this, [_this.getCurrentFilter()]);
            }, function(errorMessage) {
                deferred.rejectWith(_this, [{
                        message: errorMessage
                }]);
            });
        }

        deferred.progress(validationSuccess);
        return deferred.promise();
    };

    /*
     * Keep updated the JiraTracker with latest release.
     * @param {Object} Spreasheet object which needs to be make active
     */
    JiraTracker.prototype.onReleaseChange = function(releaseSheet) {
        currentFilter = releaseSheet;
        var setupSheet = this.getCurrentFilter().getWorksheet(JIRA_SETUP_WORKSHEET_TITLE);
        if (setupSheet && setupSheet.rows.length > 0) {
            $("#jiraJQL").val(setupSheet.rows[0][JIRA_SETUP_WORKSHEET_JQL]); //.prop("disabled", true);
            // $("#releaseTitle").prop("disabled", true);
        }
        $("#releaseId").val(this.getCurrentFilter().id);
        $("#releaseTitle").val(this.getCurrentFilter().title);
        this.storage.set("releaseId", this.getCurrentFilter().id);
        return this.getCurrentFilter();
    };

    /**
     * Returns jira server time
     * @this {JiraTracker}
     * @return {Date} Date object of jira server time
     */
    JiraTracker.prototype.getJiraServerTime = function() {
        /* Cengage jira server is in EST */
        return moment().toZone(-4);
    };

    /**
     * Return false if snapshot can not be generated. Else return date as snapshot title
     * @this {JiraTracker}
     * @return {Boolean/String} false if can not be generated else date string
     */
    JiraTracker.prototype.canSnapshotBeGenerated = function() {
        var _this = this,
            result = false,
            todaysDate = _this.getJiraServerTime(), //.format("MM-DD-YYYY");
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
        todaysDate = todaysDate.format("MM-DD-YYYY");

        if (_this.getCurrentFilter()) {
            /* If Snapshot is not available for a date so can be generated */
            result = todaysDate;
            $.each(_this.getCurrentFilter().worksheets, function(idx, wSheet) {
                /* return is a break of $.each. Return false if snapshot is found for date */
                if (moment(todaysDate, "MM-DD-YYYY").isSame(moment(wSheet.title, "MM-DD-YYYY"))) {
                    _this.logger.debug("Snapshot for", todaysDate, "is available, NO need to create one");
                    result = false;
                    return;
                }
            });
        } else {
            _this.logger.debug("No release is loaded, loading last used one");
            _this.loadReleaseFromStorage();
        }
        return result;
    };

    JiraTracker.prototype.createSnapshot = function(evt, snapshotTitle) {
        var _this = this;
        if (snapshotTitle) {
            $("#snapshotTitle").val(snapshotTitle);
        }
        snapshotTitle = $("#snapshotTitle").val();

        var deferred = $.Deferred();

        function validationSuccess(base64Encode) {
            _this.logger.debug("Getting jira issues");
            $.ajax({
                url: "http://jira.cengage.com/rest/api/2/search",
                data: {
                    maxResults: $("#jiraMaxResults").val(),
                    jql: $("#jiraJQL").val()
                },
                headers: {
                    "Authorization": "Basic " + base64Encode
                }
            }).then(function(data /*, textStatus, jqXHR*/ ) {
                var defObj = $.Deferred();
                try {
                    if (typeof(data) === "string") {
                        data = JSON.parse(data);
                    }

                    var jiraIssues = [],
                        jiraIssue;
                    $.each(data.issues, function(idx, issue) {
                        jiraIssue = new JiraIssue(issue);
                        jiraIssues.push(jiraIssue.toArray());
                    });

                    _this.logger.debug("Received jira issues, creating snapshot out of it. Total issue found", data.issues.length);
                    defObj.resolve(jiraIssues);
                } catch (e) {
                    defObj.reject({}, "Exception while parsing jira issue response");
                }
                return defObj.promise();
            }).then(function(jiraIssues) {
                var headersTitles = [];
                $.each(JiraIssue.fields, function(key) {
                    headersTitles.push(key);
                });

                return _this.getCurrentFilter().createWorksheet({
                    title: snapshotTitle,
                    headers: headersTitles,
                    rowData: jiraIssues,
                    rows: jiraIssues.length + 1,
                    cols: headersTitles.length
                });
            }).then(function(wSheet) {
                _this.logger.debug("Snapshot", wSheet.title, "created successfully");
                deferred.resolveWith(_this, [wSheet]);
            }, function(jqXHR, textStatus) {
                deferred.rejectWith(_this, [{
                        message: textStatus || jqXHR
                }]);
                _this.logger.error(textStatus || jqXHR);
            });
        }

        function formValidationDone(valObject) {
            _this.storage.get("Jira-Credentials").always(function(base64Key) {
                if (base64Key && valObject === undefined) {
                    validationSuccess(base64Key);
                } else {
                    valObject = valObject || {};
                    valObject.errors = valObject.errors || {};
                    $.extend(valObject.errors, {
                        "jira-authentication": "Jira authentication is required"
                    });
                    deferred.rejectWith(_this, [valObject]);
                }
            });
        }

        Validator.get("CREATE_SNAPSHOT").validate({
            context: this
        }).then($.noop, formValidationDone, formValidationDone);

        return deferred.promise();
    };
    return new JiraTracker("0AlpsUVqaDZHSdHdJc2R2emQ4MncwLW8zS2Fsa0NRaFE");
});
