this["JiraTrackerTemplates"] = this["JiraTrackerTemplates"] || {};

this["JiraTrackerTemplates"]["src/views/jiraTrackerForm.hbs"] = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [2,'>= 1.0.0-rc.3'];
helpers = helpers || Handlebars.helpers; data = data || {};
  


  return "<form class=\"form-horizontal jira-tracker\">\n	<div class=\"control-group\">\n		<label class=\"control-label\" for=\"jiraUserId\">Jira User Id</label>\n		<div class=\"controls\">\n			<input type=\"text\" id=\"jiraUserId\" name=\"jiraUserId\" placeholder=\"Jira User Id\" />\n		</div>\n	</div>\n	<div class=\"control-group\">\n		<label class=\"control-label\" for=\"jiraPassword\">Password</label>\n		<div class=\"controls\">\n			<input type=\"password\" id=\"jiraPassword\" name=\"jiraPassword\" placeholder=\"Password\" />\n		</div>\n	</div>\n	<div class=\"control-group\">\n		<label class=\"control-label\" for=\"releaseTitle\">Release Title</label>\n		<div class=\"controls\">\n			<input class=\"span6\" type=\"text\" id=\"releaseId\" name=\"releaseId\" placeholder=\"Release Spreadsheet Id\" />\n			<input type=\"text\" id=\"releaseTitle\" name=\"releaseTitle\" placeholder=\"Release Spreadsheet Title\" />\n		</div>\n	</div>\n	<div class=\"control-group\">\n		<label class=\"control-label\" for=\"snapshotTitle\">Snapshot Title</label>\n		<div class=\"controls\">\n			<input type=\"text\" id=\"snapshotTitle\" name=\"snapshotTitle\" placeholder=\"Snapshot Title\"/>\n		</div>\n	</div>\n	<div class=\"control-group\">\n		<label class=\"control-label\" for=\"jiraJQL\">Jira JQL</label>\n		<div class=\"controls\">\n			<textarea class=\"span8\" id=\"jiraJQL\" name=\"jiraJQL\" placeholder=\"Jira JQL\" rows=\"4\"></textarea>\n			<input type=\"text\" id=\"jiraMaxResults\" name=\"jiraMaxResults\" placeholder=\"Max Results\" value=\"999\" class=\"hide\"/>\n		</div>\n	</div>\n	<div class=\"control-group\">\n		<div class=\"controls\">\n			<button type=\"button\" class=\"btn load-release btn-primary\">Load Release</button>\n			<button type=\"button\" class=\"btn create-release\">Create Release (Baseline)</button>\n			<button type=\"button\" class=\"btn create-snapshot\">Create Snapshot</button>\n		</div>\n	</div>\n</form>";
  });