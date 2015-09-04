'use strict';

/**
 * Construct an {@link RTCPeerConnectionIceEvent}.
 * @class
 * @classdesc
 * @extends Event
 * @param {string} type - "icecandidate"
 * @param {object} init
 * @property {MediaStream} stream
 */
function RTCPeerConnectionIceEvent(type, init) {
  if (!(this instanceof RTCPeerConnectionIceEvent)) {
    return new RTCPeerConnectionIceEvent(type, init);
  }
  Event.call(this, type, init);
  Object.defineProperties(this, {
    candidate: {
      enumerable: true,
      value: init.candidate
    }
  });
}

module.exports = RTCPeerConnectionIceEvent;
