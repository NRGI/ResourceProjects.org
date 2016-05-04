describe("Unit: Testing sanitize Filters", function() {

    beforeEach(module('app'));

    var $sce,
        codeFilter;

    it('should have a sanitize filter', inject(function ($filter) {
        expect($filter('sanitize')).not.toBeNull();
    }));

    it('testing sanitize filter', inject(function ($filter,_$sce_) {
        $sce = _$sce_;
        codeFilter = $filter('sanitize');
        expect($sce.getTrustedHtml(codeFilter('Andrea (Michoacán)'))).toEqual("Andrea (Michoacán)");
        expect($sce.getTrustedHtml(codeFilter('ἱερογλύφος'))).toEqual("ἱερογλύφος");
    }));
});