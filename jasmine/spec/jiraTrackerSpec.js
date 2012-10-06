describe("JiraTracker", function() {

    describe("Load release", function() {
        var actualRelease = {
            id: "mySpreadSheetId"
        };
        beforeEach(function() {
        	JiraTracker.activeRelease = null;
            spyOn(GSLoader, "loadSpreadsheet").andCallFake(function(spreadsheetId){
            	if (spreadsheetId === "mySpreadSheetId") {
            		return actualRelease;
            	}
            });
        });

        it("Load release by spreadsheet id parameter and make it active", function() {
            JiraTracker.loadRelease("mySpreadSheetId")
            expect(JiraTracker.activeRelease).toBe(actualRelease);
        });

        it("Load release from spreadsheet id field make it active", function() {
            affix("input#releaseId[value=mySpreadSheetId]");
            JiraTracker.loadRelease();
            expect(JiraTracker.activeRelease).toBe(actualRelease);
        });
    });

    describe("Create release baseline", function() {
        var spreadsheetTitle = "Release Sheet Title";
        var newSpreadsheet = {
            id: "mySpreadSheetId",
            title: spreadsheetTitle
        };
        
        beforeEach(function() {
            JiraTracker.activeRelease = null;
            spyOn(GSLoader, "createSpreadsheet").andCallFake(function(title, callBack, context){
            	if (title === spreadsheetTitle) {
	            	callBack.apply(context, [newSpreadsheet]);
            	}
            });
        });

        it("Create baseline by spreadsheet title parameter and make it active", function() {
            JiraTracker.createBaseline(spreadsheetTitle);
            expect(JiraTracker.activeRelease).toBe(newSpreadsheet);
        });

        it("Create baseline by spreadsheet title field and make it active", function() {
            affix("input#releaseTitle[value="+spreadsheetTitle+"]");
            JiraTracker.createBaseline();
            expect(JiraTracker.activeRelease).toBe(newSpreadsheet);
        });
    });
    
    describe("Create snapshot", function() {
        var snapshotTitle = "Worksheet Title";
        var spyOnCreateWorksheet = jasmine.createSpy("createWorksheet")
        var activeRelease = {
            id: "mySpreadSheetId",
            title: "Release Sheet Title",
            worksheets: [],
            createWorksheet: spyOnCreateWorksheet
        };
    	var worksheet = {
    		id: "ws1",
    		title: snapshotTitle
    	}
        
        beforeEach(function() {
            JiraTracker.activeRelease = activeRelease;
        	spyOnCreateWorksheet.andCallFake(function(){
        		activeRelease.worksheets.push(worksheet);
        	});
        });

        it("Create snapshot checks for activeRelease", function() {
        	JiraTracker.activeRelease = null;
            var exceptionThrown;
            try {
            	JiraTracker.createSnapshot();
            }
            catch (error){
            	exceptionThrown = error;
            }
            expect(exceptionThrown).toBe("Release is not loaded");
            expect(spyOnCreateWorksheet).not.toHaveBeenCalled();
        });

        it("Create snapshot creates worksheet into activeRelease using snapshot title field", function() {
            affix("input#snapshotTitle[value="+snapshotTitle+"]");

            JiraTracker.createSnapshot();
            
            expect(spyOnCreateWorksheet).toHaveBeenCalled();
            expect(JiraTracker.activeRelease.worksheets[0]).toBe(worksheet);
            expect(JiraTracker.activeRelease.worksheets[0].id).toBe("ws1");
            expect(JiraTracker.activeRelease.worksheets[0].title).toBe(snapshotTitle);
        });
    })
});