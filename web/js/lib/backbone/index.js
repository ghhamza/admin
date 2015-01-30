/**
 * Backbone Umbrella module that includes everything Backbone related:
 *
 * - plugins
 * - patches
 * - etc...
 *
 * This is the module that should be declared as the 'backbone' module ID in the AMD config.
 *
 * Hence this is the Backbone module that should be required by any module specifying Backbone as a dependency.
 */
define(function(require){
  'use strict';

  var Backbone;

  require('./lib/backbone/_plugins');
  var rHelper = require('./lib/backbone/helpers/relationalHelper/index');
  Backbone = require('./lib/backbone/_bootstrap');

  rHelper.setBackbone(Backbone);
  Backbone.relationalHelper = rHelper;

  Backbone.noConflict();

  return Backbone;

});
