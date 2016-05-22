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
