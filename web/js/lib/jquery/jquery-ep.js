define(function(require) {
  'use strict';

  var $ = require('jquery');
  require('./lib/jquery/plugins/autosize');
  require('./lib/jquery/plugins/textext');
  require('./lib/jquery/plugins/htmlclean-amd');
  require('./lib/jquery/plugins/fileUpload');
  require('./lib/jquery/plugins/minform');
  require('./lib/jquery/plugins/epbox');
  require('./lib/jquery/plugins/jquery.scrollTo');
  $.noConflict();
  return $;
});
