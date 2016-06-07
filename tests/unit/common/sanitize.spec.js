'use strict';

describe("sanitize FILTER", function() {
    beforeEach(module('app'));
    var $filter,$sce;

    beforeEach(inject(
        function (_$filter_,_$sce_) {
            $filter = _$filter_;
            $sce = _$sce_;
        }
    ));
    it('sanitized incoming html', function () {
        $filter('sanitize')('<span>Andrea (Michoacán)</span>').$$unwrapTrustedValue().should.be.equal('<span>Andrea (Michoacán)</span>');
        $sce.getTrustedHtml($filter('sanitize')('<span ng-bind-html="Andrea (Michoacán)"></span>')).should.be.equal('<span ng-bind-html="Andrea (Michoacán)"></span>');
    });
});


