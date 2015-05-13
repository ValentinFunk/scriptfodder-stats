angular.module('stats')
    .controller('RevenueCtrl', function($scope, $loading, ScriptFodder, $q) {
        $loading.start('data');

        $scope.dateRange = {};

        function generateData(scripts, dataType) {
            var data = [];
            var labels = [];
            for (var i = 0; i < scripts.length; i++) {
                var purchases = scripts[i].purchases;

                data[i] = _.chain(purchases)
                .filter(function(purchase) {
                    return moment(purchase.purchase_time * 1000).isBetween($scope.dateRange.startDate, $scope.dateRange.endDate);
                })
                .groupBy(function(purchase) {
                    var date = new Date(purchase.purchase_time * 1000);
                    date.setSeconds(0);
                    date.setMinutes(0);
                    date.setHours(12);
                    return date.valueOf();
                })
                .reduce(function(result, purchases, key) {
                    if (dataType == "revenue") {
                        var total = _.chain(purchases)
                            .pluck('price')
                            .reduce(_.add)
                            .value();
                        result[key] = total;
                    }
                    else if (dataType == "purchases") {
                        result[key] = purchases.length;
                    }
                    return result;
                }, {})
                .tap(function(grouped){
                    var start = moment(_(grouped).keys().min() * 1);
                    var end = moment(_(grouped).keys().max() * 1);
                    var current = start;
                    for (var i = 0; ; i++) {
                        current.add(1, 'd');
                        grouped[current.unix() * 1000] = grouped[current.unix() * 1000] || 0;
                        if (!current.isBefore(end)) {
                            break;
                        }
                    }
                    console.log("Finished");
                })
                .map(function(purchases, key, object) {
                    var date = new Date(key * 1);
                    return {
                        date: date,
                        value: purchases
                    };
                })
                .sortBy(function(pair) {
                    return pair.date;
                })
                .value();

                labels[i] = scripts[i].name;
            }
            return {
                data: data,
                labels: labels
            };
        }

        $scope.checkModel = {
            0: true
        };
        ScriptFodder.Scripts.query().$promise
        .then(function(scripts) {
            $scope.scripts = scripts;

            return $q.each(scripts, function(script) {
                return script.$info()
                    .then(function(script) {
                        return ScriptFodder.Scripts.purchases({
                            scriptId: script.id
                        }).$promise
                    })
                    .then(function(purchases) {
                        script.purchases = purchases;
                    });
            });
        })
        .then(function() {
            var earliest = _.chain($scope.scripts).pluck('addedDate').min().value();
            $scope.dateRange = {
                startDate: new Date(earliest * 1000),
                endDate: Date.now()
            };
            $scope.maxDate = Date.now();
        })
        .catch(function(err) {
            console.log(err);
        });

        $scope.$watch(function() {
            return [$scope.checkModel, $scope.dateRange];
        }, function(newValue, oldValue) {
            var scripts = _.filter($scope.scripts, function(value, index) {
                return $scope.checkModel[index];
            });

            if (scripts.length < 1) {
                return;
            }

            var data = generateData(scripts, 'purchases');
            MG.data_graphic({
                title: "Number of Purchases",
                data: data.data,
                legend: data.labels,
                legend_target: '.legend',
                target: '#number',
                full_width: true,
                interpolate: 'basic',
                height: 200,
                right: 40,
                //aggregate_rollover: true,
                linked: true,
                y_label: 'Amount',
            });
            
            
            var data2 = generateData(scripts, 'revenue');
            
            var merged = [];
            for (var i = 0; i < data2.data.length; i++) {
                 var indexed = _(data2.data[i]).indexBy('date').value();
                 _.merge(merged, indexed, merged, function(a, b){
                    if (a && b) {
                        return {
                            date: a.date,
                            value: a.value + b.value
                        };
                    }
                    if (a && !b) {
                        return a;
                    }
                    if (!a && b) {
                        return b;
                    }
                });
                
            }

            var revenueData = _(merged)
            .values()
            .sortBy(function(pair) {
                return pair.date;
            })
            .value();

            MG.data_graphic({
                title: "Revenue",
                data: revenueData,
                yax_units: '$',
                target: '#revenue',
                full_width: true,
                interpolate: 'basic',
                y_label: 'Revenue in $',
                height: 200,
                right: 40,
                linked: true
            });
        }, true);
    });
