(function($) {
    var jiraTracker = function() {}

    jiraTracker.prototype.loadSpreadsheet = function() {
        console.log('inside load spreadsheet');
    };

    $.extend({
        jiraTracker: new jiraTracker()
    })
})(jQuery);

$(function() {});

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

$(function() {
    jiraClient();

    var PRIVATE_SHEET_URL = "https://spreadsheets.google.com/feeds/worksheets/{0}/private/full";
    var WORKSHEET_CREATE_REQ = '<entry xmlns="http://www.w3.org/2005/Atom" '+
                    'xmlns:gs="http://schemas.google.com/spreadsheets/2006">'+
                    '<title>{0}</title>'+
                    '<gs:rowCount>50</gs:rowCount>'+
                    '<gs:colCount>10</gs:colCount>'+
                '</entry>'
    $(".create-baseline").click(function() {
        googleClientApi.drive.createSpreadSheet($("#spreadSheetTitle").val(), function(spreadsheetObj){
            $("#spreadSheetId").val(spreadsheetObj.id);
        });
    })
    $(".create-snapshot").click(function() {
        $.ajax({
            url: PRIVATE_SHEET_URL.format($("#spreadSheetId").val()),
            type: "POST",
            contentType: "application/atom+xml",
            headers: {
                "GData-Version": "3.0"
            },
            data: WORKSHEET_CREATE_REQ.format($("#snapshotTitle").val())
        }).done(function(data, textStatus, jqXHR) {
            console.log(jqXHR.responseText);
        });
    })
});

/**
 * Called when the client library is loaded.
 */

window.googleDrieClientLoaded = function() {
    googleClientApi.onLoad();
}