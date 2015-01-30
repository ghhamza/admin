/**
 * Umbrella module that includes most Backbone plugins except layout manager.
 */
define(function(require){
  'use strict';

  require('./plugins/notifier');
  require('./plugins/modalDialog');
  require('./plugins/validation');
  require('./plugins/paginator');

});
