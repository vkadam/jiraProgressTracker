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
        this.validatorMap[typeName] = $.extend(defaultValidator, validatorDef);
    };
    Validators.prototype.get = function(typeName) {
        return this.validatorMap[typeName];
    };

    var jiraValidator = new Validators();

    jiraValidator.add("LOAD_RELEASE", {
        rules: {
            "releaseId": "required"
        },
        messages: {
            "releaseId": "Release id is required"
        }
    });

    jiraValidator.add("CREATE_BASELINE", {
        rules: {
            "releaseTitle": "required",
            "jiraUserId": "required",
            "jiraPassword": "required",
            "jiraJQL": "required",
            "snapshotTitle": "required"
        },
        messages: {
            "releaseTitle": "Release title is required",
            "jiraUserId": "Jira user name is required",
            "jiraPassword": "Jira password is required",
            "jiraJQL": "Jira JQL is required",
            "snapshotTitle": "Snapshot title is required"
        }
    });

    jiraValidator.add("CREATE_SNAPSHOT", {
        rules: {
            "releaseId": "required",
            "jiraUserId": "required",
            "jiraPassword": "required",
            "jiraJQL": "required",
            "jiraMaxResults": "required",
            "snapshotTitle": "required"
        },
        messages: {
            "releaseId": "Release is not loaded",
            "jiraUserId": "Jira user name is required",
            "jiraPassword": "Jira password is required",
            "jiraJQL": "Jira JQL is required",
            "jiraMaxResults": "Value of max result from is required",
            "snapshotTitle": "Snapshot title is required"
        }
    });
    return jiraValidator;
});
