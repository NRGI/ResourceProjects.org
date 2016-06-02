'use strict';

angular.module('app')
    .controller('nrgiMapSiteCtrl', function (
        $scope,
        nrgiSitesSrvc,
        $location
    ) {
        $scope.field = false;
        if($location.path()=='/sites/map'){$scope.field =false;$scope.record_type = 'sites';$scope.header = 'Site';
        } else{ $scope.field =true; $scope.record_type = 'fields'; $scope.header = 'Field';
        }
        nrgiSitesSrvc.get({map:'map',field: $scope.field}, function (success) {
            $scope.siteMarkers = success.data;
        });
    });