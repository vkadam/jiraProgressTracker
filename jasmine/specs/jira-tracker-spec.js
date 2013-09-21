define(["jquery", "js/jira-tracker", "gsloader",
    "js/moment-zone", "jasmine-helper", "logger", "js/models/jira-storage", "js/comparator/Snapshot"
], function($, JiraTracker, GSLoader, moment, Deferred) {
    describe("JiraTracker", function() {
        var spyOnAjax, jiraTracker;
        beforeEach(function() {
            $.ajaxSetup({
                async: false
            });
            spyOnAjax = spyOn($, "ajax");
            affix("#jira-container");
            jiraTracker = new JiraTracker();
        });

        afterEach(function() {
            $("#jira-container").empty();
        });

        describe("populate filters", function() {
            /*var filterMasterWorksheet = {
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
            };
            getWorksheetSpy = jasmine.createSpy("Spreadsheet.getWorksheet").andReturn(filterMasterWorksheet);
            spreadsheetId = "my-fliter-masters-spreadsheet-id",
                filterSpreadsheet = {
                    id: spreadsheetId,
                    getWorksheet: getWorksheetSpy
                };*/

            beforeEach(function() {
                spyOn(jiraTracker, "loadReleaseFromStorage");
                // spyOn(jiraTracker, "fetchFilters");
            });

            it("loads release from storage", function() {
                jiraTracker.init();
                expect(jiraTracker.loadReleaseFromStorage).toHaveBeenCalled();
            });

            /*it("fetches filters", function() {
                jiraTracker.init();
                expect(jiraTracker.fetchFilters).toHaveBeenCalled();
            });*/
        });

        describe("injectUI", function() {

            it("create filter dropdown", function() {

            });
        });

        describe("loadReleaseFromStorage", function() {
            beforeEach(function() {
                spyOn(jiraTracker, "loadRelease");
                spyOn(jiraTracker.storage, "get").andCallThrough();
                jiraTracker.storage.set("filterId", "spreadsheetIdFromCache");
                jasmine.Clock.useMock();
            });

            it("populates release id from user sync data and load release", function() {
                jiraTracker.loadRelease.andCallFake(new Deferred().callBack);
                jiraTracker.loadReleaseFromStorage();
                jasmine.Clock.tick(101);

                expect(jiraTracker.storage.get).toHaveBeenCalledWith("filterId");
                expect(jiraTracker.loadRelease).toHaveBeenCalled();
            });

            it("returns deferred object", function() {
                jiraTracker.loadRelease.andCallFake(new Deferred().callBack);
                var loadStorageReq = jiraTracker.loadReleaseFromStorage();
                expect(loadStorageReq).toBeDefined();
                expect(loadStorageReq.done).toBeDefined();
            });

            it("call error callback incase of loadRelease fails", function() {
                jiraTracker.loadRelease.andCallFake(new Deferred({
                    "status": 0,
                    "result": "load release failed"
                }).callBack);

                var errorCallback = jasmine.createSpy("jiraTracker.loadReleaseFromStorage.errorCallback"),
                    loadStorageReq = jiraTracker.loadReleaseFromStorage().fail(errorCallback);
                jasmine.Clock.tick(101);
                waitsFor(function() {
                    return (loadStorageReq.state() === "rejected");
                }, "jiraTracker.loadReleaseFromStorage should fail", 200);

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

        describe("loadRelease", function() {
            beforeEach(function() {
                spyOn(jiraTracker, "onReleaseChange");
                spyOn(GSLoader, "loadSpreadsheet");
                jiraTracker.injectUI();
            });

            function loadSpreadsheet(actualSpreadsheetId, expectedSpreadsheetId) {
                var actualRelease = {
                    id: expectedSpreadsheetId
                };
                GSLoader.loadSpreadsheet.andCallFake(new Deferred({
                    "result": actualRelease
                }).callBack);
                var loadedReq = jiraTracker.loadRelease(null, actualSpreadsheetId);

                waitsFor(function() {
                    return (loadedReq.state() === "resolved");
                }, "Spreadsheet should be loaded", 200);

                runs(function() {
                    expect(GSLoader.loadSpreadsheet).toHaveBeenCalled();
                    expect(GSLoader.loadSpreadsheet.callCount).toBe(1);
                    expect(GSLoader.loadSpreadsheet.mostRecentCall.args[0].id).toBe(expectedSpreadsheetId);
                    expect(GSLoader.loadSpreadsheet.mostRecentCall.args[0].wanted).toEqual(["Setup"]);
                    expect(jiraTracker.onReleaseChange).toHaveBeenCalledWith(actualRelease);
                });
            }

            it("does validation for spreadsheet id", function() {
                var errorObject,
                    loadReq = jiraTracker.loadRelease().fail(function(valObject) {
                        errorObject = valObject;
                    });
                waitsFor(function() {
                    return loadReq.state() !== "pending";
                });
                runs(function() {
                    expect(errorObject).toBeDefined();
                    doControlValidation(errorObject, "filterId", "Release id is required");
                });

                expect(GSLoader.loadSpreadsheet).not.toHaveBeenCalled();
            });

            function loadSpreedsheetAndCallErrorBack(spreadsheetId, errorObj) {
                GSLoader.loadSpreadsheet.andCallFake(new Deferred({
                    "status": 0,
                    "result": "GSLoader.loadSpreadsheet failed"
                }).callBack);

                var errorCallback = jasmine.createSpy("jiraTracker.loadRelease.errorCallback"),
                    loadedReq = jiraTracker.loadRelease(null, spreadsheetId).fail(errorCallback);

                waitsFor(function() {
                    return (loadedReq.state() === "rejected");
                }, "jiraTracker.loadRelease should fail", 200);

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
                $("#filterId").val("Some Spreadsheet Id From Input Field");
                loadSpreadsheet(null, "Some Spreadsheet Id From Input Field");
            });

            it("resets form and removes oldvalidator object from form and then add new", function() {
                var resetSpy = jasmine.createSpy("reset");
                $("form#jira-tracker").data("validator", {
                    "some": "object",
                    "reset": resetSpy,
                    "errors": function() {
                        return $(".filter-title");
                    },
                    "settings": {
                        "unhighlight": function(ele, errorClass) {
                            $(ele).parents(".form-group").removeClass(errorClass);
                        }
                    }
                });
                $(".filter-title").parents(".form-group").addClass("has-error");

                loadSpreadsheet("mySpreadSheetId", "mySpreadSheetId");

                var validatorObj = $("form#jira-tracker").data("validator");
                expect(validatorObj.some).not.toBeDefined();
                expect(resetSpy).toHaveBeenCalled();
                expect(validatorObj instanceof $.validator).toBeTruthy();
                expect($(".filter-title").parents(".form-group")).not.toHaveClass("has-error");
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
                jiraTracker.injectUI();
                jasmine.Clock.useMock();
            });

            it("onReleaseChange poluates fields, make spreadsheet active and returns currentFilter", function() {

                expect(jiraTracker.getCurrentFilter()).toBeNull();

                var returnObj = jiraTracker.onReleaseChange(actualRelease);

                expect(returnObj).toBe(jiraTracker.getCurrentFilter());
                expect($("#filterId")).toHaveValue("Some Spreadsheet Id");
                expect($(".filter-title")).toHaveText("Some Spreadsheet Title");
                expect($("#jiraJQL")).toHaveValue("SomeJiraJQL");
                expect(jiraTracker.getCurrentFilter()).toBe(actualRelease);
            });

            xit("onReleaseChange disables filter-title and jiraJQL controls", function() {

                jiraTracker.onReleaseChange(actualRelease);

                expect($(".filter-title")).toBeDisabled();
                expect($("#jiraJQL")).toBeDisabled();
            });

            it("onReleaseChange updates spreadsheet id in user storage", function() {
                jiraTracker.onReleaseChange({
                    id: "mySpreadSheetId",
                    getWorksheet: jasmine.createSpy("spreadsheet.getWorksheet")
                });
                var filterId;
                jiraTracker.storage.get("filterId").done(function(data) {
                    filterId = data;
                });
                jasmine.Clock.tick(101);
                expect(filterId).toBe("mySpreadSheetId");
            });
        });

        describe("createBaseline", function() {
            var newSpreadsheet;
            beforeEach(function() {
                spyOn(jiraTracker, "onReleaseChange").andCallThrough();
                spyOn(jiraTracker, "createSnapshot").andCallFake(new Deferred().callBack);
                jiraTracker.injectUI();
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
                var createReq = jiraTracker.createBaseline({}, actualTitle);

                waitsFor(function() {
                    return (createReq.state() === "resolved");
                }, "Spreadsheet should be created", 200);

                runs(function() {
                    expect(GSLoader.createSpreadsheet).toHaveBeenCalled();
                    expect(GSLoader.createSpreadsheet.callCount).toBe(1);
                    expect(GSLoader.createSpreadsheet.mostRecentCall.args[0].title).toBe(expectedTitle);
                    expect(jiraTracker.onReleaseChange).toHaveBeenCalled();
                });
            }

            it("by spreadsheet title parameter and make it active", function() {
                createSpreadsheet("My Spreadsheet Title", "My Spreadsheet Title");
            });

            it("by spreadsheet title field and make it active", function() {
                $(".filter-title").val("My Spreadsheet Title Input Field");
                createSpreadsheet(null, "My Spreadsheet Title Input Field");
            });

            it("creates baseline worksheet/snapshot in newly created release spreadsheet", function() {
                createSpreadsheet("My Spreadsheet Title", "My Spreadsheet Title");
                expect(jiraTracker.createSnapshot).toHaveBeenCalled();
            });

            it("calls worksheet.rename for worksheet with correct title", function() {
                createSpreadsheet("My Spreadsheet Title", "My Spreadsheet Title");

                expect(jiraTracker.getCurrentFilter().worksheets.length).toBe(1);
                expect(jiraTracker.getCurrentFilter().worksheets[0].rename).toHaveBeenCalledWith("Setup");
            });

            it("adds release setting into setup worksheet", function() {
                createSpreadsheet("My Spreadsheet Title", "My Spreadsheet Title");
                var addRowCall = jiraTracker.getCurrentFilter().worksheets[0].addRows,
                    expectRows = [
                        ["jira-jql"],
                        ["SomeJiraJQL"]
                    ];
                expect(jiraTracker.getCurrentFilter().worksheets.length).toBe(1);
                expect(addRowCall.callCount).toBe(1);
                expect(addRowCall).toHaveBeenCalledWith(expectRows);
            });

            it("does validation and calls errorCallback", function() {
                $("#jiraJQL,#snapshotTitle").val("");

                var errorObject,
                    createReq = jiraTracker.createBaseline().fail(function(valObject) {
                        errorObject = valObject;
                    });

                waitsFor(function() {
                    return (createReq.state() === "rejected");
                }, "jiraTracker.createBaseline should fail", 200);

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
                    var errorCallback = jasmine.createSpy("jiraTracker.createBaseline.errorCallback"),
                        loadedReq = jiraTracker.createBaseline({}, "Baseline title").fail(errorCallback);

                    waitsFor(function() {
                        return (loadedReq.state() === "rejected");
                    }, "jiraTracker.createBaseline should fail", 200);

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

                it("in case of jiraTracker.createSnapshot failure", function() {
                    jiraTracker.createSnapshot.andCallFake(new Deferred({
                        "status": 0,
                        "result": "jiraTracker.createSnapshot failed"
                    }).callBack);
                    createBaselineAndCallErrorBack("jiraTracker.createSnapshot failed");
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
                $("#filterId").val(currentFilter.id);
                $("#snapshotTitle").val(snapshotTitle);
                $("#jiraJQL").val(jiraJQL);
                $("#jiraMaxResults").val(jiraMaxResults);
                jiraTracker.storage.set("Jira-Credentials", base64Key);
            }

            beforeEach(function() {
                spyOn(jiraTracker, "loadReleaseFromStorage");
                // spyOn(jiraTracker, "fetchFilters");
                jiraTracker.init();

                spyOnAjax.andCallThrough();
                $.fixture("http://jira.cengage.com/rest/api/2/search", "jasmine/fixtures/jiraIssues.json");
                spyOn(jiraTracker, "getCurrentFilter").andReturn(currentFilter);
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
                $("#filterId,#snapshotTitle,#jiraJQL,#jiraMaxResults").val("");
            });

            function createWorksheetAndAssert(_snapshotTitle) {
                populateValues();
                var createReq;
                if (_snapshotTitle) {
                    snapshotTitle = _snapshotTitle;
                    createReq = jiraTracker.createSnapshot(null, snapshotTitle);
                } else {
                    createReq = jiraTracker.createSnapshot();
                }

                waitsFor(function() {
                    return createReq.state() === "resolved";
                }, "Worksheet should be created", 200);

                runs(function() {
                    expect(spyOnCreateWorksheet).toHaveBeenCalled();
                    expect(spyOnCreateWorksheet.callCount).toBe(1);
                    expect(spyOnCreateWorksheet.mostRecentCall.args[0].rowData.length).toBe(50);
                    expect(jiraTracker.getCurrentFilter().worksheets[0]).toBe(worksheet);
                    expect(jiraTracker.getCurrentFilter().worksheets[0].id).toBe("ws1");
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
                var createReq = jiraTracker.createSnapshot();

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
                $("#filterId,#snapshotTitle,#jiraJQL,#jiraMaxResults").val("");
                var errorObject,
                    createReq = jiraTracker.createSnapshot().fail(function(valObject) {
                        errorObject = valObject;
                    });

                waitsFor(function() {
                    return (createReq.state() !== "pending");
                }, "jiraTracker.createBaseline should fail", 200);

                runs(function() {
                    expect(errorObject).toBeDefined();
                    doControlValidation(errorObject, "filterId", "Release is not loaded");
                    doControlValidation(errorObject, "jiraJQL", "Jira JQL is required");
                    doControlValidation(errorObject, "snapshotTitle", "Snapshot title is required");
                    doControlValidation(errorObject, "jiraMaxResults", "Value of max result from is required");
                    expect(errorObject.errors["jira-authentication"]).toBe("Jira authentication is required");
                    expect(spyOnCreateWorksheet).not.toHaveBeenCalled();
                });
            });

            it("does jira authentication validation and does not make jira ajax call", function() {
                populateValues();
                jiraTracker.storage.set("Jira-Credentials", null);
                var errorObject,
                    createReq = jiraTracker.createSnapshot().fail(function(valObject) {
                        errorObject = valObject;
                    });

                waitsFor(function() {
                    return (createReq.state() !== "pending");
                }, "jiraTracker.createBaseline should fail", 200);

                runs(function() {
                    expect(errorObject).toBeDefined();
                    expect(errorObject.errors["jira-authentication"]).toBe("Jira authentication is required");
                    expect(spyOnAjax).not.toHaveBeenCalled();
                    expect(spyOnCreateWorksheet).not.toHaveBeenCalled();
                });
            });

            it("does not make jira ajax call if jira authentication is available but form validation fails", function() {
                populateValues();
                $("#filterId,#snapshotTitle,#jiraJQL,#jiraMaxResults").val("");
                var errorObject,
                    createReq = jiraTracker.createSnapshot().fail(function(valObject) {
                        errorObject = valObject;
                    });

                waitsFor(function() {
                    return (createReq.state() !== "pending");
                }, "jiraTracker.createBaseline should fail", 200);

                runs(function() {
                    expect(errorObject).toBeDefined();
                    expect(spyOnAjax).not.toHaveBeenCalled();
                    expect(spyOnCreateWorksheet).not.toHaveBeenCalled();
                });
            });

            function createBaselineAndCallErrorBack(errorMsg) {
                populateValues();
                var errorCallback = jasmine.createSpy("jiraTracker.createSnapshot.errorCallback"),
                    loadedReq = jiraTracker.createSnapshot({}, "Snapshot title").fail(errorCallback);

                waitsFor(function() {
                    return (loadedReq.state() === "rejected");
                }, "jiraTracker.createSnapshot should fail", 200);

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
                spyOn(jiraTracker, "getCurrentFilter");
                spyOn(jiraTracker, "loadReleaseFromStorage");
            });

            it("load release from user sync data if no active release found", function() {
                jiraTracker.getCurrentFilter.andReturn(null);
                spyOn(jiraTracker, "getJiraServerTime").andReturn(moment("08-15-2012"));

                jiraTracker.canSnapshotBeGenerated();

                expect(jiraTracker.loadReleaseFromStorage).toHaveBeenCalled();

                jiraTracker.loadReleaseFromStorage.reset();
                jiraTracker.getCurrentFilter.andReturn(currentFilter);
                jiraTracker.canSnapshotBeGenerated();

                expect(jiraTracker.loadReleaseFromStorage).not.toHaveBeenCalled();
            });

            it("returns false is release is not loaded", function() {
                jiraTracker.getCurrentFilter.andReturn(null);

                expect(jiraTracker.canSnapshotBeGenerated()).toBeFalsy();
            });

            it("returns false if time is between work start time and work end time", function() {
                jiraTracker.loadReleaseFromStorage();
                var jiraServerTime = moment().startOf('hour').year(2012).month(7).date(17).hour(9);
                spyOn(jiraTracker, "getJiraServerTime").andReturn(jiraServerTime);

                expect(jiraTracker.canSnapshotBeGenerated()).toBeFalsy();
            });

            // Yesterday
            it("returns yesterday's date if snapshot is missing for yesterday and time is before work start time", function() {
                jiraTracker.getCurrentFilter.andReturn(currentFilter);
                var jiraServerTime = moment().startOf('hour').year(2012).month(7).date(17).hour(7);
                spyOn(jiraTracker, "getJiraServerTime").andReturn(jiraServerTime);

                expect(jiraTracker.canSnapshotBeGenerated()).toBe("08-16-2012");
            });

            it("returns false if snapshot is available for yesterday and time is before work start time", function() {
                jiraTracker.getCurrentFilter.andReturn(currentFilter);
                var jiraServerTime = moment().startOf('hour').year(2012).month(7).date(17).hour(7);
                spyOn(jiraTracker, "getJiraServerTime").andReturn(jiraServerTime);

                worksheet2.title = "Snapshot 08-16-2012";
                currentFilter.worksheets.push(worksheet2);
                expect(jiraTracker.canSnapshotBeGenerated()).toBeFalsy();
            });

            // Today
            it("returns today's date if snapshot is missing for today and time is after work end time", function() {
                jiraTracker.getCurrentFilter.andReturn(currentFilter);
                var jiraServerTime = moment().startOf('hour').year(2012).month(7).date(17).hour(18);
                spyOn(jiraTracker, "getJiraServerTime").andReturn(jiraServerTime);

                expect(jiraTracker.canSnapshotBeGenerated()).toBe("08-17-2012");
            });

            it("returns false if snapshot is available for today and time is after work end time", function() {
                jiraTracker.getCurrentFilter.andReturn(currentFilter);
                var jiraServerTime = moment().startOf('hour').year(2012).month(7).date(17).hour(18);
                spyOn(jiraTracker, "getJiraServerTime").andReturn(jiraServerTime);

                worksheet2.title = "Snapshot 08-17-2012";
                currentFilter.worksheets.push(worksheet2);
                expect(jiraTracker.canSnapshotBeGenerated()).toBeFalsy();
            });
        });

        describe("findEndOfWeekSheet", function() {
            //17-23 March 2013
            var currentFilter,
                worksheet1 = {
                    id: "ws1",
                    title: "03-15-2013"
                };

            beforeEach(function() {
                currentFilter = {
                    id: "mySpreadSheetId",
                    title: "Release Sheet Title",
                    worksheets: [worksheet1],
                    getWorksheet: jasmine.createSpy("Spreadsheet.getWorksheet")
                };

            });

            it("returns the sheet for the passed date if it exists", function() {
                //   spyOn(JiraTracker, "getCurrentFilter").andReturn(currentFilter);
                var title = "03-15-2012";
                currentFilter.worksheets.push({
                    id: "ws2",
                    title: title
                });
                spyOn(JiraTracker, "getCurrentFilter").andReturn(currentFilter);
                var sheetDate = moment().year(2012).month(2).date(15);
                expect(JiraTracker.findEndOfWeekSheet(moment(sheetDate)).title).toBe(title);
            });

            it("returns a previous sheet for the passed date sheet not exists", function() {
                var title = "03-21-2013";
                currentFilter.worksheets.push({
                    id: "ws2",
                    title: "03-18-2013"
                });
                currentFilter.worksheets.push({
                    id: "ws3",
                    title: title
                });
                spyOn(JiraTracker, "getCurrentFilter").andReturn(currentFilter);
                var sheetDate = moment().year(2013).month(2).date(23);
                expect(JiraTracker.findEndOfWeekSheet(moment(sheetDate)).title).toBe(title);
            });

            it("returns null if no sheet from the past 7 days exists", function() {
                // var date = moment().year(2013).month(2).date(23);
                currentFilter.worksheets.push({
                    id: "ws2",
                    title: "03-29-2013"
                });
                currentFilter.worksheets.push({
                    id: "ws3",
                    title: "03-16-2013"
                });
                spyOn(JiraTracker, "getCurrentFilter").andReturn(currentFilter);
                var sheetDate = moment().year(2013).month(2).date(23);
                expect(JiraTracker.findEndOfWeekSheet(moment(sheetDate))).toBeNull();
            });

            it("the earlest returns sheet is from 7 days earlier than passed date", function() {
                var title = "03-17-2013";
                currentFilter.worksheets.push({
                    id: "ws2",
                    title: "03-29-2013"
                });
                currentFilter.worksheets.push({
                    id: "ws3",
                    title: title
                });
                spyOn(JiraTracker, "getCurrentFilter").andReturn(currentFilter);
                var sheetDate = moment().year(2013).month(2).date(23);
                expect(JiraTracker.findEndOfWeekSheet(moment(sheetDate)).title).toBe(title);
            });
        });

        describe("findMostRecentSheetFromCurrentWeek", function() {

            var currentFilter,
                worksheet1 = {
                    id: "ws1",
                    title: "03-15-2013"
                };

            beforeEach(function() {
                currentFilter = {
                    id: "mySpreadSheetId",
                    title: "Release Sheet Title",
                    worksheets: [worksheet1]
                };

            });

            it("should returns today sheet if it exists", function() {

                spyOn(JiraTracker, "getToday").andReturn(moment().year(2013).month(7).date(7));
                currentFilter.worksheets.push({
                    id: "ws2",
                    title: "08-07-2013"
                });
                currentFilter.worksheets.push({
                    id: "ws3",
                    title: "08-06-2013"
                });

                spyOn(JiraTracker, "getCurrentFilter").andReturn(currentFilter);
                expect(JiraTracker.findMostRecentSheetFromCurrentWeek().title).toBe("08-07-2013");
            });

            it("should returns the most recent available sheet if todays  sheet does not exists", function() {

                spyOn(JiraTracker, "getToday").andReturn(moment().year(2013).month(7).date(7));
                currentFilter.worksheets.push({
                    id: "ws2",
                    title: "08-05-2013"
                });
                currentFilter.worksheets.push({
                    id: "ws3",
                    title: "08-03-2013"
                });

                spyOn(JiraTracker, "getCurrentFilter").andReturn(currentFilter);
                expect(JiraTracker.findMostRecentSheetFromCurrentWeek().title).toBe("08-05-2013");
            });

            it("should returns the most recent available sheet if todays  sheet does not exists", function() {

                spyOn(JiraTracker, "getToday").andReturn(moment().year(2013).month(7).date(7));
                currentFilter.worksheets.push({
                    id: "ws2",
                    title: "08-04-2013"
                });
                currentFilter.worksheets.push({
                    id: "ws3",
                    title: "08-03-2013"
                });

                spyOn(JiraTracker, "getCurrentFilter").andReturn(currentFilter);
                expect(JiraTracker.findMostRecentSheetFromCurrentWeek()).toBeNull();
            });
        });
        describe("getBaselineTitle", function() {
            it("returns name appended with current date", function() {
                spyOn(JiraTracker, "getToday").andReturn(moment().year(2013).month(7).date(7));

                expect(JiraTracker.getBaselineTitle()).toBe("Baseline - 08-07-2013");
            });
        });

        describe("getSnapshotSummary", function() {

            it("returns an object with title and data array", function() {
                // var snapshot = new Snapshot([{
                //     Points: 5,
                //     status: "Ready"
                // }]);

                jasmine.createSpy("Snapshot.summarize").andReturn([{
                    "Total Done": 9
                }, {
                    "Total WIP": 8
                }]);
                //snapshot.summarize();
                expect(JiraTracker.getSnapshotSummary({
                    id: "ws2",
                    title: "08-04-2013"
                }).date).toBe("08-04-2013");

            });
        });

        describe("findBaselineSheet", function() {

            var currentFilter,
                worksheet1 = {
                    id: "ws1",
                    title: "03-15-2013"
                };

            beforeEach(function() {
                currentFilter = {
                    id: "mySpreadSheetId",
                    title: "Release Sheet Title",
                    worksheets: [worksheet1]
                };
            });

            it("returns baseline sheet if it exists regardless of sheet order", function() {
                currentFilter.worksheets.push({
                    id: "ws2",
                    title: "08-04-2013"
                });
                currentFilter.worksheets.push({
                    id: "ws3",
                    title: "Baseline - 08-03-2013"
                });
                spyOn(JiraTracker, "getCurrentFilter").andReturn(currentFilter);

                expect(JiraTracker.findBaselineSheet().title).toBe("Baseline - 08-03-2013");

            });

            it("returns null if no baseline sheet exists", function() {
                currentFilter.worksheets.push({
                    id: "ws2",
                    title: "08-04-2013"
                });
                currentFilter.worksheets.push({
                    id: "ws3",
                    title: "BXXXline - 08-03-2013"
                });
                spyOn(JiraTracker, "getCurrentFilter").andReturn(currentFilter);

                expect(JiraTracker.findBaselineSheet()).toBeNull();

            });
        });
        describe("getSheetDate", function() {

            it("returns parsed date from title if it is a baseline sheet", function() {

                expect(JiraTracker.getSheetDate("Baseline - 07-23-2012")).toBe("07-23-2012");
            });

            it("returns date title for  for non-baseline sheets", function() {

                expect(JiraTracker.getSheetDate("07-23-2012")).toBe("07-23-2012");
            });
        });
    });
});
