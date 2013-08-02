define(["jquery", "js-logger"], function($, Logger) {
    /**
     * Static instance of all vaditator definition
     */
    var validatorMap = {};

    function heighlighter(element /*, errorClass*/ ) {
        $(element).parents(".form-group").addClass("has-error");
    }

    function unheighlighter(element /*, errorClass*/ ) {
        $(element).parents(".form-group").removeClass("has-error");
    }

    function Validator(name, formSelector, definition) {
        this.name = name;
        this.formSelector = formSelector;
        this.definition = definition;
        this.logger = Logger.get(name);
    }

    /**
     * Validates the form with specified validator name
     * @constructor
     * @param {String} validatorName
     * @param {String} returnPromise: If true return promise object instead of Deferred object
     * @returns {jQuery.Deferred} or {jQuery.Deferred.Promise}
     */
    Validator.prototype.validate = function(options) {
        options = $.extend({
            context: this,
            returnPromise: false
        }, options);
        this.reset(true);
        var $form = $(this.formSelector),
            validator = $form.validate(this.definition);

        var deferred = $.Deferred();
        if (validator.form()) {
            this.logger.debug("Validation of", this.name, "successed.");
            if (options.returnPromise) {
                deferred.resolveWith(options.context);
            } else {
                deferred.notifyWith(options.context);
            }
        } else {
            var errorMessage = "Validation of " + this.name + " failed.";
            this.logger.error(errorMessage);
            deferred.rejectWith(options.context, [{
                message: errorMessage,
                errors: validator.errorMap
            }]);
        }
        return options.returnPromise ? deferred.promise() : deferred;
    };

    Validator.prototype.reset = function(removeOldValidator) {
        var $form = $(this.formSelector),
            validator = $form.data("validator");

        if (validator) {
            $.each(validator.errors(), function(idx, ele) {
                validator.settings.unhighlight.call(validator, ele, validator.settings.errorClass, validator.settings.validClass);
                $(ele).hide();
            });
            validator.reset();
            if (removeOldValidator) {
                $form.data("validator", null);
            }
        }
    };

    var FormValidators = {
        "LOAD_RELEASE": {
            "formSelector": "form#jira-tracker",
            "definition": {
                rules: {
                    "releaseId": "required"
                },
                messages: {
                    "releaseId": "Release id is required"
                }
            }
        },
        "JIRA_SETTINGS": {
            "formSelector": "form#jira-settings-form",
            "definition": {
                rules: {
                    "jiraUserId": "required",
                    "jiraPassword": "required"
                },
                messages: {
                    "jiraUserId": "Jira user name is required",
                    "jiraPassword": "Jira password is required"
                }
            }
        },
        "CREATE_BASELINE": {
            "formSelector": "form#jira-tracker",
            "definition": {
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
        },
        "CREATE_SNAPSHOT": {
            "formSelector": "form#jira-tracker",
            "definition": {
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
        }
    };

    $.each(FormValidators, function addValidationDef(validatorName, validatorDef) {
        var defaultValidator = {
            highlight: heighlighter,
            unhighlight: unheighlighter,
            errorClass: "text-danger"
        };
        $.extend(validatorDef.definition, defaultValidator);
        validatorMap[validatorName] = new Validator(validatorName, validatorDef.formSelector, validatorDef.definition);
    });

    return {
        get: function(validatorName) {
            return validatorMap[validatorName];
        }
    };
});
