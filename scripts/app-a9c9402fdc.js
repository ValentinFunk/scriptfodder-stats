'use strict';

var app = angular.module('stats', ['ngAnimate', 'ngCookies', 'ngTouch', 'ngResource', 'ngSanitize', 'ui.router', 'ui.bootstrap', 'ngStorage', 'darthwade.loading', 'mwl.bluebird', 'daterangepicker', 'nvd3', 'angularMoment', 'ksCurrencyConvert'])

.config(function($httpProvider) {
    $httpProvider.interceptors.push(function(LoadingIndicator, $q) {
        return {
            'request': function(config) {
                LoadingIndicator.startedLoading();
                return config;
            },

            'requestError': function(rejection) {
                LoadingIndicator.finishedLoading();
                return $q.reject(rejection);
            },

            'responseError': function(rejection) {
                LoadingIndicator.finishedLoading();
                return $q.reject(rejection);
            },

            'response': function(response) {
                LoadingIndicator.finishedLoading();
                return response;
            }
        };
    });
})

.run(function($transitions, $state, ScriptFodder){
  $transitions.onBefore({to: 'statistics.*'}, ['$state', '$transition$', function($transition$) {
    if (!ScriptFodder.loaded) {
      console.log("Scriptfodder isn't loaded, redirecting to loading");
      return $state.target('loading');
    }
  }]);

  // Matches if the destination state has a 'redirectTo' property
  var matchCriteria = { to: function (state) { return state.redirectTo != null; } };
  // Function that returns a redirect for a transition, with a TargetState created using the destination state's 'redirectTo' property
  var redirectFn = function ($transition$) { return $state.target($transition$.to().redirectTo); };
  // Register the global 'redirectTo' hook
  $transitions.onBefore(matchCriteria, redirectFn);
})

.run(['$trace', function ($trace) { $trace.enable(1); }])

.config(function($stateProvider, $urlRouterProvider) {
    $stateProvider
    .state('home', {
        url: '/',
        templateUrl: 'app/main/main.html',
        controller: 'MainCtrl'
    })

    .state('statistics', {
        url: '/stats',
        templateUrl: 'app/statistics/statistics.html',
        controller: 'StatisticsCtrl',
        redirectTo: 'statistics.dashboard',
        abstract: true,
        resolve: {
          scripts: function(ScriptFodder) {
            return ScriptFodder.getScriptInfo();
          }
        }
    })

    .state('loading', {
      url: '/loading',
      templateUrl: 'app/statistics/loading.html',
      controller: 'LoadingCtrl',
      resolve: {
        returnTo: function($transition$) {
          var redirectedFrom = $transition$.previous();
          // The user was redirected to the loading state (via the a hook)
          if (redirectedFrom != null) {
              // Follow the current transition's redirect chain all the way back to the original attempted transition
              while (redirectedFrom.previous()) {
                  redirectedFrom = redirectedFrom.previous();
              }
              // return to the original attempted "to state"
              return { state: redirectedFrom.to(), params: redirectedFrom.params("to") };
          }
          // The user was not redirected to the loading state; they directly activated the loading state somehow.
          // Return them to the state they came from.
          var fromState = $transition$.from();
          var fromParams = $transition$.params("from");
          if (fromState.name !== '') {
              return { state: fromState, params: fromParams };
          }
          // If the fromState's name is empty, then this was the initial transition. Just return them to the home state
          return { state: 'home' };
        }
      }
    })

    .state('statistics.dashboard', {
        url: '',
        templateUrl: 'app/statistics/dashboard.html',
        controller: 'DashboardCtrl'
    })

    .state('statistics.related', {
        url: '/related',
        templateUrl: 'app/statistics/purchaseinfo.html',
        controller: 'PurchaseInfoCtrl'
    })

    .state('statistics.revenue', {
        url: '/revenue',
        templateUrl: 'app/statistics/revenue.html',
        controller: 'RevenueCtrl'
    })

    .state('statistics.alltime', {
        url: '/alltime',
        templateUrl: 'app/statistics/alltime.html',
        controller: 'AlltimeCtrl'
    })

    .state('statistics.monthly', {
        url: '/monthly',
        templateUrl: 'app/statistics/monthly.html',
        controller: 'MonthlyCtrl'
    })

    .state('about', {
        url: '/about',
        templateUrl: 'app/about/about.html'
    });

    $urlRouterProvider.otherwise('/');
})

