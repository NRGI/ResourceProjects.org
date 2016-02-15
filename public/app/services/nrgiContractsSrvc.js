'use strict';

angular.module('app')
    .factory('nrgiContractsSrvc', function($resource) {
        var ContractResource = $resource('/api/contracts/:limit/:skip/:_id', {_id: "@id", limit: "@limit", skip: "@skip"}, {
            query:  {method:'GET', isArray: false},
            update: {method: 'PUT', isArray: false}
        });

        return ContractResource;

    });