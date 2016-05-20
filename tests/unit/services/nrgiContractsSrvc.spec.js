'use strict';

describe('nrgiContractsSrvc', function () {
    var contractServiceInstance, $httpBackend;

    beforeEach(module('app'));

    beforeEach(inject(function(nrgiContractsSrvc, _$httpBackend_) {
        $httpBackend = _$httpBackend_;
        contractServiceInstance = new nrgiContractsSrvc();
    }));

    it('requests contract data for a given `contractId`', function () {
        var contractId = 1;
        $httpBackend.expectGET('/api/contracts/' + contractId).respond('');
        contractServiceInstance.$get({_id: contractId});
    });
    it('requests contract data list with a skip and limit var', function () {
        var limit = 10, skip = 1;
        $httpBackend.expectGET('/api/contracts/' + limit + '/' + skip).respond('');
        contractServiceInstance.$get({limit: limit, skip: skip});
    });
    console.info('CONTRACT SERVICE: UPDATE MISSING');

    afterEach(function() {
        $httpBackend.flush();
    });
});