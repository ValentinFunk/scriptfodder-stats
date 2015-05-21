angular.module('stats')

.controller('AlltimeCtrl', function($scope, scripts) {
    $scope.scripts = scripts;
    
    function aggregateScriptSales(beginTime, endTime, script) {
        var data = {};
        
        data.revenue = _.chain(script.purchases)
        .filter(function(purchase) {
            return moment(purchase.purchase_time * 1000).isBetween(beginTime, endTime);
        })
        .tap(function(filtered) {
            data.amountSold = filtered.length;
        })
        .pluck('price')
        .reduce(_.add)
        .value();
        
        return data;
    }
    
    $scope.performance = {
        overall: {
            scripts: [],
            total: 0,
        }, 
        records: {}
    };
    
    for (var i = 0; i < scripts.length; i++) {
        $scope.performance.overall.scripts[i] = aggregateScriptSales(moment(0), moment(), scripts[i]);
        $scope.performance.overall.scripts[i].script = $scope.scripts[i];
    }
    
    function reduceParam(scriptsData, param) {
        return _.chain(scriptsData)
        .pluck(param)
        .reduce(_.add)
        .value();
    }
    
    function calculateTotals(dataBasis) {
        return {
            revenue: reduceParam(dataBasis.scripts, 'revenue'),
            amountSold: reduceParam(dataBasis.scripts, 'amountSold')
        };
    }
    
    $scope.performance.overall.total = calculateTotals($scope.performance.overall);
    
    var earliest = _.chain(scripts)
    .map(function(script) {
        return _(script.purchases).pluck('purchase_time').min();
    })
    .min()
    .value();
    earliest = moment(earliest * 1000);
    
    function getIntervalStats(interval) {
        var intervalStats = _(scripts)
        .pluck('purchases')
        .flatten()
        .groupBy(function(purchase){
            return moment(purchase.purchase_time * 1000).startOf(interval);
        })
        .mapValues(function(purchasesInInterval) {
            return { 
                purchases: purchasesInInterval,
                scriptsSold: purchasesInInterval.length,
                revenue: _(purchasesInInterval).pluck('price').reduce(_.add)
            };
        })
        .pairs()
        .sortBy(function(obj) { 
            return moment(obj[0]).unix();
        })
        .map(function(array) { 
            array[1].time = array[0];
            return array[1]; 
        })
        .value();
        
        return intervalStats;
    }
    
    function getMaxInterval(intervalStats) {
        var max = _(intervalStats)
        .pluck('revenue')
        .max();
        console.log(max);
        return _.find(intervalStats, {'revenue': max});
    }
    
    _.forEach(['day', 'week', 'month'], function(interval){
       $scope.performance[interval] = getIntervalStats(interval);
       $scope.performance.records[interval] = getMaxInterval($scope.performance[interval]);
    });
    
    console.log($scope.performance);
})

.directive('salesRecord', function() {
    return {
        restrict: 'E',
        templateUrl: 'app/statistics/alltime_sales-record.html', 
        scope: {
            interval: "=",
            intervalName: '@',
            dateFormat: '@',
            globalCurrency: '='
        }
    };
});