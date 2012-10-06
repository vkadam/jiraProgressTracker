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
    };

    JiraTrackerClass.prototype.createBaseline = function(baselineTitle) {
        if (typeof(baselineTitle) !== "string") {
            baselineTitle = $("#releaseTitle").val();
        }
        GSLoader.createSpreadsheet(baselineTitle, this.onReleaseChange, this);
    };

    JiraTrackerClass.prototype.onReleaseChange = function(releaseSheet) {
        this.activeRelease = releaseSheet;
    };

    JiraTrackerClass.prototype.createSnapshot = function() {
        if (!this.activeRelease) {
            throw "Release is not loaded";
        }
        this.activeRelease.createWorksheet($("#snapshotTitle").val());
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


    //GSLoader.loadSheet({key : "0AlpsUVqaDZHSdG4yR2hXZjJpbmRNS2s3RTU4eVQyQ2c", debug: true})
    var urls = {
        // "Spreadsheets" : "https://spreadsheets.google.com/feeds/spreadsheets/private/full",
        // "list_basic" : "https://spreadsheets.google.com/feeds/list/0AlpsUVqaDZHSdG4yR2hXZjJpbmRNS2s3RTU4eVQyQ2c/od6/private/basic",
        // "Private_Basic" : "https://spreadsheets.google.com/feeds/worksheets/0AlpsUVqaDZHSdG4yR2hXZjJpbmRNS2s3RTU4eVQyQ2c/private/basic",
        // "Private_Full" : "https://spreadsheets.google.com/feeds/worksheets/0AlpsUVqaDZHSdG4yR2hXZjJpbmRNS2s3RTU4eVQyQ2c/private/full",
        // "list_full": "https://spreadsheets.google.com/feeds/list/0AlpsUVqaDZHSdG4yR2hXZjJpbmRNS2s3RTU4eVQyQ2c/od6/private/full"
        // "document_list_api": "https://docs.google.com/feeds/default/private/full"
    }

    $.each(urls, function(key, value) {
        $.ajax({
            url: value
        }).done(function(data, textStatus, jqXHR) {
            //console.log(key, value, data);
            console.log(jqXHR.responseText);
        });
    })

    var spreadsheets = [
    // "0AlpsUVqaDZHSdG4yR2hXZjJpbmRNS2s3RTU4eVQyQ2c", 
    // "0AquDXlXxVjqPdElEQ3RSTzZ5SG4zVUN5UWQzYnZQbnc"
    ];
    $.each(spreadsheets, function(key, value) {
        GSLoader.loadSpreadsheet(value).done(function(spreadsheet) {
            console.log(this.title, this);
        });
    });
}

var currentSpreadsheet;
$(function() {
    jiraClient();
    $(".create-baseline").click(function() {
        GSLoader.createSpreadsheet($("#spreadSheetTitle").val(), function(spreadSheet) {
            $("#spreadSheetId").val(spreadSheet.key);
            currentSpreadsheet = spreadSheet;
        });
    })
    $(".create-snapshot").click(function() {
        currentSpreadsheet.createWorksheet($("#snapshotTitle").val());
    })
});

/**
 * Called when the client library is loaded.
 */

window.googleDrieClientLoaded = function() {
    GSLoader.enableLog().auth.setClientId("1074663392007.apps.googleusercontent.com").onLoad(GSLoader.drive.load, GSLoader.drive);
}