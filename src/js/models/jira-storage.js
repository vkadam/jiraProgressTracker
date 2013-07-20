define(["jquery"], function($) {

    function Storage() {
        this.data = {};
    }

    Storage.prototype = {
        get: function(key) {
            var deferred = new $.Deferred();
            deferred.resolve(this.data[key]);
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
