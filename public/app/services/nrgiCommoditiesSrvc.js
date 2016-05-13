'use strict';

angular.module('app')
    .factory('nrgiCommoditiesSrvc', function($resource) {
        var CommodityResource = $resource('/api/commodities/:limit/:skip/:_id', {_id: "@id", limit: "@limit", skip: "@skip"}, {
            query:  {method:'GET', isArray: false},
            update: {method: 'PUT', isArray: false}
        });

        return CommodityResource;

    });