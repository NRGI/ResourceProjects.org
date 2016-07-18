'use strict';

describe('nrgiContentMethodSrvc', function () {
    beforeEach(module('app'));

    var nrgiContentMethodSrvc;
    var $q;
    var $qDeferStub, $qDeferSpy, expectedPromise;

    beforeEach(inject(function (_nrgiContentMethodSrvc_, _$q_) {
        $q = _$q_;
        nrgiContentMethodSrvc = _nrgiContentMethodSrvc_;
    }));

    describe('#updateContentPage', function () {
        it('resolves the deferred in positive case', function () {
            expectedPromise = 'POSITIVE';

            $qDeferSpy = sinon.spy();
            $qDeferStub = sinon.stub($q, 'defer', function () {
                return {
                    resolve: $qDeferSpy,
                    promise: expectedPromise
                };
            });

            nrgiContentMethodSrvc.updateContentPage({
                $update: function () {
                    return {
                        then: function (callbackPositive) {
                            callbackPositive();
                        }
                    };
                }
            }).should.be.equal(expectedPromise);

            $qDeferSpy.called.should.be.equal(true);
        });

        it('rejects the deferred in negative case', function () {
            expectedPromise = 'NEGATIVE';
            var REASON = 'REASON';

            $qDeferSpy = sinon.spy();
            $qDeferStub = sinon.stub($q, 'defer', function () {
                return {
                    reject: $qDeferSpy,
                    promise: expectedPromise
                };
            });

            nrgiContentMethodSrvc.updateContentPage({
                $update: function () {
                    return {
                        then: function (uselessCallbackPositive, callbackNegative) {
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



    afterEach(function () {
        $qDeferStub.restore();
    });
});