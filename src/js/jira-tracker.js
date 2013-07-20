define(["jquery", "underscore", "js-logger", "dist/jira-tracker-templates",
    "gsloader", "js/base64", "js/moment-zone", "js/models/jira-issue",
    "js/jira-form-validators", "js/comparator/snapshot", "js/models/jira-storage",
    "js/handlebars-helpers", "jquery/validate"
], function($, _, Logger, JiraTrackerTemplates,
    GSLoader, Base64, moment, JiraIssue,
    JiraValidators, Snapshot, Storage) {

    /**
     * Creates an instance of JiraTracker.
     *
     * @constructor
     * @this {JiraTracker}
     */
    var JiraTracker = function() {
        this.activeRelease = null;
        this.storage = new Storage();
        Logger.useDefaults(Logger.DEBUG);
        this.logger = Logger.get("jiraTracker");
    };

    var JIRA_SETUP_WORKSHEET_TITLE = "Setup",
        BASELINE_SNAPSHOT = 1,
        JIRA_SETUP_WORKSHEET_JQL = "jira-jql";

    /**
     * Validates the form with specified validator name
     * @constructor
     * @param {String} Validator name
     * @returns {jQuery.Deferred}
     */
    JiraTracker.prototype.validate = function(validatorName) {
        var validatorDef = JiraValidators.get(validatorName),
            validatorForms = [],
            validator = {
                valid: function() {
                    var isValid = true;
                    $.each(validatorForms, function(idx, formObj) {
                        if (isValid) {
                            isValid = formObj.form();
                        }
                    });
                    return isValid;
                },
                errorMap: function() {
                    var resultErrors = {};
                    $.each(validatorForms, function(idx, formObj) {
                        formObj.form();
                        $.extend(resultErrors, formObj.errorMap);
                    });
                    return resultErrors;
                }
            };

        $.each(validatorDef, function(formSelector, validationDef) {
            var $form = $(formSelector),
                oldValidator = $form.data("validator");

            if (oldValidator && oldValidator.reset) {
                $.each(oldValidator.errors(), function(idx, ele) {
                    oldValidator.settings.unhighlight.call(oldValidator, ele, oldValidator.settings.errorClass, oldValidator.settings.validClass);
                });
                oldValidator.reset();
            }
            $form.data("validator", null);
            validatorForms.push($form.validate(validationDef));
        });

        var deferred = $.Deferred();
        if (validator.valid()) {
            this.logger.debug("Validation of", validatorName, "successed.");
            deferred.notifyWith(this);
        } else {
            var errorMessage = "Validation of " + validatorName + " failed.";
            this.logger.error(errorMessage);
            deferred.rejectWith(this, [{
                message: errorMessage,
                errors: validator.errorMap()
            }]);
        }
        return deferred;
    };

    /**
     * Initialization
     * @this {JiraTracker}
     * @return {Object} The deferred request object if release id is available in cache
     */
    JiraTracker.prototype.init = function(options) {
        $.extend(this, options);
        this.injectUI()
            .loadReleaseFromStorage();

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
        $(".container").append(JiraTrackerTemplates["src/views/jira-tracker-form.hbs"]());
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

        var deferred = this.validate("LOAD_RELEASE");

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

    JiraTracker.prototype.compareSnapshot = function() {

        var _this = this;
        var baselineWS = _this.activeRelease.worksheets[BASELINE_SNAPSHOT];
        var latestWS = _this.activeRelease.worksheets[_this.activeRelease.worksheets.length - 1];
        $.when(baselineWS.fetch(), latestWS.fetch())
            .done(function() {
                var baselineSnapshot = new Snapshot(baselineWS.rows);
                var latestSnapshot = new Snapshot(latestWS.rows);

                var inputJson = {
                    snapshot1: baselineSnapshot.summarize(),
                    snapshot2: latestSnapshot.summarize()
                };

                $(".summary-group").html(JiraTrackerTemplates["src/views/summary-form.hbs"](inputJson));
            });
    };

    JiraTracker.prototype.createBaseline = function(evt, baselineTitle) {
        var _this = this;
        if (baselineTitle) {
            $("#releaseTitle").val(baselineTitle);
        }
        baselineTitle = $("#releaseTitle").val();

        var deferred = this.validate("CREATE_BASELINE");

        function validationSuccess() {
            // Create new spreadsheet using GSLoader
            _this.logger.debug("Creating spreadsheet with title =", baselineTitle);
            GSLoader.createSpreadsheet({
                title: baselineTitle
                /* Add callback to update active release value */
            }).then($.proxy(_this, "onReleaseChange")).then(function() {
                // Rename Sheet 1 worksheet to Setup
                return _this.activeRelease.worksheets[0].rename("Setup");
            }).then(function() {
                var releaseSettings = [
                    [JIRA_SETUP_WORKSHEET_JQL],
                    [$("#jiraJQL").val()]
                ];
                // Adds release details into setup worksheet
                _this.logger.debug("Saving release settings into setup worksheet");
                return _this.activeRelease.worksheets[0].addRows(releaseSettings);
            }).then(function() {
                _this.logger.debug("Release settings saved successfully");
                // Once Spreadsheet is created successfully, create a baseline snapshot
                return _this.createSnapshot(evt, "Baseline");
            }).then(function() {
                // Once Baseline is created successfully, execute callbacks
                deferred.resolveWith(_this, [_this.activeRelease]);
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
        this.activeRelease = releaseSheet;
        var setupSheet = this.activeRelease.getWorksheet(JIRA_SETUP_WORKSHEET_TITLE);
        if (setupSheet && setupSheet.rows.length > 0) {
            $("#jiraJQL").val(setupSheet.rows[0][JIRA_SETUP_WORKSHEET_JQL]); //.prop("disabled", true);
            // $("#releaseTitle").prop("disabled", true);
        }
        $("#releaseId").val(this.activeRelease.id);
        $("#releaseTitle").val(this.activeRelease.title);
        this.storage.set("releaseId", this.activeRelease.id);
        return this.activeRelease;
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

        if (_this.activeRelease) {
            /* If Snapshot is not available for a date so can be generated */
            result = todaysDate;
            $.each(_this.activeRelease.worksheets, function(idx, wSheet) {
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

                return _this.activeRelease.createWorksheet({
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
                if (base64Key) {
                    validationSuccess(base64Key);
                } else {
                    $.extend(valObject.errors, {
                        "jira-authentication": "Jira authentication is required"
                    });
                    deferred.rejectWith(_this, [valObject]);
                }
            });
        }

        this.validate("CREATE_SNAPSHOT").then($.noop, formValidationDone, formValidationDone);
        return deferred.promise();
    };
    return new JiraTracker();
});
