define(["js/jira-tracker", "js/jira-tracker-background", "jasmine-helper", "chrome"], function(JiraTracker, Background, Deferred, chrome) {
    xdescribe("JiraTracker Background", function() {
        describe("on init", function() {
            beforeEach(function() {
                spyOn(chrome.alarms, "create").andCallThrough();
                spyOn(chrome.alarms.onAlarm, "addListener").andCallThrough();
                new Background().init();
            });

            it("creates a chrome.alarm with correct parameters", function() {
                expect(chrome.alarms.create).toHaveBeenCalled();
                expect(chrome.alarms.create.argsForCall[0][0]).toBe("watchSnapshot");
                expect(chrome.alarms.create.argsForCall[0][1].periodInMinutes).toBe(30);
            });

            it("adds listner for onAlarm", function() {
                expect(chrome.alarms.onAlarm.addListener).toHaveBeenCalled();
                expect(chrome.alarms.onAlarm.addListener.argsForCall[0][0] instanceof Function).toBeTruthy();
            });
        });

        describe("on Alarm Listener", function() {
            var snapshot, background;
            beforeEach(function() {
                background = new Background();
                spyOn(JiraTracker, "canSnapshotBeGenerated").andCallFake(function() {
                    return snapshot;
                });
            });

            afterEach(function() {
                snapshot = undefined;
            });

            it("creates snapshot with correct title using JiraTracker only if its required", function() {
                spyOn(JiraTracker, "createSnapshot").andCallFake(new Deferred().callBack);

                // Snapshot can not be generated
                background.onAlarmListener();

                expect(JiraTracker.canSnapshotBeGenerated).toHaveBeenCalled();
                expect(JiraTracker.createSnapshot).not.toHaveBeenCalled();
                expect(background.inProgress).toBeFalsy();

                JiraTracker.canSnapshotBeGenerated.reset();
                JiraTracker.createSnapshot.reset();
                snapshot = "New snapshot date title";

                // Snapshot can be generated
                background.onAlarmListener();
                expect(JiraTracker.canSnapshotBeGenerated).toHaveBeenCalled();
                expect(JiraTracker.createSnapshot).toHaveBeenCalledWith(null, snapshot);
            });

            it("updates inProgress parameters correctly for successful response", function() {
                var deferredSpy = new Deferred({
                    status: -1
                });
                snapshot = "New snapshot date title";
                spyOn(JiraTracker, "createSnapshot").andCallFake(deferredSpy.callBack);

                // Snapshot can not be generated
                background.onAlarmListener();

                expect(background.inProgress).toBeTruthy();

                deferredSpy.deferredObj.resolve();

                expect(background.inProgress).toBeFalsy();
            });

            it("updates inProgress parameters correctly for un-successful response", function() {
                var deferredSpy = new Deferred({
                    status: -1
                });
                snapshot = "New snapshot date title";
                spyOn(JiraTracker, "createSnapshot").andCallFake(deferredSpy.callBack);

                // Snapshot can not be generated
                background.onAlarmListener();

                expect(background.inProgress).toBeTruthy();

                deferredSpy.deferredObj.reject();

                expect(background.inProgress).toBeFalsy();
            });

        });

    });
});
