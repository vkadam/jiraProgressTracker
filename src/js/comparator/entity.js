define(['jquery'], function($) {
    var Entity = function(index, title, options) {
        $.extend(this, {
            index: index,
            title: title,
            leftSnapshot: null,
            rightSnapshot: null,
            leftDate: null,
            rightDate: null
        }, options);
    };

    Entity.prototype.summarize = function(leftSnapshot, summarizers, rightSnapshot) {
        /* Copy Summarizers */
        var _this = this;
        _this.leftSnapshot = leftSnapshot;
        _this.rightSnapshot = rightSnapshot;
        $.each([_this.leftSnapshot, _this.rightSnapshot], function(idx, snapshot) {
            if (snapshot) {
                snapshot.summarizers = $.map(summarizers, function(summarizer) {
                    return summarizer.clone();
                });
                $.each(snapshot.rows, function(idx, issue) {
                    $.each(snapshot.summarizers, function(index, summarizer) {
                        summarizer.process(issue);
                    });
                });
            }
        });
    };

    return Entity;
});
