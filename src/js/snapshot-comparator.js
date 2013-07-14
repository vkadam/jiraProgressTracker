define(["jquery", "js-logger"], function($, Logger) {
    var Snapshot = function(issues) {
        this.issues = issues || [];
        Logger.useDefaults(Logger.DEBUG);
        this.logger = Logger.get("Snapshot");

    };

    function DoneSummarizer() {
        var count = 0,
            points = 0;

        this.process = function(issue) {
            if (issue.status === "Closed" || issue.status === "Resolved") {
                count++;
                points += Number(issue.points);
            }
        };

        this.getSummary = function() {
            return [{
                name: "Done.Count",
                val: count
            }, {
                name: "Done.Points",
                val: points
            }];
        }
    };

    function TotalSummarizer() {
        var count = 0,
            points = 0;

        this.process = function(issue) {
            count++;
            points += Number(issue.points);
        };

        this.getSummary = function() {
            return [{
                name: "Total.Count",
                val: count
            }, {
                name: "Total.Points",
                val: points
            }];
        }
    }

    Snapshot.prototype.summarize = function() {
        var summary = [];

        var totalSummarizer = new TotalSummarizer();
        var doneSummarizer = new DoneSummarizer();

        $.each(this.issues, function(idx, issue) {
            totalSummarizer.process(issue);
            doneSummarizer.process(issue);
        });

        return totalSummarizer.getSummary().concat(doneSummarizer.getSummary());
    };

    return Snapshot;

    /*
    var issueClass = function() {
        this.points = 0;
        this.key = null;
        this.status = null;
    };
    */

    /*var CompareSummaryClass = function() {
        this.totalCountDiff = 0;
        this.totalPointsDiff = 0;
        this.doneCountDiff = 0;
        this.donePointsDiff = 0;
    };

    function compare(snapshot1, snapshot2) {
        var compareSummary = new CompareSummaryClass();

        compareSummary.totalCountDiff = snapshot2.totalCount - snapshot1.totalCount;
        compareSummary.totalPointsDiff = snapshot2.totalPoints - snapshot1.totalPoints;
        compareSummary.doneCountDiff = snapshot2.doneCount - snapshot1.doneCount;
        compareSummary.donePointsDiff = snapshot2.donePoints - snapshot1.donePoints;
        return compareSummary;
    }*/

});
