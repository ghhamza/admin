/**
 * Created by hamzaghandouri on 26/01/15.
 */
define(function (require) {
  'use strict';

  var $ = require('jquery');
  var BaseView = require('views/base/baseView');
  var template = require('hbs!views/layout/leftSideLayoutTemplate');

  require('tree');

  var View = BaseView.extend({
    template: template,
    tagName: 'aside',
    className: 'left-side sidebar-offcanvas',

    render: function(){
      this.$el.html(this.template({foo: 'left side'}));
      this.$el.find(".sidebar .treeview").tree();
      return this;
    }
  });

  return View;
});