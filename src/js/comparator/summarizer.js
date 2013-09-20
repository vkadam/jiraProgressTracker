define(['jquery'], function($) {

    function Summarizer(options) {
        $.extend(this, {
            title: 'Summarizer Name',
            count: 0,
            points: 0,
            filter: function() {
                return true;
            }
        }, options);
    }

    Summarizer.prototype.process = function(issue) {
        if (this.filter.apply(issue)) {
            this.count++;
            this.points += Number(issue.points);
        }
    };

    Summarizer.prototype.clone = function() {
        var copy = new this.constructor();
        for (var attr in this) {
            if (this.hasOwnProperty(attr)) {
                copy[attr] = this[attr];
            }
        }
        return copy;
    };
    return Summarizer;
});
