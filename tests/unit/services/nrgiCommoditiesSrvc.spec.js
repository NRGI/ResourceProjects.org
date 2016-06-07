'use strict';

describe('nrgiCommoditiesSrvc', function () {
    var commodityServiceInstance, $httpBackend;

    beforeEach(module('app'));

    beforeEach(inject(function(nrgiCommoditiesSrvc, _$httpBackend_) {
        $httpBackend = _$httpBackend_;
        commodityServiceInstance = new nrgiCommoditiesSrvc();
    }));

    it('requests commodity data for a given `commodityId`', function () {
        var commodityId = 1;
        $httpBackend.expectGET('/api/commodities/' + commodityId).respond('');
        commodityServiceInstance.$get({_id: commodityId});
    });
    it('requests commodity data list with a skip and limit var', function () {
        var limit = 10, skip = 1;
        $httpBackend.expectGET('/api/commodities/' + limit + '/' + skip).respond('');
        commodityServiceInstance.$get({limit: limit, skip: skip});
    });
    it('requests commodity update data for a given `commodityId`', function () {
        var commodityId = 1;
        $httpBackend.expectPUT('/api/commodities/' + commodityId).respond('');
        commodityServiceInstance.$update({_id: commodityId});
    });
    //console.info('COMMODITY SERVICE: UPDATE MISSING')

    afterEach(function() {
        $httpBackend.flush();
    });
});