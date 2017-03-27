angular
  .module('stats')
  .controller('LoadingCtrl', function($scope, ScriptFodder, returnTo, $state) {
    $scope.scriptCount = 0;
    $scope.progress = 0;
    $scope.numScriptsLoaded = 0;

    var returnToOriginalState = function() {
      console.log(
        'Loading finished, returning',
        returnTo.state,
        returnTo.params,
        { reload: true }
      );
      return $state.go(returnTo.state, returnTo.params, { reload: true });
    };

    ScriptFodder.loadScripts(
      function scriptListLoaded(scripts) {
        $scope.scriptCount = scripts.length + 1; // Plus one for the listing call itself
      },
      function scriptDetailLoadingStarted(script) {
        $scope.numScriptsLoaded = $scope.numScriptsLoaded + 1;
        $scope.currentScript = script;
        $scope.progress = $scope.numScriptsLoaded / $scope.scriptCount;
      }
    ).then(function() {
      $scope.numScriptsLoaded = $scope.numScriptsLoaded + 1;
      returnToOriginalState();
    });
  });
