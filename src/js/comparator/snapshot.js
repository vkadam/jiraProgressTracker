define(["jquery", "js-logger", "js/comparator/summarizer"], function($, Logger, Summarizer) {
    var Snapshot = function(issues) {
        this.issues = issues || [];
        Logger.useDefaults(Logger.DEBUG);
        this.logger = Logger.get("Snapshot");
    };

    Snapshot.prototype.summarize = function() {
        var totalSummarizer = new Summarizer({
            name: "Total"
        });
        var doneSummarizer = new Summarizer({
            name: "Done",
            filter: function() {
                return this.status === "Closed" || this.status === "Resolved";
            }
        });

        $.each(this.issues, function(idx, issue) {
            totalSummarizer.process(issue);
            doneSummarizer.process(issue);
        });

        return $.extend(totalSummarizer.getSummary(), doneSummarizer.getSummary());
    };

    return Snapshot;
});
