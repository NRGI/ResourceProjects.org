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
    it('requests source type all data list with a skip and limit var', function () {
        var limit = 10, skip = 1, display = true;
        $httpBackend.expectGET('/api/sourcetypes/' + limit + '/' + skip).respond('');
        sourceTypeServiceInstance.$get({limit: limit, skip: skip});
    });
    it('requests source type data list with a skip and limit var', function () {
        var limit = 10, skip = 1, display = false;
        $httpBackend.expectGET('/api/sourcetypes/' + limit + '/' + skip).respond('');
        sourceTypeServiceInstance.$get({limit: limit, skip: skip});
    });
    it('requests source type update data for a given `sourceTypeId`', function () {
        var sourceTypeId = 1;
        $httpBackend.expectPUT('/api/sourcetypes/' + sourceTypeId).respond('');
        sourceTypeServiceInstance.$update({_id: sourceTypeId});
    });
    //console.info('SOURCE SERVICE: TYPE UPDATE MISSING');
    //console.info('SOURCE SERVICE: TYPE DISPLAY MISSING');

    afterEach(function() {
        $httpBackend.flush();
    });
});