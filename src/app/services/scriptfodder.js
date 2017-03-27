function appendTransform(defaults, transform) {
  // We can't guarantee that the default transformation is an array
  defaults = angular.isArray(defaults) ? defaults : [defaults];

  // Append the new transformation to the defaults
  return defaults.concat(transform);
}

angular
  .module('stats')
  .config([
    '$httpProvider',
    function($httpProvider) {
      $httpProvider.defaults.useXDomain = true;
    },
  ])
  .factory('ScriptFodder', function($resource, $localStorage, $http, $q) {
    var ScriptFodder = {};

    var initApi = function() {
      ScriptFodder.Scripts = $resource(
        'https://scriptfodder.com/api/scripts/info/:scriptId?api_key=' +
          $localStorage.apiKey,
        { scriptId: '@id' },
        {
          query: {
            method: 'GET',
            url: 'https://scriptfodder.com/api/scripts?api_key=' +
              $localStorage.apiKey,
            isArray: true,
            transformResponse: appendTransform(
              $http.defaults.transformResponse,
              function(response) {
                return response.scripts;
              }
            ),
          },
          info: {
            method: 'GET',
            transformResponse: appendTransform(
              $http.defaults.transformResponse,
              function(response) {
                return response.script;
              }
            ),
          },
          purchases: {
            method: 'GET',
            url: 'https://scriptfodder.com/api/scripts/purchases/:scriptId?api_key=' +
              $localStorage.apiKey,
            isArray: true,
            transformResponse: appendTransform(
              $http.defaults.transformResponse,
              function(response) {
                response.purchases = _(response.purchases)
                  .mapValues(function(val) {
                    val.price = (val.price && parseFloat(val.price)) || 0;
                    return val;
                  })
                  .toArray()
                  .value();
                return response.purchases;
              }
            ),
          },
        }
      );
    };

    ScriptFodder.ready = false;
    ScriptFodder.initialize = function() {
      if (this.ready) {
        $q.resolve();
      }

      this.initializing = true;
      initApi();
      return this.Scripts.query().$promise.then(function() {
        ScriptFodder.ready = true;
      });
    };

    ScriptFodder.loaded = false;
    // Delays are due to SF API Rate Limits
    ScriptFodder.loadScripts = function(gotScriptsCallback, statusCallback) {
      return ScriptFodder.initialize()
        .then(function() {
          return ScriptFodder.Scripts.query().$promise;
        })
        .tap(function(scripts) {
          gotScriptsCallback(scripts);
        })
        .then(function(scripts) {
          return _.filter(scripts, function(script) {
            return parseInt(script.status) != 2;
          })
        })
        .map(
          function(script) {
            statusCallback(script);
            var purchasePromise = $q.delay(100).then(function() {
              return ScriptFodder.Scripts.purchases({
                scriptId: script.id,
              });
            });
            return $q
              .all([script.$info(), purchasePromise])
              .spread(function(info, purchases) {
                info.purchases = purchases;
                return info;
              })
              .delay(100);
          },
          { concurrency: 1 }
        )
        .tap(function(scriptInfo) {
          ScriptFodder.scriptInfo = scriptInfo;
          ScriptFodder.loaded = true;
        });
    };

    ScriptFodder.getScriptInfo = function() {
      return this.scriptInfo;
    };

    ScriptFodder.getOftenPurchasedWith = function(scriptId) {
      var self = this;
      return $q
        .resolve()
        .then(function() {
          if (!self.frequentSets) {
            self.frequentSets = $http
              .get('/assets/frequentSets.json')
              .then(function(sets) {
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
            return _.filter(entry.ItemSet, function(id) {
              return id != scriptId;
            });
          }
          return null;
        });
    };

    ScriptFodder.getLocalScriptInfo = function(scriptId) {
      var self = this;

      var data = {};
      data.$promise = $q
        .resolve()
        .then(function() {
          if (!self.scriptInfo) {
            self.scriptInfo = $http
              .get('/assets/scripts.json')
              .then(function(scripts) {
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
            return $q.reject(
              'Script ' + scriptId + ' could not be found in the local db'
            );
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
