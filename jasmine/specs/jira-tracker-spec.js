define(["jquery", "js/jira-tracker", "gsloader",
    "js/moment-zone", "jasmine-helper", "js-logger", "js/models/jira-storage"
], function($, JiraTracker, GSLoader, moment, Deferred, Logger, Storage) {
    describe("JiraTracker", function() {
        var spyOnAjax;
        beforeEach(function() {
            $.ajaxSetup({
                async: false
            });
            spyOnAjax = spyOn($, "ajax");
            affix("#jira-container");
        });

        afterEach(function() {
            JiraTracker.storage = new Storage();
            $("#jira-container").empty();
        });

        describe("populate filters", function() {
            var spreadsheetId = "my-fliter-masters-spreadsheet-id",
                filterMasterWorksheet = {
                    title: "Filters",
                    rows: [{
                            "filtername": "Filter Name 1",
                            "spreadsheetid": "spreadsheetid1",
                            "jql": "jira jql 1",
                            "active": "N"
                    }, {
                            "filtername": "Filter Name 2",
                            "spreadsheetid": "spreadsheetid2",
                            "jql": "jira jql 2",
                            "active": "N"
                    }, {
                            "filtername": "Filter Name 3",
                            "spreadsheetid": "spreadsheetid3",
                            "jql": "jira jql 3",
                            "active": "Y"
                    }]
                },
                getWorksheetSpy = jasmine.createSpy("Spreadsheet.getWorksheet").andReturn(filterMasterWorksheet),
                filterSpreadsheet = {
                    id: spreadsheetId,
                    getWorksheet: getWorksheetSpy
                };

            beforeEach(function() {
                JiraTracker.id = spreadsheetId;
                spyOn(GSLoader, "loadSpreadsheet").andCallFake(new Deferred({
                    "result": filterSpreadsheet
                }).callBack);
            });

            it("returns promise object", function() {
                var promise = JiraTracker.fetchFilters();

                expect(promise.fail).toBeDefined();
                expect(promise.done).toBeDefined();
                expect(promise.resolve).not.toBeDefined();
            });

            it("makes call to GSLoader.loadSpreadsheet with correct parameters", function() {
                JiraTracker.fetchFilters();

                expect(GSLoader.loadSpreadsheet).toHaveBeenCalledWith({
                    id: spreadsheetId,
                    wanted: ["Filters"]
                });
            });

            function assertFilter(filter, name, id, jql, active) {
                expect(filter.name).toBe(name);
                expect(filter.id).toBe(id);
                expect(filter.jql).toBe(jql);
                expect(filter.isActive).toBe(active);
            }

            it("resolves returned promise object with correct list of Filters", function() {
                var filters,
                    promise = JiraTracker.fetchFilters().done(function(filts) {
                        filters = filts;
                    });

                waitsFor(function() {
                    return promise.state() !== "pending";
                }, 200);

                runs(function() {
                    expect(filters).toBeDefined();
                    expect(filters.length).toBe(3);
                    assertFilter(filters[0], "Filter Name 1", "spreadsheetid1", "jira jql 1", false);
                    assertFilter(filters[1], "Filter Name 2", "spreadsheetid2", "jira jql 2", false);
                    assertFilter(filters[2], "Filter Name 3", "spreadsheetid3", "jira jql 3", true);
                });
            });

            it("fails promise object if GSLoader.loadSpreadsheet fails", function() {
                GSLoader.loadSpreadsheet.andCallFake(new Deferred({
                    "status": 0,
                    "result": "Error Message"
                }).callBack);

                var failCallBack = jasmine.createSpy("JiraTracker.fetchFilters"),
                    promise = JiraTracker.fetchFilters().fail(failCallBack);

                waitsFor(function() {
                    return promise.state() !== "pending";
                }, 200);

                runs(function() {
                    expect(failCallBack).toHaveBeenCalledWith({
                        "message": "Error Message"
                    });
                });
            });

            it("fails promise object if worksheet with name \"Filters\" is not available", function() {
                getWorksheetSpy.andReturn(null);

                var failCallBack = jasmine.createSpy("JiraTracker.fetchFilters"),
                    promise = JiraTracker.fetchFilters().fail(failCallBack);

                waitsFor(function() {
                    return promise.state() !== "pending";
                }, 200);

                runs(function() {
                    expect(failCallBack).toHaveBeenCalledWith({
                        "message": "Filters worksheet not available",
                        "spreadsheet": filterSpreadsheet
                    });
                });
            });
        });

        describe("on init", function() {
            beforeEach(function() {
                spyOn(JiraTracker, "loadReleaseFromStorage");
                spyOn(JiraTracker, "fetchFilters");
            });

            it("loads release from storage", function() {
                JiraTracker.init();
                expect(JiraTracker.loadReleaseFromStorage).toHaveBeenCalled();
            });

            it("fetches filters", function() {
                JiraTracker.init();
                expect(JiraTracker.fetchFilters).toHaveBeenCalled();
            });
        });

        describe("on loadReleaseFromStorage", function() {
            beforeEach(function() {
                spyOn(JiraTracker, "loadRelease");
                spyOn(JiraTracker.storage, "get").andCallThrough();
                JiraTracker.storage.set("releaseId", "spreadsheetIdFromCache");
                jasmine.Clock.useMock();
            });

            it("populates release id from user sync data and load release", function() {
                JiraTracker.loadRelease.andCallFake(new Deferred().callBack);
                JiraTracker.loadReleaseFromStorage();
                jasmine.Clock.tick(101);

                expect(JiraTracker.storage.get).toHaveBeenCalledWith("releaseId");
                expect(JiraTracker.loadRelease).toHaveBeenCalled();
            });

            it("returns deferred object", function() {
                JiraTracker.loadRelease.andCallFake(new Deferred().callBack);
                var loadStorageReq = JiraTracker.loadReleaseFromStorage();
                expect(loadStorageReq).toBeDefined();
                expect(loadStorageReq.done).toBeDefined();
            });

            it("call error callback incase of loadRelease fails", function() {
                JiraTracker.loadRelease.andCallFake(new Deferred({
                    "status": 0,
                    "result": "load release failed"
                }).callBack);

                var errorCallback = jasmine.createSpy("JiraTracker.loadReleaseFromStorage.errorCallback"),
                    loadStorageReq = JiraTracker.loadReleaseFromStorage().fail(errorCallback);
                jasmine.Clock.tick(101);
                waitsFor(function() {
                    return (loadStorageReq.state() === "rejected");
                }, "JiraTracker.loadReleaseFromStorage should fail", 200);

                runs(function() {
                    expect(errorCallback).toHaveBeenCalledWith({
                        message: "load release failed"
                    });
                });
            });
        });

        function doControlValidation(valObject, controlName, msg) {
            expect(valObject.errors[controlName]).toBe(msg);
            expect($("#" + controlName).parents(".form-group")).toHaveClass("has-error");
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
                GSLoader.loadSpreadsheet.andCallFake(new Deferred({
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
                var errorObject,
                    loadReq = JiraTracker.loadRelease().fail(function(valObject) {
                        errorObject = valObject;
                    });
                waitsFor(function() {
                    return loadReq.state() !== "pending";
                });
                runs(function() {
                    expect(errorObject).toBeDefined();
                    doControlValidation(errorObject, "releaseId", "Release id is required");
                });

                expect(GSLoader.loadSpreadsheet).not.toHaveBeenCalled();
            });

            function loadSpreedsheetAndCallErrorBack(spreadsheetId, errorObj) {
                GSLoader.loadSpreadsheet.andCallFake(new Deferred({
                    "status": 0,
                    "result": "GSLoader.loadSpreadsheet failed"
                }).callBack);

                var errorCallback = jasmine.createSpy("JiraTracker.loadRelease.errorCallback"),
                    loadedReq = JiraTracker.loadRelease(null, spreadsheetId).fail(errorCallback);

                waitsFor(function() {
                    return (loadedReq.state() === "rejected");
                }, "JiraTracker.loadRelease should fail", 200);

                runs(function() {
                    if (errorObj) {
                        expect(errorCallback).toHaveBeenCalledWith(errorObj);
                    } else {
                        expect(errorCallback).toHaveBeenCalled();
                    }
                });
            }

            it("call error callback in case of GSLoader.loadSpreadsheet failure", function() {
                loadSpreedsheetAndCallErrorBack("Some Spreadsheet Id", {
                    message: "GSLoader.loadSpreadsheet failed"
                });
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
                $("form#jira-tracker").data("validator", {
                    "some": "object",
                    "reset": resetSpy,
                    "errors": function() {
                        return $("#releaseTitle");
                    },
                    "settings": {
                        "unhighlight": function(ele, errorClass) {
                            $(ele).parents(".form-group").removeClass(errorClass);
                        }
                    }
                });
                $("#releaseTitle").parents(".form-group").addClass("has-error");

                loadSpreadsheet("mySpreadSheetId", "mySpreadSheetId");

                var validatorObj = $("form#jira-tracker").data("validator");
                expect(validatorObj.some).not.toBeDefined();
                expect(resetSpy).toHaveBeenCalled();
                expect(validatorObj instanceof $.validator).toBeTruthy();
                expect($("#releaseTitle").parents(".form-group")).not.toHaveClass("has-error");
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
                                "jira-jql": "SomeJiraJQL"
                        }]
                    };
                }
            };

            beforeEach(function() {
                JiraTracker.injectUI();
                jasmine.Clock.useMock();
            });

            it("onReleaseChange poluates fields, make spreadsheet active and returns currentFilter", function() {

                expect(JiraTracker.getCurrentFilter()).toBeNull();

                var returnObj = JiraTracker.onReleaseChange(actualRelease);

                expect(returnObj).toBe(JiraTracker.getCurrentFilter());
                expect($("#releaseId")).toHaveValue("Some Spreadsheet Id");
                expect($("#releaseTitle")).toHaveValue("Some Spreadsheet Title");
                expect($("#jiraJQL")).toHaveValue("SomeJiraJQL");
                expect(JiraTracker.getCurrentFilter()).toBe(actualRelease);
            });

            xit("onReleaseChange disables releaseTitle and jiraJQL controls", function() {

                JiraTracker.onReleaseChange(actualRelease);

                expect($("#releaseTitle")).toBeDisabled();
                expect($("#jiraJQL")).toBeDisabled();
            });

            it("onReleaseChange updates spreadsheet id in user storage", function() {
                JiraTracker.onReleaseChange({
                    id: "mySpreadSheetId",
                    getWorksheet: jasmine.createSpy("spreadsheet.getWorksheet")
                });
                var releaseId;
                JiraTracker.storage.get("releaseId").done(function(data) {
                    releaseId = data;
                });
                jasmine.Clock.tick(101);
                expect(releaseId).toBe("mySpreadSheetId");
            });
        });

        describe("Create release", function() {
            var newSpreadsheet;
            beforeEach(function() {
                spyOn(JiraTracker, "onReleaseChange").andCallThrough();
                spyOn(JiraTracker, "createSnapshot").andCallFake(new Deferred().callBack);
                JiraTracker.injectUI();
                var worksheet = {
                    title: "Sheet 1",
                    rename: jasmine.createSpy("worksheet.rename").andCallFake(new Deferred().callBack),
                    addRows: jasmine.createSpy("worksheet.addRows").andCallFake(new Deferred().callBack)
                };
                newSpreadsheet = {
                    id: "mySpreadSheetId",
                    worksheets: [worksheet],
                    getWorksheet: jasmine.createSpy("spreadsheet.getWorksheet")
                };
                spyOn(GSLoader, "createSpreadsheet").andCallFake(new Deferred({
                    "result": newSpreadsheet
                }).callBack);

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

                expect(JiraTracker.getCurrentFilter().worksheets.length).toBe(1);
                expect(JiraTracker.getCurrentFilter().worksheets[0].rename).toHaveBeenCalledWith("Setup");
            });

            it("adds release setting into setup worksheet", function() {
                createSpreadsheet("My Spreadsheet Title", "My Spreadsheet Title");
                var addRowCall = JiraTracker.getCurrentFilter().worksheets[0].addRows,
                    expectRows = [
                        ["jira-jql"],
                                                                        ["SomeJiraJQL"]
                    ];
                expect(JiraTracker.getCurrentFilter().worksheets.length).toBe(1);
                expect(addRowCall.callCount).toBe(1);
                expect(addRowCall).toHaveBeenCalledWith(expectRows);
            });

            it("does validation and calls errorCallback", function() {
                $("#jiraJQL,#snapshotTitle").val("");

                var errorObject,
                    createReq = JiraTracker.createBaseline().fail(function(valObject) {
                        errorObject = valObject;
                    });

                waitsFor(function() {
                    return (createReq.state() === "rejected");
                }, "JiraTracker.createBaseline should fail", 200);

                runs(function() {
                    expect(errorObject).toBeDefined();
                    doControlValidation(errorObject, "releaseTitle", "Release title is required");
                    doControlValidation(errorObject, "jiraJQL", "Jira JQL is required");
                    doControlValidation(errorObject, "snapshotTitle", "Snapshot title is required");
                    expect(GSLoader.createSpreadsheet).not.toHaveBeenCalled();
                });
            });

            describe("call error callback", function() {
                function createBaselineAndCallErrorBack(errorMsg) {
                    var errorCallback = jasmine.createSpy("JiraTracker.createBaseline.errorCallback"),
                        loadedReq = JiraTracker.createBaseline({}, "Baseline title").fail(errorCallback);

                    waitsFor(function() {
                        return (loadedReq.state() === "rejected");
                    }, "JiraTracker.createBaseline should fail", 200);

                    runs(function() {
                        expect(errorCallback).toHaveBeenCalledWith({
                            message: errorMsg
                        });
                    });
                }

                it("in case of GSLoader.createSpreadsheet failure", function() {
                    GSLoader.createSpreadsheet.andCallFake(new Deferred({
                        "status": 0,
                        "result": "GSLoader.createSpreadsheet failed"
                    }).callBack);
                    createBaselineAndCallErrorBack("GSLoader.createSpreadsheet failed");
                });

                it("in case of worksheet.rename failure", function() {
                    newSpreadsheet.worksheets[0].rename.andCallFake(new Deferred({
                        "status": 0,
                        "result": "worksheet.rename failed"
                    }).callBack);
                    createBaselineAndCallErrorBack("worksheet.rename failed");
                });

                it("in case of JiraTracker.createSnapshot failure", function() {
                    JiraTracker.createSnapshot.andCallFake(new Deferred({
                        "status": 0,
                        "result": "JiraTracker.createSnapshot failed"
                    }).callBack);
                    createBaselineAndCallErrorBack("JiraTracker.createSnapshot failed");
                });

                it("in case of worksheet.addRows failure", function() {
                    newSpreadsheet.worksheets[0].addRows.andCallFake(new Deferred({
                        "status": 0,
                        "result": "worksheet.addRows failed"
                    }).callBack);
                    createBaselineAndCallErrorBack("worksheet.addRows failed");
                });
            });
        });

        describe("createSnapshot", function() {
            var snapshotTitle = "Worksheet Title",
                spyOnCreateWorksheet = jasmine.createSpy("createWorksheet"),
                currentFilter = {
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
                base64Key = "JiraCredentials base64Key";

            function populateValues() {
                $("#releaseId").val(currentFilter.id);
                $("#snapshotTitle").val(snapshotTitle);
                $("#jiraJQL").val(jiraJQL);
                $("#jiraMaxResults").val(jiraMaxResults);
                JiraTracker.storage.set("Jira-Credentials", base64Key);
            }

            beforeEach(function() {
                spyOn(JiraTracker, "loadReleaseFromStorage");
                spyOn(JiraTracker, "fetchFilters");
                JiraTracker.init();

                spyOnAjax.andCallThrough();
                $.fixture("http://jira.cengage.com/rest/api/2/search", "jasmine/fixtures/jiraIssues.json");
                spyOn(JiraTracker, "getCurrentFilter").andReturn(currentFilter);
                spyOnCreateWorksheet.reset();
                spyOnCreateWorksheet.andCallFake(function(options) {
                    currentFilter.worksheets.push(worksheet);
                    var deferred = $.Deferred();
                    var lsReq = deferred.promise();
                    options.context = options.context || lsReq;
                    deferred.resolveWith(options.context, [worksheet]);
                    return lsReq;
                });
                jiraJQL = "Some jira query";
                jiraMaxResults = "10";
            });

            afterEach(function() {
                $("#releaseId,#snapshotTitle,#jiraJQL,#jiraMaxResults").val("");
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
                    expect(JiraTracker.getCurrentFilter().worksheets[0]).toBe(worksheet);
                    expect(JiraTracker.getCurrentFilter().worksheets[0].id).toBe("ws1");
                    expect($("#snapshotTitle")).toHaveValue(snapshotTitle);
                });
            }

            it("creates worksheet into currentFilter using snapshot title field", function() {
                createWorksheetAndAssert();
            });

            it("creates worksheet into currentFilter using snapshot title parameter", function() {
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

            it("does form control validation", function() {
                $("#releaseId,#snapshotTitle,#jiraJQL,#jiraMaxResults").val("");
                var errorObject,
                    createReq = JiraTracker.createSnapshot().fail(function(valObject) {
                        errorObject = valObject;
                    });

                waitsFor(function() {
                    return (createReq.state() !== "pending");
                }, "JiraTracker.createBaseline should fail", 200);

                runs(function() {
                    expect(errorObject).toBeDefined();
                    doControlValidation(errorObject, "releaseId", "Release is not loaded");
                    doControlValidation(errorObject, "jiraJQL", "Jira JQL is required");
                    doControlValidation(errorObject, "snapshotTitle", "Snapshot title is required");
                    doControlValidation(errorObject, "jiraMaxResults", "Value of max result from is required");
                    expect(errorObject.errors["jira-authentication"]).toBe("Jira authentication is required");
                    expect(spyOnCreateWorksheet).not.toHaveBeenCalled();
                });
            });

            it("does jira authentication validation and does not make jira ajax call", function() {
                populateValues();
                JiraTracker.storage.set("Jira-Credentials", null);
                var errorObject,
                    createReq = JiraTracker.createSnapshot().fail(function(valObject) {
                        errorObject = valObject;
                    });

                waitsFor(function() {
                    return (createReq.state() !== "pending");
                }, "JiraTracker.createBaseline should fail", 200);

                runs(function() {
                    expect(errorObject).toBeDefined();
                    expect(errorObject.errors["jira-authentication"]).toBe("Jira authentication is required");
                    expect(spyOnAjax).not.toHaveBeenCalled();
                    expect(spyOnCreateWorksheet).not.toHaveBeenCalled();
                });
            });

            it("does not make jira ajax call if jira authentication is available but form validation fails", function() {
                populateValues();
                $("#releaseId,#snapshotTitle,#jiraJQL,#jiraMaxResults").val("");
                var errorObject,
                    createReq = JiraTracker.createSnapshot().fail(function(valObject) {
                        errorObject = valObject;
                    });

                waitsFor(function() {
                    return (createReq.state() !== "pending");
                }, "JiraTracker.createBaseline should fail", 200);

                runs(function() {
                    expect(errorObject).toBeDefined();
                    expect(spyOnAjax).not.toHaveBeenCalled();
                    expect(spyOnCreateWorksheet).not.toHaveBeenCalled();
                });
            });

            function createBaselineAndCallErrorBack(errorMsg) {
                populateValues();
                var errorCallback = jasmine.createSpy("JiraTracker.createSnapshot.errorCallback"),
                    loadedReq = JiraTracker.createSnapshot({}, "Snapshot title").fail(errorCallback);

                waitsFor(function() {
                    return (loadedReq.state() === "rejected");
                }, "JiraTracker.createSnapshot should fail", 200);

                runs(function() {
                    expect(errorCallback).toHaveBeenCalledWith({
                        message: errorMsg
                    });
                });
            }

            it("call error callback in case of error for getting jira issues", function() {
                $.fixture("http://jira.cengage.com/rest/api/2/search", function() {
                    return [401, "Get Jira Issue Error", null];
                });
                createBaselineAndCallErrorBack("error");
            });

            it("call error callback in case of parsing jira issues response", function() {
                $.fixture("http://jira.cengage.com/rest/api/2/search", function() {
                    return [200, "jira response parsing exception", "null"];
                });
                createBaselineAndCallErrorBack("Exception while parsing jira issue response");
            });

            it("call error callback in case of currentFilter.createWorksheet failure", function() {
                spyOnCreateWorksheet.andCallFake(new Deferred({
                    "status": 0,
                    "result": "Create worksheet failed"
                }).callBack);
                createBaselineAndCallErrorBack("Create worksheet failed");
            });
        });

        describe("canSnapshotBeGenerated", function() {
            var currentFilter,
                worksheet1 = {
                    id: "ws1",
                    title: "Snapshot 08-15-2012"
                },
                worksheet2 = {
                    id: "ws2",
                    title: "Changes as per test"
                };

            beforeEach(function() {
                currentFilter = {
                    id: "mySpreadSheetId",
                    title: "Release Sheet Title",
                    worksheets: [worksheet1]
                };
                spyOn(JiraTracker, "getCurrentFilter");
                spyOn(JiraTracker, "loadReleaseFromStorage");
            });

            it("load release from user sync data if no active release found", function() {
                JiraTracker.getCurrentFilter.andReturn(null);
                spyOn(JiraTracker, "getJiraServerTime").andReturn(moment("08-15-2012"));

                JiraTracker.canSnapshotBeGenerated();

                expect(JiraTracker.loadReleaseFromStorage).toHaveBeenCalled();

                JiraTracker.loadReleaseFromStorage.reset();
                JiraTracker.getCurrentFilter.andReturn(currentFilter);
                JiraTracker.canSnapshotBeGenerated();

                expect(JiraTracker.loadReleaseFromStorage).not.toHaveBeenCalled();
            });

            it("returns false is release is not loaded", function() {
                JiraTracker.getCurrentFilter.andReturn(null);

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
                JiraTracker.getCurrentFilter.andReturn(currentFilter);
                var jiraServerTime = moment().startOf('hour').year(2012).month(7).date(17).hour(7);
                spyOn(JiraTracker, "getJiraServerTime").andReturn(jiraServerTime);

                expect(JiraTracker.canSnapshotBeGenerated()).toBe("08-16-2012");
            });

            it("returns false if snapshot is available for yesterday and time is before work start time", function() {
                JiraTracker.getCurrentFilter.andReturn(currentFilter);
                var jiraServerTime = moment().startOf('hour').year(2012).month(7).date(17).hour(7);
                spyOn(JiraTracker, "getJiraServerTime").andReturn(jiraServerTime);

                worksheet2.title = "Snapshot 08-16-2012";
                currentFilter.worksheets.push(worksheet2);
                expect(JiraTracker.canSnapshotBeGenerated()).toBeFalsy();
            });

            // Today
            it("returns today's date if snapshot is missing for today and time is after work end time", function() {
                JiraTracker.getCurrentFilter.andReturn(currentFilter);
                var jiraServerTime = moment().startOf('hour').year(2012).month(7).date(17).hour(18);
                spyOn(JiraTracker, "getJiraServerTime").andReturn(jiraServerTime);

                expect(JiraTracker.canSnapshotBeGenerated()).toBe("08-17-2012");
            });

            it("returns false if snapshot is available for today and time is after work end time", function() {
                JiraTracker.getCurrentFilter.andReturn(currentFilter);
                var jiraServerTime = moment().startOf('hour').year(2012).month(7).date(17).hour(18);
                spyOn(JiraTracker, "getJiraServerTime").andReturn(jiraServerTime);

                worksheet2.title = "Snapshot 08-17-2012";
                currentFilter.worksheets.push(worksheet2);
                expect(JiraTracker.canSnapshotBeGenerated()).toBeFalsy();
            });
        });

        describe("findEndOfWeekSheet", function() {
            //17-23 March 2013
            var currentFilter,
                worksheet1 = {
                    id: "ws1",
                    title: "08-15-2012"
                },
                worksheet2 = {
                    id: "ws2",
                    title: "Changes as per test"
                };

            beforeEach(function() {
                currentFilter = {
                    id: "mySpreadSheetId",
                    title: "Release Sheet Title",
                    worksheets: [worksheet1]
                };

                spyOn(JiraTracker, "getCurrentFilter");
                spyOn(JiraTracker, "loadReleaseFromStorage");
            });

            it("returns the sheet for the passed date if it exists", function() {
                JiraTracker.getCurrentFilter.andReturn(currentFilter);
                var title = "03-23-2013";
                worksheet2.title = title;
                currentFilter.worksheets.push(worksheet2);
                Logger.debug("Testing: ", moment(title));
                var returnedTitle = JiraTracker.findEndOfWeekSheet(moment(title)).title;
                expect(returnedTitle).toBe(title);
            });
        });
    });
});
