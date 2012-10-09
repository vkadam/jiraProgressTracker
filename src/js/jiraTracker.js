(function(attachTo, $) {
    var JiraTrackerClass = function() {
            this.activeRelease = null;
        }

    var JiraTracker = new JiraTrackerClass();

    JiraTrackerClass.prototype.loadRelease = function(releaseId) {
        if (typeof(releaseId) !== "string") {
            releaseId = $("#releaseId").val();
        }
        this.activeRelease = GSLoader.loadSpreadsheet(releaseId);
        this.onReleaseChange.apply(this, [this.activeRelease]);
    };

    JiraTrackerClass.prototype.createBaseline = function(evt, baselineTitle) {
        if (typeof(baselineTitle) !== "string") {
            baselineTitle = $("#releaseTitle").val();
        }
        GSLoader.createSpreadsheet(baselineTitle, function(spreadsheet) {
            this.onReleaseChange(spreadsheet);
            //this.createSnapshot(evt, "Baseline");
        }, this);
    };

    JiraTrackerClass.prototype.onReleaseChange = function(releaseSheet) {
        this.activeRelease = releaseSheet;
        $("#releaseId").val(this.activeRelease.id);
        $("#releaseTitle").val(this.activeRelease.title);
    };

    JiraTrackerClass.dataMapping = {
        "Project": ["fields", "project", "key"],
        "Key": ["key"],
        "Issue Type": ["fields","issuetype","name"],
        "Summary": ["fields", "summary"],
        "Points": ["fields", "customfield_10792"],
        "Status": ["fields", "status", "name"],
        "Assignee": ["fields", "assignee", "displayName"],
        "Reporter": ["fields", "reporter", "displayName"],
        "Priority": ["fields", "priority", "name"],
        "Team": ["fields", "customfield_11261", "value"],
        "Resolution": ["fields", "resolution"],
        "Created Date": ["fields", "created"],
        "Due Date": ["fields", "duedate"],
        "Fix Version": ["fields", "fixVersions", "0", "name"],
        "Resolution Date": ["fields", "resolutiondate"],
        "Component/s": ["fields", "components", "0", "name"],
        "Work Stream": ["fields", "customfield_12544", "value"],
        "Epic/Theme": ["fields", "customfield_10850", "value"],
        "Feature": ["fields", "customfield_12545", "value"],
        "Labels": ["fields", "labels", "0"]
    };

    JiraTrackerClass.get = function(issue, p) {
        var obj = issue;
        for (var i = 0, len = p.length; i < len - 1; i++){
            obj = obj[p[i]];
        }
        return obj ? obj[p[len - 1]] : null;
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
        }).done(function(data, textStatus, jqXHR) {
            if (typeof(data) === "string"){
                data = JSON.parse(data);
            }
            var headersTitles = [];
            $.each(JiraTrackerClass.dataMapping, function(key, value){
                headersTitles.push(key);
            });

            var jiraIssues = [];
            $.each(data.issues, function(idx, issue) {
                var row = [];
                $.each(JiraTrackerClass.dataMapping, function(key, value){
                    row.push(JiraTrackerClass.get(issue, value));
                });
                jiraIssues.push(row);
            });

            _this.activeRelease.createWorksheet({
                title: worksheetTitle || $("#snapshotTitle").val(),
                headers: headersTitles,
                rowData: jiraIssues,
                rows: jiraIssues.length + 1,
                cols: headersTitles.length
            });
        })

    };

    $.extend(attachTo, {
        JiraTracker: JiraTracker
    });

})(window, jQuery);

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
    }

    $.each(urls, function(key, value) {
        $.ajax({
            url: value
        }).done(function(data, textStatus, jqXHR) {
            //console.log(key, value, data);
            console.log(jqXHR.responseText);
        });
    })


}

var currentSpreadsheet;
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
}