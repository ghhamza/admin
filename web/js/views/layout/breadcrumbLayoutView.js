/**
 * Created by hamzaghandouri on 26/01/15.
 */
define(function (require) {
  'use strict';

  var BaseView = require('views/base/baseView');
  var template = require('hbs!views/layout/breadcrumbLayoutTemplate');

  var View = BaseView.extend({
    template: template,
    tagName: 'section',
    className: 'content-header',
    render: function(){
      this.$el.html(this.template({foo: 'breadcrumb'}));
      return this;
    }
  });

  return View;
});