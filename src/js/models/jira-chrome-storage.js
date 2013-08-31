define(['jquery', 'underscore', 'js/models/jira-storage'], function($, _, Storage) {
    /*global chrome:false*/

    function ChromeStorage(cacheName) {
        this.cacheName = cacheName;
    }

    ChromeStorage.prototype = Object.create(Storage.prototype);

    ChromeStorage.prototype.get = function() {
        var _this = this,
            deferred = new $.Deferred(),
            keys = arguments;
        chrome.storage.sync.get(this.cacheName, function(data) {
            if (data[_this.cacheName]) {
                var values = [];
                $.each(keys, function(idx, key) {
                    values.push(data[_this.cacheName][key]);
                });
                // if array contains any value after removing all undefined
                if (_.without(values, undefined).length > 0) {
                    deferred.resolve.apply(deferred, values);
                    return;
                }
            }
            deferred.reject();
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
