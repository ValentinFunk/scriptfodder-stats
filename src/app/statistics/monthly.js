angular.module('stats')

.controller('MonthlyCtrl', function($scope, scripts) {
    $scope.scripts = scripts;

    function reduceParam(scriptsData, param) {
        return _.chain(scriptsData)
            .pluck(param)
            .reduce(_.add)
            .value();
    }

    var earliest = _.chain(scripts)
        .map(function(script) {
            return _(script.purchases).filter(function(x) {
                return x.price != 0;
            }).pluck('purchase_time').min();
        })
        .min()
        .value();

    var latest = _.chain(scripts)
        .map(function(script) {
            return _(script.purchases).pluck('purchase_time').max();
        })
        .max()
        .value();

    earliest = moment(earliest * 1000).startOf('month');
    latest = moment(latest * 1000).startOf('month');

    function getIntervalStats(interval) {
        var intervalStats = _(scripts)
            .mapValues(function(script) {
                var scriptData = _(script.purchases)
                    .filter(function(purchase) {
                        return purchase.price > 0;
                    })
                    .groupBy(function(purchase) {
                        return moment(purchase.purchase_time * 1000).startOf(interval).unix();
                    })
                    .tap(function(array) {
                        for (var current = moment(earliest); !current.isAfter(latest); current.add(1, 'M')) {
                            array[current.unix()] = array[current.unix()] || [];
                        }
                    })
                    .pairs()
                    .sortBy(function(obj) {
                        return moment(obj[0] * 1000).unix();
                    })
                    .mapValues(function(array) {
                        var purchasesInInterval = array[1];
                        return {
                            time: array[0],
                            purchases: purchasesInInterval,
                            scriptsSold: purchasesInInterval.length,
                            revenue: _(purchasesInInterval).pluck('price').reduce(_.add) || 0
                        };
                    })
                    .value();
                return scriptData;
            })
            .value();

        return intervalStats;
    }

    var monthlyData = getIntervalStats('month');
    console.log("Got Monthly", monthlyData);

    function getData(variable) {
        return _(scripts)
            .map(function(script, key, object) {
                return {
                    id: key,
                    key: script.name,
                    values: _(monthlyData[key])
                    .mapValues(function(data) {
                        return {
                            x: data.time,
                            y: data[variable],
                        };
                    })
                    .toArray()
                    .value(),
                };
            })
            .value();
    }

    $scope.revenue = getData('revenue');
    $scope.numPurchases = getData('scriptsSold');

    var baseChart = {
        type: 'multiBarChart',
        height: 450,
        margin: {
            top: 20,
            right: 20,
            bottom: 60,
            left: 45
        },
        clipEdge: true,
        staggerLabels: true,
        transitionDuration: 500,
        stacked: true,
        xAxis: {
            axisLabel: 'Date',
            showMaxMin: false,
            tickFormat: function(d) {
                return moment(d * 1000).format('MM/YY');
            }
        },
    };

    $scope.revenueChart = {
        chart: _.extend({
            yAxis: {
                axisLabel: 'Revenue',
                axisLabelDistance: 40,
                tickFormat: function(d) {
                    return d3.format('$,.1f')(d);
                }
            }
        }, baseChart)
    };

    $scope.numPurchasesChart = {
        chart: _.extend({
            yAxis: {
                axisLabel: 'Revenue',
                axisLabelDistance: 40,
                tickFormat: function(d) {
                    return d;
                }
            }
        }, baseChart)
    };
});