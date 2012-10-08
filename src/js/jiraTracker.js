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
            this, createSnapshot(evt, "Baseline");
        }, this);
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
            url: 'http://jira.cengage.com/rest/api/2/search?maxResults=' + $("#jiraMaxResults").val() + '&jql=' + $("#jiraJQL").val(),
            headers: {
                "Authorization": "Basic " + base64Encode
            }
        }).done(function(data, textStatus, jqXHR) {
            //$('.jiraResponse').html(JSON.stringify(data));
            var jiraIssues = [];
/*    Original    Escaped
            '   &apos;
            "   &quot;
            &   &amp;
            <   &lt;
            >   &gt; */
            $.each(data.issues, function(idx, issue) {
                var summary = issue.fields.summary.encodeXML();
                var points = issue.fields.customfield_10792 ? issue.fields.customfield_10792 : "";
                var team = issue.fields.customfield_11261 ? issue.fields.customfield_11261.value : "";
                jiraIssues.push([issue.key, summary, points, issue.fields.issuetype.name, issue.fields.status.name, team])
            });

            _this.activeRelease.createWorksheet({
                title: worksheetTitle || $("#snapshotTitle").val(),
                headers: ["Key", "Summary", "Points", "Issue Type", "Status", "Team"],
                rowData: jiraIssues,
                rows: jiraIssues.length + 1,
                cols: 6
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

window.googleDrieClientLoaded = function() {
    GSLoader.enableLog().auth.setClientId("1074663392007.apps.googleusercontent.com").onLoad(GSLoader.drive.load, GSLoader.drive);
}

if (!String.prototype.encodeXML) {
  String.prototype.encodeXML = function () {
    return this.replace(/&/g, '&amp;')
               .replace(/</g, '&lt;')
               .replace(/>/g, '&gt;')
               .replace(/"/g, '&quot;')
               .replace(/'/g, '&apos;');
  };
}