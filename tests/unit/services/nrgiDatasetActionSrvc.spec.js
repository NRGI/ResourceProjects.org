'use strict';

describe('nrgiDatasetActionSrvc', function () {
    var datasetActionServiceInstance, $httpBackend;

    beforeEach(module('app'));

    beforeEach(inject(function(nrgiDatasetActionSrvc, _$httpBackend_) {
        $httpBackend = _$httpBackend_;
        datasetActionServiceInstance = new nrgiDatasetActionSrvc();
    }));
    //console.error('DATASET ACTION SERVICE: NO TEST')

    it('requests country data for a given `datasetId`', function () {
         var datasetId = 1;
         $httpBackend.expectPOST('/api/datasets/' + datasetId + '/actions').respond('');
         datasetActionServiceInstance.$save({_id: datasetId});
    });

    afterEach(function() {
        $httpBackend.flush();
    });
});