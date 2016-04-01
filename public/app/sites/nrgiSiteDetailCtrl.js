'use strict';

angular.module('app')
    .controller('nrgiSiteDetailCtrl', function (
        $scope,
        $rootScope,
        nrgiAuthSrvc,
        nrgiIdentitySrvc,
        nrgiSitesSrvc,
        $routeParams
    ) {
        nrgiSitesSrvc.get({_id: $routeParams.id}, function (success) {
            var _ = $rootScope._;
            $scope.site = success;

            _.each($scope.site.companies, function(company) {
                company.operator = false;
                _.each($scope.site.site_company_share, function(company_share) {
                    if (company._id==company_share.company) {
                        company.stake = {share: company_share.number, timestamp: company_share.timestamp}
                    }
                });
                // _.each($scope.project.proj_operated_by, function(company_op) {
                //     if (company._id==company_op.company) {
                //         company.operator = true;
                //     }
                // })
            });
        });
    });