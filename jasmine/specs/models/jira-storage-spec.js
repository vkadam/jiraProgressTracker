define(["js/models/jira-storage", "chrome"], function(Storage, chrome) {
    describe("models/jira-chrome-storage.js", function() {
        describe("get method", function() {
            var storage;
            beforeEach(function() {
                spyOn(chrome.storage.sync, "get").andCallThrough();
                storage = new Storage();
            });

            it("returns promise object", function() {
                var getPromise = storage.get("Key");
                expect(getPromise).toBeDefined();
                expect(getPromise.done).toBeDefined();
                expect(getPromise.resolve).not.toBeDefined();
            });

            it("calls callback function with correct value", function() {
                var callBack = jasmine.createSpy("storageGetCallback");

                storage.set("Key", "Value");

                var getPromise = storage.get("Key").done(callBack);

                waitsFor(function() {
                    return getPromise.state() === "resolved";
                }, 200);

                runs(function() {
                    expect(callBack).toHaveBeenCalledWith("Value");
                });
            });
        });

        describe("set method", function() {
            var storage;
            beforeEach(function() {
                storage = new Storage();
            });

            it("returns promise object", function() {
                var setPromise = storage.set();
                expect(setPromise).toBeDefined();
                expect(setPromise.done).toBeDefined();
                expect(setPromise.resolve).not.toBeDefined();
            });

            it("calls callback function", function() {
                var callBack = jasmine.createSpy("storageSetCallBack"),
                    setPromise = storage.set("Key", "Value").done(callBack);

                waitsFor(function() {
                    return setPromise.state() === "resolved";
                }, 200);

                runs(function() {
                    expect(callBack).toHaveBeenCalled();
                });
            });
        });
    });
});
