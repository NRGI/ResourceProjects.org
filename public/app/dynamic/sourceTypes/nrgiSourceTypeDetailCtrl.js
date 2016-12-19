'use strict';

angular.module('app')
    .controller('nrgiSourceTypeDetailCtrl', function (
        $scope,
        nrgiSourceTypesSrvc,
        $routeParams
    ) {
        nrgiSourceTypesSrvc.get({_id: $routeParams.id}, function (success) {
            $scope.source_type = success.sourceTypes;
        });
    });