define(['handlebars'], function(Handlebars) {

this["JiraTrackerTemplates"] = this["JiraTrackerTemplates"] || {};

this["JiraTrackerTemplates"]["src/views/jira-credentials.hbs"] = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  


  return "<div class=\"form-group\">\n	<label class=\"control-label col-lg-4\" for=\"jiraUserId\">Jira User Id</label>\n	<div class=\"col-lg-6\">\n		<input type=\"text\" id=\"jiraUserId\" class=\"form-control\" name=\"jiraUserId\" placeholder=\"Jira User Id\"/>\n	</div>\n</div>\n<div class=\"form-group\">\n	<label class=\"control-label col-lg-4\" for=\"jiraPassword\">Password</label>\n	<div class=\"col-lg-6\">\n		<input type=\"password\" id=\"jiraPassword\" class=\"form-control\" name=\"jiraPassword\" placeholder=\"Password\"/>\n	</div>\n</div>\n";
  });

this["JiraTrackerTemplates"]["src/views/jira-tracker-form.hbs"] = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  


  return "<form id=\"jira-tracker\" class=\"form-horizontal\">\n	<div class=\"form-group\">\n		<label class=\"control-label col-lg-3 col-lg-3\" for=\"releaseTitle\">Release Title</label>\n		<div class=\"col-lg-7\">\n			<input class=\"form-control\" type=\"text\" id=\"releaseId\" name=\"releaseId\" placeholder=\"Release Spreadsheet Id\" />\n			<input class=\"form-control\" type=\"text\" id=\"releaseTitle\" name=\"releaseTitle\" placeholder=\"Release Spreadsheet Title\" />\n		</div>\n	</div>\n	<div class=\"form-group\">\n		<label class=\"control-label col-lg-3\" for=\"snapshotTitle\">Snapshot Title</label>\n		<div class=\"col-lg-7\">\n			<input class=\"form-control\" type=\"text\" id=\"snapshotTitle\" name=\"snapshotTitle\" placeholder=\"Snapshot Title\"/>\n		</div>\n	</div>\n	<div class=\"form-group\">\n		<label class=\"control-label col-lg-3\" for=\"jiraJQL\">Jira JQL</label>\n		<div class=\"col-lg-7\">\n			<textarea class=\"form-control\" id=\"jiraJQL\" name=\"jiraJQL\" placeholder=\"Jira JQL\" rows=\"4\"></textarea>\n			<input class=\"form-control hide\" id=\"jiraMaxResults\" name=\"jiraMaxResults\" placeholder=\"Max Results\" value=\"999\" />\n		</div>\n	</div>\n	<div class=\"form-group\">\n		<div class=\"col-lg-9 pull-right\">\n			<button type=\"button\" class=\"btn load-release\">Load Release</button>\n			<button type=\"button\" class=\"btn create-release\">Create Release</button>\n			<button type=\"button\" class=\"btn create-snapshot\">Create Snapshot</button>\n			<button type=\"button\" class=\"btn compare-snapshot\">Compare Snapshots</button>\n		</div>\n	</div>\n</form>\n<div class=\"summary-group\"></div>";
  });

this["JiraTrackerTemplates"]["src/views/summary-form.hbs"] = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "", stack1, stack2, helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression, functionType="function", self=this;

