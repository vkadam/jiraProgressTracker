define(['handlebars'], function(Handlebars) {

this["JiraTrackerTemplates"] = this["JiraTrackerTemplates"] || {};

this["JiraTrackerTemplates"]["src/views/jira-tracker-form.hbs"] = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  


  return "<form class=\"form-horizontal jira-tracker\">\n	<div class=\"control-group\">\n		<label class=\"control-label\" for=\"jiraUserId\">Jira User Id</label>\n		<div class=\"controls\">\n			<input type=\"text\" id=\"jiraUserId\" name=\"jiraUserId\" placeholder=\"Jira User Id\" />\n		</div>\n	</div>\n	<div class=\"control-group\">\n		<label class=\"control-label\" for=\"jiraPassword\">Password</label>\n		<div class=\"controls\">\n			<input type=\"password\" id=\"jiraPassword\" name=\"jiraPassword\" placeholder=\"Password\" />\n		</div>\n	</div>\n	<div class=\"control-group\">\n		<label class=\"control-label\" for=\"releaseTitle\">Release Title</label>\n		<div class=\"controls\">\n			<input class=\"span6\" type=\"text\" id=\"releaseId\" name=\"releaseId\" placeholder=\"Release Spreadsheet Id\" />\n			<input type=\"text\" id=\"releaseTitle\" name=\"releaseTitle\" placeholder=\"Release Spreadsheet Title\" />\n		</div>\n	</div>\n	<div class=\"control-group\">\n		<label class=\"control-label\" for=\"snapshotTitle\">Snapshot Title</label>\n		<div class=\"controls\">\n			<input type=\"text\" id=\"snapshotTitle\" name=\"snapshotTitle\" placeholder=\"Snapshot Title\"/>\n		</div>\n	</div>\n	<div class=\"control-group\">\n		<label class=\"control-label\" for=\"jiraJQL\">Jira JQL</label>\n		<div class=\"controls\">\n			<textarea class=\"span8\" id=\"jiraJQL\" name=\"jiraJQL\" placeholder=\"Jira JQL\" rows=\"4\"></textarea>\n			<input type=\"text\" id=\"jiraMaxResults\" name=\"jiraMaxResults\" placeholder=\"Max Results\" value=\"999\" class=\"hide\"/>\n		</div>\n	</div>\n	<div class=\"control-group\">\n		<div class=\"controls\">\n			<button type=\"button\" class=\"btn load-release btn-primary\">Load Release</button>\n			<button type=\"button\" class=\"btn create-release\">Create Release (Baseline)</button>\n			<button type=\"button\" class=\"btn create-snapshot\">Create Snapshot</button>\n			<button type=\"button\" class=\"btn compare-snapshot\">Compare Snapshots</button>\n		</div>\n	</div>\n</form>\n<div class=\"summary-group\"></div>";
  });

this["JiraTrackerTemplates"]["src/views/summary-form.hbs"] = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "", stack1, functionType="function", escapeExpression=this.escapeExpression, helperMissing=helpers.helperMissing, self=this;

function program1(depth0,data,depth1) {
  
  var buffer = "", stack1, options;
  buffer += "\n    <tr>\n     	<td>"
    + escapeExpression(((stack1 = ((stack1 = data),stack1 == null || stack1 === false ? stack1 : stack1.key)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</td>\n     	<td>"
    + escapeExpression((typeof depth0 === functionType ? depth0.apply(depth0) : depth0))
    + "</td>\n		<td>";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.get || depth1.get),stack1 ? stack1.call(depth0, depth1.snapshot2, ((stack1 = data),stack1 == null || stack1 === false ? stack1 : stack1.key), options) : helperMissing.call(depth0, "get", depth1.snapshot2, ((stack1 = data),stack1 == null || stack1 === false ? stack1 : stack1.key), options)))
    + "</td>\n		<td>";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.subtract || depth1.subtract),stack1 ? stack1.call(depth0, depth1.snapshot1, depth1.snapshot2, ((stack1 = data),stack1 == null || stack1 === false ? stack1 : stack1.key), options) : helperMissing.call(depth0, "subtract", depth1.snapshot1, depth1.snapshot2, ((stack1 = data),stack1 == null || stack1 === false ? stack1 : stack1.key), options)))
    + "</td>\n    </tr>\n    ";
  return buffer;
  }

  buffer += "<table class=\"table .table-striped\">\n	<thead>\n	    <tr>\n	     	<th>Matric</th>\n	      	<th>Baseline</th>\n	      	<th>Current</th>\n	      	<th>Change +/-</th>\n	    </tr>\n	</thead>\n  <tbody>\n    ";
  stack1 = helpers.each.call(depth0, depth0.snapshot1, {hash:{},inverse:self.noop,fn:self.programWithDepth(1, program1, data, depth0),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n  </tbody>\n</table>";
  return buffer;
  });

return this["JiraTrackerTemplates"];

});