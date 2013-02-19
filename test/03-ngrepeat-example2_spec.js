'use strict';

/* http://docs.angularjs.org/guide/dev_guide.e2e-testing */

describe('my app', function() {

  beforeEach(function() {
    browser().navigateTo('/03-ngrepeat/example2.html');
  });


  it('should not be filtered by default', function() {
    expect(browser().location().url()).toBe("");
    expect(repeater('div.thumbnail').count()).toEqual(10);

  });

  it('should filter', function () {
    input('search').enter("boom")
    expect(repeater('div.thumbnail').count()).toEqual(1);
  });

});
