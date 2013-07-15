define(["jquery"], function($) {
    function Summarizer(options) {
        var count = 0,
            points = 0;
        options = $.extend({
            filter: function() {
                return true;
            }
        }, options);

        this.process = function(issue) {
            if (options.filter.apply(issue)) {
                count++;
                points += Number(issue.points);
            }
        };

        this.getSummary = function() {
            var result = {};
            result[[options.name, "Count"].join(" ")] = count;
            result[[options.name, "Points"].join(" ")] = points;
            return result;
        };
        return this;
    }
    return Summarizer;
});
