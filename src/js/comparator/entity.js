define(['jquery', 'lodash'], function($, _) {
    var Entity = function(index, title, options) {
        $.extend(this, {
            index: index,
            title: title,
            leftSummary: null,
            rightSummary: null,
            leftDate: null,
            rightDate: null
        }, options);
    };

    Entity.prototype.summarize = function(leftSnapshot, summarizers, rightSnapshot) {
        /* Copy Summarizers */
        var summaries = [];

        if (leftSnapshot) {
            this.leftSummary = {
                snapshot: leftSnapshot
            };
            summaries.push(this.leftSummary);
        }
        if (rightSnapshot) {
            this.rightSummary = {
                snapshot: rightSnapshot
            };
            summaries.push(this.rightSummary);
        }
        $.each(summaries, function(idx, summary) {
            if (summary.snapshot) {
                summary.summarizers = _.map(summarizers, function(summarizer) {
                    return summarizer.clone();
                });
                $.each(summary.snapshot.rows, function(idx, issue) {
                    $.each(summary.summarizers, function(index, summarizer) {
                        summarizer.process(issue);
                    });
                });
                delete summary.snapshot;
            }
        });
    };

    return Entity;
});
