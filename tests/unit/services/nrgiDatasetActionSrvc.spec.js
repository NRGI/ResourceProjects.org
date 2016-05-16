'use strict';

describe('nrgiDatasetActionSrvc', function () {
    var datasetActionServiceInstance, $httpBackend;

    beforeEach(module('app'));

    beforeEach(inject(function(nrgiDatasetActionSrvc, _$httpBackend_) {
        $httpBackend = _$httpBackend_;
        datasetActionServiceInstance = new nrgiCountryCommoditiesSrvc();
    }));
    console.error('FIX DATASET ACTION SVC TEST')

    // it('requests country data for a given `datasetId`', function () {
    //     var countryId = 1;
    //     $httpBackend.expectGET('/api/datasets/' + datasetId + '/actions').respond('');
    //     datasetActionServiceInstance.$get({_id: datasetId});
    // });

    afterEach(function() {
        $httpBackend.flush();
    });
});