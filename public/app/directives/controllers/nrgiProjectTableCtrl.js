'use strict';

angular
    .module('app')
    .controller('nrgiProjectTableCtrl', function ($scope, nrgiProjectTablesSrvc, usSpinnerService, nrgiCSV) {

        $scope.projects = [];
        $scope.openClose = true;
        $scope.expression = '';
        $scope.count = 0;
        $scope.busy = true;
        var headerProject = [];
        var fields = [];
        var limit = 50,
            currentPage = 0;
        var headers = [{name: 'Project ID', status: true, field: 'project_id'},
            {name: 'Name', status: true, field: 'proj_name'},
            {name: 'Country', status: $scope.country, field: 'proj_country'},
            {name: 'Commodity Type ', status: $scope.type, field: 'proj_type'},
            {name: 'Commodity ', status: $scope.commodity, field: 'proj_commodity'},
            {name: 'Status ', status: $scope.status, field: 'proj_status'},
            {name: 'Companies ', status: $scope.companies, field: 'companies'}];

        angular.forEach(headers, function (header) {
            if (header.status != false && header.status != undefined) {
                headerProject.push(header.name);
                fields.push(header.field);
            }
        });

        $scope.getHeaderProjects = function () {
            return headerProject
        };

        usSpinnerService.spin('spinner-project');
        $scope.$watch('id', function (value) {
            if ($scope.type == 'country' && value == undefined || $scope.type == 'company' && value == undefined || $scope.type == 'concession' && value == undefined) {
                usSpinnerService.stop('spinner-project');
                $scope.expression = 'showLast';
            }
            if ($scope.type == 'country' && value != undefined || $scope.type == 'company' && value != undefined || $scope.type == 'concession' && value != undefined) {
                $scope.projects = value;
                usSpinnerService.stop('spinner-project');
                if ($scope.projects.length == 0) {
                    $scope.expression = 'showLast';
                } else {
                    $scope.busy = false;
                    limit = 50;
                    currentPage = 1;
                }
            }
            if ($scope.type != 'country' && value != undefined && $scope.type!= 'company' && $scope.type!= 'concession') {
                $scope.loading = false;
                $scope.getProjects($scope.id, $scope.type);
            }

        });

        $scope.loadMoreProjects = function () {
            if ($scope.busy) return;
            $scope.busy = true;
            nrgiProjectTablesSrvc.query({
                _id: $scope.countryid,
                type: $scope.type, skip: currentPage * limit, limit: limit
            }, function (response) {
                $scope.projects = _.union($scope.projects, response.projects);
                if (response.projects.length > 49) {
                    currentPage = currentPage + 1;
                    $scope.busy = false;
                } else {
                    $scope.busy = true;
                }
            });
        };

        $scope.loadCSV = function () {
            nrgiCSV.setCsv(fields, $scope.projects)
            return nrgiCSV.getResult()
        };

        $scope.getAllProjects = function () {
            if ($scope.busy == true && $scope.projects.length > 49 || $scope.projects.length < 49) {
                setTimeout(function () {angular.element(document.getElementById("loadProjectCSV")).trigger('click');}, 0)
            } else {
                nrgiProjectTablesSrvc.query({
                    _id: $scope.countryid,
                    type: $scope.type, skip: 0, limit: 5000000
                }, function (data) {
                    $scope.projects = data.projects
                    $scope.busy = true;
                    setTimeout(function () {angular.element(document.getElementById("loadProjectCSV")).trigger('click');}, 0)
                })
            }
        }
        $scope.getProjects=function(id,type) {
            if ($scope.id != undefined) {
                if ($scope.openClose == true) {
                    if ($scope.projects.length == 0 || $scope.loading == false) {
                        $scope.loading = true;
                        nrgiProjectTablesSrvc.get({
                            _id: id,
                            type: type,
                            skip: currentPage*limit,
                            limit: limit
                        }, function (success) {
                            $scope.expression='';
                            if (success.projects.length == 0 && $scope.projects.length == 0) {
                                $scope.expression = 'showLast';
                            }
                            $scope.projects=success.projects;
                            usSpinnerService.stop('spinner-project');
                        }, function(error){
                            console.log(error)
                            usSpinnerService.stop('spinner-project');
                        })
                    }
                }
            }
        }
    });