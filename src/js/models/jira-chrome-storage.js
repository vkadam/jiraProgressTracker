define(["jquery", "underscore", "js/models/jira-storage"], function($, _, Storage) {
    /*global chrome:false*/

    function ChromeStorage(cacheName) {
        this.cacheName = cacheName;
    }

    ChromeStorage.prototype = Object.create(Storage.prototype);

    ChromeStorage.prototype.get = function(key) {
        var _this = this,
            deferred = new $.Deferred();
        chrome.storage.sync.get(this.cacheName, function(data) {
            if (data[_this.cacheName] && !_.isUndefined(data[_this.cacheName][key])) {
                deferred.resolve(data[_this.cacheName][key]);
            } else {
                deferred.reject();
            }
        });
        return deferred.promise();
    };

    ChromeStorage.prototype.set = function(key, value) {
        var _this = this,
            deferred = new $.Deferred();

        chrome.storage.sync.get(this.cacheName, function(data) {
            var oldData = data[_this.cacheName] || {},
                setData = {};

            oldData[key] = value,
            setData[_this.cacheName] = oldData;

            chrome.storage.sync.set(setData, function() {
                deferred.resolve();
            });
        });
        return deferred.promise();
    };
    return ChromeStorage;
});
