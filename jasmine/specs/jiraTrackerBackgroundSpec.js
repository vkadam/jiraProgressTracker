describe("JiraTracker Background", function() {

    afterEach(function() {
        JiraTracker.Background.inProgress = false;
    });

    describe("on init", function() {

        beforeEach(function() {
            spyOn(chrome.alarms, "create").andCallThrough();
            spyOn(chrome.alarms.onAlarm, "addListener").andCallThrough();
        });

        it("creates a chrome.alarm with correct parameters", function() {
            JiraTracker.Background.init();
            expect(chrome.alarms.create).toHaveBeenCalled();
            expect(chrome.alarms.create.argsForCall[0][0]).toBe("watchSnapshot");
            expect(chrome.alarms.create.argsForCall[0][1].periodInMinutes).toBe(60);
        });

        it("adds listner for onAlarm", function() {
            JiraTracker.Background.init();
            expect(chrome.alarms.onAlarm.addListener).toHaveBeenCalled();
            expect(chrome.alarms.onAlarm.addListener.argsForCall[0][0] instanceof Function).toBeTruthy();
        });
    });

    describe("on Alarm Listener", function() {
        var snapshot;
        beforeEach(function() {
            spyOn(JiraTracker, "getSnapshotForToday").andCallFake(function() {
                return snapshot;
            });
            spyOn(JiraTracker, "createSnapshotForToday");
        });

        it("creates snapshot for today using JiraTracker only if its not there", function() {
            JiraTracker.Background.onAlarmListener();
            expect(JiraTracker.getSnapshotForToday).toHaveBeenCalled();
            expect(JiraTracker.createSnapshotForToday).toHaveBeenCalled();

            JiraTracker.getSnapshotForToday.reset();
            JiraTracker.createSnapshotForToday.reset();
            JiraTracker.Background.inProgress = false;

            snapshot = "Some snapshot";
            JiraTracker.Background.onAlarmListener();
            expect(JiraTracker.getSnapshotForToday).toHaveBeenCalled();
            expect(JiraTracker.createSnapshotForToday).not.toHaveBeenCalled();

        });

    });

});
