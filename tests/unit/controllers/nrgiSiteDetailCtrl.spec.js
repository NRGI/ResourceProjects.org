'use strict';

describe('Unit: Testing Controllers', function() {

    beforeEach(module('app'));

    var SiteStub,
        sitesSrvc,
        scope,
        controller,
        ctrl,
        ID = '56eb117c0007bf5b2a3e4b71',
        expectedID = {_id: ID},
        data = {
            "_id": "56eb117c0007bf5b2a3e4b71",
            "site_name": "Test site 1",
            "site_established_source": "56747e060e8cc07115200ee3",
            "description": "<p>yes</p><p>no</p>",
            "_keywords": ["test", "site"],
            "site_status": [{
                "source": "56747e060e8cc07115200ee3",
                "_id": "56f8c98288a7024614709001",
                "timestamp": "2016-03-28T06:04:49.836Z",
                "string": "exploration"
            }],
            "site_company_share": [],
            "site_operated_by": [],
            "site_commodity": [{
                "_id": "56f8c98288a702461470900f",
                "commodity_name": "Ferrotitanium",
                "commodity_type": "mining",
                "commodity_id": "ferrotitanium"
            }, {
                "_id": "56f8c98288a702461470900f",
                "commodity_name": "Ferrotitanium",
                "commodity_type": "mining",
                "commodity_id": "ferrotitanium"
            }, {
                "_id": "56f8c98288a702461470900f",
                "commodity_name": "Ferrotitanium",
                "commodity_type": "mining",
                "commodity_id": "ferrotitanium"
            }],
            "site_coordinates": [{
                "source": "56747e060e8cc07115200ee3",
                "loc": [14.15392307, 19.50168983],
                "_id": "56f8c98288a7024614709005",
                "timestamp": "2016-03-28T06:04:49.711Z"
            }],
            "site_country": [{
                "source": "56747e060e8cc07115200ee3",
                "country": {"iso2": "AD", "name": "Andorra", "_id": "56f8c98288a7024614708e98"},
                "_id": "56f8c98288a7024614709006",
                "timestamp": "2016-03-28T06:04:49.711Z"
            }],
            "site_address": [{
                "source": "56747e060e8cc07115200ee3",
                "string": "123 main st",
                "_id": "56f8c98288a7024614709007",
                "timestamp": "2016-03-28T06:04:49.711Z"
            }],
            "site_aliases": [{"_id": "56a939e64ddd4cfc1354d64b", "alias": "site 1111"}],
            "field": false,
            "__v": 0,
            "concessions": [{"_id": "56a2b8236e585b7316655794", "concession_name": "Block A"}],
            "contracts": [{
                "_id": "56a2eb4345d114c30439ec22",
                "contract_id": "ocds-591adf-PH9670211788RC",
                "__v": 0
            }, {"_id": "56a2eb4345d114c30439ec20", "contract_id": "ocds-591adf-YE2702919895RC", "__v": 0}],
            "sites": [],
            "projects": [{
                "_id": "56a930f41b5482a31231ef42",
                "proj_id": "ad-jufi-yqceeo",
                "proj_name": "Jubilee Field",
                "proj_established_source": "56747e060e8cc07115200ee3",
                "description": "<p>yes</p><p>no</p>",
                "__v": 0,
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
                        "__v": 0,
                        "commodity_aliases": []
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
                        "__v": 0,
                        "country_aliases": []
                    },
                    "_id": "56f8c98288a70246147090dc",
                    "timestamp": "2016-03-28T06:04:49.711Z"
                }],
                "proj_aliases": ["56a939e649434cfc1354d64b", "56a939e649434cfc1354d64c"]
            }],
            "proj_coordinates": [],
            "coordinates": [{
                "lat": 14.15392307,
                "lng": 19.50168983,
                "message": "Test site 1",
                "timestamp": "2016-03-28T06:04:49.711Z",
                "type": "site",
                "id": "56eb117c0007bf5b2a3e4b71"
            }, {
                "lat": -73.15392307,
                "lng": 17.50168983,
                "message": "Jubilee Field",
                "timestamp": "2016-03-28T06:04:49.711Z",
                "type": "project",
                "id": "ad-jufi-yqceeo"
            }],
            "source_type": {"p": true, "c": true}
        };

    beforeEach(inject(function ($controller, nrgiSitesSrvc, $rootScope) {
        scope = $rootScope.$new;
        controller = $controller;
        sitesSrvc = nrgiSitesSrvc;
    }));

    it('requests site data for a given `Id`', function () {
        var siteDetailQuerySpy;

        siteDetailQuerySpy = sinon.spy(function (id, callback) {
            callback(data);
        });

        SiteStub = sinon.stub(sitesSrvc, 'get', siteDetailQuerySpy);

        ctrl = controller('nrgiSiteDetailCtrl', {
            $scope: scope,
            $routeParams: {
                id: ID
            }
        });

        siteDetailQuerySpy.called.should.be.equal(true);

        sinon.assert.calledWith(siteDetailQuerySpy, expectedID);

        scope.site.should.be.equal(data);

    });
    afterEach(function () {
        SiteStub.restore();
    });
});
