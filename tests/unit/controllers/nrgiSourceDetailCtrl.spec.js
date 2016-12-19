'use strict';
describe('Unit: Testing Controllers', function() {

    beforeEach(module('app'));

    var SourceStub,
        sourcesSrvc,
        scope,
        controller,
        ctrl,
        ID = '56747e060e8cc07115200ee5',
        expectedID = {_id: ID},
        source = {
            source: {
                "_id": "56747e060e8cc07115200ee5",
                "source_name": "source 2",
                "source_type_id": "56e873691d1d2a3824141428",
                "source_url": "google.com",
                "source_archive_url": "sheets.google.com",
                "source_notes": "notes notes notes notes notes notes notes notes notes notes notes notes notes notes",
                "staged": true,
                "possible_duplicate": false,
                "create_date": "2016-03-28T06:04:50.374Z",
                "create_author": [{"_id": "569976c21dad48f614cc8126", "first_name": "Chris", "last_name": "Perry"}],
                "retrieve_date": "2016-03-28T06:04:50.373Z",
                "source_date": "2016-03-28T06:04:50.373Z",
                "__v": 0
            }
        };


    beforeEach(inject(function ($controller, nrgiSourcesSrvc, $rootScope) {
        scope = $rootScope.$new;
        controller = $controller;
        sourcesSrvc = nrgiSourcesSrvc;
    }));

    it('requests source data for a given `Id`', function () {
        var sourceDetailQuerySpy;

        sourceDetailQuerySpy = sinon.spy(function (id, callback) {
            callback(source);
        });

        SourceStub = sinon.stub(sourcesSrvc, 'get', sourceDetailQuerySpy);

        ctrl = controller('nrgiSourceDetailCtrl', {
            $scope: scope,
            $routeParams: {
                id: ID
            }
        });

        sourceDetailQuerySpy.called.should.be.equal(true);

        sinon.assert.calledWith(sourceDetailQuerySpy, expectedID);

        scope.source.should.be.equal(source.source);

    });
    afterEach(function () {
        SourceStub.restore();
    });
});
