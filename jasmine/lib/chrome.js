define(["jquery"], function($) {
    var chrome = chrome || {};

    chrome["storage"] = {};
    chrome["storage"]["sync"] = {
        _data: {},
        get: function(key, callBack) {
            var storedValue = chrome.storage.sync._data[key];
            var value = {};
            if (typeof(storedValue) !== 'undefined') {
                value[key] = storedValue;
            }
            callBack.apply(this, [value]);
        },
        set: function(data) {
            $.extend(chrome.storage.sync._data, data);
        },
        clear: function() {
            chrome.storage.sync._data = {};
        }
    };

    chrome["tabs"] = {
        onUpdated: {
            addListener: function() {}
        },
        onRemoved: {
            addListener: function() {}
        }
    };

    chrome["alarms"] = {
        create: function() {},
        onAlarm: {
            addListener: function() {}
        }
    };
    window.chrome = chrome;
});
