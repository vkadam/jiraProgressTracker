steal("js/jira-tracker-background.js", function() {
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
                expect(chrome.alarms.create.argsForCall[0][1].periodInMinutes).toBe(30);
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
                JiraTracker.Background.inProgress = false;
                spyOn(JiraTracker, "canSnapshotBeGenerated").andCallFake(function() {
                    return snapshot;
                });
            });

            afterEach(function() {
                snapshot = undefined;
            });

            it("creates snapshot with correct title using JiraTracker only if its required", function() {
                spyOn(JiraTracker, "createSnapshot").andCallFake(jasmine.deferred().callBack);

                // Snapshot can not be generated
                JiraTracker.Background.onAlarmListener();

                expect(JiraTracker.canSnapshotBeGenerated).toHaveBeenCalled();
                expect(JiraTracker.createSnapshot).not.toHaveBeenCalled();
                expect(JiraTracker.Background.inProgress).toBeFalsy();

                JiraTracker.canSnapshotBeGenerated.reset();
                JiraTracker.createSnapshot.reset();
                snapshot = "New snapshot date title";

                // Snapshot can be generated
                JiraTracker.Background.onAlarmListener();
                expect(JiraTracker.canSnapshotBeGenerated).toHaveBeenCalled();
                expect(JiraTracker.createSnapshot).toHaveBeenCalledWith(null, snapshot);
            });

            it("updates inProgress parameters correctly for successful response", function() {
                var deferredSpy = jasmine.deferred({
                    status: -1
                });
                snapshot = "New snapshot date title";
                spyOnCreateSnapshot = spyOn(JiraTracker, "createSnapshot").andCallFake(deferredSpy.callBack);

                // Snapshot can not be generated
                JiraTracker.Background.onAlarmListener();

                expect(JiraTracker.Background.inProgress).toBeTruthy();

                deferredSpy.deferredObj.resolve();

                expect(JiraTracker.Background.inProgress).toBeFalsy();
            });

            it("updates inProgress parameters correctly for un-successful response", function() {
                var deferredSpy = jasmine.deferred({
                    status: -1
                });
                snapshot = "New snapshot date title";
                spyOnCreateSnapshot = spyOn(JiraTracker, "createSnapshot").andCallFake(deferredSpy.callBack);

                // Snapshot can not be generated
                JiraTracker.Background.onAlarmListener();

                expect(JiraTracker.Background.inProgress).toBeTruthy();

                deferredSpy.deferredObj.reject();

                expect(JiraTracker.Background.inProgress).toBeFalsy();
            });

        });

    });
});
