angular.module('app')
    .controller('nrgiConcessionAdminCtrl', function($scope, nrgiConcessionsSrvc) {
        nrgiConcessionsSrvc.query({skip: 0, limit: 0}, function (response) {
            $scope.concessions = response.data;
        })
    });