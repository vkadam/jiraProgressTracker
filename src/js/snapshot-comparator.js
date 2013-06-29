define(["jquery", "js-logger"], function($, Logger) {
    /**
     * Creates an instance of Comparator.
     *
     * @constructor
     * @this {Comparator}
     */
    var Comparator = function() {
        Logger.useDefaults(Logger.DEBUG);
        this.logger = Logger.get("comparator");
    };

    Comparator.prototype.compare = function( /* snapshot1, snapshot2 */ ) {

    };

    return Comparator;
});
