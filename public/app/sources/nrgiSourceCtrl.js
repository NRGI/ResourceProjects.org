'use strict';

angular.module('app')
    .controller('nrgiSourceCtrl', function (
        $scope,
        nrgiAuthSrvc,
        nrgiIdentitySrvc,
        nrgiSourcesSrvc,
        $routeParams
    ) {
        nrgiSourcesSrvc.getSourceByID($routeParams.id).then(function(response) {
            $scope.source=response.data;
            $scope.created=response.created;
        });
    });


