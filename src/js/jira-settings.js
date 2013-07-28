define(["jquery", "js-logger", "js/jira-validator", "dist/jira-tracker-templates",
    "js/models/jira-storage", "js/base64"
], function($, Logger, Validator, JiraTrackerTemplates, Storage, Base64) {
    var settingsModal,
        settingsForm;

    function JiraSettings(options) {
        this.storage = new Storage();
        $.extend(this, options);
        this.logger = Logger.get("jiraTrackerSettings");
        settingsModal = $("#jira-settings");
        settingsForm = $("#jira-settings-form");
        settingsForm.append(JiraTrackerTemplates["src/views/jira-credentials.hbs"]());
        this.bindEvents().populate();
    }

    JiraSettings.prototype.populate = function() {
        this.isDirty = false;
        this.storage.get("Jira-UserName", "Jira-Credentials").always(function(userName, base64Key) {
            $("#jiraUserId").val(userName).data("prev-value", userName);
            $("#jiraPassword").val(base64Key ? "It5AS3cr3t" : "");
        });
        return this;
    };

    /**
     * Bind different types of events to form elements.
     */
    JiraSettings.prototype.bindEvents = function() {
        var _this = this;
        settingsForm.on("submit", function() { /* Attach userId change event */
            $("button.save-settings").click();
            return false;
        }).on("change", "#jiraUserId", function() { /* Attach userId change event */
            var $this = $(this);
            if ($this.data("prev-value") !== $this.val()) {
                _this.isDirty = true;
                $("#jiraPassword").val("");
            }
        }).on("change", "#jiraPassword", function() { /* Attach password change event */
            var $this = $(this);
            if ("It5AS3cr3t" !== $this.val()) {
                _this.isDirty = true;
            }
        });

        settingsModal.on("click", "button.save-settings", function() {
            Validator.get("JIRA_SETTINGS").validate({
                returnPromise: true
            }).done(function() {
                if (_this.isDirty) {
                    _this.logger.log("Saving setting to storage");
                    var $userId = $("#jiraUserId"),
                        userName = $userId.val(),
                        base64Encode = Base64.encode(userName + ":" + $("#jiraPassword").val());
                    _this.storage.set("Jira-Credentials", base64Encode);
                    _this.storage.set("Jira-UserName", userName);
                    _this.populate();
                }
                settingsModal.modal("hide");
            });
        }).on("show", function() { /* Attach setting modal show event */
            _this.populate();
        }).on("hide", function() { /* Attach setting modal hide event */
            Validator.get("JIRA_SETTINGS").reset();
        });
        return this;
    };
    return JiraSettings;
});
