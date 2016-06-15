'use strict';
angular
    .module('app')
    .controller('nrgiLastAddedCtrl', function ($scope, nrgiLastAddedSrvc) {
        nrgiLastAddedSrvc.get(function (success) {
            $scope.projects = success.projects;
            $scope.sources = success.sources;
        }, function(error) {
        });
    });
