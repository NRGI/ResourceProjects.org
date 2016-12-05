'use strict';

angular.module('app')
    .factory('nrgiTablesSrvc', function($resource) {
    var CompanyTableResource = $resource('/api/company_table/:type/:_id/:limit/:skip', {_id: "@id",type:"@type",limit:"@limit",skip:"@skip"}, {
        query:  {method:'GET', isArray: false}
    });

    return CompanyTableResource;
    })
    .factory('nrgiProjectTablesSrvc', function($resource) {
        var ProjectTableResource = $resource('/api/project_table/:type/:_id/:limit/:skip', {_id: "@id",type:"@type",limit:"@limit",skip:"@skip"}, {
            query:  {method:'GET', isArray: false}
        });

        return ProjectTableResource;
    })
    .factory('nrgiProdTablesSrvc', function($resource) {
        var ProdTableResource = $resource('/api/prod_table/:type/:_id/:limit/:skip', {_id:"@id",type:"@type",limit:"@limit",skip:"@skip"}, {
            query:  {method:'GET', isArray: false}
        });

        return ProdTableResource;
    })
    .factory('nrgiTransferTablesSrvc', function($resource) {
        var TransferTableResource = $resource('/api/transfer_table/:type/:_id/:limit/:skip', {_id:"@id",type:"@type",limit:"@limit",skip:"@skip"}, {
            query:  {method:'GET', isArray: false}
        });

        return TransferTableResource;
    })
    .factory('nrgiSourceTablesSrvc', function($resource) {
        var SourceTableResource = $resource('/api/source_table/:type/:_id', {_id:"@id",type:"@type"}, {
            query:  {method:'GET', isArray: false}
        });

        return SourceTableResource;
    })
    .factory('nrgiSiteFieldTablesSrvc', function($resource) {
        var SiteFieldTableResource = $resource('/api/site_table/:type/:_id/:limit/:skip', {_id:"@id",type:"@type",limit:"@limit",skip:"@skip"}, {
            query:  {method:'GET', isArray: false}
        });

        return SiteFieldTableResource;
    })
    .factory('nrgiContractTablesSrvc', function($resource) {
        var ContractTableResource = $resource('/api/contract_table/:type/:_id', {_id:"@id",type:"@type"}, {
            query:  {method:'GET', isArray: false}
        });

        return ContractTableResource;
    })
    .factory('nrgiConcessionTablesSrvc', function($resource) {
        var ConcessionTableResource = $resource('/api/concession_table/:type/:_id/:limit/:skip', {_id:"@id",type:"@type",limit:"@limit",skip:"@skip"}, {
            query:  {method:'GET', isArray: false}
        });

        return ConcessionTableResource;
    })