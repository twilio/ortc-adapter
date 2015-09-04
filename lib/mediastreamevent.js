'use strict';

/**
 * Construct a {@link MediaStreamEvent}.
 * @class
 * @classdesc
 * @extends Event
 * @param {string} type - one of "addstream" or "removestream"
 * @param {object} init
 * @property {MediaStream} stream
 */
function MediaStreamEvent(type, init) {
  if (!(this instanceof MediaStreamEvent)) {
    return new MediaStreamEvent(type, init);
  }
  Event.call(this, type, init);
  Object.defineProperties(this, {
    stream: {
      enumerable: true,
      value: init.stream
    }
  });
}

module.exports = MediaStreamEvent;
