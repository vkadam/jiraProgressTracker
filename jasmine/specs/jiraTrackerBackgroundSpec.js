describe("JiraTracker Background", function() {

    function returnDeffered(resolveWithThis) {
        return function(options) {
            var deferred = $.Deferred(),
                lsReq = deferred.promise(),
                context = options && options.context || lsReq;
            deferred.resolveWith(context, [resolveWithThis]);
            return lsReq;
        };
    }

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
            spyOn(JiraTracker, "canSnapshotBeGenerated").andCallFake(function() {
                return snapshot;
            });
            spyOn(JiraTracker, "createSnapshot").andCallFake(returnDeffered());
        });

        it("creates snapshot with correct title using JiraTracker only if its required", function() {
            JiraTracker.Background.onAlarmListener();
            expect(JiraTracker.canSnapshotBeGenerated).toHaveBeenCalled();
            expect(JiraTracker.createSnapshot).not.toHaveBeenCalled();

            JiraTracker.canSnapshotBeGenerated.reset();
            JiraTracker.createSnapshot.reset();
            JiraTracker.Background.inProgress = false;

            snapshot = "New snapshot date title";
            JiraTracker.Background.onAlarmListener();
            expect(JiraTracker.canSnapshotBeGenerated).toHaveBeenCalled();
            expect(JiraTracker.createSnapshot).toHaveBeenCalledWith(null, snapshot);

        });

    });

});
