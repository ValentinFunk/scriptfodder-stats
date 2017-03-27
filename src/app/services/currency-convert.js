angular
  .module('ksCurrencyConvert', [])
  .factory('ExchangeRate', function($http) {
    var ExchangeRate = {};

    var supportedCurrencies = [
      'AUD',
      'BGN',
      'BRL',
      'CAD',
      'CHF',
      'CNY',
      'CZK',
      'DKK',
      'GBP',
      'HKD',
      'HRK',
      'HUF',
      'IDR',
      'ILS',
      'INR',
      'JPY',
      'KRW',
      'MXN',
      'MYR',
      'NOK',
      'NZD',
      'PHP',
      'PLN',
      'RON',
      'RUB',
      'SEK',
      'SGD',
      'THB',
      'TRY',
      'USD',
      'ZAR',
    ];

    ExchangeRate.getSupportedCurrencies = function() {
      return supportedCurrencies;
    };

    ExchangeRate.isCurrencySupported = function(currencyCode) {
      return _.findKey(supportedCurrencies, currencyCode) !== -1;
    };

    ExchangeRate.getExchangeRate = function(
      baseCurrency,
      toCurrency,
      date,
      $q
    ) {
      if (!this.isCurrencySupported(baseCurrency)) {
        throw new Error('Invalid base currency');
      }

      if (!this.isCurrencySupported(toCurrency)) {
        throw new Error('Invalid toCurrency');
      }

      var multiRequest = angular.isArray(toCurrency);
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
        },
      }).then(function(response) {
        if (response.status != 200) {
          return $q.reject(['Error fetching data ', response]);
        }

        if (multiRequest) {
          return response.data;
        }

        return {
          rate: response.data.rates[toCurrency],
          date: response.data.date,
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
        amount: '=',
      },
      controller: function($scope) {
        $scope.currencySymbol = currencySymbolMap[$scope.toCurrency];
        $scope.isLoading = true;

        $scope.hideConverted = $scope.hideConverted ||
          $scope.baseCurrency == $scope.toCurrency;
        ExchangeRate.getExchangeRate(
          $scope.baseCurrency,
          $scope.toCurrency,
          $scope.date
        )
          .then(function(data) {
            $scope.rate = data.rate;
            $scope.convertedAmount = $scope.amount * data.rate;
            $scope.rateFrom = data.date;
          })
          .catch(function(error) {
            $scope.isError = true;
          })
          .finally(function() {
            $scope.isLoading = false;
          });
      },
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
    ALL: 'L',
    AFN: '؋',
    ARS: '$',
    AWG: 'ƒ',
    AUD: '$',
    AZN: '₼',
    BSD: '$',
    BBD: '$',
    BYR: 'p.',
    BZD: 'BZ$',
    BMD: '$',
    BOB: 'Bs.',
    BAM: 'KM',
    BWP: 'P',
    BGN: 'лв',
    BRL: 'R$',
    BND: '$',
    KHR: '៛',
    CAD: '$',
    KYD: '$',
    CLP: '$',
    CNY: '¥',
    COP: '$',
    CRC: '₡',
    HRK: 'kn',
    CUP: '₱',
    CZK: 'Kč',
    DKK: 'kr',
    DOP: 'RD$',
    XCD: '$',
    EGP: '£',
    SVC: '$',
    EEK: 'kr',
    EUR: '€',
    FKP: '£',
    FJD: '$',
    GHC: '¢',
    GIP: '£',
    GTQ: 'Q',
    GGP: '£',
    GYD: '$',
    HNL: 'L',
    HKD: '$',
    HUF: 'Ft',
    ISK: 'kr',
    INR: '₹',
    IDR: 'Rp',
    IRR: '﷼',
    IMP: '£',
    ILS: '₪',
    JMD: 'J$',
    JPY: '¥',
    JEP: '£',
    KES: 'KSh',
    KZT: 'лв',
    KPW: '₩',
    KRW: '₩',
    KGS: 'лв',
    LAK: '₭',
    LVL: 'Ls',
    LBP: '£',
    LRD: '$',
    LTL: 'Lt',
    MKD: 'ден',
    MYR: 'RM',
    MUR: '₨',
    MXN: '$',
    MNT: '₮',
    MZN: 'MT',
    NAD: '$',
    NPR: '₨',
    ANG: 'ƒ',
    NZD: '$',
    NIO: 'C$',
    NGN: '₦',
    NOK: 'kr',
    OMR: '﷼',
    PKR: '₨',
    PAB: 'B/.',
    PYG: 'Gs',
    PEN: 'S/.',
    PHP: '₱',
    PLN: 'zł',
    QAR: '﷼',
    RON: 'lei',
    RUB: '₽',
    SHP: '£',
    SAR: '﷼',
    RSD: 'Дин.',
    SCR: '₨',
    SGD: '$',
    SBD: '$',
    SOS: 'S',
    ZAR: 'R',
    LKR: '₨',
    SEK: 'kr',
    CHF: 'Fr.',
    SRD: '$',
    SYP: '£',
    TZS: 'TSh',
    TWD: 'NT$',
    THB: '฿',
    TTD: 'TT$',
    TRY: '',
    TRL: '₤',
    TVD: '$',
    UGX: 'USh',
    UAH: '₴',
    GBP: '£',
    USD: '$',
    UYU: '$U',
    UZS: 'лв',
    VEF: 'Bs',
    VND: '₫',
    YER: '﷼',
    ZWD: 'Z$',
  });
