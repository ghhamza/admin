/**
 * Created by hamzaghandouri on 26/01/15.
 */
define(function (require) {
  'use strict';

  var BaseView = require('views/base/baseView');
  var template = require('hbs!views/layout/headerLayoutTemplate');

  var View = BaseView.extend({
    template: template,
    tagName: 'haeder',
    id: 'header',
    className: 'header',

    events: {
      'click a.sidebar-toggle': 'toggleMenu'
    },

    toggleMenu: function () {
      console.log('toggle');
      if ($(window).width() <= 992) {
        $('.row-offcanvas').toggleClass('active');
        $('.left-side').removeClass("collapse-left");
        $(".right-side").removeClass("strech");
        $('.row-offcanvas').toggleClass("relative");
      } else {
        //Else, enable content streching
        $('.left-side').toggleClass("collapse-left");
        $(".right-side").toggleClass("strech");
      }
    },

    render: function () {
      this.$el.html(this.template({foo: 'baar'}));
      return this;
    }
  });

  return View;
});