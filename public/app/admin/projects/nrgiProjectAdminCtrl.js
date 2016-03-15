angular.module('app')
    .controller('nrgiProjectAdminCtrl', function($scope, nrgiProjectsSrvc) {
        nrgiProjectsSrvc.query({skip: 0, limit: 0}, function (response) {
            $scope.projects = response.data;
        })
    });