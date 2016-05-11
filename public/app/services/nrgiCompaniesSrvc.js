'use strict';

angular.module('app')
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
    });