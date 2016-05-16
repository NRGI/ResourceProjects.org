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
    })
    .factory('nrgiCountriesSrvc', function($resource) {
        var CountriesResource = $resource('/api/countries/:limit/:skip/:_id', {_id: "@id", limit: "@limit", skip: "@skip"}, {
            query:  {method:'GET', isArray: false},
            update: {method: 'PUT', isArray: false}
        });

        return CountriesResource;
    })
    .factory('nrgiCountryCommoditiesSrvc', function($resource) {
        var CountriesResource = $resource('/api/countrycommodity/:_id', {_id: "@id"}, {
            query:  {method:'GET', isArray: false}
        });

        return CountriesResource;
    })
    .factory('nrgiCountryCoordinatesSrvc', function($resource) {
        var CountriesResource = $resource('/api/coordinate/:type/:_id', {_id: "@id",type:"@type"}, {
            query:  {method:'GET', isArray: false}
        });

        return CountriesResource;
    })
    .factory('nrgiDatasetSrvc', function($resource) {
        var DatasetResource = $resource('/api/datasets/:_id', {_id: "@id"}, {
            query:  {method: 'GET', isArray: false},
            update: {method: 'PUT', isArray:false},
            save: {method: 'POST', isArray:false}
        });

        return DatasetResource;
    })
    .factory('nrgiDatasetActionSrvc', function($resource) {
        var DatasetActionResource = $resource('/api/datasets/:_id/actions', {_id: "@id"}, {
            save: {method: 'POST', isArray:false}
        });

        return DatasetActionResource;
    })
    .factory('nrgiGroupsSrvc', function($resource) {
        var GroupResource = $resource('/api/companyGroups/:limit/:skip/:_id', {_id: "@id", limit: "@limit", skip: "@skip"}, {
            query:  {method:'GET', isArray: false},
            update: {method: 'PUT', isArray: false}
        });

        return GroupResource;

    })
    .factory('nrgiGroupDataSrvc', function($resource) {
        var GroupResource = $resource('/api/companyGroupData/:_id', {_id: "@id"}, {
            query:  {method:'GET', isArray: false}
        });

        return GroupResource;

    })
    .factory('nrgiProjectsSrvc', function($resource) {
        var ProjectResource = $resource('/api/projects/:limit/:skip/:_id', {_id: "@id", limit: "@limit", skip: "@skip"}, {
            query:  {method:'GET', isArray: false},
            update: {method: 'PUT', isArray: false}
        });

        return ProjectResource;
    })
    .factory('nrgiSitesSrvc', function($resource) {
        var SiteResource = $resource('/api/sites/:limit/:skip/:map/:field/:_id', {_id: "@id", limit: "@limit", skip: "@skip", field: "@field",map: "@map"}, {
            query:  {method:'GET', isArray: false},
            update: {method: 'PUT', isArray: false}
        });

        return SiteResource;
    })
    .factory('nrgiSourcesSrvc', function($resource) {
        var SourceResource = $resource('/api/sources/:limit/:skip/:_id', {_id: "@id", limit: "@limit", skip: "@skip"}, {
            query:  {method:'GET', isArray: false},
            update: {method: 'PUT', isArray: false}
        });

        return SourceResource;
    })
    .factory('nrgiSourceTypesSrvc', function($resource) {
        var SourceTypeResource = $resource('/api/sourcetypes/:limit/:skip/:display/:_id', {_id: "@id", limit: "@limit", skip: "@skip", display: "@display"}, {
            query:  {method:'GET', isArray: false},
            update: {method: 'PUT', isArray: false}
        });

        return SourceTypeResource;
    });