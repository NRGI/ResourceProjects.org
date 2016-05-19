'use strict';

angular.module('app')
    .controller('nrgiCommodityListCtrl', function (
        $scope,
        nrgiNotifier,
        nrgiCommoditiesSrvc
    ) {
        var limit = 100,
            page = 0;

        $scope.count =0;
        $scope.show_count=0;

        nrgiCommoditiesSrvc.query({skip: page, limit: limit, record_type: $scope.record_type}, function (response) {
            $scope.count = response.count;
            page = page + 1;
            $scope.commodities = response.data;
            // $scope.show_count = response.data.length+$scope.page;
            // console.log($scope.commodities[0]);
        });

        $scope.loadMore = function() {

            nrgiCommoditiesSrvc.query({skip: page, limit: limit, record_type: $scope.record_type}, function (response) {
                $scope.count = response.count;
                page = page + 1;
                response.data.forEach(function (commodity) {
                    $scope.commodities.push(commodity);
                });
                // $scope.commodities.push(response.data);
                // $scope.show_count = response.data.length+$scope.page;
                // console.log($scope.commodities[0]);
            });
        };
        // var totalPages, ITEMS_PER_PAGE = 100, currentPage = 0;
        // $scope.commodities = [];
        //
        // $scope.loadCommodities = function() {
        //     if(currentPage < totalPages) {
        //         nrgiCommoditiesSrvc.query({skip: currentPage, limit: ITEMS_PER_PAGE, record_type: $scope.record_type}, function(commoditiesResponse) {
        //             if(commoditiesResponse.data.error) {
        //                 nrgiNotifier.error(commoditiesResponse.data.error.message);
        //             } else {
        //                 commoditiesResponse.data.forEach(function(commodity) {
        //                     $scope.commodities.push(commodity);
        //                 });
        //             }
        //         });
        //         // nrgiCommoditiesSrvc.query({skip: page, limit: limit, record_type: $scope.record_type}).then(function (logsResponse) {
        //         //     if(logsResponse.data.error) {
        //         //         rgiNotifier.error(logsResponse.data.error.message);
        //         //     } else {
        //         //         logsResponse.data.logs.forEach(function(log) {
        //         //             $scope.logs.push(log);
        //         //         });
        //         //     }
        //         // }, function(response) {
        //         //     rgiNotifier.error(rgiHttpResponseProcessorSrvc.getMessage(response, 'Auth logs loading failure'));
        //         //     rgiHttpResponseProcessorSrvc.handle(response);
        //         // });
        //     }
        // };
        // var stopWatch = $scope.$watchCollection('user', function(user) {
        //     if((user === undefined) || (user._id === undefined)) {
        //         return;
        //     }
        //
        //     userId = user._id;
        //     stopWatch();
        //
        //     rgiAuthLogsSrvc.getTotalNumber(userId).then(function (logsNumberResponse) {
        //         if(logsNumberResponse.data.error) {
        //             rgiNotifier.error(logsNumberResponse.data.error.message);
        //         } else {
        //             totalPages = Math.ceil(logsNumberResponse.data.number / ITEMS_PER_PAGE);
        //             $scope.loadLogs();
        //         }
        //     }, function(response) {
        //         rgiNotifier.error(rgiHttpResponseProcessorSrvc.getMessage(response, 'Auth logs loading failure'));
        //         rgiHttpResponseProcessorSrvc.handle(response);
        //     });
        // });

        // var loadCommodities = function(limit,page){
        //     nrgiCommoditiesSrvc.query({skip: page, limit: limit,record_type:$scope.record_type}, function (response) {
        //         $scope.count = response.count;
        //         $scope.limit = limit;
        //         $scope.page = page;
        //         $scope.commodities=response.data;
        //         $scope.show_count = response.data.length+$scope.page;
        //         console.log($scope.commodities[0]);
        //     });
        // };
        // loadCommodities($scope.limit,$scope.page);

        //
        // $scope.select = function(changeLimit){
        //     loadCommodities(changeLimit,0);
        // };
        // $scope.next = function(page,count){
        //     loadCommodities($scope.limit,count);
        // };
        // $scope.prev = function(page){
        //     loadCommodities($scope.limit,page-$scope.limit);
        // };
        // $scope.first = function(){
        //     loadCommodities($scope.limit,0);
        // };
        // $scope.last = function(page){
        //     if($scope.count%$scope.limit!=0){
        //         page =  parseInt($scope.count/$scope.limit)*$scope.limit;
        //         loadCommodities($scope.limit,page);
        //     }else {
        //         loadCommodities($scope.limit,page-$scope.limit);
        //     }
        // };
    });

