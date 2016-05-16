'use strict';

angular.module('app')
    .factory('nrgiCommoditiesSrvc', function($resource) {
        var CommodityResource = $resource('/api/commodities/:limit/:skip/:_id', {_id: "@id", limit: "@limit", skip: "@skip"}, {
            query:  {method:'GET', isArray: false},
            update: {method: 'PUT', isArray: false}
        });

        return CommodityResource;
    })
    .factory('nrgiCompaniesSrvc', function($resource) {
        var CompanyResource = $resource('/api/companies/:limit/:skip/:_id', {_id: "@id", limit: "@limit", skip: "@skip"}, {
            query:  {method:'GET', isArray: false},
            update: {method: 'PUT', isArray: false}
        });

        return CompanyResource;
    })
    .factory('nrgiCompanyDataSrvc', function($resource) {
        var CompanyResource = $resource('/api/companydata/:_id', {_id: "@id"}, {
            query:  {method:'GET', isArray: false}
        });

        return CompanyResource;
    })
    .factory('nrgiConcessionsSrvc', function($resource) {
        var ConcessionResource = $resource('/api/concessions/:limit/:skip/:_id', {_id: "@id", limit: "@limit", skip: "@skip"}, {
            query:  {method:'GET', isArray: false},
            update: {method: 'PUT', isArray: false}
        });

        return ConcessionResource;
    })
    .factory('nrgiContractsSrvc', function($resource) {
        var ContractResource = $resource('/api/contracts/:limit/:skip/:_id', {_id: "@id", limit: "@limit", skip: "@skip"}, {
            query:  {method:'GET', isArray: false},
            update: {method: 'PUT', isArray: false}
        });

        return ContractResource;
    });