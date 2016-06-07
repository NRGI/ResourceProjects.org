describe("Unit: Testing Controllers", function() {

    beforeEach(module('app'));

    var expectedParams = {limit:50, skip:0},
        scope,
        commoditiesData = {
            "count": 200,
            "data": [
                {
                    "_id": "5734d18b3dbaf9c32c313963",
                    "commodity_name": "3PGM+Au",
                    "commodity_type": "mining",
                    "commodity_id": "3pgm+au",
                    "concessions": 0,
                    "projects": 2,
                    "fields": 3,
                    "sites": 0,
                    "contract": 0
                },
                {
                    "_id": "5734d18b3dbaf9c32c313964",
                    "commodity_name": "6PGM+Au",
                    "commodity_type": "mining",
                    "commodity_id": "6pgm+au",
                    "concessions": 1,
                    "projects": 4,
                    "fields": 0,
                    "sites": 0,
                    "contract": 77
                }]
        },
        commoditiesQueryStub,$rootScope,  ctrl;

    beforeEach(inject(function ($rootScope, $controller, nrgiCommoditiesSrvc) {
        var $rootScope = $rootScope;
        var commodityDetailQuerySpy;

        commodityDetailQuerySpy = sinon.spy(function (expectedParams, callback) {
            callback(commoditiesData);
        });


        commoditiesQueryStub = sinon.stub(nrgiCommoditiesSrvc, 'query', commodityDetailQuerySpy);

        scope = $rootScope.$new();
        ctrl = $controller('nrgiCommodityListCtrl', {
            $scope:  scope
        });
    }));

    it("loads the commodity data", function () {

        commoditiesQueryStub.called.should.be.equal(true);
        sinon.assert.calledWith(commoditiesQueryStub, expectedParams);
        scope.commodities.should.be.equal(commoditiesData.data);
        scope.loadMore();
        commoditiesQueryStub.called.should.be.equal(true);
    });

    afterEach(function () {
        commoditiesQueryStub.restore();
    });
});



//
//'use strict';
//
//describe('nrgiCommodityListCtrl', function () {
//    beforeEach(module('app'));
//
//    var $scope, nrgiCommoditiesSrvc,
//        commodityQueryStub, commodityQuerySpy,
//        commoditiesData = [
//            {
//                "_id": "5734d18b3dbaf9c32c313963",
//                "commodity_name": "3PGM+Au",
//                "commodity_type": "mining",
//                "commodity_id": "3pgm+au",
//                "concessions": 0,
//                "projects": 2,
//                "fields": 3,
//                "sites": 0,
//                "contract": 0
//            },
//            {
//                "_id": "5734d18b3dbaf9c32c313964",
//                "commodity_name": "6PGM+Au",
//                "commodity_type": "mining",
//                "commodity_id": "6pgm+au",
//                "concessions": 1,
//                "projects": 4,
//                "fields": 0,
//                "sites": 0,
//                "contract": 77
//            },
//        ];
//
//    // beforeEach(inject(
//    //     function ($rootScope, _nrgiCommoditiesSrvc_) {
//    //         nrgiCommoditiesSrvc = _nrgiCommoditiesSrvc_;
//    //         $scope = $rootScope.$new();
//    //         /*jshint unused: true*/
//    //         /*jslint unparam: true*/
//    //         commodityQuerySpy = sinon.spy(function (uselessObject, callback) {
//    //             callback(commoditiesData);
//    //         });
//    //         /*jshint unused: false*/
//    //         /*jslint unparam: false*/
//    //         commodityQueryStub = sinon.stub(nrgiCommoditiesSrvc, 'query', commodityQuerySpy);
//    //
//    //         // $controller('nrgiCommodityListCtrl', {$scope: $scope});
//    //     }
//    // ));
//    //
//    // it('loads the commodity data', function () {
//    //     $scope.commodities.should.deep.equal([{data: [commoditiesData[0]]}]);
//    // });
//
//    // describe('#getExportedCommodities', function () {
//    //     it('returns transformed commodity data', function () {
//    //         $scope.getExportedQuestions().should.deep.equal([
//    //             {
//    //                 _id: commoditiesData[0]._id,
//    //                 commodity_name: commoditiesData[0].commodity_name,
//    //                 commodity_type: commoditiesData[0].commodity_type,
//    //                 commodity_id: commoditiesData[0].commodity_id,
//    //                 concessions: commoditiesData[0].concessions,
//    //                 projects: commoditiesData[0].projects,
//    //                 fields: commoditiesData[0].fields,
//    //                 sites: commoditiesData[0].sites,
//    //                 contract: commoditiesData[0].contract
//    //             }
//    //         ]);
//    //     });
//    // });
//
//    // describe('#newQuestionDialog', function () {
//    //     it('opens a dialog', function () {
//    //         var dialogFactoryMock = sinon.mock(rgiDialogFactory);
//    //         dialogFactoryMock.expects('questionNew').withArgs($scope);
//    //
//    //         $scope.newQuestionDialog();
//    //
//    //         dialogFactoryMock.verify();
//    //         dialogFactoryMock.restore();
//    //     });
//    //
//    // });
//    //
//    // afterEach(function () {
//    //     questionQueryStub.restore();
//    //     getPreceptsStub.restore();
//    // });
//});
//
//
//
//
