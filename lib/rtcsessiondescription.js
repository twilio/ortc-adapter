'use strict';

/**
 * Construct an {@link RTCSessionDescription}.
 * @class
 * @classdesc
 * @param {object} description
 * @property {string} sdp
 * @property {string} type - one of "offer" or "answer"
 */
function RTCSessionDescription(description) {
  if (!(this instanceof RTCSessionDescription)) {
    return new RTCSessionDescription(description);
  }
  Object.defineProperties(this, {
    sdp: {
      enumerable: true,
      value: description.sdp
    },
    type: {
      enumerable: true,
      value: description.type
    }
  });
}

module.exports = RTCSessionDescription;
