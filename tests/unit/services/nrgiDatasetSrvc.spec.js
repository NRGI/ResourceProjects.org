'use strict';

describe('nrgiDatasetSrvc', function () {
    var datasetServiceInstance, $httpBackend;

    beforeEach(module('app'));

    beforeEach(inject(function(nrgiDatasetSrvc, _$httpBackend_) {
        $httpBackend = _$httpBackend_;
        datasetServiceInstance = new nrgiDatasetSrvc();
    }));

    it('requests country data for a given `datasetId`', function () {
        var datasetId = 1;
        $httpBackend.expectGET('/api/datasets/' + datasetId).respond('');
        datasetServiceInstance.$get({_id: datasetId});
    });
    it('requests country data list with a skip and limit var', function () {
        $httpBackend.expectGET('/api/datasets').respond('');
        datasetServiceInstance.$get({});
    });
    console.info('DATASET UPDATE MISSING');
    console.info('DATASET SAVE MISSING');

    afterEach(function() {
        $httpBackend.flush();
    });
});