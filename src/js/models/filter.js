define(["jquery", "js-logger"], function($, Logger) {

    /**
     * Creates an instance of Filter
     *
     * @constructor
     * @this {Filter}
     * @param {Object} options: Filter options */

    function Filter(options) {
        this.logger = Logger.get("Filter");
        $.extend(this, parse(options));
        // this.spreadsheet = null;
    }

    function parse(options) {
        return {
            "name": options["filtername"],
            "id": options["spreadsheetid"],
            "jql": options["jql"],
            "isActive": (options["active"] === "Y")
        };
    }

    return Filter;
});
