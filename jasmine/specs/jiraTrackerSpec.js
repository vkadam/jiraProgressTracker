steal("js/jiraTracker.js", function() {
    describe("JiraTracker", function() {
        var spyOnAjax;
        beforeEach(function() {
            $.ajaxSetup({
                async: false
            });
            // jasmine.getStyleFixtures().fixturesPath = "src/";
            // loadStyleFixtures("lib/bootstrap/css/bootstrap.css");
            spyOnAjax = spyOn($, "ajax");
            chrome.storage.sync.clear();
            affix(".container");
            JiraTracker.activeRelease = null;
        });

        afterEach(function() {
            JiraTracker.activeRelease = null;
            $(".container").empty();
        });

        describe("on init", function() {
            beforeEach(function() {
                spyOn(JiraTracker, "loadReleaseFromStorage");
                spyOn(JiraTracker, "bindEvents").andReturn(JiraTracker);
            });

            it("calls binds events and loads release from storage", function() {
                JiraTracker.init();
                expect(JiraTracker.bindEvents).toHaveBeenCalled();
                expect(JiraTracker.loadReleaseFromStorage).toHaveBeenCalled();
            });
        });

        describe("on loadReleaseFromStorage", function() {
            beforeEach(function() {
                spyOn(JiraTracker, "loadRelease");
                spyOn(chrome.storage.sync, "get").andCallThrough();
                chrome.storage.sync.set({
                    "JiraTracker": {
                        releaseId: "spreadsheetIdFromCache"
                    }
                });
            });

            it("populates release id from user sync data and load release", function() {
                JiraTracker.loadRelease.andCallFake(jasmine.deferred().callBack);
                JiraTracker.loadReleaseFromStorage();

                expect(chrome.storage.sync.get).toHaveBeenCalledWith("JiraTracker", jasmine.any(Function));
                expect(JiraTracker.loadRelease).toHaveBeenCalled();
            });

            it("returns deferred object", function() {
                JiraTracker.loadRelease.andCallFake(jasmine.deferred().callBack);
                var loadStorageReq = JiraTracker.loadReleaseFromStorage();
                expect(loadStorageReq).toBeDefined();
                expect(loadStorageReq.done).toBeDefined();
            });

            it("call error callback incase of loadRelease fails", function() {
                JiraTracker.loadRelease.andCallFake(jasmine.deferred({
                    "status": 0
                }).callBack);

                var errorCallback = jasmine.createSpy("JiraTracker.loadReleaseFromStorage.errorCallback"),
                    loadStorageReq = JiraTracker.loadReleaseFromStorage().fail(errorCallback);

                waitsFor(function() {
                    return (loadStorageReq.state() === "rejected");
                }, "JiraTracker.loadReleaseFromStorage should fail", 200);

                runs(function() {
                    expect(errorCallback).toHaveBeenCalled();
                });
            });
        });

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

        function doControlValidation(request, controlName, msg) {
            expect(request.errors[controlName]).toBe(msg);
            expect($("#" + controlName).parents(".control-group")).toHaveClass("error");
        }

        describe("Load release", function() {
            beforeEach(function() {
                spyOn(JiraTracker, "onReleaseChange");
                spyOn(GSLoader, "loadSpreadsheet");
                JiraTracker.injectUI();
            });

            function loadSpreadsheet(actualSpreadsheetId, expectedSpreadsheetId) {
                var actualRelease = {
                    id: expectedSpreadsheetId
                };
                GSLoader.loadSpreadsheet.andCallFake(jasmine.deferred({
                    "result": actualRelease
                }).callBack);
                var loadedReq = JiraTracker.loadRelease(null, actualSpreadsheetId);

                waitsFor(function() {
                    return (loadedReq.state() === "resolved");
                }, "Spreadsheet should be loaded", 200);

                runs(function() {
                    expect(GSLoader.loadSpreadsheet).toHaveBeenCalled();
                    expect(GSLoader.loadSpreadsheet.callCount).toBe(1);
                    expect(GSLoader.loadSpreadsheet.mostRecentCall.args[0].id).toBe(expectedSpreadsheetId);
                    expect(GSLoader.loadSpreadsheet.mostRecentCall.args[0].wanted).toEqual(["Setup"]);
                    expect(JiraTracker.onReleaseChange).toHaveBeenCalledWith(actualRelease);
                });
            }

            it("does validation for spreadsheet id", function() {
                var loadReq = JiraTracker.loadRelease();

                expect(loadReq.errors).toBeDefined();
                doControlValidation(loadReq, "releaseId", "Release id is required");
                expect(GSLoader.loadSpreadsheet).not.toHaveBeenCalled();
            });

            function loadSpreedsheetAndCallErrorBack(spreadsheetId) {
                GSLoader.loadSpreadsheet.andCallFake(jasmine.deferred({
                    "status": 0
                }).callBack);

                var errorCallback = jasmine.createSpy("JiraTracker.loadRelease.errorCallback"),
                    loadedReq = JiraTracker.loadRelease(null, spreadsheetId).fail(errorCallback);

                waitsFor(function() {
                    return (loadedReq.state() === "rejected");
                }, "JiraTracker.loadRelease should fail", 200);

                runs(function() {
                    expect(errorCallback).toHaveBeenCalled();
                });
            }

            it("call error callback in case of GSLoader.loadSpreadsheet failure", function() {
                loadSpreedsheetAndCallErrorBack("Some Spreadsheet Id");
            });

            it("call error callback in case of validation failure", function() {
                loadSpreedsheetAndCallErrorBack();
            });

            it("by spreadsheet id parameter and make it active", function() {
                loadSpreadsheet("mySpreadSheetId", "mySpreadSheetId");
            });

            it("from spreadsheet id input control make it active", function() {
                $("#releaseId").val("Some Spreadsheet Id From Input Field");
                loadSpreadsheet(null, "Some Spreadsheet Id From Input Field");
            });

            it("resets form and removes oldvalidator object from form and then add new", function() {
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
                            }
                        ]
                    };
                }
            };

            beforeEach(function() {
                JiraTracker.injectUI();
            });

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
            var newSpreadsheet;
            beforeEach(function() {
                spyOn(JiraTracker, "onReleaseChange").andCallThrough();
                spyOn(JiraTracker, "createSnapshot").andCallFake(jasmine.deferred().callBack);
                JiraTracker.injectUI();
                var worksheet = {
                    title: "Sheet 1",
                    rename: jasmine.createSpy("worksheet.rename").andCallFake(jasmine.deferred().callBack),
                    addRows: jasmine.createSpy("worksheet.addRows").andCallFake(jasmine.deferred().callBack)
                };
                newSpreadsheet = {
                    id: "mySpreadSheetId",
                    worksheets: [worksheet],
                    getWorksheet: jasmine.createSpy("spreadsheet.getWorksheet")
                };
                spyOn(GSLoader, "createSpreadsheet").andCallFake(jasmine.deferred({
                    "result": newSpreadsheet
                }).callBack);

                $("#jiraUserId").val("SomeJiraUserId");
                $("#jiraPassword").val("SomeJiraPassword");
                $("#jiraJQL").val("SomeJiraJQL");
                $("#snapshotTitle").val("SomeBaselineTitle");
            });

            function createSpreadsheet(actualTitle, expectedTitle) {
                newSpreadsheet.title = expectedTitle;
                var createReq = JiraTracker.createBaseline({}, actualTitle);

                waitsFor(function() {
                    return (createReq.state() === "resolved");
                }, "Spreadsheet should be created", 200);

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

            it("does validation and calls errorCallback", function() {
                $("#jiraUserId, #jiraPassword,#jiraJQL,#snapshotTitle").val("");

                var errorCallback = jasmine.createSpy("JiraTracker.createBaseline.errorCallback"),
                    createReq = JiraTracker.createBaseline().fail(errorCallback);

                waitsFor(function() {
                    return (createReq.state() === "rejected");
                }, "JiraTracker.createBaseline should fail", 200);

                runs(function() {
                    expect(errorCallback).toHaveBeenCalled();
                    expect(createReq.errors).toBeDefined();
                    doControlValidation(createReq, "releaseTitle", "Release title is required");
                    doControlValidation(createReq, "jiraUserId", "Jira user name is required");
                    doControlValidation(createReq, "jiraPassword", "Jira password is required");
                    doControlValidation(createReq, "jiraJQL", "Jira JQL is required");
                    doControlValidation(createReq, "snapshotTitle", "Snapshot title is required");
                    expect(GSLoader.createSpreadsheet).not.toHaveBeenCalled();
                });
            });

            function createBaselineAndCallErrorBack() {
                var errorCallback = jasmine.createSpy("JiraTracker.createBaseline.errorCallback"),
                    loadedReq = JiraTracker.createBaseline({}, "Baseline title").fail(errorCallback);

                waitsFor(function() {
                    return (loadedReq.state() === "rejected");
                }, "JiraTracker.createBaseline should fail", 200);

                runs(function() {
                    expect(errorCallback).toHaveBeenCalled();
                });
            }

            it("call error callback in case of GSLoader.createSpreadsheet failure", function() {
                GSLoader.createSpreadsheet.andCallFake(jasmine.deferred({
                    "status": 0
                }).callBack);
                createBaselineAndCallErrorBack();
            });

            it("call error callback in case of worksheet.rename failure", function() {
                newSpreadsheet.worksheets[0].rename.andCallFake(jasmine.deferred({
                    "status": 0
                }).callBack);
                createBaselineAndCallErrorBack();
            });

            it("call error callback in case of JiraTracker.createSnapshot failure", function() {
                JiraTracker.createSnapshot.andCallFake(jasmine.deferred({
                    "status": 0
                }).callBack);
                createBaselineAndCallErrorBack();
            });

            it("call error callback in case of worksheet.addRows failure", function() {
                newSpreadsheet.worksheets[0].addRows.andCallFake(jasmine.deferred({
                    "status": 0
                }).callBack);
                createBaselineAndCallErrorBack();
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
                $("#releaseId").val(activeRelease.id);
                $("#snapshotTitle").val(snapshotTitle);
                $("#jiraJQL").val(jiraJQL);
                $("#jiraMaxResults").val(jiraMaxResults);
                $("#jiraUserId").val(jiraUserId);
                $("#jiraPassword").val(jiraPassword);
            }

            beforeEach(function() {
                spyOn(JiraTracker, "loadReleaseFromStorage");
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

            function createWorksheetAndAssert(_snapshotTitle) {
                populateValues();
                var createReq;
                if (_snapshotTitle) {
                    snapshotTitle = _snapshotTitle;
                    createReq = JiraTracker.createSnapshot(null, snapshotTitle);
                } else {
                    createReq = JiraTracker.createSnapshot();
                }

                waitsFor(function() {
                    return createReq.state() === "resolved";
                }, "Worksheet should be created", 200);

                runs(function() {
                    expect(spyOnCreateWorksheet).toHaveBeenCalled();
                    expect(spyOnCreateWorksheet.callCount).toBe(1);
                    expect(spyOnCreateWorksheet.mostRecentCall.args[0].rowData.length).toBe(50);
                    expect(JiraTracker.activeRelease.worksheets[0]).toBe(worksheet);
                    expect(JiraTracker.activeRelease.worksheets[0].id).toBe("ws1");
                    expect($("#snapshotTitle")).toHaveValue(snapshotTitle);
                });
            }

            it("creates worksheet into activeRelease using snapshot title field", function() {
                createWorksheetAndAssert();
            });

            it("creates worksheet into activeRelease using snapshot title parameter", function() {
                createWorksheetAndAssert("Some another worksheet title");
            });

            it("makes jira call with correct data to get jira issues", function() {
                populateValues();
                var createReq = JiraTracker.createSnapshot();

                waitsFor(function() {
                    return createReq.state() === "resolved";
                }, "Worksheet should be created", 200);

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

            function assertForBasicKey(checkThisKey) {
                var createReq = JiraTracker.createSnapshot(),
                    created = false;
                createReq.done(function() {
                    created = true;
                });

                waitsFor(function() {
                    return created;
                }, "Worksheet should be created", 200);

                runs(function() {
                    var jiraCallArgs = spyOnAjax.calls[0].args[0];
                    expect(jiraCallArgs.headers.Authorization).toContain(checkThisKey);
                });
            }

            it("uses saved jira basic authentication to makes jira call to get jira issues", function() {
                populateValues();
                $("#jiraPassword").data("jira-basic-authorization", "Some-Stored-Basic-Authentication-Value");

                assertForBasicKey("Some-Stored-Basic-Authentication-Value");
            });

            it("uses entered password instead of stored basic authentication for jira call if password control value is changed", function() {
                populateValues();
                $("#jiraPassword").data("jira-basic-authorization", "Some-Stored-Basic-Authentication-Value");

                $("#jiraPassword").trigger("change");

                assertForBasicKey(base64Key);
            });

            it("does validation", function() {
                $("#releaseId").val("");
                $("#jiraMaxResults").val("").show();
                var errorCallback = jasmine.createSpy("JiraTracker.createSnapshot.errorCallback"),
                    createReq = JiraTracker.createSnapshot().fail(errorCallback);

                waitsFor(function() {
                    return (createReq.state() === "rejected");
                }, "JiraTracker.createBaseline should fail", 200);

                runs(function() {
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

            function createBaselineAndCallErrorBack() {
                populateValues();
                var errorCallback = jasmine.createSpy("JiraTracker.createSnapshot.errorCallback"),
                    loadedReq = JiraTracker.createSnapshot({}, "Snapshot title").fail(errorCallback);

                waitsFor(function() {
                    return (loadedReq.state() === "rejected");
                }, "JiraTracker.createSnapshot should fail", 200);

                runs(function() {
                    expect(errorCallback).toHaveBeenCalled();
                });
            }

            it("call error callback in case of error for getting jira issues", function() {
                $.fixture("http://jira.cengage.com/rest/api/2/search", function() {
                    return [401, "Get Jira Issue Error", null];
                });
                createBaselineAndCallErrorBack();
            });

            it("call error callback in case of activeRelease.createWorksheet failure", function() {
                spyOnCreateWorksheet.andCallFake(jasmine.deferred({
                    "status": 0
                }).callBack);
                createBaselineAndCallErrorBack();
            });
        });

        describe("canSnapshotBeGenerated", function() {
            var activeRelease,
                worksheet1 = {
                    id: "ws1",
                    title: "Snapshot 08-15-2012"
                },
                worksheet2 = {
                    id: "ws2",
                    title: "Changes as per test"
                };

            beforeEach(function() {
                activeRelease = {
                    id: "mySpreadSheetId",
                    title: "Release Sheet Title",
                    worksheets: [worksheet1]
                };
                spyOn(JiraTracker, "loadReleaseFromStorage").andCallFake(function() {
                    JiraTracker.activeRelease = activeRelease;
                });
            });

            it("load release from user sync data if no active release found", function() {
                expect(JiraTracker.activeRelease).toBeNull();
                spyOn(JiraTracker, "getJiraServerTime").andReturn(moment("08-15-2012"));

                JiraTracker.canSnapshotBeGenerated();

                expect(JiraTracker.loadReleaseFromStorage).toHaveBeenCalled();

                JiraTracker.loadReleaseFromStorage.reset();
                JiraTracker.canSnapshotBeGenerated();

                expect(JiraTracker.loadReleaseFromStorage).not.toHaveBeenCalled();
            });

            it("returns false is release is not loaded", function() {
                expect(JiraTracker.activeRelease).toBeNull();

                expect(JiraTracker.canSnapshotBeGenerated()).toBeFalsy();
            });

            it("returns false if time is between work start time and work end time", function() {
                JiraTracker.loadReleaseFromStorage();
                var jiraServerTime = moment().startOf('hour').year(2012).month(7).date(17).hour(9);
                spyOn(JiraTracker, "getJiraServerTime").andReturn(jiraServerTime);

                expect(JiraTracker.canSnapshotBeGenerated()).toBeFalsy();
            });

            // Yesterday
            it("returns yesterday's date if snapshot is missing for yesterday and time is before work start time", function() {
                expect(JiraTracker.activeRelease).toBeNull();
                JiraTracker.loadReleaseFromStorage();
                var jiraServerTime = moment().startOf('hour').year(2012).month(7).date(17).hour(7);
                spyOn(JiraTracker, "getJiraServerTime").andReturn(jiraServerTime);

                expect(JiraTracker.canSnapshotBeGenerated()).toBe("08-16-2012");
            });

            it("returns false if snapshot is available for yesterday and time is before work start time", function() {
                JiraTracker.loadReleaseFromStorage();
                var jiraServerTime = moment().startOf('hour').year(2012).month(7).date(17).hour(7);
                spyOn(JiraTracker, "getJiraServerTime").andReturn(jiraServerTime);

                worksheet2.title = "Snapshot 08-16-2012";
                activeRelease.worksheets.push(worksheet2);
                expect(JiraTracker.canSnapshotBeGenerated()).toBeFalsy();
            });

            // Today
            it("returns today's date if snapshot is missing for today and time is after work end time", function() {
                expect(JiraTracker.activeRelease).toBeNull();
                JiraTracker.loadReleaseFromStorage();
                var jiraServerTime = moment().startOf('hour').year(2012).month(7).date(17).hour(18);
                spyOn(JiraTracker, "getJiraServerTime").andReturn(jiraServerTime);

                expect(JiraTracker.canSnapshotBeGenerated()).toBe("08-17-2012");
            });

            it("returns false if snapshot is available for today and time is after work end time", function() {
                JiraTracker.loadReleaseFromStorage();
                var jiraServerTime = moment().startOf('hour').year(2012).month(7).date(17).hour(18);
                spyOn(JiraTracker, "getJiraServerTime").andReturn(jiraServerTime);

                worksheet2.title = "Snapshot 08-17-2012";
                activeRelease.worksheets.push(worksheet2);
                expect(JiraTracker.canSnapshotBeGenerated()).toBeFalsy();
            });
        });
    });
});
