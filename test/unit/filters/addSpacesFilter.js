describe("Unit: Testing sanitize Filters", function() {

    beforeEach(module('app'));

    var codeFilter;

    it('should have a addSpaces filter', inject(function ($filter) {
        expect($filter('sanitize')).not.toBeNull();
    }));

    it('addSpaces filter', inject(function ($filter) {
        codeFilter = $filter('addSpaces');
        expect(codeFilter('Oil_and_gas')).toEqual("Oil and gas");
        expect(codeFilter('Lorem_ipsum_dolor_sit_amet,_consectetur_adipiscing_elit,_sed_do_eiusmod_tempor_incididunt_ut_labore_et_dolore_magna_aliqua.'))
            .toEqual("Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.");
    }));
});