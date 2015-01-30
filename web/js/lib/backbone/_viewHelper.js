define(function(require) {
  'use strict';

  var _;

  _ = require('underscore');

  /**
   * Ensure that properties (other than those already managed by Backbone) of the options hash
   * are set directly on the instance.
   *
   */
  return function(parent) {
    return {
      constructor: function(options) {

        var DEFAULT_VIEW_OPTIONS = ['model', 'collection', 'el', 'id', 'className', 'tagName', 'attributes', 'events'];

        // !!! Order is important.
        // We need to pick the options ***BEFORE*** calling Backbone.View.
        // This is because Backbone.View in turn will invoke initialize
        // where we can thus assume that this options have been picked.
        _.extend(this, _.omit(options || {}, DEFAULT_VIEW_OPTIONS));
        parent.apply(this, arguments);
      }

    };
  };
});
