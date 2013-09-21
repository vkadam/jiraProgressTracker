define(['jquery', 'moment', 'js/app', 'js/factories/filter',
    'js/comparator/entity', 'js/comparator/summarizer'
], function($, moment, App, FilterFactory, ComparatorEntity, Summarizer) {

    function getSummarizers() {
        var summarizers = [];
        summarizers.push(new Summarizer({
            title: 'Total'
        }));

        summarizers.push(new Summarizer({
            title: 'Done',
            filter: function() {
                return ['Closed', 'Resolved'].indexOf(this.status) > -1;
            }
        }));

        summarizers.push(new Summarizer({
            title: 'WIP',
            filter: function() {
                return ['In Progress', 'Complete', 'Verified', 'QA Active', 'Ready for QA'].indexOf(this.status) !== -1;
            }
        }));
        return summarizers;
    }

    function getComparatorEntity() {
        var comparatorEntities = [],
            baseline = new ComparatorEntity(1, 'Baseline Totals', 'BASELINE'),
            current = new ComparatorEntity(2, 'Current Totals', 'CURRENT'),
            lastWeek = new ComparatorEntity(3, 'Last Week Data', 'LAST_WEEK'),
            thisWeek = new ComparatorEntity(4, 'This Week Data', 'THIS_WEEK'),
            tillToday = new ComparatorEntity(5, 'Project To Date', 'TILL_TODAY');
        comparatorEntities.push(baseline, current, lastWeek, thisWeek, tillToday);
        return comparatorEntities;
    }

    var findSnapshotForDate = function(filter, from, to, searchReverse) {
        var date = searchReverse ? from.clone() : to.clone(),
            sheet = null;
        // console.log(from, date);
        while (!sheet && from <= date) {
            sheet = filter.spreadsheet.getWorksheet(date.format('MM-DD-YYYY'));
            if (searchReverse) {
                date.add('day', 1);
            } else {
                date.subtract('day', 1);
            }
        }
        return sheet;
    };

    function findSnapshot(filter, comparatorEntity) {
        // console.log(moment());
        var snapshots = filter.snapshots,
            today = moment().endOf('day'),
            startOfThisWeek = moment().startOf('day').day(0);
        switch (comparatorEntity.identifier) {
            case 'BASELINE':
                return [snapshots[0]];
            case 'CURRENT': // Most recent sheet available from current week
                return [findSnapshotForDate(filter, startOfThisWeek, today)];
            case 'LAST_WEEK': // Most recent sheet available from last week and start
                var endOfLastWeek = moment().endOf('day').day(-1),
                    startOfLastWeek = moment().startOf('day').day(-7),
                    endOfWeekBeforeLastWeek = moment().endOf('day').day(-8),
                    startOfWeekBeforeLastWeek = moment().startOf('day').day(-14),
                    lastWeekSnapshot = findSnapshotForDate(filter, startOfLastWeek, endOfLastWeek),
                    weekBeforeLastWeekSnapshot = findSnapshotForDate(filter, startOfWeekBeforeLastWeek, endOfWeekBeforeLastWeek);

                weekBeforeLastWeekSnapshot.displayDate = moment(weekBeforeLastWeekSnapshot.createdOn).add('seconds', 1).toDate();
                lastWeekSnapshot.displayDate = lastWeekSnapshot.createdOn;

                return [weekBeforeLastWeekSnapshot, lastWeekSnapshot];
            case 'THIS_WEEK':
                var thisWeekLatest = findSnapshotForDate(filter, startOfThisWeek, today),
                    thisWeekStart = findSnapshotForDate(filter, startOfThisWeek, today, true);

                thisWeekStart.displayDate = thisWeekStart.createdOn;
                thisWeekLatest.displayDate = thisWeekLatest.createdOn;

                return [thisWeekStart, thisWeekLatest];
            case 'TILL_TODAY':
                var baselineSnapshot = snapshots[0],
                    latestSnapshot = snapshots[snapshots.length - 1];

                baselineSnapshot.displayDate = baselineSnapshot.createdOn;
                latestSnapshot.displayDate = latestSnapshot.createdOn;

                return [baselineSnapshot, latestSnapshot];
        }
    }

    function SummaryController($scope, $routeParams, $scope$apply) {
        var comparatorEntities = getComparatorEntity(),
            summarizers = getSummarizers();
        $scope.summary = {
            comparatorEntities: comparatorEntities,
            summarizers: summarizers
        };

        function fetchAndSummarizeEntity(comparatorEntity, snapshot1, snapshot2) {
            var snapshot1Req = !snapshot1.isLoaded ? snapshot1.fetch() : snapshot1,
                snapshot2Req = snapshot2 && !snapshot2.isLoaded ? snapshot2.fetch() : snapshot2;

            $.when(snapshot1Req, snapshot2Req).then(function() {
                $scope$apply($scope, function() {
                    comparatorEntity.summarize.call(comparatorEntity, snapshot1, summarizers, snapshot2);
                });
            });
        }

        $scope.$watch('filter.snapshots', function() {
            if ($scope.filter.snapshots && $scope.filter.snapshots.length > 0) {
                $.each(comparatorEntities, function(idx, comparatorEntity) {
                    var snapshots = findSnapshot($scope.filter, comparatorEntity);
                    if (snapshots && snapshots.length > 0) {
                        snapshots.unshift(comparatorEntity);
                        fetchAndSummarizeEntity.apply(this, snapshots);
                    }
                });
            }
        });

    }

    App.controller('FilterSummaryController', SummaryController);
});
