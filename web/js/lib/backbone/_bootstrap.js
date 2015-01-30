/**
 * Export a Backbone module with LayoutManager and the _viewHelper functionality already backed in.
 *
 * Backbone plugins should require this module instead of the original, vanilla backbone.
 *
 * This module ensures that layoutmanager is loaded before any other plugins.
 * This in turns garantees that Layoutmanager patches to Backbone.View are available to all Backbone.View subclasses,
 * including the ones defined by plugins.
 *
 * Same goes for the _viewHelper patches;
 */
define(function(require) {
  'use strict';

  var Backbone, _viewHelper;

  Backbone = require('./backbone');
  _viewHelper = require('./_viewHelper');

  Backbone.View = Backbone.View.extend(_viewHelper(Backbone.View));

  return Backbone;
});
