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

    function BurndownController($scope, $scope$apply, $filter) {
        $scope.chartConfig = {
            options: {
                chart: {
                    type: 'column'
                },
                plotOptions: {
                    column: {
                        stacking: 'normal'
                    },
                    series: {
                        pointPadding: 0,
                        borderWidth: 0
                    }
                },
                yAxis: {
                    title: {
                        text: null
                    }
                },
                title: {
                    text: ''
                },
                xAxis: {
                    categories: []
                },
                /*tooltip: {
                    crosshairs: true,
                    shared: true
                },
                legend: {
                    layout: 'vertical'
                },*/
                loading: {
                    labelStyle: {
                        top: '25%',
                        fontSize: '2em'
                    }
                }
            },
            series: [],
            loading: true
        };
        $scope.summarizers = getSummarizers();

        function findSnapshotForWeek(sundayOfWeek) {
            var mondayOfWeek = sundayOfWeek.clone().startOf('d').day(-6);
            return findSnapshotForDate($scope.filter, mondayOfWeek, sundayOfWeek);
        }

        function createSeriesEntity(index, title, snapshot) {
            return new ComparatorEntity(index, title, {
                leftSnapshot: snapshot
            });
        }

        $scope.summarized = false;
        $scope.seriesEntities = [];

        function fetchAndSummarizeEntity(seriesEntities) {
            var summarized = -seriesEntities.length;
            _.each(seriesEntities, function(seriesEntity) {
                if (seriesEntity.leftSnapshot) {
                    seriesEntity.leftSnapshot.fetch().done(function() {
                        seriesEntity.summarize.call(seriesEntity, seriesEntity.leftSnapshot, $scope.summarizers);
                        summarized++;
                        if (summarized === 0) {
                            renderChart();
                        }
                    });
                } else {
                    summarized++;
                }
            });
        }

        function renderChart() {
            var serieses = {},
                defaultData = _.map($scope.seriesEntities, function() {
                    return 0;
                });
            _.each($scope.summarizers, function(summarize) {
                _.each(['Points', 'Count'], function(type) {
                    var seriesName = summarize.title + ' ' + type;
                    serieses[seriesName.toLowerCase()] = {
                        data: _.clone(defaultData),
                        stack: type,
                        name: seriesName
                    };
                    // if (type === 'Count') {
                    //     serieses[seriesName.toLowerCase()].linkedTo = ':previous'
                    // }
                });
            });
            var categories = [],
                numberFilter = $filter('number'),
                seriesName, val;

            _.each($scope.seriesEntities, function(seriesEntity, idx) {
                categories.push(seriesEntity.title);
                if (seriesEntity.leftSnapshot) {
                    _.each(seriesEntity.leftSnapshot.summarizers, function(summarize) {
                        _.each(['points', 'count'], function(type) {
                            seriesName = summarize.title + ' ' + type;
                            val = _.parseInt(numberFilter(summarize[type]));
                            serieses[seriesName.toLowerCase()].data[idx] = val;
                        });
                    });
                }
            });
            $scope$apply($scope, function() {
                $scope.chartConfig.options.xAxis.categories = categories;
                $scope.chartConfig.options.title.text = 'Weekly Burndown';
                $scope.chartConfig.series = _.map(serieses, function(series) {
                    return series;
                });
                $scope.chartConfig.loading = false;

            });
        }

        $scope.$watch('filter.snapshots', function() {
            if ($scope.filter.snapshots && $scope.filter.snapshots.length > 0) {
                var endDate = moment($scope.filter.endDate).endOf('day'),
                    sundayOfWeek = moment($scope.filter.startDate).endOf('week').add('d', 1),
                    snapshot = $scope.filter.snapshots[0],
                    title = snapshot.title;

                $scope.seriesEntities.push(createSeriesEntity($scope.seriesEntities.length, title, snapshot));

                while (sundayOfWeek < endDate) {
                    snapshot = findSnapshotForWeek(sundayOfWeek);
                    title = snapshot ? snapshot.title : sundayOfWeek.format('MM-DD-YYYY');

                    $scope.seriesEntities.push(createSeriesEntity($scope.seriesEntities.length, title, snapshot));
                    sundayOfWeek = sundayOfWeek.clone().add('w', 1);
                }
                snapshot = findSnapshotForWeek(endDate);
                $scope.seriesEntities.push(createSeriesEntity($scope.seriesEntities.length, endDate.format('MM-DD-YYYY'), snapshot));
                fetchAndSummarizeEntity($scope.seriesEntities);
            }
        });
    }

    App.controller('FilterBurndownController', BurndownController);
});
