'use strict';

describe('zpad FILTER', function () {
    beforeEach(module('app'));
    var $filter;

    beforeEach(inject(
        function (_$filter_) {
            $filter = _$filter_;
        }
    ));

    it('pads number with leading zeros', function () {
        $filter('zpad')('04',1).should.be.equal('4');
        $filter('zpad')('024',2).should.be.equal('24');
        $filter('zpad')(1, 1).should.be.equal('1');
        $filter('zpad')(1, 3).should.be.equal('001');
        $filter('zpad')(1, 5).should.be.equal('00001');
    });
});