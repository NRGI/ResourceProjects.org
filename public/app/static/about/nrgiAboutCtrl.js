'use strict';

angular.module('app')
    .controller('nrgiAboutCtrl', function (
        $scope,
        nrgiAboutPageContentSrvc
    ) {
        nrgiAboutPageContentSrvc.get(function (success) {
            $scope.content = success;
        }, function(error) {     });
    });