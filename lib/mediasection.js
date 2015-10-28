'use strict';

/**
 * Construct a {@link MediaSection}.
 * @class
 * @classdesc
 * @param {?string} [address="0.0.0.0"]
 * @param {?Array<RTCIceCandidate>} [candidates=[]]
 * @param {object} capabilities
 * @param {string} direction - one of "sendrecv", "sendonly", "recvonly", or "inactive"
 * @param {string} kind - one of "audio" or "video"
 * @param {string} mid
 * @param {?number} [port=9]
 * @param {?boolean} [rtcpMux=true]
 * @param {?string} streamId
 * @param {?MediaStreamTrack} track
 * @property {Array<RTCIceCandidate>} candidates
 * @property {object} capabilities
 * @property {?RTCIceCandidate} defaultCandidate
 * @property {string} direction - one of "sendrecv", "sendonly", "recvonly", or "inactive"
 * @property {string} kind - one of "audio" or "video"
 * @property {string} mid
 * @property {number} port
 * @property {boolean} rtcpMux
 * @property {?string} streamId
 * @property {?MediaStreamTrack} track
 */
function MediaSection(address, _candidates, capabilities, direction, kind, mid, port, rtcpMux, streamId, track) {
  if (!(this instanceof MediaSection)) {
    return new MediaSection(address, _candidates, capabilities, direction, kind,
      mid, port, rtcpMux, streamId, track);
  }
  var rejected = false;
  address = address || '0.0.0.0';
  port = typeof port === 'number' ? port : 9;
  rtcpMux = typeof rtcpMux === 'boolean' ? rtcpMux : true;
  streamId = streamId || null;
  track = track || null;
  Object.defineProperties(this, {
    _address: {
      get: function() {
        return address;
      },
      set: function(_address) {
        address = _address;
      }
    },
    _candidates: {
      value: []
    },
    _port: {
      get: function() {
        return port;
      },
      set: function(_port) {
        port = _port;
      }
    },
    _rejected: {
      get: function() {
        return rejected;
      },
      set: function(_rejected) {
        rejected = _rejected;
      }
    },
    _streamId: {
      get: function() {
        return streamId;
      },
      set: function(_streamId) {
        streamId = _streamId;
      }
    },
    _track: {
      get: function() {
        return track;
      },
      set: function(_track) {
        track = _track;
      }
    },
    _triples: {
      value: new Set()
    },
    candidates: {
      enumerable: true,
      get: function() {
        return this._candidates.slice();
      }
    },
    capabilities: {
      enumerable: true,
      value: capabilities
    },
    defaultCandidate: {
      enumerable: true,
      get: function() {
        return this._candidates.length ? this._candidates[0] : null;
      }
    },
    direction: {
      enumerable: true,
      value: direction
    },
    kind: {
      enumerable: true,
      value: kind
    },
    port: {
      enumerable: true,
      get: function() {
        return port;
      }
    },
    rtcpMux: {
      enumerable: true,
      value: rtcpMux
    },
    streamId: {
      enumerable: true,
      get: function() {
        return streamId;
      }
    },
    track: {
      enumerable: true,
      get: function() {
        return track;
      }
    }
  });
  if (_candidates) {
    _candidates.forEach(this.addCandidate, this);
  }
}

/**
 * Add an RTCIceCandidate to the {@link MediaSection}.
 * @param {RTCIceCandidate} candidate
 * @returns {boolean}
 */
MediaSection.prototype.addCandidate = function addCandidate(candidate) {
  var triple = [
    candidate.ip,
    candidate.port,
    candidate.protocol
  ].join(' ');
  if (!this._triples.has(triple)) {
    this._triples.add(triple);
    this._candidates.push(candidate);
    return true;
  }
  return false;
};

/**
 * Copy the {@link MediaSection}.
 * @param {?string} address - if unsupplied, use the {@link MediaSection} defaults
 * @param {?Array<RTCIceCandidates> candidates - if unsupplied, use the {@link MediaSection} defaults
 * @param {?string} capabilities - if unsupplied, copy the existing capabilities
 * @param {?string} direction - if unsupplied, copy the existing direction
 * @param {?number} port - if unsupplied, use the {@link MediaSection} defaults
 * @param {?string} streamId - if unsupplied, set to null
 * @param {?MediaStreamTrack} track - if unsupplied, set to null
 * @returns {MediaSection}
 */
MediaSection.prototype.copy = function copy(address, candidates, capabilities, direction, port, streamId, track) {
  return new MediaSection(this.address, candidates,
    capabilities || this.capabilities, direction || this.direction, this.kind,
    this.mid, port, this.rtcpMux, streamId, track);
};

/**
 * Copy and reject the {@link MediaSection}.
 * @returns {MediaSection}.
 */
MediaSection.prototype.copyAndReject = function copyAndReject() {
  var mediaSection = new MediaSection(null, this.candidates, this.capabilities,
    this.direction, this.kind, this.mid, null, this.rtcpMux);
  return mediaSection.reject();
};

/**
 * Reject the {@link MediaSection}.
 * @returns {MediaSection}
 */
MediaSection.prototype.reject = function reject() {
  // RFC 3264, Section 6:
  //
  //     To reject an offered stream, the port number in the corresponding
  //     stream in the answer MUST be set to zero. Any media formats listed
  //     are ignored. At least one MUST be present, as specified by SDP.
  //
  this.setPort(0);
  return this;
};

/**
 * Set the {@link MediaSection}'s address.
 * @param {string} address
 * @returns {MediaSection}
 */
MediaSection.prototype.setAddress = function setAddress(address) {
  this._address = address;
  return this;
};

/**
 * Set the {@link MediaSection}'s port.
 * @param {number} port
 * @returns {MediaSection}
 */
MediaSection.prototype.setPort = function setPort(port) {
  this._port = port;
  return this;
};

/* MediaSection.prototype.setStreamId = function setStreamId(streamId) {
  this._streamId = streamId;
  return this;
};

MediaSection.prototype.setTrack = function setTrack(track) {
  this._track = track;
  return this;
}; */

module.exports = MediaSection;
