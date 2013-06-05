steal.config({
    "root": "src",
    "paths": {
        "google/client": "../jasmine/lib/chrome.js"
    }
});
steal.then("jquery");
jasmine.deferred = function(defferedOpts) {
    defferedOpts = $.extend({
        // 1: Resolve, 0: Reject, -1: Pending
        status: 1,
        result: undefined
    }, defferedOpts);

    var deferred = $.Deferred(),
        promise = deferred.promise(),
        returnObj = {
            deferredObj: deferred,
            promiseObj: promise,
            callBack: function(options) {
                var context = options && options.context || promise;
                if (defferedOpts.status === 1) {
                    deferred.resolveWith(context, [defferedOpts.result]);
                } else if (defferedOpts.status === 0) {
                    deferred.rejectWith(context, [defferedOpts.result]);
                }
                return promise;
            }
        };
    return returnObj;
};
