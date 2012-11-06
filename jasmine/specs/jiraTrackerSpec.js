describe("JiraTracker", function() {

    var spyOnAjax;
    beforeEach(function() {
        $.ajaxSetup({
            async: false
        });
        spyOnAjax = spyOn($, "ajax");
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
        var actualRelease = {
            id: "spreadsheetIdFromCache"
        };
        beforeEach(function() {
            affix("form.jira-tracker input#releaseId[name=releaseId]");
            spyOnAndReturnDeferred(GSLoader, "loadSpreadsheet", actualRelease);
            spyOn(chrome.storage.sync, "get").andCallThrough();
        });

        afterEach(function() {
            JiraTracker.activeRelease = null;
        });

        it("populates release id from user sync data", function() {
            chrome.storage.sync.set("JiraTracker", {
                releaseId: "spreadsheetIdFromCache"
            });
            var loadReq = JiraTracker.init();

            expect(chrome.storage.sync.get).toHaveBeenCalledWith("JiraTracker", jasmine.any(Function));

            waitsFor(function() {
                return JiraTracker.activeRelease;
            }, "Spreadsheet should be created", 1000);

            runs(function() {
                expect(JiraTracker.activeRelease).toBe(actualRelease);
                expect($("#releaseId")).toHaveValue("spreadsheetIdFromCache");
            });
        });
    });

    describe("Load release", function() {
        var actualRelease = {
            id: "mySpreadSheetId"
        };

        beforeEach(function() {
            affix("form.jira-tracker input#releaseId[name=releaseId]");
            spyOnAndReturnDeferred(GSLoader, "loadSpreadsheet", actualRelease);
        });

        afterEach(function() {
            JiraTracker.activeRelease = null;
        });

        it("Load release does validation for spreadsheet id", function() {
            var loadReq = JiraTracker.loadRelease();

            expect(loadReq.errors).toBeDefined();
            expect(loadReq.errors["releaseId"]).toBeDefined();
            expect(loadReq.errors["releaseId"]).toBe("Release id is required");
            expect(GSLoader.loadSpreadsheet.callCount).toBe(0);
        });

        it("Load release by spreadsheet id parameter and make it active", function() {
            var spreadsheet;
            JiraTracker.loadRelease(null, "mySpreadSheetId");

            waitsFor(function() {
                return JiraTracker.activeRelease;
            }, "Spreadsheet should be created", 1000);

            runs(function() {
                expect(JiraTracker.activeRelease).toBe(actualRelease);
                expect($("#releaseId")).toHaveValue("mySpreadSheetId");
            });
        });

        it("Load release from spreadsheet id input control make it active", function() {
            $("#releaseId").val("mySpreadSheetId");
            JiraTracker.loadRelease();

            waitsFor(function() {
                return JiraTracker.activeRelease;
            }, "Spreadsheet should be created", 1000);

            runs(function() {
                expect(JiraTracker.activeRelease).toBe(actualRelease);
            });
        });
    });

    describe("Create release baseline", function() {
        var spreadsheetTitle = "Release Sheet Title";
        var newSpreadsheet = {
            id: "mySpreadSheetId",
            title: spreadsheetTitle
        };

        beforeEach(function() {
            spyOnAndReturnDeferred(GSLoader, "createSpreadsheet", newSpreadsheet);
            affix("input#releaseTitle[value=" + spreadsheetTitle + "] input#releaseId");
        });

        afterEach(function() {
            JiraTracker.activeRelease = null;
        });

        function createSpreadsheet(title) {
            JiraTracker.createBaseline(title);

            waitsFor(function() {
                return JiraTracker.activeRelease;
            }, "Spreadsheet should be created", 1000);

            runs(function() {
                expect(JiraTracker.activeRelease).toBe(newSpreadsheet);
                expect($("#releaseId")).toHaveValue("mySpreadSheetId");
                expect($("#releaseTitle")).toHaveValue(spreadsheetTitle);
            });
        }

        it("Create baseline by spreadsheet title parameter and make it active", function() {
            createSpreadsheet(spreadsheetTitle);
        });

        it("Create baseline by spreadsheet title field and make it active", function() {
            createSpreadsheet();
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