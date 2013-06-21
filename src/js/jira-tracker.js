/**
 * @author Vishal Kadam https://github.com/vkadam
 */
steal("jquery", "underscore", "js-logger", "handlebars", "moment")
    .then("jquery/validate", "dist/jira-tracker-templates.js", "gsloader",
    "js/base64.js", "js/moment-zone.js", "js/models/jira-issue.js", function() {

    /**
     * User data
     * @define {Object}
     */
    var UserData = {
        releaseId: ""
    };

    /**
     * Creates an instance of JiraTrackerClass.
     *
     * @constructor
     * @this {JiraTrackerClass}
     */
    var JiraTrackerClass = function() {
        this.activeRelease = null;
        Logger.useDefaults(Logger.DEBUG);
        this.logger = Logger.get("jiraTracker");
    };

    var JIRA_SETUP_WORKSHEET_TITLE = "Setup",
        JIRA_SETUP_WORKSHEET_USER_ID = "jira-user-id",
        JIRA_SETUP_WORKSHEET_BASIC_AUTH = "jira-basic-authorization",
        JIRA_SETUP_WORKSHEET_JQL = "jira-jql";

    var JiraTracker = new JiraTrackerClass();

    /**
     * Static instance of all vaditator definition
     */
    var validators = {
        "heighlighter": function(element, errorClass) {
            $(element).parents(".control-group").addClass(errorClass);
        },
        "unheighlighter": function(element, errorClass) {
            $(element).parents(".control-group").removeClass(errorClass);
        },
        "addValidatorType": function(typeName, validatorDef) {
            var defaultValidator = {
                highlight: this.heighlighter,
                unhighlight: this.unheighlighter
            };
            this[typeName] = $.extend(defaultValidator, validatorDef);
        }
    };

    validators.addValidatorType.call(validators, "LOAD_RELEASE", {
        rules: {
            "releaseId": "required"
        },
        messages: {
            "releaseId": "Release id is required"
        }
    });

    validators.addValidatorType.call(validators, "CREATE_BASELINE", {
        rules: {
            "releaseTitle": "required",
            "jiraUserId": "required",
            "jiraPassword": "required",
            "jiraJQL": "required",
            "snapshotTitle": "required"
        },
        messages: {
            "releaseTitle": "Release title is required",
            "jiraUserId": "Jira user name is required",
            "jiraPassword": "Jira password is required",
            "jiraJQL": "Jira JQL is required",
            "snapshotTitle": "Snapshot title is required"
        }
    });

    validators.addValidatorType.call(validators, "CREATE_SNAPSHOT", {
        rules: {
            "releaseId": "required",
            "jiraUserId": "required",
            "jiraPassword": "required",
            "jiraJQL": "required",
            "jiraMaxResults": "required",
            "snapshotTitle": "required"
        },
        messages: {
            "releaseId": "Release is not loaded",
            "jiraUserId": "Jira user name is required",
            "jiraPassword": "Jira password is required",
            "jiraJQL": "Jira JQL is required",
            "jiraMaxResults": "Value of max result from is required",
            "snapshotTitle": "Snapshot title is required"
        }
    });

    /**
     *
     */
    JiraTrackerClass.prototype.validate = function(requestType) {
        var $form = $(".jira-tracker"),
            oldValidator = $.data($form[0], "validator");

        if (oldValidator && oldValidator.reset) {
            $.each(oldValidator.errors(), function(idx, ele) {
                oldValidator.settings.unhighlight.call(oldValidator, ele, oldValidator.settings.errorClass, oldValidator.settings.validClass);
            });
            oldValidator.reset();
        }

        $.data($form[0], "validator", null);
        var validator = $form.validate(validators[requestType]);
        validator.form();
        return validator;
    };

    /**
     * Initialization
     * @this {JiraTrackerClass}
     * @return {Object} The deferred request object if release id is available in cache
     */
    JiraTrackerClass.prototype.init = function(evt) {
        this.injectUI()
            .bindEvents()
            .loadReleaseFromStorage(evt);

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
     * @this {JiraTrackerClass}
     * @return {JiraTrackerClass} Instance of JiraTrackerClass
     */
    JiraTrackerClass.prototype.injectUI = function() {
        $(".container").prepend(JiraTrackerTemplates["src/views/jira-tracker-form.hbs"]());
        return this;
    };

    /**
     * Populates last used values from storage (if any)
     * @this {JiraTrackerClass}
     * @return {Object} The deferred request object if release id is available in cache
     */

    JiraTrackerClass.prototype.loadReleaseFromStorage = function(evt) {
        var _this = this,
            deferred = $.Deferred(),
            lrfsReq = {};
        // Attach deferred method to return object 
        deferred.promise(lrfsReq);

        _this.logger.debug("Getting last saved state from sync storage");

        chrome.storage.sync.get("JiraTracker", function(data) {
            $.extend(UserData, data["JiraTracker"]);
            if (UserData.releaseId && UserData.releaseId.length > 0) {
                _this.logger.debug("Last loaded release was", UserData.releaseId, "loading is again...");
                _this.loadRelease(evt, UserData.releaseId).done(function(sSheet) {
                    _this.logger.debug("Release loaded from last saved state...", sSheet);
                    deferred.resolveWith(_this, [sSheet]);
                }).fail(function(errorMessage, sSheet) {
                    deferred.rejectWith(_this, [errorMessage, sSheet]);
                });
            }
        });
        return lrfsReq;
    };

    /**
     * Bind different types of events to form elements.
     */
    JiraTrackerClass.prototype.bindEvents = function() {
        $("form.jira-tracker input#jiraUserId, form.jira-tracker input#jiraPassword").on("change", function() {
            $("form.jira-tracker input#jiraPassword").removeData(JIRA_SETUP_WORKSHEET_BASIC_AUTH);
        });
        return this;
    };

    /**
     * Validates the form with specified validator name
     * and on success invoke callback with validator request object.
     * @constructor
     * @param {String} Validator name
     * @param {Function} Callback function which will be invoked if form is valid
     * @returns {jQuery.Deferred} Returns validator request i.e. instance of jquery deferred, with errors
     */

    function validateAndProceed(validatorName, successCallBack, errorCallBack) {
        var deferred = $.Deferred(),
            lrReq = {};
        successCallBack = successCallBack || $.noop,
        errorCallBack = errorCallBack || $.noop;
        // Attach deferred method to return object 
        deferred.promise(lrReq);

        // Validate input 
        var validator = this.validate(validatorName);

        // Attach validator errors to return object 
        $.extend(lrReq, {
            errors: validator.errorMap
        });

        // If input is valid then only call successCallBack 
        if (validator.valid()) {
            this.logger.debug("Validation of", validatorName, "successed.");
            successCallBack.apply(this, [deferred]);
        } else {
            var errorMessage = "Validation of " + validatorName + " failed";
            this.logger.debug(errorMessage);
            errorCallBack.apply(this, [errorMessage, deferred]);
        }
        return lrReq;
    }

    /**
     * Loads release by specified release id or value of releaseId element.
     * @this {JiraTrackerClass}
     * @param {String=} Optional release id. If not passed value of releaseId element will be used
     * @return {Object} The deferred request object
     */
    JiraTrackerClass.prototype.loadRelease = function(env, releaseId) {
        // If release id is passed set it to element. 
        if (releaseId) {
            $("#releaseId").val(releaseId);
        }
        releaseId = $("#releaseId").val();
        this.logger.debug("Loading release with id", releaseId);

        function validationSuccess(deferred) {
            // Add callback to update active release value
            GSLoader.loadSpreadsheet({
                context: this,
                id: releaseId,
                wanted: ["Setup"]
            }).then(this.onReleaseChange).then(function(sSheet) {
                deferred.resolveWith(this, [sSheet]);
            }, function(errorMessage, sSheet) {
                deferred.rejectWith(this, [errorMessage, sSheet]);
            });
        }

        return validateAndProceed.call(this, "LOAD_RELEASE", validationSuccess, function(errorMessage, deferred) {
            deferred.rejectWith(this, [errorMessage]);
        });
    };

    JiraTrackerClass.prototype.createBaseline = function(evt, baselineTitle) {
        var _this = this;
        if (baselineTitle) {
            $("#releaseTitle").val(baselineTitle);
        }
        baselineTitle = $("#releaseTitle").val();

        function validationSuccess(deferred) {
            // Create new spreadsheet using GSLoader
            _this.logger.debug("Creating spreadsheet with title =", baselineTitle);
            GSLoader.createSpreadsheet({
                context: _this,
                title: baselineTitle
                /* Add callback to update active release value */
            }).then(_this.onReleaseChange).then(function() {
                // Rename Sheet 1 worksheet to Setup
                return _this.activeRelease.worksheets[0].rename("Setup");
            }).then(function() {
                var titles = [JIRA_SETUP_WORKSHEET_USER_ID, JIRA_SETUP_WORKSHEET_BASIC_AUTH, JIRA_SETUP_WORKSHEET_JQL],
                    base64Encode = Base64.encode($("#jiraUserId").val() + ":" + $("#jiraPassword").val()),
                    values = [$("#jiraUserId").val(), base64Encode, $("#jiraJQL").val()],
                    releaseSettings = [titles, values];
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
                deferred.rejectWith(_this, [errorMessage]);
            });
        }

        return validateAndProceed.call(_this, "CREATE_BASELINE", validationSuccess, function(errorMessage, deferred) {
            deferred.rejectWith(this, [errorMessage]);
        });
    };

    /*
     * Keep updated the JiraTracker with latest release.
     * @param {Object} Spreasheet object which needs to be make active
     */
    JiraTrackerClass.prototype.onReleaseChange = function(releaseSheet) {
        this.activeRelease = releaseSheet;
        var setupSheet = this.activeRelease.getWorksheet(JIRA_SETUP_WORKSHEET_TITLE);
        if (setupSheet && setupSheet.rows.length > 0) {
            $("#jiraUserId").val(setupSheet.rows[0][JIRA_SETUP_WORKSHEET_USER_ID]);
            $("#jiraPassword").val("It5AS3cr3t").data(JIRA_SETUP_WORKSHEET_BASIC_AUTH, setupSheet.rows[0][JIRA_SETUP_WORKSHEET_BASIC_AUTH]);
            $("#jiraJQL").val(setupSheet.rows[0][JIRA_SETUP_WORKSHEET_JQL]).prop("disabled", true);
            $("#releaseTitle").prop("disabled", true);
        }
        $("#releaseId").val(this.activeRelease.id);
        $("#releaseTitle").val(this.activeRelease.title);
        chrome.storage.sync.set({
            "JiraTracker": {
                releaseId: this.activeRelease.id
            }
        });
        return this.activeRelease;
    };

    /**
     * Returns jira server time
     * @this {JiraTrackerClass}
     * @return {Date} Date object of jira server time
     */
    JiraTrackerClass.prototype.getJiraServerTime = function() {
        /* Cengage jira server is in EST */
        return moment().toZone(-4);
    };

    /**
     * Return false if snapshot can not be generated. Else return date as snapshot title
     * @this {JiraTrackerClass}
     * @return {Boolean/String} false if can not be generated else date string
     */
    JiraTrackerClass.prototype.canSnapshotBeGenerated = function() {
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

    JiraTrackerClass.prototype.createSnapshot = function(evt, snapshotTitle) {
        var _this = this;
        if (snapshotTitle) {
            $("#snapshotTitle").val(snapshotTitle);
        }
        snapshotTitle = $("#snapshotTitle").val();

        function validationSuccess(deferred) {
            var base64Encode = $("#jiraPassword").data(JIRA_SETUP_WORKSHEET_BASIC_AUTH);
            if (_.isUndefined(base64Encode)) {
                base64Encode = Base64.encode($("#jiraUserId").val() + ":" + $("#jiraPassword").val());
            }

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
            }).then(function(data, textStatus, jqXHR) {
                var deferred = $.Deferred();
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
                    deferred.resolve(jiraIssues);
                } catch (e) {
                    deferred.reject("Exception while parsing jira issue response");
                }
                return deferred.promise();
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
                deferred.resolveWith(this, [wSheet]);
            }, function(jqXHR, textStatus) {
                deferred.rejectWith(this, [textStatus]);
            });
        }

        return validateAndProceed.call(this, "CREATE_SNAPSHOT", validationSuccess, function(errorMessage, deferred) {
            deferred.rejectWith(this, [errorMessage]);
        });
    };

    $.extend(window, {
        JiraTracker: JiraTracker
    });
    return JiraTracker;
}, function() {
    JiraTracker.init();
    $(".load-release").click($.proxy(JiraTracker.loadRelease, JiraTracker));
    $(".create-release").click($.proxy(JiraTracker.createBaseline, JiraTracker));
    $(".create-snapshot").click($.proxy(JiraTracker.createSnapshot, JiraTracker));
    /**
     * Called when the google drive client library is loaded.
     */
    window.googleDriveClientLoaded = function() {
        GSLoader.auth.setClientId("1074663392007.apps.googleusercontent.com").onLoad(GSLoader.drive.load, GSLoader.drive);
    };
}, "google/client");