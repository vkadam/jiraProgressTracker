define(["jquery", "underscore"], function($, _) {

    function Storage() {
        this.data = {};
    }

    Storage.prototype = {
        get: function() {
            var deferred = new $.Deferred(),
                _this = this,
                values = [];
            $.each(arguments, function(idx, key) {
                values.push(_this.data[key]);
            });
            // if array contains any value after removing all undefined
            if (_.without(values, undefined).length > 0) {
                deferred.resolve.apply(deferred, values);
            } else {
                deferred.reject();
            }
            return deferred.promise();
        },
        set: function(key, value) {
            var deferred = new $.Deferred();

            this.data[key] = value;

            deferred.resolve();
            return deferred.promise();
        }
    };
    return Storage;
});
