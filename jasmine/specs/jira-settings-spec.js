define(["jquery", "js-logger", "js/base64",
    "js/jira-validator", "js/jira-settings", "jasmine-helper"
], function($, Logger, Base64, Validator, JiraSetting, Deferred) {
    describe("jira-settings.js", function() {
        var settingsModal,
            settingsForm,
            jiraSetting;

        beforeEach(function() {
            affix("#jira-settings form#jira-settings-form");
            settingsModal = $("#jira-settings");
            settingsModal.append("<button class='save-settings'>Save</button>");
            settingsForm = $("#jira-settings-form");
            jiraSetting = new JiraSetting();
        });

        describe("JiraSetting constructor", function() {
            it("calls JiraSetting.bindEvents and populate", function() {
                spyOn(JiraSetting.prototype, "bindEvents").andCallThrough();
                spyOn(JiraSetting.prototype, "populate").andCallThrough();
                jiraSetting = new JiraSetting();
                expect(JiraSetting.prototype.bindEvents).toHaveBeenCalled();
                expect(JiraSetting.prototype.populate).toHaveBeenCalled();
            });
            it("append jira credential controls for setting form", function() {
                expect(settingsForm).toContain("#jiraUserId");
                expect(settingsForm).toContain("#jiraPassword");
            });
        });

        describe("JiraSetting.populate", function() {
            it("populates jiraUserId from storage", function() {
                jiraSetting.storage.set("Jira-UserName", "Jira User Name");
                jiraSetting.populate();
                expect($("#jiraUserId")).toHaveValue("Jira User Name");
                expect($("#jiraPassword")).toHaveValue("");
            });

            it("populates jiraPassword only if \"Jira-Credentials\" is available in storage", function() {
                jiraSetting.storage.set("Jira-Credentials", "jiraBase64Key");
                jiraSetting.populate();
                expect($("#jiraPassword")).toHaveValue("It5AS3cr3t");
            });

            it("stores userId value as data-prev-value", function() {
                jiraSetting.storage.set("Jira-UserName", "Jira User Name");
                jiraSetting.populate();
                expect($("#jiraUserId")).toHaveData("prev-value", "Jira User Name");
            });
        });

        describe("JiraSetting.bindEvents", function() {
            var saveSettingButton;
            beforeEach(function() {
                // constructor calls bindEvents
                jiraSetting.storage.set("Jira-UserName", "Userid");
                jiraSetting.storage.set("Jira-Credentials", "jiraBase64Key");
                jiraSetting.populate();
                spyOn(Validator, "get").andCallThrough();
                saveSettingButton = $("button.save-settings");
            });

            describe("userid-change", function() {
                var $userid, $password;

                beforeEach(function() {
                    $userid = $("#jiraUserId");
                    $password = $("#jiraPassword");
                });

                it("sets JiraSetting.isDirty flag true only when userid value is changed", function() {
                    expect(jiraSetting.isDirty).toBeFalsy();

                    $userid.val("Userid").change();
                    expect(jiraSetting.isDirty).toBeFalsy();

                    $userid.val("Changed user id").change();
                    expect(jiraSetting.isDirty).toBeTruthy();
                });

                it("clears jiraPassword field if jiraUserId value is changed", function() {

                    $userid.val("Userid").change();
                    expect($password).toHaveValue("It5AS3cr3t");

                    $userid.val("Changed user id").change();
                    expect($password).toHaveValue("");
                });
            });

            describe("save-settings", function() {
                beforeEach(function() {
                    spyOn(jiraSetting.storage, "set").andCallThrough();
                });

                it("validates the jira credential form", function() {
                    saveSettingButton.click();
                    expect(Validator.get).toHaveBeenCalledWith("JIRA_SETTINGS");
                });

                it("call validate method with correct parameter", function() {
                    var JiraValidator = Validator.get("JIRA_SETTINGS");
                    spyOn(JiraValidator, "validate").andCallThrough();

                    saveSettingButton.click();
                    expect(JiraValidator.validate).toHaveBeenCalledWith({
                        returnPromise: true
                    });
                });

                describe("update storage", function() {
                    var base64Encode, userIdCtrl, passwordCtrl;

                    function validateAndSaveSetting(triggerChangeEvent, callback) {
                        var JiraValidator = Validator.get("JIRA_SETTINGS"),
                            deferred = new Deferred();

                        spyOn(JiraValidator, "validate").andReturn(deferred.promiseObj);

                        userIdCtrl = $("#jiraUserId");
                        passwordCtrl = $("#jiraPassword");
                        userIdCtrl.val("JiraUserName");
                        passwordCtrl.val("JiraAccountPassword");
                        if (triggerChangeEvent) {
                            userIdCtrl.change();
                        }

                        saveSettingButton.click();
                        waitsFor(function() {
                            return deferred.promiseObj.state() !== "pending";
                        });
                        base64Encode = Base64.encode(userIdCtrl.val() + ":" + passwordCtrl.val());
                        runs(callback);
                        deferred.deferredObj.resolve();
                    }

                    it("stores userName and base64Key into storage and change isDirty flag when validatation is done", function() {
                        validateAndSaveSetting(true, function() {
                            expect(jiraSetting.storage.set).toHaveBeenCalledWith("Jira-Credentials", base64Encode);
                            expect(jiraSetting.storage.set).toHaveBeenCalledWith("Jira-UserName", "JiraUserName");
                            expect(jiraSetting.isDirty).toBeFalsy();
                            expect(userIdCtrl).toHaveData("prev-value", "JiraUserName");
                        });
                    });

                    it("doesn't update userName and base64Key into storage is form is not dirty", function() {
                        validateAndSaveSetting(false, function() {
                            expect(jiraSetting.storage.set).not.toHaveBeenCalled();
                        });
                    });
                });
            });

            describe("hide modal", function() {
                var JiraValidator;
                beforeEach(function() {
                    JiraValidator = Validator.get("JIRA_SETTINGS");
                    spyOn(JiraValidator, "reset");
                });

                it("on hide modal call validator.reset api", function() {
                    saveSettingButton.trigger("hide");
                    expect(JiraValidator.reset).toHaveBeenCalled();
                });
            });
        });
    });
});
