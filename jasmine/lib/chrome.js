define(["jquery"], function($) {
    var chrome = window.chrome || {};

    chrome["storage"] = {};
    chrome["storage"]["sync"] = {
        _data: {},
        get: function(key, callBack) {
            var storedValue = chrome.storage.sync._data[key],
                value = {},
                _this = this;
            if (typeof(storedValue) !== 'undefined') {
                value[key] = storedValue;
            }
            setTimeout(function() {
                callBack.apply(_this, [value]);
            }, 100);
        },
        set: function(data, callBack) {
            var _this = this;
            callBack = callBack || $.noop;
            $.extend(chrome.storage.sync._data, data);
            setTimeout(function() {
                callBack.apply(_this, []);
            }, 100);
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
    return chrome;
});
