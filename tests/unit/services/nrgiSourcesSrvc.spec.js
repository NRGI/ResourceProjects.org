'use strict';

describe('nrgiSourcesSrvc', function () {
    var sourceServiceInstance, $httpBackend;

    beforeEach(module('app'));

    beforeEach(inject(function(nrgiSourcesSrvc, _$httpBackend_) {
        $httpBackend = _$httpBackend_;
        sourceServiceInstance = new nrgiSourcesSrvc();
    }));

    it('requests source data for a given `sourceId`', function () {
        var sourceId = 1;
        $httpBackend.expectGET('/api/sources/' + sourceId).respond('');
        sourceServiceInstance.$get({_id: sourceId});
    });
    it('requests source data list with a skip and limit var', function () {
        var limit = 10, skip = 1;
        $httpBackend.expectGET('/api/sources/' + limit + '/' + skip).respond('');
        sourceServiceInstance.$get({limit: limit, skip: skip});
    });
    console.info('SOURCE UPDATE MISSING')

    afterEach(function() {
        $httpBackend.flush();
    });
});