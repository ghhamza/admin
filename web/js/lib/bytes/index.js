
/**
 * Parse byte `size` string.
 *
 * @param {String} size
 * @return {Number}
 * @api public
 */

/* jshint bitwise: false, curly: false */

define(function(require, exports, module) {
  'use strict';

  module.exports = function(size) {
    var parts, n, type, map;

    if ('number' === typeof size) return convert(size);

    parts  = size.match(/^(\d+(?:\.\d+)?) *(kb|mb|gb|tb)$/);
    n = parseFloat(parts[1]);
    type = parts[2];

    map = {
      kb: 1 << 10,
      mb: 1 << 20,
      gb: 1 << 30,
      tb: ((1 << 30) * 1024)
    };

    return map[type] * n;
  };

  /**
   * convert bytes into string.
   *
   * @param {Number} b - bytes to convert
   * @return {String}
   * @api public
   */

  function convert (b) {
    var tb, gb, mb, kb, abs;

    tb = ((1 << 30) * 1024);
    gb = 1 << 30;
    mb = 1 << 20;
    kb = 1 << 10;
    abs = Math.abs(b);

    if (abs >= tb) return (Math.round(b / tb * 100) / 100) + 'TB';
    if (abs >= gb) return (Math.round(b / gb * 100) / 100) + 'GB';
    if (abs >= mb) return (Math.round(b / mb * 100) / 100) + 'MB';
    if (abs >= kb) return (Math.round(b / kb * 100) / 100) + 'kB';

    return b + 'b';
  }
});
