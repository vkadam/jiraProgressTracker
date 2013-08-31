define(["jquery", "gsloader", "jasmine-helper",
    "js/loaders/filters-loader"
], function($, GSLoader, Deferred, FiltersLoader) {
    describe("filter-loader.js", function() {
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

        describe("get", function() {
            beforeEach(function() {
                spyOn(GSLoader, "loadSpreadsheet").andCallFake(new Deferred({
                    "result": filterSpreadsheet
                }).callBack);
            });

            it("returns promise object", function() {
                var promise = FiltersLoader.get("id1");

                expect(promise.fail).toBeDefined();
                expect(promise.done).toBeDefined();
                expect(promise.resolve).not.toBeDefined();
            });

            it("returns unique promise object for same spreadsheetId ", function() {
                expect(FiltersLoader.get("id1")).toBe(FiltersLoader.get("id1"));
            });

            it("makes call to GSLoader.loadSpreadsheet with correct parameters", function() {
                FiltersLoader.get(spreadsheetId);

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
                    promise = FiltersLoader.get(spreadsheetId).done(function(filts) {
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
                    promise = FiltersLoader.get("id3").fail(failCallBack);

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
                    promise = FiltersLoader.get("id4").fail(failCallBack);

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
    });
});
