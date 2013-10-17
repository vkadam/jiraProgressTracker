define(['jquery', 'lodash', 'moment', 'js/app',
    'js/comparator/entity', 'js/comparator/summarizer'
], function($, _, moment, App, ComparatorEntity, Summarizer) {

    function getSummarizers() {
        var summarizers = [];
        summarizers.push(new Summarizer({
            title: 'Total'
        }));

        var DoneStatusArray = ['Closed', 'Resolved'];
        summarizers.push(new Summarizer({
            title: 'Done',
            filter: function() {
                return _.contains(DoneStatusArray, this.status);
            }
        }));

        var WIPStatusArray = ['In Progress', 'Complete', 'Verified', 'QA Active', 'Ready for QA'];
        summarizers.push(new Summarizer({
            title: 'WIP',
            filter: function() {
                return _.contains(WIPStatusArray, this.status);
            }
        }));
        return summarizers;
    }

    function getComparatorEntity() {
        var comparatorEntities = [],
            baseline = new ComparatorEntity(1, 'Baseline Totals'),
            current = new ComparatorEntity(2, 'Current Totals'),
            lastWeek = new ComparatorEntity(3, 'Last Week Data'),
            thisWeek = new ComparatorEntity(4, 'This Week Data'),
            tillToday = new ComparatorEntity(5, 'Project To Date');
        comparatorEntities.push(baseline, current, lastWeek, thisWeek, tillToday);
        return comparatorEntities;
    }

    var findSnapshotForDate = function(filter, from, to, startFromBeginning) {
        var date = startFromBeginning ? from.clone() : to.clone(),
            sheet = null;
        while (!sheet && from <= date && date <= to) {
            sheet = filter.spreadsheet.getWorksheet(date.format('MM-DD-YYYY'));
            if (startFromBeginning) {
                date.add('day', 1);
            } else {
                date.subtract('day', 1);
            }
        }
        return sheet;
    };

    function findSnapshot(filter, comparatorEntity) {
        var snapshots = filter.snapshots,
            today = moment().endOf('day'),
            startOfThisWeek = moment().startOf('day').day(0);
        switch (comparatorEntity.index) {
            case 1: //'BASELINE'
                comparatorEntity.leftDate = snapshots[0].startDate;
                return [snapshots[0]];
            case 2: //'CURRENT' Most recent sheet available from current week
                var currentSnapshot = findSnapshotForDate(filter, startOfThisWeek, today);
                comparatorEntity.leftDate = currentSnapshot ? currentSnapshot.startDate : today.toDate();
                return [currentSnapshot];
            case 3: //'LAST_WEEK' Most recent sheet available from last week and start
                var endOfLastWeek = moment().endOf('day').day(-1),
                    startOfLastWeek = moment().startOf('day').day(-7),
                    endOfWeekBeforeLastWeek = moment().endOf('day').day(-8),
                    startOfWeekBeforeLastWeek = moment().startOf('day').day(-14),
                    lastWeekSnapshot = findSnapshotForDate(filter, startOfLastWeek, endOfLastWeek),
                    weekBeforeLastWeekSnapshot = findSnapshotForDate(filter, startOfWeekBeforeLastWeek, endOfWeekBeforeLastWeek);

                comparatorEntity.leftDate = startOfLastWeek.toDate();
                comparatorEntity.rightDate = endOfLastWeek.toDate();
                return [weekBeforeLastWeekSnapshot, lastWeekSnapshot];
            case 4: //'THIS_WEEK'
                var thisWeekLatest = findSnapshotForDate(filter, startOfThisWeek, today),
                    thisWeekStart = findSnapshotForDate(filter, startOfThisWeek, today, true);

                comparatorEntity.leftDate = startOfThisWeek.toDate();
                comparatorEntity.rightDate = today.toDate();
                return [thisWeekStart, thisWeekLatest];
            case 5: //'TILL_TODAY'
                var baselineSnapshot = snapshots[0],
                    latestSnapshot = snapshots[snapshots.length - 1];

                comparatorEntity.leftDate = baselineSnapshot.startDate;
                comparatorEntity.rightDate = latestSnapshot.startDate;
                return [baselineSnapshot, latestSnapshot];
        }
    }

    function SummaryController($scope, $scope$apply) {
        var comparatorEntities = getComparatorEntity(),
            summarizers = getSummarizers();
        $scope.summary = {
            comparatorEntities: comparatorEntities,
            summarizers: summarizers
        };

        $scope.summarized = false;
        var summarized = -comparatorEntities.length;

        function fetchAndSummarizeEntity(comparatorEntity, leftSnapshot, rightSnapshot) {
            var leftSnapshotReq = (leftSnapshot && leftSnapshot.rows.length === 0) ? leftSnapshot.fetch() : leftSnapshot,
                rightSnapshotReq = (rightSnapshot && rightSnapshot.rows.length === 0) ? rightSnapshot.fetch() : rightSnapshot;

            $.when(leftSnapshotReq, rightSnapshotReq).then(function() {
                $scope$apply($scope, function() {
                    comparatorEntity.summarize.call(comparatorEntity, leftSnapshot, summarizers, rightSnapshot);
                    summarized++;
                    $scope.summarized = (summarized === 0);
                });
            });
        }

        $scope.$watch('filter.snapshots', function() {
            if ($scope.filter.snapshots && $scope.filter.snapshots.length > 0) {
                $scope.summarized = false;
                _.each(comparatorEntities, function(comparatorEntity) {
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
