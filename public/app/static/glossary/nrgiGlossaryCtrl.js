'use strict';

angular.module('app')
    .controller('nrgiGlossaryCtrl', function (
        $scope,
        nrgiGlossaryPageContentSrvc
    ) {
        nrgiGlossaryPageContentSrvc.get(function (success) {
            $scope.content = success;
        }, function(error) {     });
    });