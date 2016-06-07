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
    it('requests country update data for a given `datasetId`', function () {
        var datasetId = 1;
        $httpBackend.expectPUT('/api/datasets/' + datasetId).respond('');
        datasetServiceInstance.$update({_id: datasetId});
    });
    it('requests country save data', function () {
        $httpBackend.expectPOST('/api/datasets').respond('');
        datasetServiceInstance.$save({});
    });

    //console.info('DATASET SERVICE: UPDATE MISSING');
    //console.info('DATASET SERVICE: SAVE MISSING');

    afterEach(function() {
        $httpBackend.flush();
    });
});