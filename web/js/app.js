define(function (require) {
    'use strict';

    var Backbone = require('backbone');
    var LayoutView = require('views/layout/layoutView');

    require('bootstrap');

    return {
        layout: function () {
            return new LayoutView();
        },

        run: function () {

          Backbone.history.start();
          this.layout().render();
        }
    };
});