describe("JiraTracker", function() {

    var spyOnAjax;
    beforeEach(function() {
        $.ajaxSetup({
            async: false
        });
        spyOnAjax = spyOn($, "ajax");
        chrome.storage.sync.clear();
        var container = affix("form.jira-tracker div.control-group input#releaseTitle[name=releaseTitle]");
        container.affix("div.control-group input#releaseId[name=releaseId]");
        container.affix("div.control-group input#jiraUserId[name=jiraUserId]");
        container.affix("div.control-group input#jiraPassword[name=jiraPassword]");
        container.affix("div.control-group input#jiraJQL[name=jiraJQL]");
        container.affix("div.control-group input#jiraMaxResults[name=jiraMaxResults]");
        container.affix("div.control-group input#snapshotTitle[name=snapshotTitle]");
    });

    afterEach(function() {
        JiraTracker.activeRelease = null;
    });

    function returnDeffered(resolveWithThis) {
        return function(options) {
            var deferred = $.Deferred(),
                lsReq = deferred.promise(),
                context = options.context || lsReq;
            deferred.resolveWith(context, [resolveWithThis]);
            return lsReq;
        };
    }

    function spyOnAndReturnDeferred(obj, apiName, resolveWithThis) {
        spyOn(obj, apiName).andCallFake(returnDeffered(resolveWithThis));
    }

    describe("on init", function() {
        beforeEach(function() {
            spyOn(JiraTracker, "loadRelease");
            spyOn(JiraTracker, "bindEvents");
            spyOn(chrome.storage.sync, "get").andCallThrough();
        });

        it("populates release id from user sync data and load release", function() {
            chrome.storage.sync.set({
                "JiraTracker": {
                    releaseId: "spreadsheetIdFromCache"
                }
            });

            JiraTracker.init();

            expect(chrome.storage.sync.get).toHaveBeenCalledWith("JiraTracker", jasmine.any(Function));

            expect(JiraTracker.loadRelease).toHaveBeenCalled();
        });

        it("calls binds events", function() {
            JiraTracker.init();
            expect(JiraTracker.bindEvents).toHaveBeenCalled();
        });
    });

    describe("bind Events", function() {
        
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

    function doControlValidation(request, controlName, msg) {
        expect(request.errors[controlName]).toBe(msg);
        expect($("#" + controlName).parents(".control-group")).toHaveClass("error");
    }

    describe("Load release", function() {

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
                expect(GSLoader.loadSpreadsheet.mostRecentCall.args[0].wanted).toEqual(["Setup"]);
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

        it("Load release resets form and removes oldvalidator object from form and then add new", function() {
            var resetSpy = jasmine.createSpy("reset");
            $("form.jira-tracker").data("validator", {
                "some": "object",
                "reset": resetSpy,
                "errors": function() {
                    return $("#releaseTitle");
                },
                "settings": {
                    "unhighlight": function(ele, errorClass) {
                        $(ele).parents(".control-group").removeClass(errorClass);
                    }
                }
            });
            $("#releaseTitle").parents(".control-group").addClass("error");

            loadSpreadsheet("mySpreadSheetId", "mySpreadSheetId");

            var validatorObj = $("form.jira-tracker").data("validator");
            expect(validatorObj.some).not.toBeDefined();
            expect(resetSpy).toHaveBeenCalled();
            expect(validatorObj instanceof $.validator).toBeTruthy();
            expect($("#releaseTitle").parents(".control-group")).not.toHaveClass("error");
        });

    });

    describe("onReleaseChange", function() {
        var actualRelease = {
            id: "Some Spreadsheet Id",
            title: "Some Spreadsheet Title",
            getWorksheet: function() {
                return {
                    title: "Setup",
                    rows: [{
                        "jira-user-id": "SomeJiraUserId",
                        "jira-basic-authorization": "U29tZUppcmFVc2VySWQ6U29tZUppcmFQYXNzd29yZA==",
                        "jira-jql": "SomeJiraJQL"
                    }]
                };
            }
        };

        it("onReleaseChange poluates fields and make spreadsheet active", function() {

            expect(JiraTracker.activeRelease).toBeNull();

            JiraTracker.onReleaseChange(actualRelease);

            expect($("#jiraUserId")).toHaveValue("SomeJiraUserId");
            expect($("#jiraPassword")).toHaveValue("It5AS3cr3t");
            expect($("#jiraPassword")).toHaveData("jira-basic-authorization", "U29tZUppcmFVc2VySWQ6U29tZUppcmFQYXNzd29yZA==");
            expect($("#releaseId")).toHaveValue("Some Spreadsheet Id");
            expect($("#releaseTitle")).toHaveValue("Some Spreadsheet Title");
            expect($("#jiraJQL")).toHaveValue("SomeJiraJQL");
            expect(JiraTracker.activeRelease).toBe(actualRelease);
        });

        it("onReleaseChange disables releaseTitle and jiraJQL controls", function() {

            JiraTracker.onReleaseChange(actualRelease);

            expect($("#releaseTitle")).toBeDisabled();
            expect($("#jiraJQL")).toBeDisabled();
        });

        it("onReleaseChange updates spreadsheet id in user storage", function() {
            JiraTracker.onReleaseChange({
                id: "mySpreadSheetId",
                getWorksheet: jasmine.createSpy("spreadsheet.getWorksheet")
            });
            var userData;
            chrome.storage.sync.get("JiraTracker", function(data) {
                userData = data["JiraTracker"];
            });
            expect(userData).toBeDefined();
            expect(userData.releaseId).toBe("mySpreadSheetId");
        });

    });

    describe("Create release", function() {

        beforeEach(function() {
            spyOn(JiraTracker, "onReleaseChange").andCallThrough();
            spyOnAndReturnDeferred(JiraTracker, "createSnapshot");
        });

        function createSpreadsheet(actualTitle, expectedTitle) {
            var worksheet = {
                title: "Sheet 1",
                rename: jasmine.createSpy("worksheet.rename"),
                addRows: jasmine.createSpy("worksheet.addRows").andCallFake(returnDeffered())
            },
            newSpreadsheet = {
                id: "mySpreadSheetId",
                title: expectedTitle,
                worksheets: [worksheet],
                getWorksheet: jasmine.createSpy("spreadsheet.getWorksheet")
            };
            spyOnAndReturnDeferred(GSLoader, "createSpreadsheet", newSpreadsheet);
            $("#jiraUserId").val("SomeJiraUserId");
            $("#jiraPassword").val("SomeJiraPassword");
            $("#jiraJQL").val("SomeJiraJQL");
            $("#snapshotTitle").val("SomeBaselineTitle");

            var createReq = JiraTracker.createBaseline({}, actualTitle);
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

        it("by spreadsheet title parameter and make it active", function() {
            createSpreadsheet("My Spreadsheet Title", "My Spreadsheet Title");
        });

        it("by spreadsheet title field and make it active", function() {
            $("#releaseTitle").val("My Spreadsheet Title Input Field");
            createSpreadsheet(null, "My Spreadsheet Title Input Field");
        });

        it("does validation", function() {
            spyOn(GSLoader, "createSpreadsheet");
            var createReq = JiraTracker.createBaseline();

            expect(createReq.errors).toBeDefined();
            doControlValidation(createReq, "releaseTitle", "Release title is required");
            doControlValidation(createReq, "jiraUserId", "Jira user name is required");
            doControlValidation(createReq, "jiraPassword", "Jira password is required");
            doControlValidation(createReq, "jiraJQL", "Jira JQL is required");
            doControlValidation(createReq, "snapshotTitle", "Snapshot title is required");
            expect(GSLoader.createSpreadsheet).not.toHaveBeenCalled();
        });

        it("creates baseline worksheet/snapshot in newly created release spreadsheet", function() {
            createSpreadsheet("My Spreadsheet Title", "My Spreadsheet Title");
            expect(JiraTracker.createSnapshot).toHaveBeenCalled();
        });

        it("calls worksheet.rename for worksheet with correct title", function() {
            createSpreadsheet("My Spreadsheet Title", "My Spreadsheet Title");

            expect(JiraTracker.activeRelease.worksheets.length).toBe(1);
            expect(JiraTracker.activeRelease.worksheets[0].rename).toHaveBeenCalledWith("Setup");
        });

        it("adds release setting into setup worksheet", function() {
            createSpreadsheet("My Spreadsheet Title", "My Spreadsheet Title");
            var addRowCall = JiraTracker.activeRelease.worksheets[0].addRows,
                expectRows = [
                    ["jira-user-id", "jira-basic-authorization", "jira-jql"],
                    ["SomeJiraUserId", "U29tZUppcmFVc2VySWQ6U29tZUppcmFQYXNzd29yZA==", "SomeJiraJQL"]
                ];
            expect(JiraTracker.activeRelease.worksheets.length).toBe(1);
            expect(addRowCall.callCount).toBe(1);
            expect(addRowCall).toHaveBeenCalledWith(expectRows);
        });
    });

    describe("Create snapshot", function() {
        var snapshotTitle = "Worksheet Title",
            spyOnCreateWorksheet = jasmine.createSpy("createWorksheet"),
            activeRelease = {
                id: "mySpreadSheetId",
                title: "Release Sheet Title",
                worksheets: [],
                createWorksheet: spyOnCreateWorksheet
            },
            worksheet = {
                id: "ws1",
                title: snapshotTitle
            },
            jiraJQL,
            jiraMaxResults,
            jiraUserId,
            jiraPassword,
            base64Key;

        function populateValues() {
            $("input#releaseId").val(activeRelease.id);
            $("input#snapshotTitle").val(snapshotTitle);
            $("input#jiraJQL").val(jiraJQL);
            $("input#jiraMaxResults").val(jiraMaxResults);
            $("input#jiraUserId").val(jiraUserId);
            $("input#jiraPassword").val(jiraPassword);
        }

        beforeEach(function() {
            spyOn(JiraTracker, "loadRelease");
            JiraTracker.init();

            spyOnAjax.andCallThrough();
            $.fixture("http://jira.cengage.com/rest/api/2/search", "jasmine/fixtures/jiraIssues.json");
            JiraTracker.activeRelease = activeRelease;
            spyOnCreateWorksheet.reset();
            spyOnCreateWorksheet.andCallFake(function(options) {
                activeRelease.worksheets.push(worksheet);
                var deferred = $.Deferred();
                var lsReq = deferred.promise();
                options.context = options.context || lsReq;
                deferred.resolveWith(options.context, [worksheet]);
                return lsReq;
            });
            jiraJQL = "Some jira query";
            jiraMaxResults = "10";
            jiraUserId = "User Name";
            jiraPassword = "password";
            base64Key = Base64.encode(jiraUserId + ":" + jiraPassword);
        });

        it("creates worksheet into activeRelease using snapshot title field", function() {
            populateValues();
            var createReq = JiraTracker.createSnapshot();
            var created = false;
            createReq.done(function() {
                created = true;
            });

            waitsFor(function() {
                return created;
            }, "Worksheet should be created", 1000);

            runs(function() {
                expect(spyOnCreateWorksheet).toHaveBeenCalled();
                expect(JiraTracker.activeRelease.worksheets[0]).toBe(worksheet);
                expect(JiraTracker.activeRelease.worksheets[0].id).toBe("ws1");
                expect(JiraTracker.activeRelease.worksheets[0].title).toBe(snapshotTitle);
            });
        });

        it("makes jira call with correct data to get jira issues", function() {
            populateValues();
            var createReq = JiraTracker.createSnapshot();
            var created = false;
            createReq.done(function() {
                created = true;
            });

            waitsFor(function() {
                return created;
            }, "Worksheet should be created", 1000);

            runs(function() {
                expect(spyOnAjax).toHaveBeenCalled();
                expect(spyOnAjax.callCount).toBe(1);
                var jiraCallArgs = spyOnAjax.calls[0].args[0];
                expect(jiraCallArgs.url).toBe("http://jira.cengage.com/rest/api/2/search");
                expect(jiraCallArgs.data.jql).toBe(jiraJQL);
                expect(jiraCallArgs.data.maxResults).toBe(jiraMaxResults);
                expect(jiraCallArgs.headers.Authorization).toContain(base64Key);
            });
        });

        function assertForBasicKey(checkThisKey){
            var createReq = JiraTracker.createSnapshot(),
                created = false;
            createReq.done(function() {
                created = true;
            });

            waitsFor(function() {
                return created;
            }, "Worksheet should be created", 1000);

            runs(function() {
                var jiraCallArgs = spyOnAjax.calls[0].args[0];
                expect(jiraCallArgs.headers.Authorization).toContain(checkThisKey);
            });
        }

        it("uses saved jira basic authentication to makes jira call to get jira issues", function() {
            populateValues();
            $("input#jiraPassword").data("jira-basic-authorization", "Some-Stored-Basic-Authentication-Value");

            assertForBasicKey("Some-Stored-Basic-Authentication-Value");
        });

        it("uses entered password instead of stored basic authentication for jira call if password control value is changed", function() {
            populateValues();
            $("input#jiraPassword").data("jira-basic-authorization", "Some-Stored-Basic-Authentication-Value");
            
            $("input#jiraPassword").trigger("change");

            assertForBasicKey(base64Key);
        });

        it("Create snapshot does validation", function() {
            $("input#releaseId").val("");
            var createReq = JiraTracker.createSnapshot();

            expect(createReq.errors).toBeDefined();
            doControlValidation(createReq, "releaseId", "Release is not loaded");
            doControlValidation(createReq, "jiraUserId", "Jira user name is required");
            doControlValidation(createReq, "jiraPassword", "Jira password is required");
            doControlValidation(createReq, "jiraJQL", "Jira JQL is required");
            doControlValidation(createReq, "snapshotTitle", "Snapshot title is required");
            doControlValidation(createReq, "jiraMaxResults", "Value of max result from is required");
            expect(spyOnCreateWorksheet).not.toHaveBeenCalled();
        });
    });
});