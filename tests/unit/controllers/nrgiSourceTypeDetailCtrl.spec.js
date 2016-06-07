'use strict';
describe('Unit: Testing Controllers', function() {

    beforeEach(module('app'));

    var SourceTypeStub,
        sourcesTypeSrvc,
        scope,
        controller,
        ctrl,
        ID = '1',
        expectedID = {_id: ID},
        data = {
            "_id": "1",
            "source_type_name": "source type",
            "source_type_id": "2",
            "source_type_display": true,
            "source_type_authority": "authority",
            "source_type_examples": "examples",
            "source_type_url_type": "url",
            "source_type_notes": "notes"
        };


    beforeEach(inject(function ($controller, nrgiSourceTypesSrvc, $rootScope) {
        scope = $rootScope.$new;
        controller = $controller;
        sourcesTypeSrvc = nrgiSourceTypesSrvc;
    }));

    it('requests source type data for a given `Id`', function () {
        var sourceTypeDetailQuerySpy;

        sourceTypeDetailQuerySpy = sinon.spy(function (id, callback) {
            callback(data);
        });

        SourceTypeStub = sinon.stub(sourcesTypeSrvc, 'get', sourceTypeDetailQuerySpy);

        ctrl = controller('nrgiSourceTypeDetailCtrl', {
            $scope: scope,
            $routeParams: {
                id: ID
            }
        });

        sourceTypeDetailQuerySpy.called.should.be.equal(true);

        sinon.assert.calledWith(sourceTypeDetailQuerySpy, expectedID);

        scope.source_type.should.be.equal(data);

    });
    afterEach(function () {
        SourceTypeStub.restore();
    });
});
