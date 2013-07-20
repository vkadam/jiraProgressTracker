/*define(["jquery", "js/base64", "jasmine-helper", "js-logger"], function($, JiraTracker, GSLoader, Base64, moment, Deferred, Logger) {
    describe("bind Events", function() {
            beforeEach(function() {
                JiraTracker.injectUI();
            });

            it("jiraPassword.change clears basic auth data attribute", function() {
                expect($("#jiraPassword")).not.toHandle("change");
                $("#jiraPassword").data("jira-basic-authorization", "some value");

                JiraTracker.bindEvents();
                $("#jiraPassword").trigger("change");

                expect($("#jiraPassword")).toHandle("change");
                expect($("#jiraPassword")).not.toHaveData("jira-basic-authorization");
            });

            it("jiraUserId.change clears basic auth data attribute", function() {
                expect($("#jiraUserId")).not.toHandle("change");
                $("#jiraPassword").data("jira-basic-authorization", "some value");

                JiraTracker.bindEvents();
                $("#jiraUserId").trigger("change");

                expect($("#jiraUserId")).toHandle("change");
                expect($("#jiraPassword")).not.toHaveData("jira-basic-authorization");
            });
        });
        
    describe("jira-settings.js", function() {
        describe("jira credentials", function() {
            beforeEach(function() {
                // JiraTracker.injectUI();
            });

            it("jiraPassword.change clears basic auth data attribute", function() {
                expect($("#jiraPassword")).not.toHandle("change");
                $("#jiraPassword").data("jira-basic-authorization", "some value");

                JiraTracker.bindEvents();
                $("#jiraPassword").trigger("change");

                expect($("#jiraPassword")).toHandle("change");
                expect($("#jiraPassword")).not.toHaveData("jira-basic-authorization");
            });

            it("jiraUserId.change clears basic auth data attribute", function() {
                expect($("#jiraUserId")).not.toHandle("change");
                $("#jiraPassword").data("jira-basic-authorization", "some value");

                JiraTracker.bindEvents();
                $("#jiraUserId").trigger("change");

                expect($("#jiraUserId")).toHandle("change");
                expect($("#jiraPassword")).not.toHaveData("jira-basic-authorization");
            });
        });
    });
});*/
