'use strict';

/**
 * @ngdoc function
 * @name dreApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the dreApp
 */
angular.module('dreApp')
  .controller('MainCtrl', ['$scope', '$q', 'DashboardService', '$modal', '$location', '$rootScope', 'ngDialog', function ($scope, $q, DashboardService, $modal, $location, $rootScope, ngDialog) {

    $scope.searchTerm;

    $rootScope.$on("$routeChangeSuccess", function(){
      window.scrollTo(0,0);
    });

    $scope.initDashboard = function() {
      var params = $location.search();

      if(params.q) {
        $scope.getResults(params.q);
        $scope.searchTerm = params.q;
      }
      else
        $scope.setDashboard();

      $scope.showFilter = true;
      $scope.noResults = false;
    };

    $scope.search = function(keyword) {
      $location.search({'q': keyword});
    }

    $scope.getResults = function(keyword) {
      $scope.showFilter = true;
      $location.search({'q': keyword});
      //var countPromise = DashboardService.getSymptomCount(keyword);

      DashboardService.postSearchTerm(keyword);

      DashboardService.getSymptomCount(keyword).then(function (data) {
        if(data > 0)
          $scope.setDashboard(keyword);
        else
          $scope.noResults = true;

      }, function (error) {
        console.log(error);
      });

      $scope.searchTerm = keyword;
      $scope.definitions = [];
    };

    $scope.openConfirm = function (reaction, symptomIndex) {
      $scope.selectedDefinition = reaction;
      $scope.updateSymptomIndex = symptomIndex;
      ngDialog.openConfirm({
        template: 'definitionModalDialog',
        controller: 'DefinitionModalCtrl',
        scope: $scope
      }).then(function (newDefinition) {
        DashboardService.postNewDefinition($scope.selectedDefinition, newDefinition).then(function(data) {
          console.log(data);
          $scope.definitions[$scope.updateSymptomIndex] = data;
        }, function(error) {
          console.log(error);
        });
      }, function (reason) {
        //console.log('Modal promise rejected. Reason: ', reason);
      });
   };

    $scope.showErrorModal = function(error) {

      var modalInstance = $modal.open({
        animation: true,
        backdrop: 'static',
        keyboard: false,
        templateUrl: 'myModalContent.html',
        controller: 'ModalInstanceCtrl'
      });
    };

    $scope.vote = function(keyword, vote, definitionIndex, symptomIndex) {
      $scope.definitionIndex = definitionIndex;
      $scope.symptomIndex = symptomIndex;
      DashboardService.putDefinitionVote(keyword, vote, definitionIndex).then(function(data) {
        $scope.definitions[$scope.symptomIndex][$scope.definitionIndex] = data[$scope.definitionIndex];
      }, function(error) {
        console.log(error);
      });
    };

    $scope.setDashboard = function(keyword) {

      $scope.noResults = false;

      loadSymptoms(keyword)
        .then(parallelLoad);

      DashboardService.getSymptoms(keyword).then(function (symptoms) {

        $scope.allSymptoms = symptoms;
        _.forEach(symptoms, function(symptom) {
          return DashboardService.getSymptomDefinitions(symptom.term);
        });

      }, errorHandler).then(function(definition) {
        $scope.definition = definition;
      });

      DashboardService.getManufacturers(keyword).then(function (manufacturers){
        $scope.allManufacturers = manufacturers;
        var manufacturerNames = [], manufacturerCounts = [];
        _.forEach($scope.allManufacturers, function (manufacturer) {
          manufacturerNames.push(manufacturer.term);
          manufacturerCounts.push(manufacturer.count);
        });
        $scope.manufacturerCounts = _.take(manufacturerCounts, 7);
        $scope.manufacturerNames = _.take(manufacturerNames, 7);
      }, errorHandler);

      DashboardService.getBrands(keyword).then(function (brands){
        $scope.allBrands = brands;
      }, errorHandler);

      DashboardService.getSeverity(keyword).then(function (severity){
        $scope.allSeverityCount = severity;
      }, errorHandler);

      DashboardService.getGenders(keyword).then(function (genders) {
        $scope.allGenderCount = genders;
      }, errorHandler);

      setTimeout(function() {
        DashboardService.getCountries(keyword).then(function (countries) {
        $scope.allCountries = countries;
      }, errorHandler);
    }, 1000);

      DashboardService.getEvents(keyword).then(function (events) {
        $scope.allEvents = events;
        var eventDates = [], eventCounts = [];
        _.forEach($scope.allEvents, function (event) {
          eventDates.push(parseDate(event.time));
          eventCounts.push(event.count);
        });
        eventCounts = _.drop(eventCounts, eventCounts.length - 25);
        eventDates = _.drop(eventDates, eventDates.length - 25);
        $scope.eventCounts = [eventCounts];
        $scope.eventDates = eventDates;
      }, errorHandler);
    }

    function parseDate(str) {
      var y = str.substr(0,4),
          m = str.substr(4,2) - 1,
          d = str.substr(6,2);
      var D = new Date(y,m,d);
      return (D.getFullYear() == y && D.getMonth() == m && D.getDate() == d) ? m.toString() + '/' + d + '/' + y : 'invalid date';
    }

    var loadSymptoms = function(drugKeyword) {
      return DashboardService.getSymptoms(drugKeyword);
    },
    parallelLoad = function(symptoms) {

      var allDefs = [];
      var allDefsPost = [];
      var allDefsGetAgain = [];

      // Call reaction lookup service to get reaction definitions
      _.forEach(symptoms, function(symptom, idx) {
        var defCall = DashboardService.getSymptomDefinitions(symptom.term);
        allDefs.push(defCall);
      });


      $q.all(allDefs).then(

        function (data) {

          _.forEach(data, function(definition, idx) {
            if(definition.length === undefined)
              this[idx] = [];
          }, data);

          $scope.definitions = data;

        }, function(error) {
          if(error.status == 404) {
          // If any of GET reactions throws an error, go thru and POST this list to fill in the defintions
          _.forEach(symptoms, function(symptom, idx) {
            var defCall = DashboardService.postSymptomDefinitions(symptom.term);
            allDefsPost.push(defCall);
          });

          $q.all(allDefsPost).finally(function (data) {

            _.forEach(symptoms, function(symptom, idx) {
              var defCall = DashboardService.getSymptomDefinitions(symptom.term);
              allDefsGetAgain.push(defCall);
            });

            // Re-call the GET reactions endpoint to update the definitions
            // TODO : This should be updated at some point to not be so heavy handed in GETTING, POSTING and then GETTING again
            $q.all(allDefsGetAgain).then(function (data) {
              $scope.definitions = data;
            });

          });
        } else {
          //alert('Non 404 error');
        }
        });

      return;

    },
    errorHandler = function(error) {
      console.log(error);
      if (error.status == 404){
        console.log('404 Error');
      } else if (error.status == 429) {
        $scope.showErrorModal(error);
      } else {
        console.log(error.status)
      }
    };

  }]);
