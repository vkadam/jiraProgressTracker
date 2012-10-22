(function(attachTo, $) {

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

    //var JiraIssue = new JiraIssue();
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

    var JiraTrackerClass = function() {
            this.activeRelease = null;
        };

    var JiraTracker = new JiraTrackerClass();

    JiraTrackerClass.prototype.loadRelease = function(releaseId) {
        var deferred = $.Deferred(),
            lrReq = {};
        deferred.promise(lrReq);

        if (typeof(releaseId) !== "string") {
            releaseId = $("#releaseId").val();
        }

        GSLoader.loadSpreadsheet({
            context: this,
            id: releaseId
        }).done(function(sSheet) {
            deferred.resolveWith(this, [sSheet]);
            this.onReleaseChange.apply(this, [sSheet]);
        });
        return lrReq;
    };

    JiraTrackerClass.prototype.createBaseline = function(evt, baselineTitle) {
        if (typeof(baselineTitle) !== "string") {
            baselineTitle = $("#releaseTitle").val();
        }
        GSLoader.createSpreadsheet({
            context: this,
            title: baselineTitle
        }).done(function(spreadsheet) {
            this.onReleaseChange(spreadsheet);
            //this.createSnapshot(evt, "Baseline");
        });
    };

    JiraTrackerClass.prototype.onReleaseChange = function(releaseSheet) {
        this.activeRelease = releaseSheet;
        $("#releaseId").val(this.activeRelease.id);
        $("#releaseTitle").val(this.activeRelease.title);
    };

    JiraTrackerClass.prototype.createSnapshot = function(evt, worksheetTitle) {
        var _this = this;
        if (!this.activeRelease) {
            throw "Release is not loaded";
        }
        var base64Encode = Base64.encode($("#jiraUseId").val() + ":" + $("#jiraPassword").val());

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
            });
        });
    };

    $.extend(attachTo, {
        JiraTracker: JiraTracker
    });

}(window, jQuery));

function jiraClient() {
/* $.ajax({
        url : 'http://jira.cengage.com/rest/api/2/search?jql=assignee="vishal.kadam"',
        headers : { "Authorization": "Basic " + Base64.encode('vishal.kadam:cengagejira')}
      })
      .done(function(data, textStatus, jqXHR) {
        $('.jiraResponse').html(JSON.stringify(data));
      })
      .fail(function(jqXHR, textStatus, errorThrown) {
    });*/

    var urls = {
        // "Spreadsheets" : "https://spreadsheets.google.com/feeds/spreadsheets/private/full",
        // "list_basic" : "https://spreadsheets.google.com/feeds/list/0AlpsUVqaDZHSdG4yR2hXZjJpbmRNS2s3RTU4eVQyQ2c/od6/private/basic",
        // "Private_Basic" : "https://spreadsheets.google.com/feeds/worksheets/0AlpsUVqaDZHSdG4yR2hXZjJpbmRNS2s3RTU4eVQyQ2c/private/basic",
        // "Private_Full" : "https://spreadsheets.google.com/feeds/worksheets/0AlpsUVqaDZHSdG4yR2hXZjJpbmRNS2s3RTU4eVQyQ2c/private/full",
        // "list_full": "https://spreadsheets.google.com/feeds/list/0AlpsUVqaDZHSdE9xQlZBVVVNTWJ0dkRxM2w0RktXb2c/od6/private/full"
        // "document_list_api": "https://docs.google.com/feeds/default/private/full"
        // "cell_feed": "https://spreadsheets.google.com/feeds/cells/0AlpsUVqaDZHSdE9xQlZBVVVNTWJ0dkRxM2w0RktXb2c/od6/private/full/"
    };

    $.each(urls, function(key, value) {
        $.ajax({
            url: value
        }).done(function(data, textStatus, jqXHR) {
            //console.log(key, value, data);
            console.log(jqXHR.responseText);
        });
    });
}

$(function() {
    jiraClient();
    $(".load-release").click($.proxy(JiraTracker.loadRelease, JiraTracker));
    $(".create-release").click($.proxy(JiraTracker.createBaseline, JiraTracker));
    $(".create-snapshot").click($.proxy(JiraTracker.createSnapshot, JiraTracker));
});

/**
 * Called when the client library is loaded.
 */

window.googleDriveClientLoaded = function() {
    GSLoader.enableLog().auth.setClientId("1074663392007.apps.googleusercontent.com").onLoad(GSLoader.drive.load, GSLoader.drive);
};