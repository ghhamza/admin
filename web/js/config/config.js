/**
 * @filename config.js
 */

(function () {
  'use strict';

  requirejs.config({
    baseUrl: '../../js',
    paths: {
      'hbs': 'lib/hbs/hbs',
      'bootstrap': 'lib/bootstrap/bootstrap',
      'backbone': 'lib/backbone/index',
      'text': 'lib/require/text',
      'i18n': 'lib/require/i18n',
      'jquery': 'lib/jquery/jquery',
      'handlebars': 'lib/handlebars/handlebars',
      'slimscroll': 'lib/jquery/plugins/slimscroll',
      'tree': 'lib/jquery/plugins/tree',
      'underscore': 'lib//underscore/underscore'
    },
    shim: {
      handlebars: {
        exports: 'Handlebars'
      },
      bootstrap: {deps: ['jquery']},
      slimscroll: {deps: ['jquery']},
      tree: {deps: ['jquery']}
    },

    hbs: { // optional
      helpers: true,            // default: true
      i18n: false,              // default: false
      templateExtension: 'hbs', // default: 'hbs'
      partialsUrl: ''           // default: ''
    }
  });

  requirejs(['app'], function (app) {
    app.run();
  });
}());
