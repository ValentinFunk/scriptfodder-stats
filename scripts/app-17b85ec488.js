"use strict";function appendTransform(t,e){return t=angular.isArray(t)?t:[t],t.concat(e)}var app=angular.module("stats",["ngAnimate","ngCookies","ngTouch","ngResource","ngSanitize","ui.router","ui.bootstrap","ngStorage","darthwade.loading","mwl.bluebird","daterangepicker","nvd3","angularMoment","ksCurrencyConvert"]).config(["$httpProvider",function(t){t.interceptors.push(["LoadingIndicator","$q",function(t,e){return{request:function(e){return t.startedLoading(),e},requestError:function(r){return t.finishedLoading(),e.reject(r)},responseError:function(r){return t.finishedLoading(),e.reject(r)},response:function(e){return t.finishedLoading(),e}}}])}]).run(["$transitions","$state","ScriptFodder",function(t,e,r){t.onBefore({to:"statistics.*"},["$state","$transition$",function(t){if(!r.loaded)return console.log("Scriptfodder isn't loaded, redirecting to loading"),e.target("loading")}]);var a={to:function(t){return null!=t.redirectTo}},n=function(t){return e.target(t.to().redirectTo)};t.onBefore(a,n)}]).run(["$trace",function(t){t.enable(1)}]).config(["$stateProvider","$urlRouterProvider",function(t,e){t.state("home",{url:"/",templateUrl:"app/main/main.html",controller:"MainCtrl"}).state("statistics",{url:"/stats",templateUrl:"app/statistics/statistics.html",controller:"StatisticsCtrl",redirectTo:"statistics.dashboard","abstract":!0,resolve:{scripts:["ScriptFodder",function(t){return t.getScriptInfo()}]}}).state("loading",{url:"/loading",templateUrl:"app/statistics/loading.html",controller:"LoadingCtrl",resolve:{returnTo:["$transition$",function(t){var e=t.previous();if(null!=e){for(;e.previous();)e=e.previous();return{state:e.to(),params:e.params("to")}}var r=t.from(),a=t.params("from");return""!==r.name?{state:r,params:a}:{state:"home"}}]}}).state("statistics.dashboard",{url:"",templateUrl:"app/statistics/dashboard.html",controller:"DashboardCtrl"}).state("statistics.related",{url:"/related",templateUrl:"app/statistics/purchaseinfo.html",controller:"PurchaseInfoCtrl"}).state("statistics.revenue",{url:"/revenue",templateUrl:"app/statistics/revenue.html",controller:"RevenueCtrl"}).state("statistics.alltime",{url:"/alltime",templateUrl:"app/statistics/alltime.html",controller:"AlltimeCtrl"}).state("statistics.monthly",{url:"/monthly",templateUrl:"app/statistics/monthly.html",controller:"MonthlyCtrl"}).state("about",{url:"/about",templateUrl:"app/about/about.html"}),e.otherwise("/")}]).run(["$localStorage",function(t){t.globalCurrency=t.globalCurrency||"USD"}]);angular.module("stats").controller("NavbarCtrl",["$scope","ScriptFodder","LoadingIndicator","$rootScope",function(t,e,r,a){t.ScriptFodder=e,t.loadingIndicator=r}]),angular.module("stats").controller("StatisticsCtrl",["$scope","$localStorage",function(t,e){t.$storage=e}]),angular.module("stats").controller("RevenueCtrl",["$scope","$loading","ScriptFodder","$q","scripts",function(t,e,r,a,n){function s(e,r){for(var a=[],n=[],s=0;s<e.length;s++){var i=e[s].purchases;a[s]=_.chain(i).filter(function(e){return moment(1e3*e.purchase_time).isBetween(t.dateRange.startDate,t.dateRange.endDate)}).groupBy(function(t){var e=new Date(1e3*t.purchase_time);return e.setSeconds(0),e.setMinutes(0),e.setHours(12),e.valueOf()}).reduce(function(t,e,a){if("revenue"==r){var n=_.chain(e).pluck("price").reduce(_.add).value();t[a]=n}else"purchases"==r&&(t[a]=e.length);return t},{}).tap(function(t){for(var e=moment(1*_(t).keys().min()),r=moment(1*_(t).keys().max()),a=e,n=0;a.add(1,"d"),t[1e3*a.unix()]=t[1e3*a.unix()]||0,a.isBefore(r);n++);console.log("Finished")}).map(function(t,e,r){var a=new Date(1*e);return{date:a,value:t}}).sortBy(function(t){return t.date}).value(),n[s]=e[s].name}return{data:a,labels:n}}e.start("data"),t.dateRange={},t.checkModel={0:!0},t.scripts=n;var i=_.chain(t.scripts).pluck("addedDate").min().value();t.dateRange={startDate:new Date(1e3*i),endDate:Date.now()},t.maxDate=Date.now(),t.$watch(function(){return[t.checkModel,t.dateRange]},function(e,r){var a=_.filter(t.scripts,function(e,r){return t.checkModel[r]});if(!(a.length<1)){var n=s(a,"purchases");MG.data_graphic({title:"Number of Purchases",data:n.data,legend:n.labels,legend_target:".legend",target:"#number",full_width:!0,interpolate:"basic",height:200,right:40,linked:!0,y_label:"Amount"});for(var i=s(a,"revenue"),o=[],c=0;c<i.data.length;c++){var l=_(i.data[c]).indexBy("date").value();_.merge(o,l,o,function(t,e){return t&&e?{date:t.date,value:t.value+e.value}:t&&!e?t:!t&&e?e:void 0})}var u=_(o).values().sortBy(function(t){return t.date}).value();MG.data_graphic({title:"Revenue",data:u,yax_units:"$",target:"#revenue",full_width:!0,interpolate:"basic",y_label:"Revenue in $",height:200,right:40,linked:!0})}},!0)}]),angular.module("stats").controller("MonthlyCtrl",["$scope","scripts",function(t,e){function r(t){var r=_(e).mapValues(function(e){var r=_(e.purchases).filter(function(t){return t.price>0}).groupBy(function(e){return moment(1e3*e.purchase_time).startOf(t).unix()}).tap(function(t){for(var e=moment(n);!e.isAfter(s);e.add(1,"M"))t[e.unix()]=t[e.unix()]||[]}).pairs().sortBy(function(t){return moment(1e3*t[0]).unix()}).mapValues(function(t){var e=t[1];return{time:t[0],purchases:e,scriptsSold:e.length,revenue:_(e).pluck("price").reduce(_.add)||0}}).value();return r}).value();return r}function a(t){return _(e).map(function(e,r,a){return{id:r,key:e.name,values:_(i[r]).mapValues(function(e){return{x:e.time,y:e[t]}}).toArray().value()}}).value()}t.scripts=e;var n=_.chain(e).map(function(t){return _(t.purchases).filter(function(t){return 0!=t.price}).pluck("purchase_time").min()}).min().value(),s=_.chain(e).map(function(t){return _(t.purchases).pluck("purchase_time").max()}).max().value();n=moment(1e3*n).startOf("month"),s=moment(1e3*s).startOf("month");var i=r("month");console.log("Got Monthly",i),t.revenue=a("revenue"),t.numPurchases=a("scriptsSold");var o={type:"multiBarChart",height:450,margin:{top:20,right:20,bottom:60,left:45},clipEdge:!0,staggerLabels:!0,transitionDuration:500,stacked:!0,xAxis:{axisLabel:"Date",showMaxMin:!1,tickFormat:function(t){return moment(1e3*t).format("MM/YY")}}};t.revenueChart={chart:_.extend({yAxis:{axisLabel:"Revenue",axisLabelDistance:40,tickFormat:function(t){return d3.format("$,.1f")(t)}}},o)},t.numPurchasesChart={chart:_.extend({yAxis:{axisLabel:"Revenue",axisLabelDistance:40,tickFormat:function(t){return t}}},o)}}]),angular.module("stats").controller("LoadingCtrl",["$scope","ScriptFodder","returnTo","$state",function(t,e,r,a){t.scriptCount=0,t.progress=0,t.numScriptsLoaded=0;var n=function(){return console.log("Loading finished, returning",r.state,r.params,{reload:!0}),a.go(r.state,r.params,{reload:!0})};e.loadScripts(function(e){t.scriptCount=e.length+1},function(e){t.numScriptsLoaded=t.numScriptsLoaded+1,t.currentScript=e,t.progress=t.numScriptsLoaded/t.scriptCount}).then(function(e){t.numScriptsLoaded=t.numScriptsLoaded+1,n()})}]),angular.module("stats").controller("DashboardCtrl",["$scope","scripts",function(t,e){function r(t,e,r){var a={};return a.revenue=_.chain(r.purchases).filter(function(r){return moment(1e3*r.purchase_time).isBetween(t,e)}).tap(function(t){a.amountSold=t.length}).pluck("price").reduce(_.add).value(),a}function a(t,e){return _.chain(t).pluck(e).reduce(_.add).value()}function n(t){return{revenue:a(t.scripts,"revenue"),amountSold:a(t.scripts,"amountSold")}}t.scripts=e,t.performance={lastMonth:{scripts:[],total:{}},thisMonth:{scripts:[],total:{}}};for(var s=0;s<e.length;s++)t.performance.lastMonth.scripts[s]=r(moment().subtract(1,"M").startOf("month"),moment().subtract(1,"M").endOf("month"),e[s]),t.performance.lastMonth.scripts[s].script=t.scripts[s],t.performance.lastMonth.date=moment().subtract(1,"M").startOf("month"),t.performance.thisMonth.scripts[s]=r(moment().startOf("month"),moment(),e[s]),t.performance.thisMonth.scripts[s].script=t.scripts[s];t.performance.lastMonth.total=n(t.performance.lastMonth),t.performance.thisMonth.total=n(t.performance.thisMonth),t.salesGraphData=t.performance.thisMonth.scripts,t.salesGraphOptions={chart:{type:"pieChart",height:300,margin:{top:10,right:10,bottom:10,left:10},showLegend:!1,x:function(t){return t.script.name},y:function(t){return t.revenue||0},showValues:!1,valueFormat:function(t){return d3.format("$,.2f")(t)},duration:4e3}}}]),angular.module("stats").controller("AlltimeCtrl",["$scope","scripts",function(t,e){function r(t,e,r){var a={};return a.revenue=_.chain(r.purchases).filter(function(r){return moment(1e3*r.purchase_time).isBetween(t,e)}).tap(function(t){a.amountSold=t.length}).pluck("price").reduce(_.add).value(),a}function a(t,e){return _.chain(t).pluck(e).reduce(_.add).value()}function n(t){return{revenue:a(t.scripts,"revenue"),amountSold:a(t.scripts,"amountSold")}}function s(t){var r=_(e).pluck("purchases").flatten().groupBy(function(e){return moment(1e3*e.purchase_time).startOf(t)}).mapValues(function(t){return{purchases:t,scriptsSold:t.length,revenue:_(t).pluck("price").reduce(_.add)}}).pairs().sortBy(function(t){return moment(t[0]).unix()}).map(function(t){return t[1].time=t[0],t[1]}).value();return r}function i(t){var e=_(t).pluck("revenue").max();return console.log(e),_.find(t,{revenue:e})}t.scripts=e,t.performance={overall:{scripts:[],total:0},records:{}};for(var o=0;o<e.length;o++)t.performance.overall.scripts[o]=r(moment(0),moment(),e[o]),t.performance.overall.scripts[o].script=t.scripts[o];t.performance.overall.total=n(t.performance.overall);var c=_.chain(e).map(function(t){return _(t.purchases).pluck("purchase_time").min()}).min().value();c=moment(1e3*c),_.forEach(["day","week","month"],function(e){t.performance[e]=s(e),t.performance.records[e]=i(t.performance[e])}),console.log(t.performance)}]).directive("salesRecord",function(){return{restrict:"E",templateUrl:"app/statistics/alltime_sales-record.html",scope:{interval:"=",intervalName:"@",dateFormat:"@",globalCurrency:"="}}}),angular.module("stats").config(["$httpProvider",function(t){t.defaults.useXDomain=!0}]).factory("ScriptFodder",["$resource","$localStorage","$http","$q",function(t,e,r,a){var n={},s=function(){n.Scripts=t("https://scriptfodder.com/api/scripts/info/:scriptId?api_key="+e.apiKey,{scriptId:"@id"},{query:{method:"GET",url:"https://scriptfodder.com/api/scripts?api_key="+e.apiKey,isArray:!0,transformResponse:appendTransform(r.defaults.transformResponse,function(t){return t.scripts})},info:{method:"GET",transformResponse:appendTransform(r.defaults.transformResponse,function(t){return t.script})},purchases:{method:"GET",url:"https://scriptfodder.com/api/scripts/purchases/:scriptId?api_key="+e.apiKey,isArray:!0,transformResponse:appendTransform(r.defaults.transformResponse,function(t){return t.purchases=_(t.purchases).mapValues(function(t){return t.price=t.price&&parseFloat(t.price)||0,t}).toArray().value(),t.purchases})}})};return n.ready=!1,n.initialize=function(){return this.ready&&a.resolve(),this.initializing=!0,s(),this.Scripts.query().$promise.then(function(){n.ready=!0})},n.loaded=!1,n.loadScripts=function(t,e){return n.initialize().then(function(){return n.Scripts.query().$promise}).tap(function(e){t(e)}).map(function(t){e(t);var r=a.delay(100).then(function(){return n.Scripts.purchases({scriptId:t.id})});return a.all([t.$info(),r]).spread(function(t,e){return t.purchases=e,t}).delay(100)},{concurrency:1}).tap(function(t){n.scriptInfo=t,n.loaded=!0})},n.getScriptInfo=function(){return this.scriptInfo},n.getOftenPurchasedWith=function(t){var e=this;return a.resolve().then(function(){return e.frequentSets||(e.frequentSets=r.get("/assets/frequentSets.json").then(function(t){return t.data})),e.frequentSets}).then(function(e){var r=_.find(e,function(e){return e.KeyItem==t});return r?_.filter(r.ItemSet,function(e){return e!=t}):null})},n.getLocalScriptInfo=function(t){var e=this,n={};return n.$promise=a.resolve().then(function(){return e.scriptInfo||(e.scriptInfo=r.get("/assets/scripts.json").then(function(t){return t.data})),e.scriptInfo}).then(function(e){return _.find(e,function(e){return e.id==t})}).then(function(e){return e?(_.extend(n,e),n):a.reject("Script "+t+" could not be found in the local db")}),n},n.isReady=function(){return this.ready},n}]),angular.module("stats").filter("percentage",["$filter",function(t){return function(e,r){return t("number")(100*e,r)+"%"}}]),angular.module("ksCurrencyConvert",[]).factory("ExchangeRate",["$http",function(t){var e={},r=["AUD","BGN","BRL","CAD","CHF","CNY","CZK","DKK","GBP","HKD","HRK","HUF","IDR","ILS","INR","JPY","KRW","MXN","MYR","NOK","NZD","PHP","PLN","RON","RUB","SEK","SGD","THB","TRY","USD","ZAR"];return e.getSupportedCurrencies=function(){return r},e.isCurrencySupported=function(t){return _.findKey(r,t)!==-1},e.getExchangeRate=function(e,r,a,n){if(!this.isCurrencySupported(e))throw new Error("Invalid base currency");if(!this.isCurrencySupported(r))throw new Error("Invalid toCurrency");var s=angular.isArray(r);s||(r=[r]);var i;return i=angular.isDefined(a)?"https://api.fixer.io/"+moment(a).format("YYYY-MM-DD"):"https://api.fixer.io/latest",t({url:i,method:"GET",params:{base:e,symbols:r.join(",")}}).then(function(t){return 200!=t.status?n.reject(["Error fetching data ",t]):s?t.data:{rate:t.data.rates[r],date:t.data.date}})},e}]).directive("alternativeCurrency",["ExchangeRate","currencySymbolMap",function(t,e){return{templateUrl:"app/services/alternative-currency.html",restrict:"E",scope:{toCurrency:"=",baseCurrency:"=",date:"=",amount:"="},controller:["$scope",function(r){r.currencySymbol=e[r.toCurrency],r.isLoading=!0,r.hideConverted=r.hideConverted||r.baseCurrency==r.toCurrency,t.getExchangeRate(r.baseCurrency,r.toCurrency,r.date).then(function(t){r.rate=t.rate,console.log(r.amount,t),r.convertedAmount=r.amount*t.rate,r.rateFrom=t.date})["catch"](function(t){console.log(t),r.isError=!0})["finally"](function(){r.isLoading=!1})}]}}]).constant("currencySymbolMap",{ALL:"L",AFN:"؋",ARS:"$",AWG:"ƒ",AUD:"$",AZN:"₼",BSD:"$",BBD:"$",BYR:"p.",BZD:"BZ$",BMD:"$",BOB:"Bs.",BAM:"KM",BWP:"P",BGN:"лв",BRL:"R$",BND:"$",KHR:"៛",CAD:"$",KYD:"$",CLP:"$",CNY:"¥",COP:"$",CRC:"₡",HRK:"kn",CUP:"₱",CZK:"Kč",DKK:"kr",DOP:"RD$",XCD:"$",EGP:"£",SVC:"$",EEK:"kr",EUR:"€",FKP:"£",FJD:"$",GHC:"¢",GIP:"£",GTQ:"Q",GGP:"£",GYD:"$",HNL:"L",HKD:"$",HUF:"Ft",ISK:"kr",INR:"₹",IDR:"Rp",IRR:"﷼",IMP:"£",ILS:"₪",JMD:"J$",JPY:"¥",JEP:"£",KES:"KSh",KZT:"лв",KPW:"₩",KRW:"₩",KGS:"лв",LAK:"₭",LVL:"Ls",LBP:"£",LRD:"$",LTL:"Lt",MKD:"ден",MYR:"RM",MUR:"₨",MXN:"$",MNT:"₮",MZN:"MT",NAD:"$",NPR:"₨",ANG:"ƒ",NZD:"$",NIO:"C$",NGN:"₦",NOK:"kr",OMR:"﷼",PKR:"₨",PAB:"B/.",PYG:"Gs",PEN:"S/.",PHP:"₱",PLN:"zł",QAR:"﷼",RON:"lei",RUB:"₽",SHP:"£",SAR:"﷼",RSD:"Дин.",SCR:"₨",SGD:"$",SBD:"$",SOS:"S",ZAR:"R",LKR:"₨",SEK:"kr",CHF:"Fr.",SRD:"$",SYP:"£",TZS:"TSh",TWD:"NT$",THB:"฿",TTD:"TT$",TRY:"",TRL:"₤",TVD:"$",UGX:"USh",UAH:"₴",GBP:"£",USD:"$",UYU:"$U",UZS:"лв",VEF:"Bs",VND:"₫",YER:"﷼",ZWD:"Z$"}),angular.module("stats").service("LoadingIndicator",[function(){this.loadingStack=new Array,this.isLoading=function(){return this.loadingStack.length>0},this.startedLoading=function(){this.loadingStack.push(!0)},this.finishedLoading=function(){this.loadingStack.pop()}}]),angular.module("stats").controller("MainCtrl",["$scope","$localStorage","$loading","ScriptFodder","$rootScope",function(t,e,r,a,n){t.$storage=e,t.performCheck=function(){r.start("checkApiKey"),t.checkResult={},a.initialize().then(function(){r.finish("checkApiKey"),t.checkResult={status:"success"}},function(e){r.finish("checkApiKey"),t.checkResult={status:"error",error:e}})},t.$storage.apiKey&&t.performCheck()}]),angular.module("stats").run(["$templateCache",function(t){t.put("app/about/about.html",'<div class="row content"><div class="col-md-6 col-md-offset-3 text-center"><h1>StatFodder</h1><p>Created by Kamshak. Free and open-source.</p></div></div>'),t.put("app/main/main.html",'<div class="container"><div class="row content"><div class="col-md-6 col-md-offset-3 text-center"><h1>Welcome to StatFodder</h1><p>This site can be used by scriptfodder developers to get an overview of their sales statistics. To get started enter your API key below. The site runs on javascript, your key is only saved locally and never transmitted to a server.</p><p>You can set a currency that some amounts will be converted into.</p><div class="panel panel-primary"><div class="panel-heading"><h4 class="panel-title">API Settings</h4></div><div class="panel-body" dw-loading="checkApiKey"><div ng-show="checkResult.status" class="col-md-12" style="margin-top: 15px"><div class="alert alert-success" role="alert" ng-show="checkResult.status == \'success\'"><strong>Success</strong> The api key entered is valid. You can now access the Statistics tab.</div><div class="alert alert-danger" role="alert" ng-show="checkResult.status == \'error\'"><strong>Error</strong> The api key was not valid or the SF API is down.</div></div><div class="col-md-12"><form class="form-horizontal"><div class="form-group"><label for="apiKey">API Key</label> <input type="text" class="form-control" id="apiKey" placeholder="" ng-model="$storage.apiKey"> <button type="submit" class="btn btn-default" ng-click="performCheck()" style="margin-top: 5px">Check</button></div><div class="form-group"><label for="currency">Currency</label><select id="currency" class="form-control" ng-model="$storage.globalCurrency"><option>GBP</option><option>EUR</option><option>USD</option></select></div></form></div></div></div></div></div></div>'),t.put("app/services/alternative-currency.html",'<span><span>{{amount | currency}}</span> <span ng-hide="hideConverted">| <span ng-show="isLoading"><i class="fa fa-spinner fa-pulse"></i>loading...</span> <abbr tooltip="Exchange rate {{rate}} from {{rateFrom | amCalendar}}" tooltip-placement="bottom" ng-show="!isLoading">{{scope.isError && "error"}}{{convertedAmount | currency:currencySymbol}}</abbr></span></span>'),t.put("app/statistics/alltime.html",'<h1>All-time Script Statistics</h1><div class="row"><div class="col-md-12"><div class="panel panel-default"><div class="panel-heading">Total Revenue</div><div class="panel-body"><p><strong>Scripts Sold</strong>: {{performance.overall.total.amountSold}}</p><p><strong>Revenue</strong>:<alternative-currency to-currency="$storage.globalCurrency" base-currency="\'USD\'" amount="performance.overall.total.revenue"></alternative-currency></p><div class="row"><div class="col-md-12"><nvd3 options="salesGraphOptions" data="performance.scripts"></nvd3></div></div></div></div></div></div><div class="row"><div class="col-md-4"><sales-record interval="performance.records.day" interval-name="Day" date-format="dddd, MMMM Do YYYY" global-currency="$storage.globalCurrency"></sales-record></div><div class="col-md-4"><sales-record interval="performance.records.week" interval-name="Week" date-format="[Week] W of YYYY (MMMM Do YYYY [+ 7 Days])" global-currency="$storage.globalCurrency"></sales-record></div><div class="col-md-4"><sales-record interval="performance.records.month" interval-name="Month" date-format="MMMM YYYY" global-currency="$storage.globalCurrency"></sales-record></div></div>'),t.put("app/statistics/alltime_sales-record.html",'<div class="panel panel-default"><div class="panel-heading"><h4>Best {{intervalName}}</h4><h6>{{ interval.time | amDateFormat:dateFormat }}</h6></div><div class="panel-body"><p><strong>Revenue</strong>:<alternative-currency to-currency="globalCurrency" date="interval.time" base-currency="\'USD\'" amount="interval.revenue"></alternative-currency></p><p><strong>Scripts Sold</strong>: {{ interval.scriptsSold }}</p></div></div>'),t.put("app/statistics/dashboard.html",'<h1>Dashboard</h1><div class="row"><div class="col-md-6"><div class="panel panel-default"><div class="panel-heading">This Month</div><div class="panel-body"><p><strong>Scripts Sold</strong>: {{performance.thisMonth.total.amountSold}}</p><p><strong>Revenue</strong>:<alternative-currency to-currency="$storage.globalCurrency" base-currency="\'USD\'" amount="performance.thisMonth.total.revenue"></alternative-currency></p><div class="row"><div class="col-md-12"><nvd3 options="salesGraphOptions" data="performance.thisMonth.scripts"></nvd3></div></div></div></div></div><div class="col-md-6"><div class="panel panel-default"><div class="panel-heading">Last Month</div><div class="panel-body"><p><strong>Scripts Sold</strong>: {{performance.lastMonth.total.amountSold}}</p><p><strong>Revenue</strong>:<alternative-currency to-currency="$storage.globalCurrency" date="performance.lastMonth.date" base-currency="\'USD\'" amount="performance.lastMonth.total.revenue"></alternative-currency></p><div class="row"><div class="col-md-12"><nvd3 options="salesGraphOptions" data="performance.lastMonth.scripts"></nvd3></div></div></div></div></div></div>'),t.put("app/statistics/loading.html",'<h1><i class="fa fa-spinner fa-spin fa-fw"></i> Loading Script Information</h1><div class="row text-center"><div class="col-md-12"><small>Loading <em>{{currentScript.name || "Script List"}}</em></small><progressbar max="1" class="progress-striped active" value="progress" type="info"><b>{{progress | percentage:0}}</b></progressbar></div></div>'),t.put("app/statistics/monthly.html",'<div class="row"><div class="col-md-12"><h1>Sales Distribution</h1><h2>By Revenue</h2><nvd3 options="revenueChart" data="revenue"></nvd3><h2>By number of purchases</h2><nvd3 options="numPurchasesChart" data="numPurchases"></nvd3></div></div>'),t.put("app/statistics/revenue.html",'<h1>Daily Statistics</h1><h2>Scripts</h2><div class="btn-group"><label ng-repeat="script in scripts" class="btn btn-primary" ng-model="checkModel[$index]" btn-checkbox="">{{script.name}}</label></div><h2>Timespan</h2><input date-range-picker="" class="form-control date-picker" type="text" min="minDate" max="maxDate" ng-model="dateRange"><div id="revenue"></div><div id="number"></div><div class="legend"></div>'),t.put("app/statistics/statistics.html",'<div class="col-md-3" role="complementary"><nav class="bs-docs-sidebar hidden-print hidden-xs hidden-sm"><ul class="nav bs-docs-sidenav"><li ui-sref-active="active"><a ui-sref="statistics.dashboard">Dashboard</a></li><li ui-sref-active="active"><a ui-sref="statistics.revenue">Daily Revenue Analyzer</a></li><li ui-sref-active="active"><a ui-sref="statistics.monthly">Sales Distribution / Monthly stats</a></li><li ui-sref-active="active"><a ui-sref="statistics.alltime">All Time Stats / Records</a></li></ul></nav></div><div class="col-md-9" ui-view=""></div>'),t.put("app/components/navbar/navbar.html",'<nav class="navbar navbar-static-top navbar-default" ng-controller="NavbarCtrl"><div class="container"><div class="navbar-header"><a class="navbar-brand" href="https://kamshak.github.io/scriptfodder-stats/"><span class="fa fa-line-chart"></span> StatFodder</a><div class="navbar-brand has-spinner" ng-show="loadingIndicator.isLoading()"><i class="spinner fa fa-spinner fa-1x fa-spin"></i></div></div><div class="collapse navbar-collapse" id="bs-example-navbar-collapse-6"><ul class="nav navbar-nav"><li ui-sref-active="active"><a ui-sref="home">Home</a></li><li ui-sref-active="active" ng-show="ScriptFodder.isReady()"><a ui-sref="statistics">Statistics</a></li><li ui-sref-active="active"><a ui-sref="about">About</a></li></ul><ul class="nav navbar-nav navbar-right"><li><a href="https://github.com/Kamshak/scriptfodder-stats"><span class="fa fa-github"></span> scriptfodder-stats</a></li></ul></div></div></nav>')}]);