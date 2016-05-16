'use strict';

describe('nrgiSitesMethodSrvc', function () {
    beforeEach(module('app'));

    var nrgiSitesMethodSrvc;
    var $q, nrgiSitesSrvc;
    var $qDeferStub, $qDeferSpy, expectedPromise;

    beforeEach(inject(function (_nrgiSitesMethodSrvc_, _$q_, _nrgiSitesSrvc_) {
        $q = _$q_;
        nrgiSitesSrvc = _nrgiSitesSrvc_;
        nrgiSitesMethodSrvc = _nrgiSitesMethodSrvc_;
    }));

    describe('#createSites', function () {
        var nrgiSiteSrvcStub;

        it('resolves the deferred in positive case', function () {
            expectedPromise = 'POSITIVE';

            nrgiSiteSrvcStub = sinon.stub(nrgiSitesSrvc.prototype, '$save', function() {
                return {
                    then: function(callback) {
                        callback();
                    }
                };
            });

            $qDeferSpy = sinon.spy();
            $qDeferStub = sinon.stub($q, 'defer', function() {
                return {
                    resolve: $qDeferSpy,
                    promise: expectedPromise
                };
            });

            nrgiSitesMethodSrvc.createSite([expectedPromise]).should.be.equal(expectedPromise);
            $qDeferSpy.called.should.be.equal(true);
        });

        it('resolves the deferred in positive case', function () {
            expectedPromise = 'NEGATIVE';
            var REJECT_RESPONSE = {
                data: {reason: 'REJECT_INSERTION'}
            };

            nrgiSiteSrvcStub = sinon.stub(nrgiSitesSrvc.prototype, '$save', function() {
                return {
                    then: function(callbackPositive, callbackNegative) {
                        callbackNegative(REJECT_RESPONSE);
                    }
                };
            });

            $qDeferSpy = sinon.spy();
            $qDeferStub = sinon.stub($q, 'defer', function() {
                return {
                    reject: $qDeferSpy,
                    promise: expectedPromise
                };
            });

            nrgiSitesMethodSrvc.createSite([expectedPromise]).should.be.equal(expectedPromise);
            $qDeferSpy.should.have.been.calledWith(REJECT_RESPONSE.data.reason);
        });

        afterEach(function () {
            nrgiSiteSrvcStub.restore();
        });
    });

    describe('#updateSites', function () {
        it('resolves the deferred in positive case', function () {
            expectedPromise = 'POSITIVE';

            $qDeferSpy = sinon.spy();
            $qDeferStub = sinon.stub($q, 'defer', function() {
                return {
                    resolve: $qDeferSpy,
                    promise: expectedPromise
                };
            });

            nrgiSitesMethodSrvc.updateSite({
                $update: function() {
                    return {
                        then: function(callbackPositive) {
                            callbackPositive();
                        }
                    };
                }
            }).should.be.equal(expectedPromise);

            $qDeferSpy.called.should.be.equal(true);
        });

        console.log('SITES METHOD SERVICE: MISSING NEGATIVE UPDATE CASE')

        // it('rejects the deferred in negative case', function () {
        //     expectedPromise = 'NEGATIVE';
        //     var REASON = 'REASON';
        //
        //     $qDeferSpy = sinon.spy();
        //     $qDeferStub = sinon.stub($q, 'defer', function() {
        //         return {
        //             reject: $qDeferSpy,
        //             promise: expectedPromise
        //         };
        //     });
        //
        //     nrgiSiteSrvcStub.updateSite({
        //         $update: function() {
        //             return {
        //                 then: function(uselessCallbackPositive, callbackNegative) {
        //                     callbackNegative({
        //                         data: {reason: REASON}
        //                     });
        //                 }
        //             };
        //         }
        //     }).should.be.equal(expectedPromise);
        //
        //     $qDeferSpy.should.have.been.calledWith(REASON);
        // });
    });

    describe('#deleteSites', function () {
        var nrgiSiteSrvcStub;

        it('resolves the deferred in positive case', function () {
            expectedPromise = 'POSITIVE';

            nrgiSiteSrvcStub = sinon.stub(nrgiSitesSrvc.prototype, '$delete', function() {
                return {
                    then: function(callback) {
                        callback();
                    }
                };
            });

            $qDeferSpy = sinon.spy();
            $qDeferStub = sinon.stub($q, 'defer', function() {
                return {
                    resolve: $qDeferSpy,
                    promise: expectedPromise
                };
            });

            nrgiSitesMethodSrvc.deleteSite([expectedPromise]).should.be.equal(expectedPromise);
            $qDeferSpy.called.should.be.equal(true);
        });

        console.log('SITES METHOD SERVICE: MISSING NEGATIVE DELETE CASE')

        // it('resolves the deferred in negative case', function () {
        //     expectedPromise = 'NEGATIVE';
        //     var REJECT_RESPONSE = {
        //         data: {reason: 'REJECT_INSERTION'}
        //     };
        //
        //     nrgiSiteSrvcStub = sinon.stub(nrgiCommoditiesSrvc.prototype, '$delete', function() {
        //         return {
        //             then: function(callbackPositive, callbackNegative) {
        //                 callbackNegative(REJECT_RESPONSE);
        //             }
        //         };
        //     });
        //
        //     $qDeferSpy = sinon.spy();
        //     $qDeferStub = sinon.stub($q, 'defer', function() {
        //         return {
        //             reject: $qDeferSpy,
        //             promise: expectedPromise
        //         };
        //     });
        //
        //     nrgiSitesMethodSrvc.deleteSite([expectedPromise]).should.be.equal(expectedPromise);
        //     $qDeferSpy.should.have.been.calledWith(REJECT_RESPONSE.data.reason);
        // });

        afterEach(function () {
            $qDeferStub.restore();
            // nrgiSitesSrvc.restore();
        });
    });


    afterEach(function () {
        $qDeferStub.restore();
    });
});