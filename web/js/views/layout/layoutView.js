/**
 * Created by hamzaghandouri on 26/01/15.
 */
define(function (require) {
  'use strict';

  var $ = require('jquery');
  var _ = require('underscore');
  var BaseView = require('views/base/baseView');
  var template = require('hbs!views/layout/layoutTemplate');
  var HeaderView = require('views/layout/headerLayoutView');
  var LeftSideView = require('views/layout/leftSideLayoutView');
  var BreadcrumbView = require('views/layout/breadcrumbLayoutView');

  require('slimscroll');

  var View = BaseView.extend({
    template: template,
    el: 'body',
    render: function () {
      var headerView, leftSideView, breadcrumbView, self = this;

      this.$el.html(this.template({foo: 'baar'}));

      headerView = new HeaderView();
      this.$el.prepend(headerView.render().el);

      leftSideView = new LeftSideView();
      this.$el.find('#wrapper').prepend(leftSideView.render().el);

      breadcrumbView = new BreadcrumbView();
      this.$el.find('#wrapper > .right-side').prepend(breadcrumbView.render().el);

      self.adminLteFix();

      return this;
    },

    adminLteFix: function () {
      /*
       * ADD SLIMSCROLL TO THE TOP NAV DROPDOWNS
       * ---------------------------------------
       */
      $(".navbar .menu").slimscroll({
        height: "200px",
        alwaysVisible: false,
        size: "3px"
      }).css("width", "100%");


      var self = this;
      this.fix();
      $(window).resize(function () {
        self.fix();
        self.fixSidebar();
      });
      this.fixSidebar();
    },

    fix: function () {

      var height = $(window).height() - $(".wrapper").position().top - ($("body > .footer").outerHeight() || 0);
      $(".wrapper").css("min-height", height + "px");
      var content = $(".wrapper").height();
      //If the wrapper height is greater than the window
      if (content > height)
      //then set sidebar height to the wrapper
        $(".left-side, html, body").css("min-height", content + "px");
      else {
        //Otherwise, set the sidebar to the height of the window
        $(".left-side, html, body").css("min-height", height + "px");
      }
    },

    fixSidebar: function () {
      //Make sure the body tag has the .fixed class
      if (!$("body").hasClass("fixed")) {
        return;
      }

      //Add slimscroll
      $(".sidebar").slimscroll({
        height: ($(window).height() - $(".header").height()) + "px",
        color: "rgba(0,0,0,0.2)"
      });
    }
  });

  return View;
});