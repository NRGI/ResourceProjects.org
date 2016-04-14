'use strict';

angular.module('app')
    .factory('nrgiTablesSrvc', function($resource) {
    var ProjectResource = $resource('/api/company_table/:type/:_id', {_id: "@id",type:"@type"}, {
        query:  {method:'GET', isArray: false},
        update: {method: 'PUT', isArray: false}
    });

    return ProjectResource;
    })
    .factory('nrgiProjectTablesSrvc', function($resource) {
        var ProjectResource = $resource('/api/project_table/:type/:_id', {_id: "@id",type:"@type"}, {
            query:  {method:'GET', isArray: false},
            update: {method: 'PUT', isArray: false}
        });

        return ProjectResource;
    })
    .factory('nrgiProdTablesSrvc', function($resource) {
        var ProjectResource = $resource('/api/prod_table/:type/:_id', {_id:"@id",type:"@type"}, {
            query:  {method:'GET', isArray: false},
            update: {method: 'PUT', isArray: false}
        });

        return ProjectResource;
    })
    .factory('nrgiTransferTablesSrvc', function($resource) {
        var ProjectResource = $resource('/api/transfer_table/:type/:_id', {_id:"@id",type:"@type"}, {
            query:  {method:'GET', isArray: false},
            update: {method: 'PUT', isArray: false}
        });

        return ProjectResource;
    })
    .factory('nrgiSourceTablesSrvc', function($resource) {
        var ProjectResource = $resource('/api/source_table/:type/:_id', {_id:"@id",type:"@type"}, {
            query:  {method:'GET', isArray: false},
            update: {method: 'PUT', isArray: false}
        });

        return ProjectResource;
    })
    .factory('nrgiSiteFieldTablesSrvc', function($resource) {
        var ProjectResource = $resource('/api/site_table/:type/:_id', {_id:"@id",type:"@type"}, {
            query:  {method:'GET', isArray: false},
            update: {method: 'PUT', isArray: false}
        });

        return ProjectResource;
    })
    .factory('nrgiContractTablesSrvc', function($resource) {
        var ProjectResource = $resource('/api/contract_table/:type/:_id', {_id:"@id",type:"@type"}, {
            query:  {method:'GET', isArray: false},
            update: {method: 'PUT', isArray: false}
        });

        return ProjectResource;
    })
    .factory('nrgiConcessionTablesSrvc', function($resource) {
        var ProjectResource = $resource('/api/concession_table/:type/:_id', {_id:"@id",type:"@type"}, {
            query:  {method:'GET', isArray: false},
            update: {method: 'PUT', isArray: false}
        });

        return ProjectResource;
    })