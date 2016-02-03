'use strict';

angular.module('app')
    .controller('nrgiSourcesCtrl', function (
        $scope,
        nrgiAuthSrvc,
        nrgiIdentitySrvc,
        nrgiSourcesSrvc
    ) {
        nrgiSourcesSrvc.getAllSources().then(function(response) {
            $scope.sources = response;
        });
    });

