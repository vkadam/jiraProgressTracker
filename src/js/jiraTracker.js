/**
 * @author Vishal Kadam https://github.com/vkadam
 */

(function(attachTo, $) {

    /**
     * Creates an instance of JiraIssue.
     *
     * @constructor
     * @this {JiraIssue}
     * @param {Object} jsonObj Attributes of jira issue
     */
    var JiraIssue = function(jsonObj) {
        this.parse(jsonObj);
    };

    JiraIssue.getValue = function(issue, p) {
        var obj = issue;
        for (var i = 0, len = p.length; i < len - 1; i++) {
            obj = obj[p[i]];
        }
        return obj ? obj[p[len - 1]] : null;
    };

    JiraIssue.fields = {
        "Project": ["fields", "project", "key"],
        "Key": ["key"],
        "Issue Type": ["fields", "issuetype", "name"],
        "Summary": ["fields", "summary"],
        "Status": ["fields", "status", "name"],
        "Assignee": ["fields", "assignee", "displayName"],
        "Reporter": ["fields", "reporter", "displayName"],
        "Priority": ["fields", "priority", "name"],
        "Resolution": ["fields", "resolution"],
        "Created Date": ["fields", "created"],
        "Due Date": ["fields", "duedate"],
        "Fix Version": ["fields", "fixVersions"],
        "Resolution Date": ["fields", "resolutiondate"],
        "Component/s": ["fields", "components"],
        "Labels": ["fields", "labels"],
        "Points": ["fields", "customfield_10792"],
        "Team": ["fields", "customfield_11261", "value"],
        "Work Stream": ["fields", "customfield_12544", "value"],
        "Epic/Theme": ["fields", "customfield_10850"],
        "Feature": ["fields", "customfield_12545"]
    };

    JiraIssue.prototype.parse = function(issueData) {
        var _this = this;
        if (issueData) {
            $.each(JiraIssue.fields, function(key, value) {
                _this[key] = JiraIssue.getValue(issueData, value);
            });
        }
        return this;
    };

    JiraIssue.prototype.toArray = function() {
        var _this = this;
        var values = [];
        var attrValue;
        $.each(JiraIssue.fields, function(key) {
            attrValue = _this[key];
            if (("Fix Version" === key || "Component/s" === key) && null !== attrValue) {
                attrValue = [];
                $.each(_this[key], function(idx, val) {
                    attrValue.push(val.name);
                });
                attrValue = attrValue.join("\n");
            } else if (("Labels" === key || "Epic/Theme" === key || "Feature" === key) && null !== attrValue) {
                attrValue = [];
                $.each(_this[key], function(idx, val) {
                    attrValue.push(val);
                });
                attrValue = attrValue.join("\n");
            }
            values.push(attrValue);
        });
        return values;
    };

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

        /*
        var _this = this;
        chrome.runtime.onConnect.addListener(function(port) {
            _this.logger.debug("Inside JiraTracker onConnect response callback", Date());
            port.onMessage.addListener(function(msg) {
                _this.logger.debug("Inside JiraTracker onMessage response callback", Date());
                port.postMessage({
                    counter: msg.counter + 1
                });
            });
        });*/
    };

    /**
     * Inject ui into container div
     * @this {JiraTrackerClass}
     * @return {JiraTrackerClass} Instance of JiraTrackerClass
     */
    JiraTrackerClass.prototype.injectUI = function() {
        $(".container").prepend(JiraTrackerTemplates["src/views/jiraTrackerForm.hbs"]());
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
     * @returns {jQuery.Deffered} Returns validator request i.e. instance of jquery deffered, with errors
     */

    function validateAndProceed(validatorName, callback) {
        var deferred = $.Deferred(),
            lrReq = {};
        // Attach deferred method to return object 
        deferred.promise(lrReq);

        // Validate input 
        var validator = this.validate(validatorName);

        // Attach validator errors to return object 
        $.extend(lrReq, {
            errors: validator.errorMap
        });

        // If input is valid then only call callback 
        if (validator.valid()) {
            this.logger.debug("Validation of", validatorName, "successed.");
            callback.apply(this, [deferred]);
        } else {
            this.logger.debug("Validation of", validatorName, "failed");
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

        return validateAndProceed.call(this, "LOAD_RELEASE", function(deferred) {
            // Add callback to update active release value
            deferred.done(this.onReleaseChange);
            GSLoader.loadSpreadsheet({
                context: this,
                id: releaseId,
                wanted: ["Setup"]
            }).done(function(sSheet) {
                deferred.resolveWith(this, [sSheet]);
            });
        });
    };

    JiraTrackerClass.prototype.createBaseline = function(evt, baselineTitle) {
        var _this = this;
        if (baselineTitle) {
            $("#releaseTitle").val(baselineTitle);
        }
        baselineTitle = $("#releaseTitle").val();

        return validateAndProceed.call(_this, "CREATE_BASELINE", function(deferred) {
            // Create new spreadsheet using GSLoader
            _this.logger.debug("Creating spreadsheet with title =", baselineTitle);
            GSLoader.createSpreadsheet({
                context: _this,
                title: baselineTitle
            }).done(_this.onReleaseChange) // Add callback to update active release value
            .done(function() {
                var titles = [JIRA_SETUP_WORKSHEET_USER_ID, JIRA_SETUP_WORKSHEET_BASIC_AUTH, JIRA_SETUP_WORKSHEET_JQL],
                    base64Encode = Base64.encode($("#jiraUserId").val() + ":" + $("#jiraPassword").val()),
                    values = [$("#jiraUserId").val(), base64Encode, $("#jiraJQL").val()],
                    releaseSettings = [titles, values],
                    // Rename Sheet 1 worksheet to Setup
                    renameReq = _this.activeRelease.worksheets[0].rename("Setup"),
                    // Once Spreadsheet is created successfully, create a baseline snapshot
                    baselineReq = _this.createSnapshot(evt, "Baseline");
                $.when(renameReq, baselineReq).done(function() {
                    // Adds release details into setup worksheet
                    _this.logger.debug("Saving release settings into setup worksheet");
                    _this.activeRelease.worksheets[0].addRows(releaseSettings).done(function() {
                        _this.logger.debug("Release settings saved successfully");
                        // Once Baseline is created successfully, execute callbacks
                        deferred.resolveWith(_this, [_this.activeRelease]);
                    });
                });
            });
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
    };

    JiraTrackerClass.prototype.getSnapshotForToday = function() {
        var _this = this,
            result = false,
            todaysDate = moment().format("MM-DD-YYYY");

        if (_this.activeRelease) {
            this.logger.debug("Checking for today's snapshot");
            $.each(_this.activeRelease.worksheets, function(idx, wSheet) {
                /* its a break of each */
                if (moment(todaysDate, "MM-DD-YYYY").isSame(moment(wSheet.title, "MM-DD-YYYY"))) {
                    result = wSheet;
                    return;
                }
            });
        } else {
            this.logger.debug("No release is loaded, loading last used one");
            _this.loadReleaseFromStorage();
        }
        return result;
    };

    JiraTrackerClass.prototype.createSnapshotForToday = function() {
        this.logger.debug("Creating today's snapshot");
        return this.createSnapshot(null, "Snapshot " + moment().format("MM-DD-YYYY"));
    };

    JiraTrackerClass.prototype.createSnapshot = function(evt, snapshotTitle) {
        var _this = this;
        if (snapshotTitle) {
            $("#snapshotTitle").val(snapshotTitle);
        }
        snapshotTitle = $("#snapshotTitle").val();

        return validateAndProceed.call(this, "CREATE_SNAPSHOT", function(deferred) {
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
            }).done(function(data) {
                if (typeof(data) === "string") {
                    data = JSON.parse(data);
                }
                var headersTitles = [];
                $.each(JiraIssue.fields, function(key) {
                    headersTitles.push(key);
                });

                var jiraIssues = [];
                var jiraIssue;
                $.each(data.issues, function(idx, issue) {
                    jiraIssue = new JiraIssue(issue);
                    jiraIssues.push(jiraIssue.toArray());
                });

                _this.logger.debug("Received jira issues, creating snapshot out of it. Total issue found", data.issues.length);

                _this.activeRelease.createWorksheet({
                    title: snapshotTitle,
                    headers: headersTitles,
                    rowData: jiraIssues,
                    rows: jiraIssues.length + 1,
                    cols: headersTitles.length
                }).done(function(wSheet) {
                    _this.logger.debug("Snapshot", wSheet.title, "created successfully");
                    deferred.resolveWith(this, [wSheet]);
                });
            });
        });
    };

    $.extend(attachTo, {
        JiraTracker: JiraTracker
    });

}(window, jQuery));

// function jiraClient() {
//     /* $.ajax({
//         url : 'http://jira.cengage.com/rest/api/2/search?jql=assignee="vishal.kadam"',
//         headers : { "Authorization": "Basic " + Base64.encode('vishal.kadam:cengagejira')}
//       })
//       .done(function(data, textStatus, jqXHR) {
//         $('.jiraResponse').html(JSON.stringify(data));
//       })
//       .fail(function(jqXHR, textStatus, errorThrown) {
//     });*/

//     var urls = {
//         // "Spreadsheets" : "https://spreadsheets.google.com/feeds/spreadsheets/private/full",
//         // "list_basic" : "https://spreadsheets.google.com/feeds/list/0AlpsUVqaDZHSdG4yR2hXZjJpbmRNS2s3RTU4eVQyQ2c/od6/private/basic",
//         // "Private_Basic" : "https://spreadsheets.google.com/feeds/worksheets/0AlpsUVqaDZHSdG4yR2hXZjJpbmRNS2s3RTU4eVQyQ2c/private/basic",
//         // "Private_Full" : "https://spreadsheets.google.com/feeds/worksheets/0AlpsUVqaDZHSdG4yR2hXZjJpbmRNS2s3RTU4eVQyQ2c/private/full",
//         // "list_full": "https://spreadsheets.google.com/feeds/list/0AlpsUVqaDZHSdE9xQlZBVVVNTWJ0dkRxM2w0RktXb2c/od6/private/full"
//         // "document_list_api": "https://docs.google.com/feeds/default/private/full"
//         // "cell_feed": "https://spreadsheets.google.com/feeds/cells/0AlpsUVqaDZHSdE9xQlZBVVVNTWJ0dkRxM2w0RktXb2c/od6/private/full/"
//     };

//     $.each(urls, function(key, value) {
//         $.ajax({
//             url: value
//         }).done(function(data, textStatus, jqXHR) {
//             //console.log(key, value, data);
//             console.log(jqXHR.responseText);
//         });
//     });
// }

$(function() {
    JiraTracker.init();
    $(".load-release").click($.proxy(JiraTracker.loadRelease, JiraTracker));
    $(".create-release").click($.proxy(JiraTracker.createBaseline, JiraTracker));
    $(".create-snapshot").click($.proxy(JiraTracker.createSnapshot, JiraTracker));
    /*chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
        console.log("Updated", tabId, changeInfo, tab);
    });*/

    /*function someFun() {
        //Call cache userData
        return;
    }
    window.onbeforeunload = someFun;*/
});

/**
 * Called when the client library is loaded.
 */

window.googleDriveClientLoaded = function() {
    GSLoader.auth.setClientId("1074663392007.apps.googleusercontent.com").onLoad(GSLoader.drive.load, GSLoader.drive);
};