.run(function($localStorage){
    $localStorage.globalCurrency = $localStorage.globalCurrency || 'USD';
});

'use strict';

angular.module('stats')
.controller('NavbarCtrl', function($scope, ScriptFodder, LoadingIndicator, $rootScope) {
    $scope.ScriptFodder = ScriptFodder;

    $scope.loadingIndicator = LoadingIndicator;
});

'use strict';

angular.module('stats')

.controller('StatisticsCtrl', function($scope, $localStorage) {
    $scope.$storage = $localStorage;
});

angular.module('stats')
    .controller('RevenueCtrl', function($scope, $loading, ScriptFodder, $q, scripts) {
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
        $scope.scripts = scripts;
   
        var earliest = _.chain($scope.scripts).pluck('addedDate').min().value();
        $scope.dateRange = {
            startDate: new Date(earliest * 1000),
            endDate: Date.now()
        };
        $scope.maxDate = Date.now();

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
angular.module('stats')

.controller('LoadingCtrl', function($scope, ScriptFodder, returnTo, $state) {
  $scope.scriptCount = 0;
  $scope.progress = 0;
  $scope.numScriptsLoaded = 0;

  var returnToOriginalState = function () {
    console.log("Loading finished, returning", returnTo.state, returnTo.params, { reload: true });
    return $state.go(returnTo.state, returnTo.params, { reload: true });
  };

  ScriptFodder.loadScripts(function scriptListLoaded(scripts) {
    $scope.scriptCount = scripts.length + 1; // Plus one for the listing call itself
  }, function scriptDetailLoadingStarted(script) {
    $scope.numScriptsLoaded = $scope.numScriptsLoaded + 1;
    $scope.currentScript = script;
    $scope.progress = $scope.numScriptsLoaded / $scope.scriptCount;
  }).then(function(scriptInformation) {
    $scope.numScriptsLoaded = $scope.numScriptsLoaded + 1;
    returnToOriginalState();
  });
});

angular.module('stats')

.controller('DashboardCtrl', function($scope, scripts) {
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
        lastMonth: { scripts: [], total: {} },
        thisMonth: { scripts: [], total: {} }
    };
    
    for (var i = 0; i < scripts.length; i++) {
        $scope.performance.lastMonth.scripts[i] = aggregateScriptSales(moment().subtract(1, 'M').startOf('month'), moment().subtract(1, 'M').endOf('month'), scripts[i]);
        $scope.performance.lastMonth.scripts[i].script = $scope.scripts[i];
        $scope.performance.lastMonth.date = moment().subtract(1, 'M').startOf('month');
        
        $scope.performance.thisMonth.scripts[i] = aggregateScriptSales(moment().startOf('month'), moment(), scripts[i]);
        $scope.performance.thisMonth.scripts[i].script = $scope.scripts[i];
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
    
    $scope.performance.lastMonth.total = calculateTotals($scope.performance.lastMonth);
    $scope.performance.thisMonth.total = calculateTotals($scope.performance.thisMonth);

    $scope.salesGraphData = $scope.performance.thisMonth.scripts;
    
    $scope.salesGraphOptions = {
        chart: {
            type: 'pieChart',
            height: 300,
            margin : {
                top: 10,
                right: 10,
                bottom: 10,
                left: 10
            },
            showLegend: false,
            x: function(d){ return d.script.name; },
            y: function(d){ return d.revenue || 0; },
            showValues: false,
            valueFormat: function(d){
                return d3.format('$,.2f')(d);
            },
            duration: 4000,
        }
    };
});
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
function appendTransform(defaults, transform) {

  // We can't guarantee that the default transformation is an array
  defaults = angular.isArray(defaults) ? defaults : [defaults];

  // Append the new transformation to the defaults
  return defaults.concat(transform);
}

angular.module('stats')

.config(function($httpProvider) {
    $httpProvider.defaults.useXDomain = true;
})

.factory('ScriptFodder', function($resource, $localStorage, $http, $q) {
    var ScriptFodder = {};

     var initApi = function() {
        ScriptFodder.Scripts = $resource('https://scriptfodder.com/api/scripts/info/:scriptId?api_key=' + $localStorage.apiKey, {scriptId: '@id'}, {
            query: {
                method: 'GET',
                url: 'https://scriptfodder.com/api/scripts?api_key=' + $localStorage.apiKey,
                isArray: true,
                transformResponse: appendTransform($http.defaults.transformResponse, function(response) {
                  return response.scripts;
                })
            },
            info: {
                method: 'GET',
                transformResponse: appendTransform($http.defaults.transformResponse, function(response) {
                    return response.script;
                })
            },
            purchases: {
                method: 'GET',
                url: 'https://scriptfodder.com/api/scripts/purchases/:scriptId?api_key=' + $localStorage.apiKey,
                isArray: true,
                transformResponse: appendTransform($http.defaults.transformResponse, function(response) {
                    response.purchases = _(response.purchases)
                    .mapValues(function(val){
                       val.price = val.price && parseFloat(val.price) || 0;
                       return val;
                    })
                    .toArray()
                    .value();
                    return response.purchases;
                })
            }
        });
    };

    ScriptFodder.ready = false;
    ScriptFodder.initialize = function() {
        if (this.ready) {
            $q.resolve();
        }

        this.initializing = true;
        initApi();
        return this.Scripts.query().$promise.then(function(){
           ScriptFodder.ready = true;
        });
    };

    ScriptFodder.loaded = false;
    // Delays are due to SF API Rate Limits
    ScriptFodder.loadScripts = function(gotScriptsCallback, statusCallback) {
      return ScriptFodder.initialize().then(function() {
        return ScriptFodder.Scripts.query().$promise;
      }).tap(function(scripts) {
        gotScriptsCallback(scripts);
      }).map(function(script) {
        statusCallback(script);
        var purchasePromise = $q.delay(100).then(function() {
          return ScriptFodder.Scripts.purchases({
            scriptId: script.id
          });
        });
        return $q.all([script.$info(), purchasePromise]).spread(function(info, purchases) {
          info.purchases = purchases;
          return info;
        }).delay(100);
      }, {concurrency: 1}).tap(function(scriptInfo) {
        ScriptFodder.scriptInfo = scriptInfo;
        ScriptFodder.loaded = true;
      });
    }

    ScriptFodder.getScriptInfo = function() {
      return this.scriptInfo;
    }

    ScriptFodder.getOftenPurchasedWith = function(scriptId) {
        var self = this;
        return $q.resolve()
        .then(function(){
            if (!self.frequentSets) {
                self.frequentSets = $http.get('/assets/frequentSets.json')
                .then(function(sets){
                    return sets.data;
                });
            }

            return self.frequentSets;
        })
        .then(function(frequentSets) {
            var entry = _.find(frequentSets, function(frequentSet) {
                return frequentSet.KeyItem == scriptId;
            });

            if (entry) {
                return _.filter(entry.ItemSet, function(id) { return id != scriptId });
            }
            return null;
        });
    };

    ScriptFodder.getLocalScriptInfo = function(scriptId) {
        var self = this;

        var data = {};
        data.$promise = $q.resolve()
        .then(function(){
            if (!self.scriptInfo) {
                self.scriptInfo = $http.get('/assets/scripts.json')
                .then(function(scripts){
                    return scripts.data;
                });
            }

            return self.scriptInfo;
        })
        .then(function(scripts) {
            return _.find(scripts, function(script) {
                return script.id == scriptId;
            });
        })
        .then(function(script) {
            if (script) {
                _.extend(data, script);
            } else {
                return $q.reject("Script " + scriptId + " could not be found in the local db");
            }

            return data;
        });

        return data;
    };

    ScriptFodder.isReady = function() {
        return this.ready;
    };


    return ScriptFodder;
});

angular.module('stats').filter('percentage', ['$filter', function ($filter) {
  return function (input, decimals) {
    return $filter('number')(input * 100, decimals) + '%';
  };
}]);

angular.module('ksCurrencyConvert', [])

.factory('ExchangeRate', function($http) {
    var ExchangeRate = {};

    var supportedCurrencies = [
        "AUD",
        "BGN",
        "BRL",
        "CAD",
        "CHF",
        "CNY",
        "CZK",
        "DKK",
        "GBP",
        "HKD",
        "HRK",
        "HUF",
        "IDR",
        "ILS",
        "INR",
        "JPY",
        "KRW",
        "MXN",
        "MYR",
        "NOK",
        "NZD",
        "PHP",
        "PLN",
        "RON",
        "RUB",
        "SEK",
        "SGD",
        "THB",
        "TRY",
        "USD",
        "ZAR"
    ];

    ExchangeRate.getSupportedCurrencies = function() {
        return supportedCurrencies;
    };

    ExchangeRate.isCurrencySupported = function(currencyCode) {
        return _.findKey(supportedCurrencies, currencyCode) !== -1;
    };

    ExchangeRate.getExchangeRate = function(baseCurrency, toCurrency, date, $q) {
        if (!this.isCurrencySupported(baseCurrency)) {
            throw new Error('Invalid base currency');
        }

        if (!this.isCurrencySupported(toCurrency)) {
            throw new Error('Invalid toCurrency');
        }

        var multiRequest = angular.isArray(toCurrency)
        if (!multiRequest) {
            toCurrency = [toCurrency];
        }

        var endpoint;
        if (angular.isDefined(date)) {
            endpoint = 'https://api.fixer.io/' + moment(date).format('YYYY-MM-DD');
        } else {
            endpoint = 'https://api.fixer.io/latest';
        }

        return $http({
                url: endpoint,
                method: 'GET',
                params: {
                    base: baseCurrency,
                    symbols: toCurrency.join(','),
                }
            })
            .then(function(response) {
                if (response.status != 200) {
                    return $q.reject(['Error fetching data ', response]);
                }

                if (multiRequest) {
                    return response.data;
                }

                return {
                    rate: response.data.rates[toCurrency],
                    date: response.data.date
                };
            });
    };

    return ExchangeRate;
})

.directive('alternativeCurrency', function(ExchangeRate, currencySymbolMap) {
    return {
        templateUrl: 'app/services/alternative-currency.html',
        restrict: 'E',
        scope: {
            toCurrency: '=',
            baseCurrency: '=',
            date: '=',
            amount: '='
        },
        controller: function($scope) {
            $scope.currencySymbol = currencySymbolMap[$scope.toCurrency];
            $scope.isLoading = true;

            $scope.hideConverted = $scope.hideConverted || ($scope.baseCurrency == $scope.toCurrency);
            ExchangeRate.getExchangeRate($scope.baseCurrency, $scope.toCurrency, $scope.date)
            .then(function(data) {
                $scope.rate = data.rate;
                console.log($scope.amount, data);
                $scope.convertedAmount = $scope.amount * data.rate;
                $scope.rateFrom = data.date;
            })
            .catch(function(error) {
                console.log(error);
                $scope.isError = true;
            })
            .finally(function() {
                $scope.isLoading = false;
            });
        }
    };
})

// Currency map taken from https://github.com/bengourley/currency-symbol-map
/*
  Copyright (c) 2015, Ben Gourley
  All rights reserved.

  Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

  1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

  2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/
.constant('currencySymbolMap', {
    "ALL": "L",
    "AFN": "؋",
    "ARS": "$",
    "AWG": "ƒ",
    "AUD": "$",
    "AZN": "₼",
    "BSD": "$",
    "BBD": "$",
    "BYR": "p.",
    "BZD": "BZ$",
    "BMD": "$",
    "BOB": "Bs.",
    "BAM": "KM",
    "BWP": "P",
    "BGN": "лв",
    "BRL": "R$",
    "BND": "$",
    "KHR": "៛",
    "CAD": "$",
    "KYD": "$",
    "CLP": "$",
    "CNY": "¥",
    "COP": "$",
    "CRC": "₡",
    "HRK": "kn",
    "CUP": "₱",
    "CZK": "Kč",
    "DKK": "kr",
    "DOP": "RD$",
    "XCD": "$",
    "EGP": "£",
    "SVC": "$",
    "EEK": "kr",
    "EUR": "€",
    "FKP": "£",
    "FJD": "$",
    "GHC": "¢",
    "GIP": "£",
    "GTQ": "Q",
    "GGP": "£",
    "GYD": "$",
    "HNL": "L",
    "HKD": "$",
    "HUF": "Ft",
    "ISK": "kr",
    "INR": "₹",
    "IDR": "Rp",
    "IRR": "﷼",
    "IMP": "£",
    "ILS": "₪",
    "JMD": "J$",
    "JPY": "¥",
    "JEP": "£",
    "KES": "KSh",
    "KZT": "лв",
    "KPW": "₩",
    "KRW": "₩",
    "KGS": "лв",
    "LAK": "₭",
    "LVL": "Ls",
    "LBP": "£",
    "LRD": "$",
    "LTL": "Lt",
    "MKD": "ден",
    "MYR": "RM",
    "MUR": "₨",
    "MXN": "$",
    "MNT": "₮",
    "MZN": "MT",
    "NAD": "$",
    "NPR": "₨",
    "ANG": "ƒ",
    "NZD": "$",
    "NIO": "C$",
    "NGN": "₦",
    "NOK": "kr",
    "OMR": "﷼",
    "PKR": "₨",
    "PAB": "B/.",
    "PYG": "Gs",
    "PEN": "S/.",
    "PHP": "₱",
    "PLN": "zł",
    "QAR": "﷼",
    "RON": "lei",
    "RUB": "₽",
    "SHP": "£",
    "SAR": "﷼",
    "RSD": "Дин.",
    "SCR": "₨",
    "SGD": "$",
    "SBD": "$",
    "SOS": "S",
    "ZAR": "R",
    "LKR": "₨",
    "SEK": "kr",
    "CHF": "Fr.",
    "SRD": "$",
    "SYP": "£",
    "TZS": "TSh",
    "TWD": "NT$",
    "THB": "฿",
    "TTD": "TT$",
    "TRY": "",
    "TRL": "₤",
    "TVD": "$",
    "UGX": "USh",
    "UAH": "₴",
    "GBP": "£",
    "USD": "$",
    "UYU": "$U",
    "UZS": "лв",
    "VEF": "Bs",
    "VND": "₫",
    "YER": "﷼",
    "ZWD": "Z$"
});;

angular.module('stats')
.service('LoadingIndicator', [
	function() {
	    this.loadingStack = new Array();
	    this.isLoading = function() {
	        return this.loadingStack.length > 0;
	    };
	    
	    this.startedLoading = function() {
	        this.loadingStack.push(true);  
	    };
	    
	    this.finishedLoading = function() {
	        this.loadingStack.pop();  
	    };
	}
]);
'use strict';

angular.module('stats')

.controller('MainCtrl', function($scope, $localStorage, $loading, ScriptFodder, $rootScope) {
    $scope.$storage = $localStorage;

    $scope.performCheck = function() {
        $loading.start('checkApiKey');
        $scope.checkResult = {};
        ScriptFodder.initialize()
        .then(function() {
            $loading.finish('checkApiKey');
            $scope.checkResult = {
              status: 'success'  
            };
        }, function(err) {
            $loading.finish('checkApiKey');
            $scope.checkResult = {
                status: 'error',
                error: err
            };
        });
    };
    
    if ($scope.$storage.apiKey) {
        $scope.performCheck();
    }
});

angular.module('stats').run(['$templateCache', function($templateCache) {$templateCache.put('app/about/about.html','<div class="row content"><div class="col-md-6 col-md-offset-3 text-center"><h1>StatFodder</h1><p>Created by Kamshak. Free and open-source.</p></div></div>');
$templateCache.put('app/main/main.html','<div class="container"><div class="row content"><div class="col-md-6 col-md-offset-3 text-center"><h1>Welcome to StatFodder</h1><p>This site can be used by scriptfodder developers to get an overview of their sales statistics. To get started enter your API key below. The site runs on javascript, your key is only saved locally and never transmitted to a server.</p><p>You can set a currency that some amounts will be converted into.</p><div class="panel panel-primary"><div class="panel-heading"><h4 class="panel-title">API Settings</h4></div><div class="panel-body" dw-loading="checkApiKey"><div ng-show="checkResult.status" class="col-md-12" style="margin-top: 15px"><div class="alert alert-success" role="alert" ng-show="checkResult.status == \'success\'"><strong>Success</strong> The api key entered is valid. You can now access the Statistics tab.</div><div class="alert alert-danger" role="alert" ng-show="checkResult.status == \'error\'"><strong>Error</strong> The api key was not valid or the SF API is down.</div></div><div class="col-md-12"><form class="form-horizontal"><div class="form-group"><label for="apiKey">API Key</label> <input type="text" class="form-control" id="apiKey" placeholder="" ng-model="$storage.apiKey"> <button type="submit" class="btn btn-default" ng-click="performCheck()" style="margin-top: 5px">Check</button></div><div class="form-group"><label for="currency">Currency</label><select id="currency" class="form-control" ng-model="$storage.globalCurrency"><option>GBP</option><option>EUR</option><option>USD</option></select></div></form></div></div></div></div></div></div>');
$templateCache.put('app/services/alternative-currency.html','<span><span>{{amount | currency}}</span> <span ng-hide="hideConverted">| <span ng-show="isLoading"><i class="fa fa-spinner fa-pulse"></i>loading...</span> <abbr tooltip="Exchange rate {{rate}} from {{rateFrom | amCalendar}}" tooltip-placement="bottom" ng-show="!isLoading">{{scope.isError && "error"}}{{convertedAmount | currency:currencySymbol}}</abbr></span></span>');
$templateCache.put('app/statistics/alltime.html','<h1>All-time Script Statistics</h1><div class="row"><div class="col-md-12"><div class="panel panel-default"><div class="panel-heading">Total Revenue</div><div class="panel-body"><p><strong>Scripts Sold</strong>: {{performance.overall.total.amountSold}}</p><p><strong>Revenue</strong>:<alternative-currency to-currency="$storage.globalCurrency" base-currency="\'USD\'" amount="performance.overall.total.revenue"></alternative-currency></p><div class="row"><div class="col-md-12"><nvd3 options="salesGraphOptions" data="performance.scripts"></nvd3></div></div></div></div></div></div><div class="row"><div class="col-md-4"><sales-record interval="performance.records.day" interval-name="Day" date-format="dddd, MMMM Do YYYY" global-currency="$storage.globalCurrency"></sales-record></div><div class="col-md-4"><sales-record interval="performance.records.week" interval-name="Week" date-format="[Week] W of YYYY (MMMM Do YYYY [+ 7 Days])" global-currency="$storage.globalCurrency"></sales-record></div><div class="col-md-4"><sales-record interval="performance.records.month" interval-name="Month" date-format="MMMM YYYY" global-currency="$storage.globalCurrency"></sales-record></div></div>');
$templateCache.put('app/statistics/alltime_sales-record.html','<div class="panel panel-default"><div class="panel-heading"><h4>Best {{intervalName}}</h4><h6>{{ interval.time | amDateFormat:dateFormat }}</h6></div><div class="panel-body"><p><strong>Revenue</strong>:<alternative-currency to-currency="globalCurrency" date="interval.time" base-currency="\'USD\'" amount="interval.revenue"></alternative-currency></p><p><strong>Scripts Sold</strong>: {{ interval.scriptsSold }}</p></div></div>');
$templateCache.put('app/statistics/dashboard.html','<h1>Dashboard</h1><div class="row"><div class="col-md-6"><div class="panel panel-default"><div class="panel-heading">This Month</div><div class="panel-body"><p><strong>Scripts Sold</strong>: {{performance.thisMonth.total.amountSold}}</p><p><strong>Revenue</strong>:<alternative-currency to-currency="$storage.globalCurrency" base-currency="\'USD\'" amount="performance.thisMonth.total.revenue"></alternative-currency></p><div class="row"><div class="col-md-12"><nvd3 options="salesGraphOptions" data="performance.thisMonth.scripts"></nvd3></div></div></div></div></div><div class="col-md-6"><div class="panel panel-default"><div class="panel-heading">Last Month</div><div class="panel-body"><p><strong>Scripts Sold</strong>: {{performance.lastMonth.total.amountSold}}</p><p><strong>Revenue</strong>:<alternative-currency to-currency="$storage.globalCurrency" date="performance.lastMonth.date" base-currency="\'USD\'" amount="performance.lastMonth.total.revenue"></alternative-currency></p><div class="row"><div class="col-md-12"><nvd3 options="salesGraphOptions" data="performance.lastMonth.scripts"></nvd3></div></div></div></div></div></div>');
$templateCache.put('app/statistics/loading.html','<h1><i class="fa fa-spinner fa-spin fa-fw"></i> Loading Script Information</h1><div class="row text-center"><div class="col-md-12"><small>Loading <em>{{currentScript.name || "Script List"}}</em></small><progressbar max="1" class="progress-striped active" value="progress" type="info"><b>{{progress | percentage:0}}</b></progressbar></div></div>');
$templateCache.put('app/statistics/monthly.html','<div class="row"><div class="col-md-12"><h1>Sales Distribution</h1><h2>By Revenue</h2><nvd3 options="revenueChart" data="revenue"></nvd3><h2>By number of purchases</h2><nvd3 options="numPurchasesChart" data="numPurchases"></nvd3></div></div>');
$templateCache.put('app/statistics/revenue.html','<h1>Daily Statistics</h1><h2>Scripts</h2><div class="btn-group"><label ng-repeat="script in scripts" class="btn btn-primary" ng-model="checkModel[$index]" btn-checkbox="">{{script.name}}</label></div><h2>Timespan</h2><input date-range-picker="" class="form-control date-picker" type="text" min="minDate" max="maxDate" ng-model="dateRange"><div id="revenue"></div><div id="number"></div><div class="legend"></div>');
$templateCache.put('app/statistics/statistics.html','<div class="col-md-3" role="complementary"><nav class="bs-docs-sidebar hidden-print hidden-xs hidden-sm"><ul class="nav bs-docs-sidenav"><li ui-sref-active="active"><a ui-sref="statistics.dashboard">Dashboard</a></li><li ui-sref-active="active"><a ui-sref="statistics.revenue">Daily Revenue Analyzer</a></li><li ui-sref-active="active"><a ui-sref="statistics.monthly">Sales Distribution / Monthly stats</a></li><li ui-sref-active="active"><a ui-sref="statistics.alltime">All Time Stats / Records</a></li></ul></nav></div><div class="col-md-9" ui-view=""></div>');
$templateCache.put('app/components/navbar/navbar.html','<nav class="navbar navbar-static-top navbar-default" ng-controller="NavbarCtrl"><div class="container"><div class="navbar-header"><a class="navbar-brand" href="https://kamshak.github.io/scriptfodder-stats/"><span class="fa fa-line-chart"></span> StatFodder</a><div class="navbar-brand has-spinner" ng-show="loadingIndicator.isLoading()"><i class="spinner fa fa-spinner fa-1x fa-spin"></i></div></div><div class="collapse navbar-collapse" id="bs-example-navbar-collapse-6"><ul class="nav navbar-nav"><li ui-sref-active="active"><a ui-sref="home">Home</a></li><li ui-sref-active="active" ng-show="ScriptFodder.isReady()"><a ui-sref="statistics">Statistics</a></li><li ui-sref-active="active"><a ui-sref="about">About</a></li></ul><ul class="nav navbar-nav navbar-right"><li><a href="https://github.com/Kamshak/scriptfodder-stats"><span class="fa fa-github"></span> scriptfodder-stats</a></li></ul></div></div></nav>');}]);