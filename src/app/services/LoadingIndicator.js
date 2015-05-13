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