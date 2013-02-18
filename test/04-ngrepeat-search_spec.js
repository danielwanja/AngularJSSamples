'use strict';

/* http://docs.angularjs.org/guide/dev_guide.e2e-testing */

describe('my app', function() {

  beforeEach(function() {
    browser().navigateTo('/04-ngrepeat-search/index.html');
  });


  it('should not be filtered by default', function() {
    expect(browser().location().url()).toBe("");
    expect(repeater('.thumbnail').count()).toEqual(10);

  });

  it('should filter', function () {
    input('search').enter("bourne")
    expect(repeater('.thumbnail').count()).toEqual(1);
  });

});
