/* Jira Progress Tracker - v0.0.2rc - 2013-02-24
* https://github.com/vkadam/jiraProgressTracker
* Copyright (c) 2013 Vishal Kadam; Licensed MIT */
/**
 *
 *  Base64 encode / decode
 *  http://www.webtoolkit.info/
 *
 **/

var Base64 = {

    // private property
    _keyStr: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",

    // public method for encoding
    encode: function(input) {
        var output = "";
        var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
        var i = 0;

        input = Base64._utf8_encode(input);

        while (i < input.length) {

            chr1 = input.charCodeAt(i++);
            chr2 = input.charCodeAt(i++);
            chr3 = input.charCodeAt(i++);

            enc1 = chr1 >> 2;
            enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
            enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
            enc4 = chr3 & 63;

            if (isNaN(chr2)) {
                enc3 = enc4 = 64;
            } else if (isNaN(chr3)) {
                enc4 = 64;
            }

            output = output + this._keyStr.charAt(enc1) + this._keyStr.charAt(enc2) + this._keyStr.charAt(enc3) + this._keyStr.charAt(enc4);

        }

        return output;
    },

    // public method for decoding
    decode: function(input) {
        var output = "";
        var chr1, chr2, chr3;
        var enc1, enc2, enc3, enc4;
        var i = 0;

        input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");

        while (i < input.length) {

            enc1 = this._keyStr.indexOf(input.charAt(i++));
            enc2 = this._keyStr.indexOf(input.charAt(i++));
            enc3 = this._keyStr.indexOf(input.charAt(i++));
            enc4 = this._keyStr.indexOf(input.charAt(i++));

            chr1 = (enc1 << 2) | (enc2 >> 4);
            chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
            chr3 = ((enc3 & 3) << 6) | enc4;

            output = output + String.fromCharCode(chr1);

            if (enc3 !== 64) {
                output = output + String.fromCharCode(chr2);
            }
            if (enc4 !== 64) {
                output = output + String.fromCharCode(chr3);
            }

        }

        output = Base64._utf8_decode(output);

        return output;

    },

    // private method for UTF-8 encoding
    _utf8_encode: function(string) {
        string = string.replace(/\r\n/g, "\n");
        var utftext = "";

        for (var n = 0; n < string.length; n++) {

            var c = string.charCodeAt(n);

            if (c < 128) {
                utftext += String.fromCharCode(c);
            } else if ((c > 127) && (c < 2048)) {
                utftext += String.fromCharCode((c >> 6) | 192);
                utftext += String.fromCharCode((c & 63) | 128);
            } else {
                utftext += String.fromCharCode((c >> 12) | 224);
                utftext += String.fromCharCode(((c >> 6) & 63) | 128);
                utftext += String.fromCharCode((c & 63) | 128);
            }

        }

        return utftext;
    },

    // private method for UTF-8 decoding
    _utf8_decode: function(utftext) {
        var string = "";
        var i = 0,
            c = 0,
            c1 = 0;

        while (i < utftext.length) {

            c = utftext.charCodeAt(i);

            if (c < 128) {
                string += String.fromCharCode(c);
                i++;
            } else if ((c > 191) && (c < 224)) {
                c1 = utftext.charCodeAt(i + 1);
                string += String.fromCharCode(((c & 31) << 6) | (c1 & 63));
                i += 2;
            } else {
                c1 = utftext.charCodeAt(i + 1);
                c3 = utftext.charCodeAt(i + 2);
                string += String.fromCharCode(((c & 15) << 12) | ((c1 & 63) << 6) | (c3 & 63));
                i += 3;
            }

        }

        return string;
    }

};;
/**********************************/
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
     * Initialization, populates last used values from storage (if any) 
     * @this {JiraTrackerClass}
     * @return {Object} The deferred request object if release id is available in cache
     */
    JiraTrackerClass.prototype.init = function(evt) {
        var _this = this;
        this.bindEvents();
        chrome.storage.sync.get("JiraTracker", function(data) {
            $.extend(UserData, data["JiraTracker"]);
            if (UserData.releaseId && UserData.releaseId.length > 0) {
                return _this.loadRelease(evt, UserData.releaseId);
            }
        });
    };

    /**
     * Bind different types of events to form elements.
     */
    JiraTrackerClass.prototype.bindEvents = function() {
        $("form.jira-tracker input#jiraUserId, form.jira-tracker input#jiraPassword").on("change", function() {
            $("form.jira-tracker input#jiraPassword").removeData(JIRA_SETUP_WORKSHEET_BASIC_AUTH);
        });
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
            callback.apply(this, [deferred]);
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
            GSLoader.log("Creating spreadsheet with title =", baselineTitle);
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
                    GSLoader.log("Saving release settings into setup worksheet");
                    _this.activeRelease.worksheets[0].addRows(releaseSettings).done(function() {
                        GSLoader.log("Release settings saved successfully");
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

    JiraTrackerClass.prototype.createSnapshot = function(evt, worksheetTitle) {
        var _this = this;
        return validateAndProceed.call(this, "CREATE_SNAPSHOT", function(deferred) {
            var base64Encode = $("#jiraPassword").data(JIRA_SETUP_WORKSHEET_BASIC_AUTH);
            if (_.isUndefined(base64Encode)) {
                base64Encode = Base64.encode($("#jiraUserId").val() + ":" + $("#jiraPassword").val());
            }

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
                _this.activeRelease.createWorksheet({
                    title: worksheetTitle || $("#snapshotTitle").val(),
                    headers: headersTitles,
                    rowData: jiraIssues,
                    rows: jiraIssues.length + 1,
                    cols: headersTitles.length
                }).done(function(wSheet) {
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
    GSLoader.enableLog().auth.setClientId("1074663392007.apps.googleusercontent.com").onLoad(GSLoader.drive.load, GSLoader.drive);
};