define(["jquery"], function($) {
    /**
     * Static instance of all vaditator definition
     */
    var Validators = function() {
        this.validatorMap = {};
    };

    function heighlighter(element, errorClass) {
        $(element).parents(".control-group").addClass(errorClass);
    }

    function unheighlighter(element, errorClass) {
        $(element).parents(".control-group").removeClass(errorClass);
    }

    Validators.prototype.add = function(typeName, validatorDef) {
        var defaultValidator = {
            highlight: heighlighter,
            unhighlight: unheighlighter
        };
        $.each(validatorDef, function(key, value) {
            $.extend(value, defaultValidator);
        });
        this.validatorMap[typeName] = validatorDef;
    };
    Validators.prototype.get = function(typeName) {
        return this.validatorMap[typeName];
    };

    var jiraValidator = new Validators();

    jiraValidator.add("LOAD_RELEASE", {
        "form#jira-tracker": {
            rules: {
                "releaseId": "required"
            },
            messages: {
                "releaseId": "Release id is required"
            }
        }
    });

    jiraValidator.add("JIRA_SETTINGS", {
        rules: {
            "jiraUserId": "required",
            "jiraPassword": "required"
        },
        messages: {
            "jiraUserId": "Jira user name is required",
            "jiraPassword": "Jira password is required"
        }
    });

    jiraValidator.add("CREATE_BASELINE", {
        "form#jira-tracker": {
            rules: {
                "releaseTitle": "required",
                "jiraJQL": "required",
                "snapshotTitle": "required"
            },
            messages: {
                "releaseTitle": "Release title is required",
                "jiraJQL": "Jira JQL is required",
                "snapshotTitle": "Snapshot title is required"
            }
        }
    });

    jiraValidator.add("CREATE_SNAPSHOT", {
        "form#jira-tracker": {
            rules: {
                "releaseId": "required",
                "jiraJQL": "required",
                "jiraMaxResults": "required",
                "snapshotTitle": "required"
            },
            messages: {
                "releaseId": "Release is not loaded",
                "jiraJQL": "Jira JQL is required",
                "jiraMaxResults": "Value of max result from is required",
                "snapshotTitle": "Snapshot title is required"
            }
        }
    });
    return jiraValidator;
});
