'use strict';

/**
 * Construct an {@link RTCIceCandidate}.
 * @class
 * @classdesc
 * @param {object} candidate
 * @property {string} candidate
 * @property {number} sdpMLineIndex
 */
function RTCIceCandidate(candidate) {
  if (!(this instanceof RTCIceCandidate)) {
    return new RTCIceCandidate(candidate);
  }
  Object.defineProperties(this, {
    candidate: {
      enumerable: true,
      value: candidate.candidate
    },
    sdpMLineIndex: {
      enumerable: true,
      value: candidate.sdpMLineIndex
    }
  });
}

module.exports = RTCIceCandidate;
