'use strict';

angular.module('app')
    .controller('nrgiCompaniesCtrl', function (
        $scope,
        nrgiAuthSrvc,
        nrgiIdentitySrvc
    ) {
        $scope.headers = ['Project', 'Country', 'Commodity Types', 'No.Companies'];
        $scope.columnSort = { sortColumn: 'Project', reverse: false };
        $scope.limit = 50;
        $scope.count = 50;
        $scope.page = 0;
        $scope.companies = [
            {id:'e78a24ef78c0b90a',name:'BP',group:'BP',id_group:'BP',numberProject:'1'},
            {id:'e78a24ef78c0b90a',name:'BP',group:'BP',id_group:'BP',numberProject:'1'},
            {id:'e78a24ef78c0b90a',name:'BP',group:'BP',id_group:'BP',numberProject:'1'},
            {id:'e78a24ef78c0b90a',name:'BP',group:'BP',id_group:'BP',numberProject:'1'},
            {id:'e78a24ef78c0b90a',name:'BP',group:'BP',id_group:'BP',numberProject:'1'},
            {id:'e78a24ef78c0b90a',name:'BP',group:'BP',id_group:'BP',numberProject:'1'},
            {id:'e78a24ef78c0b90a',name:'BP',group:'BP',id_group:'BP',numberProject:'1'},
            {id:'e78a24ef78c0b90a',name:'BP',group:'BP',id_group:'BP',numberProject:'1'},
            {id:'e78a24ef78c0b90a',name:'BP',group:'BP',id_group:'BP',numberProject:'1'},
            {id:'e78a24ef78c0b90a',name:'BP',group:'BP',id_group:'BP',numberProject:'1'},
            {id:'e78a24ef78c0b90a',name:'BP',group:'BP',id_group:'BP',numberProject:'1'},
            {id:'e78a24ef78c0b90a',name:'BP',group:'BP',id_group:'BP',numberProject:'1'},
            {id:'e78a24ef78c0b90a',name:'BP',group:'BP',id_group:'BP',numberProject:'1'},
            {id:'e78a24ef78c0b90a',name:'BP',group:'BP',id_group:'BP',numberProject:'1'},
            {id:'e78a24ef78c0b90a',name:'BP',group:'BP',id_group:'BP',numberProject:'1'},
            {id:'e78a24ef78c0b90a',name:'BP',group:'BP',id_group:'BP',numberProject:'1'},
            {id:'e78a24ef78c0b90a',name:'BP',group:'BP',id_group:'BP',numberProject:'1'},
            {id:'e78a24ef78c0b90a',name:'BP',group:'BP',id_group:'BP',numberProject:'1'},
            {id:'e78a24ef78c0b90a',name:'BP',group:'BP',id_group:'BP',numberProject:'1'},
            {id:'e78a24ef78c0b90a',name:'BP',group:'BP',id_group:'BP',numberProject:'1'},
            {id:'e78a24ef78c0b90a',name:'BP',group:'BP',id_group:'BP',numberProject:'1'},
            {id:'e78a24ef78c0b90a',name:'BP',group:'BP',id_group:'BP',numberProject:'1'},
            {id:'e78a24ef78c0b90a',name:'BP',group:'BP',id_group:'BP',numberProject:'1'},
            {id:'e78a24ef78c0b90a',name:'BP',group:'BP',id_group:'BP',numberProject:'1'},
            {id:'e78a24ef78c0b90a',name:'BP',group:'BP',id_group:'BP',numberProject:'1'},
            {id:'e78a24ef78c0b90a',name:'BP',group:'BP',id_group:'BP',numberProject:'1'},
            {id:'e78a24ef78c0b90a',name:'BP',group:'BP',id_group:'BP',numberProject:'1'},
            {id:'e78a24ef78c0b90a',name:'BP',group:'BP',id_group:'BP',numberProject:'1'},
            {id:'e78a24ef78c0b90a',name:'BP',group:'BP',id_group:'BP',numberProject:'1'},
            {id:'e78a24ef78c0b90a',name:'BP',group:'BP',id_group:'BP',numberProject:'1'},
            {id:'e78a24ef78c0b90a',name:'BP',group:'BP',id_group:'BP',numberProject:'1'},
            {id:'e78a24ef78c0b90a',name:'BP',group:'BP',id_group:'BP',numberProject:'1'},
            {id:'e78a24ef78c0b90a',name:'BP',group:'BP',id_group:'BP',numberProject:'1'},
            {id:'e78a24ef78c0b90a',name:'BP',group:'BP',id_group:'BP',numberProject:'1'},
            {id:'e78a24ef78c0b90a',name:'BP',group:'BP',id_group:'BP',numberProject:'1'},
            {id:'e78a24ef78c0b90a',name:'BP',group:'BP',id_group:'BP',numberProject:'1'},
            {id:'e78a24ef78c0b90a',name:'BP',group:'BP',id_group:'BP',numberProject:'1'},
            {id:'e78a24ef78c0b90a',name:'BP',group:'BP',id_group:'BP',numberProject:'1'},
            {id:'e78a24ef78c0b90a',name:'BP',group:'BP',id_group:'BP',numberProject:'1'},
            {id:'e78a24ef78c0b90a',name:'BP',group:'BP',id_group:'BP',numberProject:'1'},
            {id:'e78a24ef78c0b90a',name:'BP',group:'BP',id_group:'BP',numberProject:'1'},
            {id:'e78a24ef78c0b90a',name:'BP',group:'BP',id_group:'BP',numberProject:'1'},
            {id:'e78a24ef78c0b90a',name:'BP',group:'BP',id_group:'BP',numberProject:'1'},
            {id:'e78a24ef78c0b90a',name:'BP',group:'BP',id_group:'BP',numberProject:'1'},
            {id:'e78a24ef78c0b90a',name:'BP',group:'BP',id_group:'BP',numberProject:'1'},
            {id:'e78a24ef78c0b90a',name:'BP',group:'BP',id_group:'BP',numberProject:'1'},
            {id:'e78a24ef78c0b90a',name:'BP',group:'BP',id_group:'BP',numberProject:'1'},
            {id:'e78a24ef78c0b90a',name:'BP',group:'BP',id_group:'BP',numberProject:'1'},
            {id:'e78a24ef78c0b90a',name:'BP',group:'BP',id_group:'BP',numberProject:'1'},
            {id:'e78a24ef78c0b90a',name:'BP',group:'BP',id_group:'BP',numberProject:'1'},
            {id:'e78a24ef78c0b90a',name:'BP',group:'BP',id_group:'BP',numberProject:'1'},
            {id:'e78a24ef78c0b90a',name:'Aa Mine Holding',group:'',id_group:'',numberProject:'1'}
        ];
        $scope.select = function(limit){
            $scope.page = 0;
            if($scope.companies.length<limit){
                $scope.count=$scope.companies.length;
            }else{
                $scope.count=limit;
            }
        };
        $scope.next = function(page,count){
            count = parseInt(count);
            $scope.page = count;
            var limit = parseInt($scope.limit);
            count = count + limit;
            if(count>$scope.companies.length){
                $scope.count = $scope.companies.length;
            }else{
                $scope.count = count;
            }

        };
        $scope.prev = function(page,count){
            count = parseInt(count);
            page = parseInt(page);
            var limit = parseInt($scope.limit);
            page = page-limit;
            if(page<limit){
                $scope.page = 0;
                $scope.count = limit;
            }else{
                $scope.page = page;
                if(count-page>limit){
                    $scope.count = count - ((count-page)-limit);
                }else if(count>$scope.companies.length){
                    $scope.count = $scope.companies.length;
                }
                else{
                    $scope.count = count-limit;
                }

            }


        }
    });

