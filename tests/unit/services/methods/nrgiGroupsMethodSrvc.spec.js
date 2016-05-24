'use strict';

describe('nrgiGroupsMethodSrvc', function () {
    beforeEach(module('app'));

    var nrgiGroupsMethodSrvc;
    var $q, nrgiGroupsSrvc;
    var $qDeferStub, $qDeferSpy, expectedPromise;

    beforeEach(inject(function (_nrgiGroupsMethodSrvc_, _$q_, _nrgiGroupsSrvc_) {
        $q = _$q_;
        nrgiGroupsSrvc = _nrgiGroupsSrvc_;
        nrgiGroupsMethodSrvc = _nrgiGroupsMethodSrvc_;
    }));

    describe('#createCompanyGroup', function () {
        var nrgiCompanyGroupSrvcStub;

        it('resolves the deferred in positive case', function () {
            expectedPromise = 'POSITIVE';

            nrgiCompanyGroupSrvcStub = sinon.stub(nrgiGroupsSrvc.prototype, '$save', function() {
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

            nrgiGroupsMethodSrvc.createGroup([expectedPromise]).should.be.equal(expectedPromise);
            $qDeferSpy.called.should.be.equal(true);
        });

        it('resolves the deferred in positive case', function () {
            expectedPromise = 'NEGATIVE';
            var REJECT_RESPONSE = {
                data: {reason: 'REJECT_INSERTION'}
            };

            nrgiCompanyGroupSrvcStub = sinon.stub(nrgiGroupsSrvc.prototype, '$save', function() {
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

            nrgiGroupsMethodSrvc.createGroup([expectedPromise]).should.be.equal(expectedPromise);
            $qDeferSpy.should.have.been.calledWith(REJECT_RESPONSE.data.reason);
        });

        afterEach(function () {
            nrgiCompanyGroupSrvcStub.restore();
        });
    });

    describe('#updateCompanyGroup', function () {
        it('resolves the deferred in positive case', function () {
            expectedPromise = 'POSITIVE';

            $qDeferSpy = sinon.spy();
            $qDeferStub = sinon.stub($q, 'defer', function() {
                return {
                    resolve: $qDeferSpy,
                    promise: expectedPromise
                };
            });

            nrgiGroupsMethodSrvc.updateGroup({
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

        //console.log('COMPANY GROUP METHOD SERVICE: MISSING NEGATIVE UPDATE CASE')

        it('rejects the deferred in negative case', function () {
             expectedPromise = 'NEGATIVE';
             var REASON = 'REASON';

             $qDeferSpy = sinon.spy();
             $qDeferStub = sinon.stub($q, 'defer', function() {
                 return {
                     reject: $qDeferSpy,
                     promise: expectedPromise
                 };
             });

             nrgiGroupsMethodSrvc.updateGroup({
                 $update: function() {
                     return {
                         then: function(uselessCallbackPositive, callbackNegative) {
                             callbackNegative({
                                 data: {reason: REASON}
                             });
                         }
                     };
                 }
             }).should.be.equal(expectedPromise);

             $qDeferSpy.should.have.been.calledWith(REASON);
        });
    });

    describe('#deleteCompanyGroup', function () {
        var nrgiCompanyGroupSrvcStub;

        it('resolves the deferred in positive case', function () {
            expectedPromise = 'POSITIVE';

            nrgiCompanyGroupSrvcStub = sinon.stub(nrgiGroupsSrvc.prototype, '$delete', function() {
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

            nrgiGroupsMethodSrvc.deleteGroup([expectedPromise]).should.be.equal(expectedPromise);
            $qDeferSpy.called.should.be.equal(true);
        });

        //console.log('COMPANY GROUP METHOD SERVICE: MISSING NEGATIVE DELETE CASE')

        it('resolves the deferred in negative case', function () {
             expectedPromise = 'NEGATIVE';
             var REJECT_RESPONSE = {
                 data: {reason: 'REJECT_INSERTION'}
             };

            nrgiCompanyGroupSrvcStub = sinon.stub(nrgiGroupsSrvc.prototype, '$delete', function() {
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

             nrgiGroupsMethodSrvc.deleteGroup([expectedPromise]).should.be.equal(expectedPromise);
             $qDeferSpy.should.have.been.calledWith(REJECT_RESPONSE.data.reason);
        });

        afterEach(function () {
            $qDeferStub.restore();
            // nrgiGroupsSrvc.restore();
        });
    });


    afterEach(function () {
        $qDeferStub.restore();
    });
});