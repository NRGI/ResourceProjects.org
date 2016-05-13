describe("Unit: Testing zpad Filters", function() {

    beforeEach(module('app'));

    var codeFilter;

    it('should have a zpad filter', inject(function ($filter) {
        expect($filter('zpad')).not.toBeNull();
    }));

    it('testing zpad filter', inject(function ($filter) {
        codeFilter = $filter('zpad');
        expect(codeFilter('04',1)).toEqual("4");
        expect(codeFilter('024',2)).toEqual("24");
    }));
});