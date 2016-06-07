'use strict';

describe('Unit: Testing Controllers', function() {

    beforeEach(module('app'));

    var ProjectStub,
        projectsSrvc,
        scope,
        controller,
        ctrl,
        ID = 'ad-jufi-yqceeo',
        expectedID = {_id: ID},
        data = {
            "_id": "56a930f41b5482a31231ef42",
            "proj_id": "ad-jufi-yqceeo",
            "proj_name": "Jubilee Field",
            "proj_established_source": "56747e060e8cc07115200ee3",
            "description": "<p>yes</p><p>no</p>",
            "_keywords": ["jubile", "field"],
            "proj_status": [{
                "source": "56747e060e8cc07115200ee3",
                "_id": "56f8c98288a70246147090d8",
                "timestamp": "2016-03-28T06:04:49.828Z",
                "string": "exploration"
            }],
            "proj_company_share": [],
            "proj_operated_by": [],
            "proj_coordinates": [{
                "source": "56747e060e8cc07115200ee3",
                "loc": [-73.15392307, 17.50168983],
                "_id": "56f8c98288a70246147090d9",
                "timestamp": "2016-03-28T06:04:49.711Z"
            }],
            "proj_address": [{
                "source": "56747e060e8cc07115200ee3",
                "string": "123 main st",
                "_id": "56f8c98288a70246147090da",
                "timestamp": "2016-03-28T06:04:49.711Z"
            }],
            "proj_commodity": [{
                "source": "56747e060e8cc07115200ee3",
                "commodity": {
                    "commodity_name": "Ferrotitanium",
                    "commodity_type": "mining",
                    "commodity_id": "ferrotitanium",
                    "_id": "56f8c98288a702461470900f",
                    "commodity_aliases": [],
                    "__v": 0
                },
                "_id": "56f8c98288a70246147090db",
                "timestamp": "2016-03-28T06:04:49.711Z"
            }],
            "proj_country": [{
                "source": "56747e060e8cc07115200ee3",
                "country": {
                    "iso2": "AD",
                    "name": "Andorra",
                    "_id": "56f8c98288a7024614708e98",
                    "country_aliases": [],
                    "__v": 0
                },
                "_id": "56f8c98288a70246147090dc",
                "timestamp": "2016-03-28T06:04:49.711Z"
            }],
            "proj_aliases": [{
                "_id": "56a939e649434cfc1354d64b",
                "alias": "project aye"
            }, {"_id": "56a939e649434cfc1354d64c", "alias": "project aaaa"}],
            "__v": 0,
            "concessions": [{"_id": "56a2b8236e585b7316655794", "concession_name": "Block A"}],
            "contracts": [{"_id": "56a2eb4345d114c30439ec20", "contract_id": "ocds-591adf-YE2702919895RC", "__v": 0}],
            "source_type": {"p": true, "c": true},
            "site_coordinates": {
                "sites": [{
                    "lat": 14.15392307,
                    "lng": 19.50168983,
                    "message": "Test site 1",
                    "timestamp": "2016-03-28T06:04:49.711Z",
                    "type": "site",
                    "id": "56eb117c0007bf5b2a3e4b71"
                }],
                "fields": [{
                    "lat": 31.15392307,
                    "lng": 47.50168983,
                    "message": "Test field 1",
                    "timestamp": "2016-03-28T06:04:49.711Z",
                    "type": "field",
                    "id": "56eb117c0007bf5b2a3e4b76"
                }]
            },
            "sources": {},
            "coordinates": [{
                "lat": 14.15392307,
                "lng": 19.50168983,
                "message": "Test site 1",
                "timestamp": "2016-03-28T06:04:49.711Z",
                "type": "site",
                "id": "56eb117c0007bf5b2a3e4b71"
            }, {
                "lat": 31.15392307,
                "lng": 47.50168983,
                "message": "Test field 1",
                "timestamp": "2016-03-28T06:04:49.711Z",
                "type": "field",
                "id": "56eb117c0007bf5b2a3e4b76"
            }, {
                "lat": -73.15392307,
                "lng": 17.50168983,
                "message": "Jubilee Field",
                "timestamp": "2016-03-28T06:04:49.711Z",
                "type": "project",
                "id": "ad-jufi-yqceeo"
            }]
        };

    beforeEach(inject(function ($controller, nrgiProjectsSrvc, $rootScope) {
        scope = $rootScope.$new;
        controller = $controller;
        projectsSrvc = nrgiProjectsSrvc;
    }));

    it('requests project data for a given `Id`', function () {
        var projectDetailQuerySpy;

        projectDetailQuerySpy = sinon.spy(function (id, callback) {
            callback(data);
        });

        ProjectStub = sinon.stub(projectsSrvc, 'get', projectDetailQuerySpy);

        ctrl = controller('nrgiProjectDetailCtrl', {
            $scope: scope,
            $routeParams: {
                id: ID
            }
        });

        projectDetailQuerySpy.called.should.be.equal(true);

        sinon.assert.calledWith(projectDetailQuerySpy, expectedID);

        scope.project.should.be.equal(data);

    });
    afterEach(function () {
        ProjectStub.restore();
    });
});
