'use strict';

var ortcAdapter = require('../lib');

(function(root, factory) {
  /* global define:true */
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  /* global module:true */
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.ortcAdapter = factory();
  }
}(this, function() {
  return ortcAdapter;
}));
