var chrome = chrome || {};

chrome["storage"] = {};
chrome["storage"]["sync"] = {
    _data: {},
    get: function(key, callBack) {
        callBack.apply(this, [chrome.storage.sync._data[key]]);
    },
    set: function(key, value) {
        chrome.storage.sync._data[key] = value;
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