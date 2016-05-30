//'use strict';
//
//angular.module('app')
//    .controller('nrgiSourceTypeListCtrl', function (
//        $scope,
//        nrgiAuthSrvc,
//        nrgiIdentitySrvc,
//        nrgiSourceTypesSrvc
//    ) {
//        $scope.limit = 50;
//        $scope.display = true;
//        $scope.page = 0;
//        $scope.count =0;
//        $scope.show_count=0;
//        var loadSources = function(limit,page){
//            nrgiSourceTypesSrvc.query({skip: page, limit: limit,display: true}, function (response) {
//                $scope.count = response.count;
//                $scope.limit = limit;
//                $scope.page = page;
//                $scope.sourceTypes=response.data;
//                $scope.show_count = response.data.length+$scope.page;
//            });
//        };
//        loadSources($scope.limit,$scope.page);
//        $scope.select = function(changeLimit){
//            loadSources(changeLimit,0);
//        };
//        $scope.next = function(page,count){
//            loadSources($scope.limit,count);
//        };
//        $scope.prev = function(page){
//            loadSources($scope.limit,page-$scope.limit);
//        };
//        $scope.first = function(){
//            loadSources($scope.limit,0);
//        };
//        $scope.last = function(page){
//            if($scope.count%$scope.limit!=0){
//                page =  parseInt($scope.count/$scope.limit)*$scope.limit;
//                loadSources($scope.limit,page);
//            }else {
//                loadSources($scope.limit,page-$scope.limit);
//            }
//        }
//    });
//


'use strict';

angular.module('app')
    .controller('nrgiSourceTypeListCtrl', function (
        $scope,
        nrgiAuthSrvc,
        nrgiIdentitySrvc,
        nrgiSourceTypesSrvc,
        $rootScope
    ) {
        var limit = 50,
            currentPage = 0,
            totalPages = 0;

        $scope.count =0;
        $scope.field = false;
        $scope.busy = false;

        nrgiSourceTypesSrvc.query({skip: currentPage*limit, limit: limit, display: true}, function (response) {
            $scope.count = response.count;
            $scope.sourceTypes = response.data;
            totalPages = Math.ceil(response.count / limit);
            currentPage = currentPage + 1;
        });

        $scope.loadMore = function() {
            if ($scope.busy) return;
            $scope.busy = true;
            if(currentPage < totalPages) {
                nrgiSourceTypesSrvc.query({skip: currentPage*limit, limit: limit, display: true}, function (response) {
                    $scope.sourceTypes = _.union($scope.sourceTypes, response.data);
                    currentPage = currentPage + 1;
                    $scope.busy = false;
                });
            }
        };
    });