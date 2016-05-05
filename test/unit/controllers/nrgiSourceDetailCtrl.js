describe("Unit: Testing Controllers", function() {

    beforeEach(module('app'));

    var scope,
        controllerService,
        httpMock,
        ID = '56747e060e8cc07115200ee5',
        data = {
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
        };

    beforeEach(inject(function ($rootScope, $controller, $httpBackend) {
        scope = $rootScope.$new();
        controllerService = $controller;
        httpMock = $httpBackend;
    }));

    it("should get '56747e060e8cc07115200ee5' from '/api/sources'", function () {

        httpMock.expectGET('/api/sources/' + ID).respond(data);

        ctrl = controllerService('nrgiSourceDetailCtrl', {
            $scope: scope,
            $routeParams:{
                id: ID
            }
        });

        httpMock.flush();

        expect(scope.source._id).toEqual(ID);
    });
});
