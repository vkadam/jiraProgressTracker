define(["js/models/jira-chrome-storage", "chrome"], function(ChromeStorage, chrome) {
    describe("models/jira-chrome-storage.js", function() {

        describe("get method", function() {
            var chromeStorage;
            beforeEach(function() {
                spyOn(chrome.storage.sync, "get").andCallThrough();
                chromeStorage = new ChromeStorage("CacheName");
            });

            it("returns promise object", function() {
                var getPromise = chromeStorage.get("Key");
                expect(getPromise).toBeDefined();
                expect(getPromise.done).toBeDefined();
                expect(getPromise.resolve).not.toBeDefined();
            });

            it("calls chrome.storage.sync.get method with correct parameters", function() {
                var chromeGetSpy = chrome.storage.sync.get;

                chromeStorage.get("Key");

                expect(chromeGetSpy.callCount).toBe(1);
                expect(chromeGetSpy).toHaveBeenCalledWith("CacheName", jasmine.any(Function));
            });

            it("calls success callback function with correct value", function() {
                var data = {
                    "Key": {
                        "foo": "bar"
                    }
                },
                    callBack = jasmine.createSpy("storage.get.successCallBack");

                chrome.storage.sync.set({
                    "CacheName": data
                });

                var getPromise = chromeStorage.get("Key").done(callBack);

                waitsFor(function() {
                    return getPromise.state() !== "pending";
                }, 200);

                runs(function() {
                    expect(callBack).toHaveBeenCalledWith({
                        "foo": "bar"
                    });
                });
            });

            it("calls error callback function in case value not found", function() {
                var callBack = jasmine.createSpy("storage.get.errorCallBack");

                chrome.storage.sync.set({
                    "CacheName": {}
                });

                var getPromise = chromeStorage.get("Key").fail(callBack);

                waitsFor(function() {
                    return getPromise.state() !== "pending";
                }, 200);

                runs(function() {
                    expect(callBack).toHaveBeenCalled();
                });
            });
        });

        describe("set method", function() {
            var chromeStorage;
            beforeEach(function() {
                spyOn(chrome.storage.sync, "set").andCallThrough();
                chromeStorage = new ChromeStorage("MyCacheName");
            });

            it("calls chrome.storage.sync.set method with correct parameters", function() {
                var data = {
                    "foo": "bar"
                },
                    chromeSetSpy = chrome.storage.sync.set;

                var setPromise = chromeStorage.set("Key", data);

                waitsFor(function() {
                    return setPromise.state() === "resolved";
                }, 200);

                runs(function() {
                    expect(chromeSetSpy.callCount).toBe(1);
                    expect(chromeSetSpy).toHaveBeenCalledWith({
                        "MyCacheName": {
                            "Key": data
                        }
                    }, jasmine.any(Function));
                });
            });

            it("calls callback function", function() {
                var callBack = jasmine.createSpy("storageSetCallBack"),
                    setPromise = chromeStorage.set("Key", "Value").done(callBack);

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
