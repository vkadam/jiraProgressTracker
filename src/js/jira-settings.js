// /**
//  * Bind different types of events to form elements.
//  */
// JiraTracker.prototype.bindEvents = function() {
//     $("form#jira-credentials input#jiraUserId, form#jira-credentials input#jiraPassword").on("change", function() {
//         $("form#jira-credentials input#jiraPassword").removeData(JIRA_SETUP_WORKSHEET_BASIC_AUTH);
//     });
//     return this;
// };

// var base64Encode = $("#jiraPassword").data(JIRA_SETUP_WORKSHEET_BASIC_AUTH);
// if (_.isUndefined(base64Encode)) {
//     base64Encode = Base64.encode($("#jiraUserId").val() + ":" + $("#jiraPassword").val());
// }
