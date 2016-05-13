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
        commodityServiceInstance.$get({commodityId: commodityId});
    });

    afterEach(function() {
        $httpBackend.flush();
    });
});