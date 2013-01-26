describe("JiraTracker", function() {

    var spyOnAjax;
    beforeEach(function() {
        $.ajaxSetup({
            async: false
        });
        spyOnAjax = spyOn($, "ajax");
        chrome.storage.sync.clear();
    });

    afterEach(function() {
        JiraTracker.activeRelease = null;
    });

    function spyOnAndReturnDeferred(obj, apiName, sSheet) {
        spyOn(obj, apiName).andCallFake(function(options) {
            var deferred = $.Deferred();
            var lsReq = deferred.promise();
            options.context = options.context || lsReq;
            //setTimeout(function() {
            deferred.resolveWith(options.context, [sSheet]);
            //}, 100);
            return lsReq;
        });
    }

    describe("on init", function() {
        beforeEach(function() {
            spyOn(JiraTracker, "loadRelease");
            spyOn(chrome.storage.sync, "get").andCallThrough();
        });

        it("populates release id from user sync data", function() {
            chrome.storage.sync.set({
                "JiraTracker": {
                    releaseId: "spreadsheetIdFromCache"
                }
            });

            JiraTracker.init();

            expect(chrome.storage.sync.get).toHaveBeenCalledWith("JiraTracker", jasmine.any(Function));

            expect(JiraTracker.loadRelease).toHaveBeenCalled();
        });
    });

    function doControlValidation(request, controlName, msg) {
        expect(request.errors[controlName]).toBe(msg);
        expect($("#" + controlName)).toHaveClass("error");
    }

    describe("Load release", function() {

        beforeEach(function() {
            affix("form.jira-tracker input#releaseTitle[name=releaseTitle]").affix("input#releaseId[name=releaseId]");
        });

        function loadSpreadsheet(actualSpreadsheetId, expectedSpreadsheetId) {
            var actualRelease = {
                id: expectedSpreadsheetId
            };
            spyOn(JiraTracker, "onReleaseChange");
            spyOnAndReturnDeferred(GSLoader, "loadSpreadsheet", actualRelease);
            var loadedReq = JiraTracker.loadRelease(null, actualSpreadsheetId);
            var loaded = false;
            loadedReq.done(function() {
                loaded = true;
            });

            waitsFor(function() {
                return loaded;
            }, "Spreadsheet should be loaded", 1000);

            runs(function() {
                expect(GSLoader.loadSpreadsheet).toHaveBeenCalled();
                expect(GSLoader.loadSpreadsheet.callCount).toBe(1);
                expect(GSLoader.loadSpreadsheet.mostRecentCall.args[0].id).toBe(expectedSpreadsheetId);
                expect(JiraTracker.onReleaseChange).toHaveBeenCalledWith(actualRelease);
            });
        }

        it("Load release does validation for spreadsheet id", function() {
            spyOn(GSLoader, "loadSpreadsheet");
            var loadReq = JiraTracker.loadRelease();

            expect(loadReq.errors).toBeDefined();
            doControlValidation(loadReq, "releaseId", "Release id is required");
            expect(GSLoader.loadSpreadsheet).not.toHaveBeenCalled();
        });

        it("Load release by spreadsheet id parameter and make it active", function() {
            loadSpreadsheet("mySpreadSheetId", "mySpreadSheetId");
        });

        it("Load release from spreadsheet id input control make it active", function() {
            $("#releaseId").val("Some Spreadsheet Id From Input Field");
            loadSpreadsheet(null, "Some Spreadsheet Id From Input Field");
        });

        it("Load release removs validator object from form and add new", function() {
            $("form.jira-tracker").data("validator", {
                some: "object"
            });
            loadSpreadsheet("mySpreadSheetId", "mySpreadSheetId");
            var validatorObj = $("form.jira-tracker").data("validator");
            expect(validatorObj.some).not.toBeDefined();
            expect(validatorObj instanceof $.validator).toBeTruthy();
        });

    });

    describe("onReleaseChange", function() {

        beforeEach(function() {
            affix("form.jira-tracker input#releaseTitle[name=releaseTitle]").affix("input#releaseId[name=releaseId]");
        });

        it("onReleaseChange poluates id and title fields and make spreadsheet active", function() {
            var actualRelease = {
                id: "Some Spreadsheet Id",
                title: "Some Spreadsheet Title"
            };

            expect(JiraTracker.activeRelease).toBeNull();

            JiraTracker.onReleaseChange(actualRelease);

            expect($("#releaseId")).toHaveValue("Some Spreadsheet Id");
            expect($("#releaseTitle")).toHaveValue("Some Spreadsheet Title");
            expect(JiraTracker.activeRelease).toBe(actualRelease);
        });

        it("onReleaseChange updates spreadsheet id in user storage", function() {
            JiraTracker.onReleaseChange({
                id: "mySpreadSheetId"
            });
            var userData;
            chrome.storage.sync.get("JiraTracker", function(data) {
                userData = data["JiraTracker"];
            });
            expect(userData).toBeDefined();
            expect(userData.releaseId).toBe("mySpreadSheetId");
        });

    });

    describe("Create release baseline", function() {

        beforeEach(function() {
            var container = affix("form.jira-tracker input#releaseTitle[name=releaseTitle]");
            container.affix("input#releaseId[name=releaseId]");
            container.affix("input#jiraUseId[name=jiraUseId]");
            container.affix("input#jiraPassword[name=jiraPassword]");
            container.affix("input#jiraJQL[name=jiraJQL]");
            container.affix("input#snapshotTitle[name=snapshotTitle]");
            spyOn(JiraTracker, "onReleaseChange").andCallThrough();
            spyOn(JiraTracker, "createSnapshot");
        });

        function createSpreadsheet(actualTitle, expectedTitle) {
            var newSpreadsheet = {
                id: "mySpreadSheetId",
                title: expectedTitle
            };
            spyOnAndReturnDeferred(GSLoader, "createSpreadsheet", newSpreadsheet);
            $("#jiraUseId").val("SomeJiraUserId");
            $("#jiraPassword").val("SomeJiraPassword");
            $("#jiraJQL").val("SomeJiraJQL");
            $("#snapshotTitle").val("SomeBaselineTitle");

            var createReq = JiraTracker.createBaseline(null, actualTitle);
            var created = false;
            createReq.done(function() {
                created = true;
            });

            waitsFor(function() {
                return created;
            }, "Spreadsheet should be created", 1000);

            runs(function() {
                expect(GSLoader.createSpreadsheet).toHaveBeenCalled();
                expect(GSLoader.createSpreadsheet.callCount).toBe(1);
                expect(GSLoader.createSpreadsheet.mostRecentCall.args[0].title).toBe(expectedTitle);
                expect(JiraTracker.onReleaseChange).toHaveBeenCalled();
            });
        }

        it("Create baseline by spreadsheet title parameter and make it active", function() {
            createSpreadsheet("My Spreadsheet Title", "My Spreadsheet Title");
        });

        it("Create baseline by spreadsheet title field and make it active", function() {
            $("#releaseTitle").val("My Spreadsheet Title Input Field");
            createSpreadsheet(null, "My Spreadsheet Title Input Field");
        });

        it("Create baseline does validation", function() {
            spyOn(GSLoader, "createSpreadsheet");
            var createReq = JiraTracker.createBaseline();

            expect(createReq.errors).toBeDefined();
            doControlValidation(createReq, "releaseTitle", "Release title is required");
            doControlValidation(createReq, "jiraUseId", "Jira user name is required");
            doControlValidation(createReq, "jiraPassword", "Jira password is required");
            doControlValidation(createReq, "jiraJQL", "Jira JQL is required");
            doControlValidation(createReq, "snapshotTitle", "Snapshot title is required");
            expect(GSLoader.createSpreadsheet).not.toHaveBeenCalled();
        });

        it("Create baseline creates baseline worksheet in newly created release spreadsheet", function() {
            createSpreadsheet("My Spreadsheet Title", "My Spreadsheet Title");
            expect(JiraTracker.createSnapshot).toHaveBeenCalled();
        });
    });

    describe("Create snapshot", function() {
        var snapshotTitle = "Worksheet Title";
        var spyOnCreateWorksheet = jasmine.createSpy("createWorksheet");
        var activeRelease = {
            id: "mySpreadSheetId",
            title: "Release Sheet Title",
            worksheets: [],
            createWorksheet: spyOnCreateWorksheet
        };
        var worksheet = {
            id: "ws1",
            title: snapshotTitle
        };

        beforeEach(function() {
            spyOnAjax.andCallThrough();
            $.fixture("http://jira.cengage.com/rest/api/2/search", "jasmine/fixtures/jiraIssues.json");
            JiraTracker.activeRelease = activeRelease;
            spyOnCreateWorksheet.andCallFake(function() {
                activeRelease.worksheets.push(worksheet);
            });
        });

        it("Create snapshot checks for activeRelease", function() {
            JiraTracker.activeRelease = null;
            var exceptionThrown;
            try {
                JiraTracker.createSnapshot();
            } catch (error) {
                exceptionThrown = error;
            }
            expect(exceptionThrown).toBe("Release is not loaded");
            expect(spyOnCreateWorksheet).not.toHaveBeenCalled();
        });

        it("Create snapshot creates worksheet into activeRelease using snapshot title field", function() {
            affix("input#snapshotTitle[value=" + snapshotTitle + "]");

            JiraTracker.createSnapshot();

            expect(spyOnCreateWorksheet).toHaveBeenCalled();
            expect(JiraTracker.activeRelease.worksheets[0]).toBe(worksheet);
            expect(JiraTracker.activeRelease.worksheets[0].id).toBe("ws1");
            expect(JiraTracker.activeRelease.worksheets[0].title).toBe(snapshotTitle);
        });

        it("Create snapshot makes jira call with correct data to get jira issues", function() {
            var jiraJQL = "Some jira query",
                jiraMaxResults = "10",
                jiraUseId = "User Name",
                jiraPassword = "password",
                base64Key = Base64.encode(jiraUseId + ":" + jiraPassword);

            affix("input#snapshotTitle[value=" + snapshotTitle + "]");
            affix("input#jiraJQL[value=" + jiraJQL + "]");
            affix("input#jiraMaxResults[value=" + jiraMaxResults + "]");
            affix("input#jiraUseId[value=" + jiraUseId + "]");
            affix("input#jiraPassword[value=" + jiraPassword + "]");

            JiraTracker.createSnapshot();

            expect(spyOnAjax).toHaveBeenCalled();
            expect(spyOnAjax.callCount).toBe(1);
            var jiraCallArgs = spyOnAjax.calls[0].args[0];
            expect(jiraCallArgs.url).toBe("http://jira.cengage.com/rest/api/2/search");
            expect(jiraCallArgs.data.jql).toBe(jiraJQL);
            expect(jiraCallArgs.data.maxResults).toBe(jiraMaxResults);
            expect(jiraCallArgs.headers.Authorization).toContain(base64Key);
        });
    });
});