function program1(depth0,data,depth1) {
  
  var buffer = "", stack1, stack2, options;
  buffer += "\n    <tr>\n     	<td>"
    + escapeExpression(((stack1 = ((stack1 = data),stack1 == null || stack1 === false ? stack1 : stack1.key)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</td>\n     	<td>"
    + escapeExpression((typeof depth0 === functionType ? depth0.apply(depth0) : depth0))
    + "</td>\n		<td>";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.get || depth1.get),stack1 ? stack1.call(depth0, ((stack1 = depth1.latest),stack1 == null || stack1 === false ? stack1 : stack1.data), ((stack1 = data),stack1 == null || stack1 === false ? stack1 : stack1.key), options) : helperMissing.call(depth0, "get", ((stack1 = depth1.latest),stack1 == null || stack1 === false ? stack1 : stack1.data), ((stack1 = data),stack1 == null || stack1 === false ? stack1 : stack1.key), options)))
    + "</td>\n		";
  stack2 = helpers['if'].call(depth0, depth1.lastWeekSnapshot, {hash:{},inverse:self.program(4, program4, data),fn:self.programWithDepth(2, program2, data, depth1),data:data});
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += "\n		<td>";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.subtract || depth1.subtract),stack1 ? stack1.call(depth0, ((stack1 = depth1.baseline),stack1 == null || stack1 === false ? stack1 : stack1.data), ((stack1 = depth1.latest),stack1 == null || stack1 === false ? stack1 : stack1.data), ((stack1 = data),stack1 == null || stack1 === false ? stack1 : stack1.key), options) : helperMissing.call(depth0, "subtract", ((stack1 = depth1.baseline),stack1 == null || stack1 === false ? stack1 : stack1.data), ((stack1 = depth1.latest),stack1 == null || stack1 === false ? stack1 : stack1.data), ((stack1 = data),stack1 == null || stack1 === false ? stack1 : stack1.key), options)))
    + "</td>\n    </tr>\n    ";
  return buffer;
  }
function program2(depth0,data,depth2) {
  
  var buffer = "", stack1, options;
  buffer += "\n			<td>";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.subtract || depth2.subtract),stack1 ? stack1.call(depth0, ((stack1 = depth2.weekb4lastSnapshot),stack1 == null || stack1 === false ? stack1 : stack1.data), ((stack1 = depth2.lastWeekSnapshot),stack1 == null || stack1 === false ? stack1 : stack1.data), ((stack1 = data),stack1 == null || stack1 === false ? stack1 : stack1.key), options) : helperMissing.call(depth0, "subtract", ((stack1 = depth2.weekb4lastSnapshot),stack1 == null || stack1 === false ? stack1 : stack1.data), ((stack1 = depth2.lastWeekSnapshot),stack1 == null || stack1 === false ? stack1 : stack1.data), ((stack1 = data),stack1 == null || stack1 === false ? stack1 : stack1.key), options)))
    + " </td>\n			<td>";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.subtract || depth2.subtract),stack1 ? stack1.call(depth0, ((stack1 = depth2.lastWeekSnapshot),stack1 == null || stack1 === false ? stack1 : stack1.data), ((stack1 = depth2.latest),stack1 == null || stack1 === false ? stack1 : stack1.data), ((stack1 = data),stack1 == null || stack1 === false ? stack1 : stack1.key), options) : helperMissing.call(depth0, "subtract", ((stack1 = depth2.lastWeekSnapshot),stack1 == null || stack1 === false ? stack1 : stack1.data), ((stack1 = depth2.latest),stack1 == null || stack1 === false ? stack1 : stack1.data), ((stack1 = data),stack1 == null || stack1 === false ? stack1 : stack1.key), options)))
    + " </td>\n		";
  return buffer;
  }

function program4(depth0,data) {
  
  
  return "\n		<td> No data available </td>\n		<td> No data available </td>\n		";
  }

  buffer += "<table class=\"table .table-striped\">\n	<thead>\n	    <tr>\n	     	<th>Matric</th>\n	      	<th>Baseline</th>\n	       	<th>Current</th>\n	     	<th>Last Week Data</br>"
    + escapeExpression(((stack1 = ((stack1 = depth0.lastWeekSnapshot),stack1 == null || stack1 === false ? stack1 : stack1.date)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + " </th>\n	      	<th>This Week Data </th> \n	      	<th>Project to Date Data</th> \n	    </tr>\n	</thead>\n  <tbody>\n 	";
  stack2 = helpers.each.call(depth0, ((stack1 = depth0.baseline),stack1 == null || stack1 === false ? stack1 : stack1.data), {hash:{},inverse:self.noop,fn:self.programWithDepth(1, program1, data, depth0),data:data});
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += "\n  </tbody>\n</table>";
  return buffer;
  });

return this["JiraTrackerTemplates"];

});