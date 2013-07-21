define(["jquery", "js-logger", "js/comparator/summarizer"], function($, Logger, Summarizer) {
    var Snapshot = function(issues) {
        this.issues = issues || [];
        Logger.useDefaults(Logger.DEBUG);
        this.logger = Logger.get("Snapshot");
    };

    Snapshot.prototype.summarize = function() {
        var summarizers = [];
        summarizers.push(new Summarizer({
            name: "Total"
        }));

        summarizers.push(new Summarizer({
            name: "Done",
            filter: function() {
                return this.status === "Closed" || this.status === "Resolved";
            }
        }));

        summarizers.push(new Summarizer({
            name: "WIP",
            filter: function() {
                return this.status === "In Progress" || this.status === "Complete" || this.status === "Verified" || this.status === "QA Active" || this.status === "Ready for QA";
            }
        }));

        $.each(this.issues, function(idx, issue) {

            $.each(summarizers, function(index, summarizer) {
                summarizer.process(issue);
            });
        });

        var results = {};
        $.each(summarizers, function(idx, summarizer) {
            results = $.extend(results, summarizer.getSummary());
        });

        return results;

    };

    return Snapshot;
});
