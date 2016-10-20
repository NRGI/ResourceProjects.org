describe("Last Added Directive", function() {

    var $compile, $rootScope, template, scope, ctrl, lastAddedQueryStub,
        result = {
            "sources": [{
                "_id": "5760fba8ba58351e038e8fb2",
                "source_name": "LAST!!",
                "source_type": "source id 3",
                "source_type_id": "56e8736944442a3824141429",
                "source_url": "google.com",
                "source_archive_url": "sheets.google.com",
                "source_notes": "notes notes notes notes notes notes notes notes notes notes notes notes notes notes",
                "__v": 0,
                "staged": true,
                "possible_duplicate": false,
                "create_date": "2016-07-13T05:49:45.258Z",
                "create_author": ["569976c21dad48f614cc8126"],
                "retrieve_date": "2016-07-13T05:49:45.258Z",
                "source_date": "2016-05-12T07:39:08.723Z"
            }, {
                "_id": "575e795a69fb2f2311530a6b",
                "source_name": "Yara 2014",
                "source_type_id": "56e8733334442a3824141429",
                "source_url": "http://yara.com/doc/197961_Country_by_country_reporting_v8.pdf",
                "source_archive_url": "",
                "source_notes": "",
                "duplicate": "57347072c7b9f6bc01cf6000",
                "__v": 0,
                "staged": true,
                "possible_duplicate": true,
                "create_date": "2016-06-13T09:14:02.240Z",
                "create_author": [],
                "retrieve_date": "2015-09-09T00:00:00.000Z",
                "source_date": "2015-01-01T00:00:00.000Z"
            }],
            "projects": [{
                "_id": "56a930f41b5482a31231ef43",
                "proj_id": "bade-m48hya",
                "proj_name": "LAST",
                "proj_established_source": null,
                "description": "<p>yes</p><p>no</p>",
                "_keywords": ["agn"],
                "proj_status": [{
                    "source": "56747e060e8cc07115200ee6",
                    "_id": "56f8c98288a70246147090dd",
                    "timestamp": "2016-03-28T06:04:49.828Z",
                    "string": "development"
                }],
                "proj_company_share": [],
                "proj_operated_by": [],
                "proj_coordinates": [{
                    "source": "56747e060e8cc07115200ee6",
                    "loc": [39.22885590999999, -19.84381911],
                    "_id": "56f8c98288a70246147090de",
                    "timestamp": "2016-03-28T06:04:49.711Z"
                }],
                "proj_address": [],
                "proj_commodity": [{
                    "source": "56747e060e8cc07115200ee3",
                    "commodity": "56f8c98288a702461470900f",
                    "_id": "56f8c98288a70246147090e1",
                    "timestamp": "2016-03-28T06:04:49.711Z"
                }, {
                    "source": "56747e060e8cc07115200ee3",
                    "commodity": "56f8c98288a702461470900f",
                    "_id": "56f8c98288a70246147090e0",
                    "timestamp": "2016-03-28T06:04:49.711Z"
                }, {
                    "source": "56747e060e8cc07115200ee6",
                    "commodity": "56f8c98288a702461470900f",
                    "_id": "56f8c98288a70246147090df",
                    "timestamp": "2016-03-28T06:04:49.711Z"
                }],
                "proj_country": [{
                    "source": "56747e060e8cc07115200ee3",
                    "country": "56f8c98288a7024614708f34",
                    "_id": "56f8c98288a70246147090e2",
                    "timestamp": "2016-03-28T06:04:49.711Z"
                }],
                "proj_aliases": ["56a939e649434cfc1354d64d"]
            }]
        },
        element;
    beforeEach(module('app'));

    beforeEach(inject(function($templateCache,_$compile_,_$rootScope_,$controller, nrgiLastAddedSrvc) {
        $compile = _$compile_;
        $rootScope = _$rootScope_;
        scope = $rootScope.$new();

        $templateCache.get('/partials/directives/templates/nrgi-last-added');

        template = '<nrgi-last-added></nrgi-last-added>';
        element = $compile(template)(scope);

        var lastAddedDetailQuerySpy;

        lastAddedDetailQuerySpy= sinon.spy(function (callback) {
            callback(result);
        });

        lastAddedQueryStub = sinon.stub(nrgiLastAddedSrvc, 'get', lastAddedDetailQuerySpy);

        ctrl = $controller('nrgiLastAddedCtrl', {
            $scope:  scope
        });

    }));


    it("should display last added data", function() {

        lastAddedQueryStub.called.should.be.equal(true);
        sinon.assert.calledWith(lastAddedQueryStub);
        scope.projects.should.be.equal(result.projects);
        scope.sources.should.be.equal(result.sources);

        scope.$digest();

        var isolateScope = element.find('table');
        isolateScope.should.be.defined;

    })

});

