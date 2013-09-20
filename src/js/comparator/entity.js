define(['jquery'], function($) {
    var Entity = function(index, title, identifier) {
        this.index = index;
        this.title = title;
        this.identifier = identifier;
        this.snapshot1 = this.snapshot2 = null;
    };

    Entity.prototype.summarize = function(snapshot1, summarizers, snapshot2) {
        /* Copy Summarizers */
        var _this = this;
        _this.snapshot1 = snapshot1;
        _this.snapshot2 = snapshot2;
        $.each([_this.snapshot1, _this.snapshot2], function(idx, snapshot) {
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
        _this.summarized = true;
    };

    return Entity;
});
