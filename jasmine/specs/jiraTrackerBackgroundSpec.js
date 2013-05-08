describe("JiraTracker Background", function() {

    beforeEach(function() {
        spyOn(chrome.alarms, "create").andCallThrough();
        spyOn(chrome.alarms.onAlarm, "addListener").andCallThrough();
    });

    describe("on init", function() {

        it("creates a chrome.alarm with correct parameters", function() {
            JiraTracker.Background.init();
            expect(chrome.alarms.create).toHaveBeenCalled();
            expect(chrome.alarms.create.argsForCall[0][0]).toBe("watchSnapshot");
            expect(chrome.alarms.create.argsForCall[0][1].periodInMinutes).toBe(10);
        });

        it("adds listner for onAlarm", function() {
            JiraTracker.Background.init();
            expect(chrome.alarms.onAlarm.addListener).toHaveBeenCalled();
            expect(chrome.alarms.onAlarm.addListener.argsForCall[0][0] instanceof Function).toBeTruthy();
        });
    });

});
