'use strict';

describe('nrgiSourceTypesSrvc', function () {
    var sourceTypeServiceInstance, $httpBackend;

    beforeEach(module('app'));

    beforeEach(inject(function(nrgiSourceTypesSrvc, _$httpBackend_) {
        $httpBackend = _$httpBackend_;
        sourceTypeServiceInstance = new nrgiSourceTypesSrvc();
    }));

    it('requests source type data for a given `sourceTypeId`', function () {
        var sourceTypeId = 1;
        $httpBackend.expectGET('/api/sourcetypes/' + sourceTypeId).respond('');
        sourceTypeServiceInstance.$get({_id: sourceTypeId});
    });
    it('requests source type data list with a skip and limit var', function () {
        var limit = 10, skip = 1;
        $httpBackend.expectGET('/api/sourcetypes/' + limit + '/' + skip).respond('');
        sourceTypeServiceInstance.$get({limit: limit, skip: skip});
    });
    console.info('SOURCE TYPE UPDATE MISSING');
    console.info('SOURCE TYPE DISPLAY MISSING');

    afterEach(function() {
        $httpBackend.flush();
    });
});