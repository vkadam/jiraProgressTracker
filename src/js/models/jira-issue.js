define(['jquery'], function($) {
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
        'Project': ['fields', 'project', 'key'],
        'Key': ['key'],
        'Issue Type': ['fields', 'issuetype', 'name'],
        'Summary': ['fields', 'summary'],
        'Status': ['fields', 'status', 'name'],
        'Assignee': ['fields', 'assignee', 'displayName'],
        'Reporter': ['fields', 'reporter', 'displayName'],
        'Priority': ['fields', 'priority', 'name'],
        'Resolution': ['fields', 'resolution', 'name'],
        'Created Date': ['fields', 'created'],
        'Due Date': ['fields', 'duedate'],
        'Fix Version': ['fields', 'fixVersions'],
        'Resolution Date': ['fields', 'resolutiondate'],
        'Component/s': ['fields', 'components'],
        'Labels': ['fields', 'labels'],
        'Points': ['fields', 'customfield_10792'],
        'Team': ['fields', 'customfield_11261', 'value'],
        'Work Stream': ['fields', 'customfield_12544', 'value'],
        'Epic/Theme': ['fields', 'customfield_10850'],
        'Feature': ['fields', 'customfield_12545']
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
            if (('Fix Version' === key || 'Component/s' === key) && null !== attrValue) {
                attrValue = [];
                $.each(_this[key], function(idx, val) {
                    attrValue.push(val.name);
                });
                attrValue = attrValue.join('\n');
            } else if (('Labels' === key || 'Epic/Theme' === key || 'Feature' === key) && null !== attrValue) {
                attrValue = [];
                $.each(_this[key], function(idx, val) {
                    attrValue.push(val);
                });
                attrValue = attrValue.join('\n');
            }
            values.push(attrValue);
        });
        return values;
    };
    return JiraIssue;
});
