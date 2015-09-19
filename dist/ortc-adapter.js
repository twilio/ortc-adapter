/*! ortc-adapter.js 0.1.1

The following license applies to all parts of this software except as
documented below.

    Copyright (c) 2015, Twilio, inc.
    All rights reserved.

    Redistribution and use in source and binary forms, with or without
    modification, are permitted provided that the following conditions are
    met:

      1. Redistributions of source code must retain the above copyright
         notice, this list of conditions and the following disclaimer.

      2. Redistributions in binary form must reproduce the above copyright
         notice, this list of conditions and the following disclaimer in
         the documentation and/or other materials provided with the
         distribution.

      3. Neither the name of Twilio nor the names of its contributors may
         be used to endorse or promote products derived from this software
         without specific prior written permission.

    THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
    "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
    LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
    A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
    HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
    SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
    LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
    DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
    THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
    (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
    OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

This software includes sdp-transform under the following license:

    (The MIT License)

    Copyright (c) 2013 Eirik Albrigtsen

    Permission is hereby granted, free of charge, to any person obtaining
    a copy of this software and associated documentation files (the
    'Software'), to deal in the Software without restriction, including
    without limitation the rights to use, copy, modify, merge, publish,
    distribute, sublicense, and/or sell copies of the Software, and to
    permit persons to whom the Software is furnished to do so, subject to
    the following conditions:

    The above copyright notice and this permission notice shall be
    included in all copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
    EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
    MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
    IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
    CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
    TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
    SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

 */
/* eslint strict:0 */
(function(root, selectWebRTC) {
  var webrtc = selectWebRTC();
  /* global define:true */
  if (typeof define === 'function' && define.amd) {
    define([], webrtc);
  /* global module:true */
  } else if (typeof module === 'object' && module.exports) {
    module.exports = webrtc;
  } else {
    for (var key in webrtc) {
      root[key] = webrtc[key];
    }
  }
}(this, function() {
  /* eslint max-len:0 */
  var ortcAdapterBundle =
    (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

module.exports.RTCIceCandidate = require('./rtcicecandidate');
module.exports.RTCPeerConnection = require('./rtcpeerconnection');
module.exports.RTCSessionDescription = require('./rtcsessiondescription');

},{"./rtcicecandidate":4,"./rtcpeerconnection":5,"./rtcsessiondescription":7}],2:[function(require,module,exports){
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

},{}],3:[function(require,module,exports){
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

},{}],4:[function(require,module,exports){
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

},{}],5:[function(require,module,exports){
'use strict';

var MediaSection = require('./mediasection');
var MediaStreamEvent = require('./mediastreamevent');
var RTCIceCandidate = require('./rtcicecandidate');
var RTCPeerConnectionIceEvent = require('./rtcpeerconnectioniceevent');
var RTCSessionDescription = require('./rtcsessiondescription');
var sdpTransform = require('sdp-transform');
var sdpUtils = require('./sdp-utils');

/**
 * Construct an {@link RTCPeerConnection}.
 * @class
 * @classdesc This {@link RTCPeerConnection} is implemented in terms of ORTC APIs.
 * @param {RTCConfiguration} configuration
 * @property {string} iceConnectionState
 * @property {string} iceGatheringState
 * @property {?RTCSessionDescription} localDescription
 * @property {?function} onaddstream
 * @property {?function} onicecandidate
 * @property {?function} oniceconnectionstatechange
 * @property {?function} onsignalingstatechange
 * @property {?RTCSessionDescription} remoteDescription
 * @property {string} signalingState
 */
function RTCPeerConnection(configuration) {
  if (!(this instanceof RTCPeerConnection)) {
    return new RTCPeerConnection(configuration);
  }

  // ICE Gatherer

  var gatherOptions = makeGatherOptions(configuration);
  /* global RTCIceGatherer:true */
  var iceGatherer = new RTCIceGatherer(gatherOptions);
  var iceGatheringCompleted = false;

  iceGatherer.onlocalcandidate = this._onlocalcandidate.bind(this);

  var onicecandidate = null;
  var onicecandidateWasSet = false;

  var iceCandidatesAdded = 0;

  // ICE Transport

  /* global RTCIceTransport:true */
  var iceTransport = new RTCIceTransport();
  var oniceconnectionstatechange = null;

  iceTransport.onicestatechange = this._onicestatechange.bind(this);

  // DTLS Transport

  /* global RTCDtlsTransport:true */
  var dtlsTransport = new RTCDtlsTransport(iceTransport);

  dtlsTransport.ondtlsstatechange = this._ondtlsstatechange.bind(this);

  // Descriptions

  var signalingState = 'stable';
  var onsignalingstatechange = null;

  var localDescription = null;
  var remoteDescription = null;

  // Streams

  var onaddstream = null;

  Object.defineProperties(this, {
    _dtlsTransport: {
      value: dtlsTransport
    },
    _dtmfSenders: {
      value: new Map()
    },
    _gatherOptions: {
      value: gatherOptions
    },
    _iceCandidatesAdded: {
      get: function() {
        return iceCandidatesAdded;
      },
      set: function(_iceCandidatesAdded) {
        iceCandidatesAdded = _iceCandidatesAdded;
      }
    },
    _iceGatherer: {
      value: iceGatherer
    },
    _iceGatheringCompleted: {
      get: function() {
        return iceGatheringCompleted;
      },
      set: function(_iceGatheringCompleted) {
        iceGatheringCompleted = _iceGatheringCompleted;
      }
    },
    _iceTransport: {
      value: iceTransport
    },
    _localCandidates: {
      value: new Set()
    },
    _localDescription: {
      get: function() {
        return localDescription;
      },
      set: function(_localDescription) {
        localDescription = _localDescription;
      }
    },
    _localStreams: {
      value: []
    },
    _midCounters: {
      value: {
        audio: 0,
        video: 0
      }
    },
    _remoteCandidates: {
      value: new Set()
    },
    _remoteDescription: {
      get: function() {
        return remoteDescription;
      },
      set: function(_remoteDescription) {
        remoteDescription = _remoteDescription;
      }
    },
    _remoteStreams: {
      value: []
    },
    _rtpReceivers: {
      value: new Map()
    },
    _rtpSenders: {
      value: new Map()
    },
    _signalingState: {
      get: function() {
        return signalingState;
      },
      set: function(_signalingState) {
        signalingState = _signalingState;
        if (this.onsignalingstatechange) {
          this.onsignalingstatechange();
        }
      }
    },
    _streamIds: {
      value: new Map()
    },
    iceConnectionState: {
      enumerable: true,
      get: function() {
        return iceTransport.state;
      }
    },
    iceGatheringState: {
      enumerable: true,
      get: function() {
        return iceGatheringCompleted ? 'gathering' : 'complete';
      }
    },
    localDescription: {
      enumerable: true,
      get: function() {
        return localDescription;
      }
    },
    onaddstream: {
      enumerable: true,
      get: function() {
        return onaddstream;
      },
      set: function(_onaddstream) {
        onaddstream = _onaddstream;
      }
    },
    onicecandidate: {
      enumerable: true,
      get: function() {
        return onicecandidate;
      },
      set: function(_onicecandidate) {
        onicecandidate = _onicecandidate;
        if (!onicecandidateWasSet) {
          try {
            iceGatherer.getLocalCandidates()
              .forEach(iceGatherer.onlocalcandidate);
          } catch (error) {
            // Do nothing.
          }
        }
        onicecandidateWasSet = true;
      }
    },
    oniceconnectionstatechange: {
      enumerable: true,
      get: function() {
        return oniceconnectionstatechange;
      },
      set: function(_oniceconnectionstatechange) {
        oniceconnectionstatechange = _oniceconnectionstatechange;
      }
    },
    onsignalingstatechange: {
      enumerable: true,
      get: function() {
        return onsignalingstatechange;
      },
      set: function(_onsignalingstatechange) {
        onsignalingstatechange = _onsignalingstatechange;
      }
    },
    remoteDescription: {
      enumerable: true,
      get: function() {
        return remoteDescription;
      }
    },
    signalingState: {
      enumerable: true,
      get: function() {
        return signalingState;
      }
    }
  });
}

RTCPeerConnection.prototype._makeMid = function _makeMid(kind) {
  return kind + ++this._midCounters[kind];
};

/**
 * This method is assigned to the {@link RTCDtlsTransport}'s "ondtlsstatechange" event handler.
 * @access private
 * @param {object} event
 */
RTCPeerConnection.prototype._ondtlsstatechange = function _ondtlsstatechange(event) {
  void event;
  console.log('DTLS transport state: ' + this._dtlsTransport.state);
};

/**
 * This method is assigned to the {@link RTCIceTransport}'s "onicestatechange" event handler.
 * @access private
 * @param {object} event
 */
RTCPeerConnection.prototype._onicestatechange = function _onicestatechange(event) {
  console.log('ICE transport state: ' + this._iceTransport.state);
  if (this.oniceconnectionstatechange) {
    this.oniceconnectionstatechange(event);
  }
};

/**
 * This method is assigned to the {@link RTCIceGatherer}'s "onlocalcandidate" event handler.
 * @access private
 * @param {object} event
 */
RTCPeerConnection.prototype._onlocalcandidate = function _onlocalcandidate(event) {
  if (isEmptyObject(event.candidate)) {
    this._iceGatheringCompleted = true;
  }
  this._localCandidates.add(event.candidate);
  if (this.onicecandidate) {
    var webrtcCandidate = makeWebRTCCandidate(event.candidate);
    this.onicecandidate(makeOnIceCandidateEvent(webrtcCandidate));
  }
};

/**
 * Start sending RTP.
 * @access private
 * @param {MediaSection} mediaSection
 * @returns {this}
 */
RTCPeerConnection.prototype._sendRtp = function _sendRtp(mediaSection) {
  var kind = mediaSection.kind;
  // FIXME(mroberts): This is not right.
  this._rtpSenders.forEach(function(rtpSender) {
    if (rtpSender.track.kind !== kind) {
      return;
    }
    rtpSender.send(mediaSection.capabilities);
  }, this);
  return this;
};

/**
 * Start sending and receiving RTP for the given {@link MediaSection}s.
 * @access private
 * @param {Array<MediaSection>} mediaSections
 * @returns {this}
 */
RTCPeerConnection.prototype._sendAndReceiveRtp = function _sendAndReceiveRtp(mediaSections) {
  mediaSections.forEach(function(mediaSection) {
    if (mediaSection.direction === 'sendrecv' || mediaSection.direction === 'sendonly') {
      this._sendRtp(mediaSection);
    }
    if (mediaSection.direction === 'sendrecv' || mediaSection.direction === 'recvonly') {
    this._receiveRtp(mediaSection);
    }
  }, this);
  return this;
};

/**
 * Start receiving RTP.
 * @access private
 * @param {MediaSection} mediaSection
 * @returns {this}
 */
RTCPeerConnection.prototype._receiveRtp = function _receiveRtp(mediaSection) {
  var kind = mediaSection.capabilities.type;
  /* global RTCRtpReceiver:true */
  var rtpReceiver = new RTCRtpReceiver(this._dtlsTransport, kind);
  rtpReceiver.receive(mediaSection.capabilities);

  var track = rtpReceiver.track;
  this._rtpReceivers.set(track, rtpReceiver);

  // NOTE(mroberts): Without any source-level msid attribute, we are just
  // going to assume a one-to-one mapping between MediaStreams and
  // MediaStreamTracks.
  /* global MediaStream:true */
  var mediaStream = new MediaStream();
  mediaStream.addTrack(track);
  this._remoteStreams.push(mediaStream);

  if (this.onaddstream) {
    this.onaddstream(makeOnAddStreamEvent(mediaStream));
  }
  return this;
};

/**
 * Start the {@link RTCDtlsTransport}.
 * @access private
 * @param {RTCDtlsParameters} dtlsParameters - the remote DTLS parameters
 * @returns {this}
 */
RTCPeerConnection.prototype._startDtlsTransport = function _startDtlsTransport(dtlsParameters) {
  this._dtlsTransport.start(dtlsParameters);
  return this;
};

/**
 * Start the {@link RTCIceTransport}.
 * @access private
 * @param {RTCIceParameters} iceParameters - the remote ICE parameters
 * @returns {this}
 */
RTCPeerConnection.prototype._startIceTransport = function _startIceTransport(iceParameters) {
  var role = this.signalingState === 'have-local-offer'
    ? 'controlling'
    : 'controlled';
  this._iceTransport.start(this._iceGatherer, iceParameters, role);
  return this;
};

/**
 * Add an {@link RTCIceCandidate} to the {@link RTCPeerConnection}.
 * @param {RTCIceCandidate} candidate - the remote ICE candidate
 * @param {?function} [onSuccess]
 * @param {?function} [onFailure]
 * @returns {Promise}
 */
RTCPeerConnection.prototype.addIceCandidate = function addIceCandidate(candidate, onSuccess, onFailure) {
  // NOTE(mroberts): I'm not sure there is a scenario where we'd ever call
  // onFailure.
  void onFailure;

  this._iceCandidatesAdded++;

  console.log(
    'Adding ICE Candidate #' + this._iceCandidatesAdded + ': ' +
      (candidate ? candidate.candidate : 'end-of-candidates'));
  var ortcCandidate = makeORTCCandidate(candidate);

  // A candidate is identified by a triple of IP address, port, and protocol.
  // ORTC ICE candidates have no component ID, and so we need to deduplicate
  // the RTP and RTCP candidates when we're muxing.
  var triple =
    [ortcCandidate.ip, ortcCandidate.port, ortcCandidate.transport].join(' ');
  if (!this._remoteCandidates.has(triple)) {
    this._remoteCandidates.add(triple);
    this._iceTransport.addRemoteCandidate(ortcCandidate);
  }

  if (onSuccess) {
    onSuccess();
  }
};

/**
 * Add a {@link MediaStream} to the {@link RTCPeerConnection}.
 * @param {MediaStream} stream
 */
RTCPeerConnection.prototype.addStream = function addStream(mediaStream) {
  this._localStreams.push(mediaStream);
  mediaStream.getTracks().forEach(function(track) {
    /* eslint no-invalid-this:0 */
    /* global RTCRtpSender:true */
    var rtpSender = new RTCRtpSender(track, this._dtlsTransport);
    this._rtpSenders.set(track, rtpSender);
    this._streamIds.set(track, mediaStream.id);
  }, this);
};

/**
 * Close the {@link RTCPeerConnection}.
 */
RTCPeerConnection.prototype.close = function close() {
  this._signalingState = 'closed';
  this._rtpReceivers.forEach(function(rtpReceiver) {
    rtpReceiver.stop();
  });
  this._dtlsTransport.stop();
  this._iceTransport.stop();
};

/**
 * Construct an {@link RTCSessionDescription} containing an SDP answer.
 * @param {?function} [onSuccess]
 * @param {?function} [onFailure]
 * @returns {Promise<RTCSessionDescription>}
 */
RTCPeerConnection.prototype.createAnswer = function createAnswer(onSuccess, onFailure) {
  if (this.signalingState !== 'have-remote-offer') {
    return void onFailure(invalidSignalingState(this.signalingState));
  }

  // draft-ietf-rtcweb-jsep-11, Section 5.3.1:
  //
  //     The next step is to go through each offered m= section. If there is a
  //     local MediaStreamTrack of the same type which has been added to the
  //     PeerConnection via addStream and not yet associated with a m= section,
  //     and the specific m= section is either sendrecv or recvonly, the
  //     MediaStreamTrack will be associated with the m= section at this time.
  //     MediaStreamTracks are assigned using the canonical order described in
  //     Section 5.2.1.
  //
  var remote = sdpUtils.parseDescription(this.remoteDescription); // sdpTransform.parse(this.remoteDescription.sdp);
  var streams = this.getLocalStreams();
  var tracks = { audio: [], video: [] };
  streams.forEach(function(stream) {
    tracks.audio = tracks.audio.concat(stream.getAudioTracks());
    tracks.video = tracks.video.concat(stream.getVideoTracks());
  });
  var mediaSections = remote.mediaSections.map(function(remoteMediaSection) {
    var kind = remoteMediaSection.kind;
    var remoteDirection = remoteMediaSection.direction;

    var remoteCapabilities = remoteMediaSection.capabilities;
    var localCapabilities = RTCRtpSender.getCapabilities(kind);
    var sharedCodecs = intersectCodecs(remoteCapabilities.codecs,
      localCapabilities.codecs);
    var sharedCapabilities = { codecs: sharedCodecs };

    var capabilities = sharedCapabilities;
    var direction;
    var track;

    // RFC 3264, Section 6.1:
    //
    //     If the answerer has no media formats in common for a particular
    //     offered stream, the answerer MUST reject that media stream by
    //     setting the port to zero.
    //
    if (!sharedCodecs.length) {
      return remoteMediaSection.copyAndReject();
    }

    // RFC 3264, Section 6.1:
    //
    //     For streams marked as inactive in the answer, the list of media
    //     formats is constructed based on the offer. If the offer was
    //     sendonly, the list is constructed as if the answer were recvonly.
    //     Similarly, if the offer was recvonly, the list is constructed as if
    //     the answer were sendonly, and if the offer was sendrecv, the list is
    //     constructed as if the answer were sendrecv. If the offer was
    //     inactive, the list is constructed as if the offer were actually
    //     sendrecv and the answer were sendrecv.
    //
    if (remoteDirection === 'inactive'
      || remoteDirection === 'recvonly' && !tracks[kind].length)
    {
      direction = 'inactive';
    } else if (remoteDirection === 'recvonly') {
      track = tracks[kind].shift();
      direction = 'sendonly';
    } else if (remoteDirection === 'sendrecv') {
      track = tracks[kind].shift();
      direction = track ? 'sendrecv' : 'recvonly';
    } else { // sendonly
      direction = 'recvonly';
    }

    var streamId = this._streamIds.get(track);
    var mediaSection = remoteMediaSection.copy(null, null, capabilities,
      direction, null, streamId, track);
    return mediaSection;
  }, this);

  var sdp = sdpUtils.makeInitialSDPBlob();
  sdpUtils.addMediaSectionsToSDPBlob(sdp, mediaSections);
  sdpUtils.addCandidatesToSDPBlob(sdp, this._localCandidates);
  sdpUtils.addIceParametersToSDPBlob(sdp, this._iceGatherer.getLocalParameters());
  sdpUtils.addDtlsParametersToSDPBlob(sdp, this._dtlsTransport.getLocalParameters());

  var description = new RTCSessionDescription({
    sdp: sdpTransform.write(sdp),
    type: 'answer'
  });

  onSuccess(description);
};

RTCPeerConnection.prototype.createDTMFSender = function createDTMFSender(track) {
  if (!this._dtmfSenders.has(track)) {
    var rtpSender = this._rtpSenders.get(track);
    /* global RTCDtmfSender:true */
    var dtmfSender = new RTCDtmfSender(rtpSender);
    this._dtmfSenders.set(track, dtmfSender);
  }
  return this._dtmfSenders.get(track);
};

/**
 * Construct an {@link RTCSessionDescription} containing an SDP offer.
 * @param {?function} [onSuccess]
 * @param {?function} [onFailure]
 * @param {?RTCOfferOptions} [options]
 * @returns {Promise<RTCSessionDescription>}
 */
RTCPeerConnection.prototype.createOffer = function createOffer(onSuccess, onFailure, options) {
  // draft-ieft-rtcweb-jsep-11, Section 5.2.3:
  //
  //    If the 'OfferToReceiveAudio' option is specified, with an integer value
  //    of N, and M audio MediaStreamTracks have been added to the
  //    PeerConnection, the offer MUST include M non-rejected m= sections with
  //    media type 'audio', even if N is greater than M. ... the directional
  //    attribute on the N-M audio m= sections without associated
  //    MediaStreamTracks MUST be set to recvonly.
  //
  //    ...
  //
  //    For backwards compatibility with pre-standards versions of this
  //    specification, a value of 'true' is interpreted as equivalent to N=1,
  //    and 'false' as N=0.
  //
  var N = { audio: null, video: null };
  var M = { audio: 0,    video: 0    };
  options = options || {};
  ['optional', 'mandatory'].forEach(function(optionType) {
    if (!(optionType in options)) {
      return;
    }
    if ('OfferToReceiveAudio' in options[optionType]) {
      N.audio = Number(options[optionType].OfferToReceiveAudio);
    }
    if ('OfferToReceiveVideo' in options[optionType]) {
      N.video = Number(options[optionType].OfferToReceiveVideo);
    }
  });

  var mediaSections = [];

  // draft-ietf-rtcweb-jsep-11, Section 5.2.1:
  //
  //     m=sections MUST be sorted first by the order in which the MediaStreams
  //     were added to the PeerConnection, and then by the alphabetical
  //     ordering of the media type for the MediaStreamTrack.
  //
  var _N = { audio: N.audio, video: N.video };
  var streams = this.getLocalStreams();
  streams.forEach(function(stream) {
    var audioTracks = stream.getAudioTracks();
    var videoTracks = stream.getVideoTracks();
    M.audio += audioTracks.length;
    M.video += videoTracks.length;
    var tracks = audioTracks.concat(videoTracks);
    tracks.forEach(function(track) {
      var kind = track.kind;
      var capabilities = RTCRtpSender.getCapabilities(kind);
      var direction;
      var mid = this._makeMid(kind);
      if (_N.audio === null) {
        direction = 'sendrecv';
      } else if (!_N[kind]) {
        direction = 'sendonly';
      } else {
        _N[kind]--;
        direction = 'sendrecv';
      }
      var mediaSection = new MediaSection(null, null, capabilities, direction,
        kind, mid, null, null, stream.id, track);
      mediaSections.push(mediaSection);
    }, this);
  }, this);

  // Add the N-M recvonly m=sections.
  ['audio', 'video'].forEach(function(kind) {
    var k = Math.max(N[kind] - M[kind], 0);
    if (!k) {
      return;
    }
    var capabilities = RTCRtpSender.getCapabilities(kind);
    var direction = 'recvonly';
    var mid;
    var mediaSection;
    while (k--) {
      mid = this._makeMid(kind);
      mediaSection = new MediaSection(null, null, capabilities, direction,
        kind, mid);
      mediaSections.push(mediaSection);
    }
  }, this);

  var sdp = sdpUtils.makeInitialSDPBlob();
  sdpUtils.addMediaSectionsToSDPBlob(sdp, mediaSections);
  // this._localCandidates.add(null);
  sdpUtils.addCandidatesToSDPBlob(sdp, this._localCandidates);
  sdpUtils.addIceParametersToSDPBlob(sdp, this._iceGatherer.getLocalParameters());
  sdpUtils.addDtlsParametersToSDPBlob(sdp, this._dtlsTransport.getLocalParameters());

  var description = new RTCSessionDescription({
    sdp: sdpTransform.write(sdp),
    type: 'offer'
  });

  onSuccess(description);
};

/**
 * Get the {@link MediaStream}s that are currently or will be sent with this
 * {@link RTCPeerConnection}.
 * @returns {Array<MediaStream>}
 */
RTCPeerConnection.prototype.getLocalStreams = function getLocalStreams() {
  return this._localStreams.slice();
};

/**
 * Get the {@link MediaStreams} that are currently received by this
 * {@link RTCPeerConnection}.
 * @returns {Array<MediaStream>}
 */
RTCPeerConnection.prototype.getRemoteStreams = function getRemoteStreams() {
  return this._remoteStreams.slice();
};

/**
 * Apply the supplied {@link RTCSessionDescription} as the local description.
 * @param {RTCSessionDescription}
 * @param {?function} [onSuccess]
 * @param {?function} [onFailure]
 * @returns {Promise}
 */
RTCPeerConnection.prototype.setLocalDescription = function setLocalDescription(description, onSuccess, onFailure) {
  var nextSignalingState;
  switch (this.signalingState) {
    case 'stable':
      nextSignalingState = 'have-local-offer';
      break;
    case 'have-remote-offer':
      nextSignalingState = 'stable';
      break;
    default:
      return void onFailure(invalidSignalingState(this.signalingState));
  }
  var parsed = sdpUtils.parseDescription(description);
  if (this.signalingState === 'have-remote-offer') {
    this._sendAndReceiveRtp(parsed.mediaSections);
  }
  this._localDescription = description;
  this._signalingState = nextSignalingState;
  onSuccess();
};

/**
 * Apply the supplied {@link RTCSessionDescription} as the remote offer or answer.
 * @param {RTCSessionDescription}
 * @param {?function} [onSuccess]
 * @param {?function} [onFailure]
 * @returns {Promise}
 */
RTCPeerConnection.prototype.setRemoteDescription = function setRemoteDescription(description, onSuccess, onFailure) {
  var nextSignalingState;
  switch (this.signalingState) {
    case 'stable':
      nextSignalingState = 'have-remote-offer';
      break;
    case 'have-local-offer':
      nextSignalingState = 'stable';
      break;
    default:
      return void onFailure(invalidSignalingState(this.signalingState));
  }
  var parsed = sdpUtils.parseDescription(description);
  this._startIceTransport(parsed.iceParameters[0]);
  this._startDtlsTransport(parsed.dtlsParameters[0]);
  if (this.signalingState === 'have-local-offer') {
    this._sendAndReceiveRtp(parsed.mediaSections);
  }
  this._remoteDescription = description;
  this._signalingState = nextSignalingState;
  onSuccess();
};

/**
 * Construct an "invalid signaling state" {@link Error}.
 * @access private
 * @param {string} singalingState
 * @returns {Error}
 */
function invalidSignalingState(signalingState) {
  return new Error('Invalid signaling state: ' + signalingState);
}

/**
 * Check if an object is empty (i.e. the object contains no keys).
 * @access private
 * @param {object} object
 * @returns {boolean}
 */
function isEmptyObject(object) {
  return !Object.keys(object).length;
}

/**
 * Construct {@link RTCIceGatherOptions} from an {@link RTCConfiguration}.
 * @access private
 * @param {RTCConfiguration} configuration
 * @returns {RTCIceGatherOptions}
 */
function makeGatherOptions(configuration) {
  // Filter STUN servers, since these appear to be broken.
  var iceServers = (configuration.iceServers || [])
    .filter(function(iceServer) {
      return !iceServer.urls.match(/^stun:/);
    });
  return {
    gatherPolicy: configuration.gatherPolicy || 'all',
    iceServers: iceServers
  };
}

/**
 * Construct an "addstream" {@link MediaStreamEvent}.
 * @access private
 * @param {MediaStream} stream
 * @returns {MediaStreamEvent}
 */
function makeOnAddStreamEvent(stream) {
  return new MediaStreamEvent('addstream', {
    stream: stream
  });
}

/**
 * Construct an "icecandidate" {@link RTCPeerConnectionIceEvent}.
 * @access private
 * @param {RTCIceCandidate} candidate
 * @returns {RTCPeerConnectionIceEvent}
 */
function makeOnIceCandidateEvent(candidate) {
  return new RTCPeerConnectionIceEvent('icecandidate', {
    candidate: candidate
  });
}

/**
 * Construct an ORTC ICE candidate from a WebRTC ICE candidate.
 * @access private
 * @param {RTCIceCandidate} candidate - an WebRTC ICE candidate
 * @returns {RTCIceCanddidate}
 */
function makeORTCCandidate(candidate) {
  if (!candidate) {
    return {};
  }
  var start = candidate.candidate.indexOf('candidate:');
  var line = candidate.candidate
    .slice(start + 10)
    .replace(/ +/g, ' ')
    .split(' ');
  var ortcIceCandidate = {
    foundation: line[0],
    protocol: line[2],
    priority: parseInt(line[3]),
    ip: line[4],
    port: parseInt(line[5]),
    type: line[7],
    relatedAddress: null,
    relatedPort: 0,
    tcpType: 'active'
  };
  if (ortcIceCandidate.type !== 'host') {
    ortcIceCandidate.relatedAddress = line[9];
    ortcIceCandidate.relatedPort = parseInt(line[11]);
  }
  return ortcIceCandidate;
}

/**
 * Construct a WebRTC ICE candidate from an ORTC ICE candidate.
 * @access private
 * @param {RTCIceCandidate} candidate - an ORTC ICE candidate
 * @returns {RTCIceCandidate}
 */
function makeWebRTCCandidate(candidate) {
  if (isEmptyObject(candidate)) {
    return null;
  }
  var line = [
    'a=candidate',
    candidate.foundation,
    1,
    candidate.protocol,
    candidate.priority,
    candidate.ip,
    candidate.port,
    candidate.type
  ];
  if (candidate.relatedAddress) {
    line = line.concat([
      'raddr',
      candidate.relatedAddress,
      'rport',
      candidate.relatedPort
    ]);
  }
  line.push('generation 0');
  return new RTCIceCandidate({
    candidate: line.join(' '),
    sdpMLineIndex: 0
  });
}

/**
 * Intersect codecs.
 * @param {Array<object>} localCodecs
 * @param {Array<object>} remoteCodecs
 * @returns {Array<object>}
 */
function intersectCodecs(localCodecs, remoteCodecs) {
  var sharedCodecs = [];
  localCodecs.forEach(function(localCodec) {
    remoteCodecs.forEach(function(remoteCodec) {
      if (localCodec.name === remoteCodec.name &&
        localCodec.clockRate === remoteCodec.clockRate &&
        localCodec.numChannels === remoteCodec.numChannels)
      {
        sharedCodecs.push(remoteCodec);
      }
    });
  });
  return sharedCodecs;
}

module.exports = RTCPeerConnection;

},{"./mediasection":2,"./mediastreamevent":3,"./rtcicecandidate":4,"./rtcpeerconnectioniceevent":6,"./rtcsessiondescription":7,"./sdp-utils":8,"sdp-transform":10}],6:[function(require,module,exports){
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

},{}],7:[function(require,module,exports){
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

},{}],8:[function(require,module,exports){
'use strict';

var MediaSection = require('./mediasection');
var sdpTransform = require('sdp-transform');

/**
 * Add ICE candidates to an arbitrary level of an SDP blob.
 * @param {?object} [level={}]
 * @param {?Array<RTCIceCandidate>} [candidates]
 * @param {?number} [component] - if unspecified, add both RTP and RTCP candidates
 * @returns {object}
 */
function addCandidatesToLevel(level, candidates, component) {
  level = level || {};
  level.candidates = level.candidates || [];
  if (!candidates) {
    return level;
  }
  candidates.forEach(function(candidate) {
    // TODO(mroberts): Empty dictionary check.
    if (!candidate.foundation) {
      level.endOfCandidates = 'end-of-candidates';
      return;
    }
    var candidate1 = {
      foundation: candidate.foundation,
      transport: candidate.protocol,
      priority: candidate.priority,
      ip: candidate.ip,
      port: candidate.port,
      type: candidate.type,
      generation: 0
    };
    if (candidate.relatedAddress) {
      candidate1.raddr = candidate.relatedAddress;
      candidate1.rport = candidate.relatedPort;
    }

    if (typeof component === 'number') {
      candidate1.component = component;
      level.candidates.push(candidate1);
      return;
    }

    // RTP candidate
    candidate1.component = 1;
    level.candidates.push(candidate1);

    // RTCP candidate
    var candidate2 = {};
    for (var key in candidate1) {
      candidate2[key] = candidate1[key];
    }
    candidate2.component = 2;
    level.candidates.push(candidate2);
  });
  return level;
}

/**
 * Add ICE candidates to the media-levels of an SDP blob. Since this adds to
 * the media-levels, you should call this after you have added all your media.
 * @param {?object} [sdp={}]
 * @param {?Array<RTCIceCandidate>} [candidates]
 * @param {?number} [component] - if unspecified, add both RTP and RTCP candidates
 * @returns {object}
 */
function addCandidatesToMediaLevels(sdp, candidates, component) {
  sdp = sdp || {};
  if (!sdp.media) {
    return sdp;
  }
  sdp.media.forEach(function(media) {
    addCandidatesToLevel(media, candidates, component);
  });
  return sdp;
}

/**
 * Add ICE candidates to the media-levels of an SDP blob. Since
 * this adds to the media-levels, you should call this after you have added
 * all your media.
 * @param {?object} [sdp={}]
 * @param {?Array<RTCIceCandidate>} [candidates]
 * @param {?number} [component] - if unspecified, add both RTP and RTCP candidates
 * @returns {object}
 */
function addCandidatesToSDPBlob(sdp, candidates, component) {
  sdp = sdp || {};
  // addCandidatesToSessionLevel(sdp, candidates, component);
  addCandidatesToMediaLevels(sdp, candidates, component);
  return sdp;
}

/**
 * Add the DTLS fingerprint to the media-levels of an SDP blob.
 * Since this adds to media-levels, you should call this after you have added
 * all your media.
 * @param {?object} [sdp={}]
 * @param {RTCDtlsParameters} dtlsParameters
 * @returns {object}
 */
function addDtlsParametersToSDPBlob(sdp, dtlsParameters) {
  sdp = sdp || {};
  // addDtlsParametersToSessionLevel(sdp, dtlsParameters);
  addDtlsParametersToMediaLevels(sdp, dtlsParameters);
  return sdp;
}

/**
 * Add the DTLS fingerprint to an arbitrary level of an SDP blob.
 * @param {?object} [sdp={}]
 * @param {RTCDtlsParameters} dtlsParameters
 * @returns {object}
 */
function addDtlsParametersToLevel(level, dtlsParameters) {
  level = level || {};
  var fingerprints = dtlsParameters.fingerprints;
  if (fingerprints.length) {
    level.fingerprint = {
      type: fingerprints[0].algorithm,
      hash: fingerprints[0].value
    };
  }
  return level;
}

/**
 * Add the DTLS fingerprint to the media-levels of an SDP blob. Since this adds
 * to the media-levels, you should call this after you have added all of your
 * media.
 * @param {?object} [sdp={}]
 * @param {RTCDtlsParameters} dtlsParameters
 * @returns {object}
 */
function addDtlsParametersToMediaLevels(sdp, dtlsParameters) {
  sdp = sdp || {};
  if (!sdp.media) {
    return sdp;
  }
  sdp.media.forEach(function(media) {
    addDtlsParametersToLevel(media, dtlsParameters);
  });
  return sdp;
}

/**
 * Add the ICE username fragment and password to the media-levels
 * of an SDP blob. Since this adds to media-levels, you should call this after
 * you have added all your media.
 * @param {?object} [sdp={}]
 * @param {RTCIceParameters} parameters
 * @returns {object}
 */
function addIceParametersToSDPBlob(sdp, iceParameters) {
  sdp = sdp || {};
  // addIceParametersToSessionLevel(sdp, iceParameters);
  addIceParametersToMediaLevels(sdp, iceParameters);
  return sdp;
}

/**
 * Add the ICE username fragment and password to the media-levels of an SDP
 * blob. Since this adds to media-levels, you should call this after you have
 * added all your media.
 * @param {?object} [sdp={}]
 * @param {RTCIceParameters} iceParameters
 * @returns {object}
 */
function addIceParametersToMediaLevels(sdp, iceParameters) {
  sdp = sdp || {};
  if (!sdp.media) {
    return sdp;
  }
  sdp.media.forEach(function(media) {
    addIceParametersToLevel(media, iceParameters);
  });
  return sdp;
}

/**
 * Add the ICE username fragment and password to an arbitrary level of an SDP
 * blob.
 * @param {?object} [level={}]
 * @param {RTCIceParameters} iceParameters
 * @returns {object}
 */
function addIceParametersToLevel(level, iceParameters) {
  level = level || {};
  level.iceUfrag = iceParameters.usernameFragment;
  level.icePwd = iceParameters.password;
  return level;
}

/**
 * Add a {@link MediaSection} to an SDP blob.
 * @param {object} sdp
 * @param {MediaSection} mediaSection
 * @returns {object}
 */
function addMediaSectionToSDPBlob(sdp, mediaSection) {
  var streamId = mediaSection.streamId;
  if (streamId) {
    sdp.msidSemantic = sdp.msidSemantic || {
      semantic: 'WMS',
      token: []
    };
    sdp.msidSemantic.token.push(streamId);
  }

  var mid = mediaSection.mid;
  if (mid) {
    sdp.groups = sdp.groups || [];
    var foundBundle = false;
    sdp.groups.forEach(function(group) {
      if (group.type === 'BUNDLE') {
        group.mids.push(mid);
        foundBundle = true;
      }
    });
    if (!foundBundle) {
      sdp.groups.push({
        type: 'BUNDLE',
        mids: [mid]
      });
    }
  }

  var payloads = [];
  var rtps = [];
  var fmtps = [];
  mediaSection.capabilities.codecs.forEach(function(codec) {
    var payload = codec.preferredPayloadType;
    payloads.push(payload);
    var rtp = {
      payload: payload,
      codec: codec.name,
      rate: codec.clockRate
    };
    if (codec.numChannels > 1) {
      rtp.encoding = codec.numChannels;
    }
    rtps.push(rtp);
    switch (codec.name) {
      case 'telephone-event':
        if (codec.parameters && codec.parameters.events) {
          fmtps.push({
            payload: payload,
            config: codec.parameters.events
          });
        }
        break;
    }
  });

  var ssrcs = [];
  if (streamId && mediaSection.track) {
    var ssrc = Math.floor(Math.random() * 4294967296);
    var cname = makeCname();
    var trackId = mediaSection.track.id;
    ssrcs = ssrcs.concat([
      {
        id: ssrc,
        attribute: 'cname',
        value: cname
      },
      {
        id: ssrc,
        attribute: 'msid',
        value: mediaSection.streamId + ' ' + trackId
      },
      {
        id: ssrc,
        attribute: 'mslabel',
        value: trackId
      },
      {
        id: ssrc,
        attribute: 'label',
        value: trackId
      }
    ]);
  }

  var media = {
    rtp: rtps,
    fmtp: fmtps,
    type: mediaSection.kind,
    port: 9,
    payloads: payloads.join(' '),
    protocol: 'RTP/SAVPF',
    direction: mediaSection.direction,
    connection: {
      version: 4,
      ip: '0.0.0.0'
    },
    rtcp: {
      port: 9,
      netType: 'IN',
      ipVer: 4,
      address: '0.0.0.0'
    },
    ssrcs: ssrcs
  };
  if (mid) {
    media.mid = mid;
  }
  if (mediaSection.rtcpMux) {
    media.rtcpMux = 'rtcp-mux';
  }
  sdp.media.push(media);
  return sdp;
}

function addMediaSectionsToSDPBlob(sdp, mediaSections) {
  mediaSections.forEach(addMediaSectionToSDPBlob.bind(null, sdp));
  return sdp;
}

/**
 * Construct an initial SDP blob.
 * @param {?number} [sessionId]
 * @returns {object}
 */
function makeInitialSDPBlob(sessionId) {
  sessionId = sessionId || Math.floor(Math.random() * 4294967296);
  return {
    version: 0,
    origin: {
      username: '-',
      sessionId: sessionId,
      sessionVersion: 0,
      netType: 'IN',
      ipVer: 4,
      address: '127.0.0.1'
    },
    name: '-',
    timing: {
      start: 0,
      stop: 0
    },
    connection: {
      version: 4,
      ip: '0.0.0.0'
    },
    media: []
  };
}

/**
 * Parse the SDP contained in an {@link RTCSessionDescription} into individual
 * {@link RTCIceParameters}, {@link RTCDtlsParameters}, and
 * {@link RTCRtpParameters}.
 * @access private
 * @param {RTCSessionDescription} description
 * @returns {object}
 */
function parseDescription(description) {
  var sdp = sdpTransform.parse(description.sdp);

  var iceParameters = [];
  var dtlsParameters = [];
  var candidates = [];
  var mediaSections = [];

  var levels = [sdp];
  if (sdp.media) {
    levels = levels.concat(sdp.media);
  }

  levels.forEach(function(level) {
    // ICE and DTLS parameters may appear at the session- or media-levels.
    if (level.iceUfrag && level.icePwd && level.fingerprint) {
      iceParameters.push({
        usernameFragment: level.iceUfrag,
        password: level.icePwd
      });
      dtlsParameters.push({
        fingerprints: [
          {
            algorithm: level.fingerprint.type,
            value: level.fingerprint.hash
          }
        ]
      });
    }

    // RTP parameters appear at the media-level.
    if (level.rtp) {
      if (level.type === 'video') {
        return;
      }
      var address = level.connection ? level.connection.ip : null;
      // var candidates;
      var direction = level.direction;
      var kind = level.type;
      var mid = level.mid;
      var port = level.port || null;
      var rtcpMux = level.rtcpMux === 'rtcp-mux';

      var cname;
      var ssrc;
      var streamId;
      // var trackId;
      // FIXME(mroberts): This breaks with multiple SSRCs.
      (level.ssrcs || []).forEach(function(attribute) {
        switch (attribute.attribute) {
          case 'cname':
            ssrc = attribute.id;
            cname = attribute.value;
            break;
          case 'label':
          case 'mslabel':
            ssrc = attribute.id;
            // trackId = attribute.value;
            break;
          case 'msid':
            ssrc = attribute.id;
            streamId = attribute.value.split(' ')[0];
            break;
        }
      });

      var capabilities = {
        type: kind,
        muxId: mid,
        codecs: level.rtp.map(function(rtp) {
          var codec = {
            name: rtp.codec,
            payloadType: parseInt(rtp.payload),
            clockRate: parseInt(rtp.rate),
            numChannels: rtp.encoding || 1,
            rtcpFeedback: [],
            parameters: {}
          };
          switch (rtp.codec) {
            case 'telephone-event':
              codec.parameters.events = '0-16';
              break;
          }
          return codec;
        }),
        headerExtensions: [],
        encodings: level.rtp.map(function(rtp) {
          return {
            ssrc: ssrc,
            codecPayloadType: parseInt(rtp.payload),
            active: true
          };
        }),
        rtcp: {
          ssrc: ssrc,
          cname: cname,
          mux: rtcpMux
        }
      };

      var mediaSection = new MediaSection(address, candidates, capabilities,
        direction, kind, mid, port, rtcpMux, streamId);

      (level.candidates || []).forEach(function(candidate) {
        var ortcCandidate = {
          foundation: candidate.foundation,
          transport: candidate.protocol,
          priority: candidate.priority,
          ip: candidate.ip,
          port: candidate.port,
          type: candidate.type,
          generation: candidate.generation,
          relatedAddress: candidate.raddr,
          relatedPort: candidate.rport
        };
        candidates.push(ortcCandidate);
        mediaSection.addCandidate(ortcCandidate);
      });

      void candidates;

      /* if (level.endOfCandidates === 'end-of-candidates') {
        mediaSection.addCandidate.
      } */

      mediaSections.push(mediaSection);
    }
  });

  return {
    iceParameters: iceParameters,
    dtlsParameters: dtlsParameters,
    mediaSections: mediaSections
  };
}

function makeCname() {
  var a = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789+/'.split('');
  var n = 16;
  var cname = '';
  while (n--) {
    cname += a[Math.floor(Math.random() * a.length)];
  }
  return cname;
}

module.exports.addCandidatesToSDPBlob = addCandidatesToSDPBlob;
module.exports.addDtlsParametersToSDPBlob = addDtlsParametersToSDPBlob;
module.exports.addIceParametersToSDPBlob = addIceParametersToSDPBlob;
module.exports.addMediaSectionsToSDPBlob = addMediaSectionsToSDPBlob;
module.exports.makeInitialSDPBlob = makeInitialSDPBlob;
module.exports.parseDescription = parseDescription;

},{"./mediasection":2,"sdp-transform":10}],9:[function(require,module,exports){
var grammar = module.exports = {
  v: [{
      name: 'version',
      reg: /^(\d*)$/
  }],
  o: [{ //o=- 20518 0 IN IP4 203.0.113.1
    // NB: sessionId will be a String in most cases because it is huge
    name: 'origin',
    reg: /^(\S*) (\d*) (\d*) (\S*) IP(\d) (\S*)/,
    names: ['username', 'sessionId', 'sessionVersion', 'netType', 'ipVer', 'address'],
    format: "%s %s %d %s IP%d %s"
  }],
  // default parsing of these only (though some of these feel outdated)
  s: [{ name: 'name' }],
  i: [{ name: 'description' }],
  u: [{ name: 'uri' }],
  e: [{ name: 'email' }],
  p: [{ name: 'phone' }],
  z: [{ name: 'timezones' }], // TODO: this one can actually be parsed properly..
  r: [{ name: 'repeats' }],   // TODO: this one can also be parsed properly
  //k: [{}], // outdated thing ignored
  t: [{ //t=0 0
    name: 'timing',
    reg: /^(\d*) (\d*)/,
    names: ['start', 'stop'],
    format: "%d %d"
  }],
  c: [{ //c=IN IP4 10.47.197.26
      name: 'connection',
      reg: /^IN IP(\d) (\S*)/,
      names: ['version', 'ip'],
      format: "IN IP%d %s"
  }],
  b: [{ //b=AS:4000
      push: 'bandwidth',
      reg: /^(TIAS|AS|CT|RR|RS):(\d*)/,
      names: ['type', 'limit'],
      format: "%s:%s"
  }],
  m: [{ //m=video 51744 RTP/AVP 126 97 98 34 31
      // NB: special - pushes to session
      // TODO: rtp/fmtp should be filtered by the payloads found here?
      reg: /^(\w*) (\d*) ([\w\/]*)(?: (.*))?/,
      names: ['type', 'port', 'protocol', 'payloads'],
      format: "%s %d %s %s"
  }],
  a: [
    { //a=rtpmap:110 opus/48000/2
      push: 'rtp',
      reg: /^rtpmap:(\d*) ([\w\-]*)(?:\s*\/(\d*)(?:\s*\/(\S*))?)?/,
      names: ['payload', 'codec', 'rate', 'encoding'],
      format: function (o) {
        return (o.encoding) ?
          "rtpmap:%d %s/%s/%s":
          o.rate ?
          "rtpmap:%d %s/%s":
          "rtpmap:%d %s";
      }
    },
    {
      //a=fmtp:108 profile-level-id=24;object=23;bitrate=64000
      //a=fmtp:111 minptime=10; useinbandfec=1
      push: 'fmtp',
      reg: /^fmtp:(\d*) ([\S| ]*)/,
      names: ['payload', 'config'],
      format: "fmtp:%d %s"
    },
    { //a=control:streamid=0
        name: 'control',
        reg: /^control:(.*)/,
        format: "control:%s"
    },
    { //a=rtcp:65179 IN IP4 193.84.77.194
      name: 'rtcp',
      reg: /^rtcp:(\d*)(?: (\S*) IP(\d) (\S*))?/,
      names: ['port', 'netType', 'ipVer', 'address'],
      format: function (o) {
        return (o.address != null) ?
          "rtcp:%d %s IP%d %s":
          "rtcp:%d";
      }
    },
    { //a=rtcp-fb:98 trr-int 100
      push: 'rtcpFbTrrInt',
      reg: /^rtcp-fb:(\*|\d*) trr-int (\d*)/,
      names: ['payload', 'value'],
      format: "rtcp-fb:%d trr-int %d"
    },
    { //a=rtcp-fb:98 nack rpsi
      push: 'rtcpFb',
      reg: /^rtcp-fb:(\*|\d*) ([\w-_]*)(?: ([\w-_]*))?/,
      names: ['payload', 'type', 'subtype'],
      format: function (o) {
        return (o.subtype != null) ?
          "rtcp-fb:%s %s %s":
          "rtcp-fb:%s %s";
      }
    },
    { //a=extmap:2 urn:ietf:params:rtp-hdrext:toffset
      //a=extmap:1/recvonly URI-gps-string
      push: 'ext',
      reg: /^extmap:([\w_\/]*) (\S*)(?: (\S*))?/,
      names: ['value', 'uri', 'config'], // value may include "/direction" suffix
      format: function (o) {
        return (o.config != null) ?
          "extmap:%s %s %s":
          "extmap:%s %s";
      }
    },
    {
      //a=crypto:1 AES_CM_128_HMAC_SHA1_80 inline:PS1uQCVeeCFCanVmcjkpPywjNWhcYD0mXXtxaVBR|2^20|1:32
      push: 'crypto',
      reg: /^crypto:(\d*) ([\w_]*) (\S*)(?: (\S*))?/,
      names: ['id', 'suite', 'config', 'sessionConfig'],
      format: function (o) {
        return (o.sessionConfig != null) ?
          "crypto:%d %s %s %s":
          "crypto:%d %s %s";
      }
    },
    { //a=setup:actpass
      name: 'setup',
      reg: /^setup:(\w*)/,
      format: "setup:%s"
    },
    { //a=mid:1
      name: 'mid',
      reg: /^mid:([^\s]*)/,
      format: "mid:%s"
    },
    { //a=msid:0c8b064d-d807-43b4-b434-f92a889d8587 98178685-d409-46e0-8e16-7ef0db0db64a
      name: 'msid',
      reg: /^msid:(.*)/,
      format: "msid:%s"
    },
    { //a=ptime:20
      name: 'ptime',
      reg: /^ptime:(\d*)/,
      format: "ptime:%d"
    },
    { //a=maxptime:60
      name: 'maxptime',
      reg: /^maxptime:(\d*)/,
      format: "maxptime:%d"
    },
    { //a=sendrecv
      name: 'direction',
      reg: /^(sendrecv|recvonly|sendonly|inactive)/
    },
    { //a=ice-lite
      name: 'icelite',
      reg: /^(ice-lite)/
    },
    { //a=ice-ufrag:F7gI
      name: 'iceUfrag',
      reg: /^ice-ufrag:(\S*)/,
      format: "ice-ufrag:%s"
    },
    { //a=ice-pwd:x9cml/YzichV2+XlhiMu8g
      name: 'icePwd',
      reg: /^ice-pwd:(\S*)/,
      format: "ice-pwd:%s"
    },
    { //a=fingerprint:SHA-1 00:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF:00:11:22:33
      name: 'fingerprint',
      reg: /^fingerprint:(\S*) (\S*)/,
      names: ['type', 'hash'],
      format: "fingerprint:%s %s"
    },
    {
      //a=candidate:0 1 UDP 2113667327 203.0.113.1 54400 typ host
      //a=candidate:1162875081 1 udp 2113937151 192.168.34.75 60017 typ host generation 0
      //a=candidate:3289912957 2 udp 1845501695 193.84.77.194 60017 typ srflx raddr 192.168.34.75 rport 60017 generation 0
      push:'candidates',
      reg: /^candidate:(\S*) (\d*) (\S*) (\d*) (\S*) (\d*) typ (\S*)(?: raddr (\S*) rport (\d*))?(?: generation (\d*))?/,
      names: ['foundation', 'component', 'transport', 'priority', 'ip', 'port', 'type', 'raddr', 'rport', 'generation'],
      format: function (o) {
        var str = "candidate:%s %d %s %d %s %d typ %s";
        // NB: candidate has two optional chunks, so %void middle one if it's missing
        str += (o.raddr != null) ? " raddr %s rport %d" : "%v%v";
        if (o.generation != null) {
          str += " generation %d";
        }
        return str;
      }
    },
    { //a=end-of-candidates (keep after the candidates line for readability)
      name: 'endOfCandidates',
      reg: /^(end-of-candidates)/
    },
    { //a=remote-candidates:1 203.0.113.1 54400 2 203.0.113.1 54401 ...
      name: 'remoteCandidates',
      reg: /^remote-candidates:(.*)/,
      format: "remote-candidates:%s"
    },
    { //a=ice-options:google-ice
      name: 'iceOptions',
      reg: /^ice-options:(\S*)/,
      format: "ice-options:%s"
    },
    { //a=ssrc:2566107569 cname:t9YU8M1UxTF8Y1A1
      push: "ssrcs",
      reg: /^ssrc:(\d*) ([\w_]*):(.*)/,
      names: ['id', 'attribute', 'value'],
      format: "ssrc:%d %s:%s"
    },
    { //a=ssrc-group:FEC 1 2
      push: "ssrcGroups",
      reg: /^ssrc-group:(\w*) (.*)/,
      names: ['semantics', 'ssrcs'],
      format: "ssrc-group:%s %s"
    },
    { //a=msid-semantic: WMS Jvlam5X3SX1OP6pn20zWogvaKJz5Hjf9OnlV
      name: "msidSemantic",
      reg: /^msid-semantic:\s?(\w*) (\S*)/,
      names: ['semantic', 'token'],
      format: "msid-semantic: %s %s" // space after ":" is not accidental
    },
    { //a=group:BUNDLE audio video
      push: 'groups',
      reg: /^group:(\w*) (.*)/,
      names: ['type', 'mids'],
      format: "group:%s %s"
    },
    { //a=rtcp-mux
      name: 'rtcpMux',
      reg: /^(rtcp-mux)/
    },
    { //a=rtcp-rsize
      name: 'rtcpRsize',
      reg: /^(rtcp-rsize)/
    },
    { // any a= that we don't understand is kepts verbatim on media.invalid
      push: 'invalid',
      names: ["value"]
    }
  ]
};

// set sensible defaults to avoid polluting the grammar with boring details
Object.keys(grammar).forEach(function (key) {
  var objs = grammar[key];
  objs.forEach(function (obj) {
    if (!obj.reg) {
      obj.reg = /(.*)/;
    }
    if (!obj.format) {
      obj.format = "%s";
    }
  });
});

},{}],10:[function(require,module,exports){
var parser = require('./parser');
var writer = require('./writer');

exports.write = writer;
exports.parse = parser.parse;
exports.parseFmtpConfig = parser.parseFmtpConfig;
exports.parsePayloads = parser.parsePayloads;
exports.parseRemoteCandidates = parser.parseRemoteCandidates;

},{"./parser":11,"./writer":12}],11:[function(require,module,exports){
var toIntIfInt = function (v) {
  return String(Number(v)) === v ? Number(v) : v;
};

var attachProperties = function (match, location, names, rawName) {
  if (rawName && !names) {
    location[rawName] = toIntIfInt(match[1]);
  }
  else {
    for (var i = 0; i < names.length; i += 1) {
      if (match[i+1] != null) {
        location[names[i]] = toIntIfInt(match[i+1]);
      }
    }
  }
};

var parseReg = function (obj, location, content) {
  var needsBlank = obj.name && obj.names;
  if (obj.push && !location[obj.push]) {
    location[obj.push] = [];
  }
  else if (needsBlank && !location[obj.name]) {
    location[obj.name] = {};
  }
  var keyLocation = obj.push ?
    {} :  // blank object that will be pushed
    needsBlank ? location[obj.name] : location; // otherwise, named location or root

  attachProperties(content.match(obj.reg), keyLocation, obj.names, obj.name);

  if (obj.push) {
    location[obj.push].push(keyLocation);
  }
};

var grammar = require('./grammar');
var validLine = RegExp.prototype.test.bind(/^([a-z])=(.*)/);

exports.parse = function (sdp) {
  var session = {}
    , media = []
    , location = session; // points at where properties go under (one of the above)

  // parse lines we understand
  sdp.split(/(\r\n|\r|\n)/).filter(validLine).forEach(function (l) {
    var type = l[0];
    var content = l.slice(2);
    if (type === 'm') {
      media.push({rtp: [], fmtp: []});
      location = media[media.length-1]; // point at latest media line
    }

    for (var j = 0; j < (grammar[type] || []).length; j += 1) {
      var obj = grammar[type][j];
      if (obj.reg.test(content)) {
        return parseReg(obj, location, content);
      }
    }
  });

  session.media = media; // link it up
  return session;
};

var fmtpReducer = function (acc, expr) {
  var s = expr.split('=');
  if (s.length === 2) {
    acc[s[0]] = toIntIfInt(s[1]);
  }
  return acc;
};

exports.parseFmtpConfig = function (str) {
  return str.split(/\;\s?/).reduce(fmtpReducer, {});
};

exports.parsePayloads = function (str) {
  return str.split(' ').map(Number);
};

exports.parseRemoteCandidates = function (str) {
  var candidates = [];
  var parts = str.split(' ').map(toIntIfInt);
  for (var i = 0; i < parts.length; i += 3) {
    candidates.push({
      component: parts[i],
      ip: parts[i + 1],
      port: parts[i + 2]
    });
  }
  return candidates;
};

},{"./grammar":9}],12:[function(require,module,exports){
var grammar = require('./grammar');

// customized util.format - discards excess arguments and can void middle ones
var formatRegExp = /%[sdv%]/g;
var format = function (formatStr) {
  var i = 1;
  var args = arguments;
  var len = args.length;
  return formatStr.replace(formatRegExp, function (x) {
    if (i >= len) {
      return x; // missing argument
    }
    var arg = args[i];
    i += 1;
    switch (x) {
      case '%%':
        return '%';
      case '%s':
        return String(arg);
      case '%d':
        return Number(arg);
      case '%v':
        return '';
    }
  });
  // NB: we discard excess arguments - they are typically undefined from makeLine
};

var makeLine = function (type, obj, location) {
  var str = obj.format instanceof Function ?
    (obj.format(obj.push ? location : location[obj.name])) :
    obj.format;

  var args = [type + '=' + str];
  if (obj.names) {
    for (var i = 0; i < obj.names.length; i += 1) {
      var n = obj.names[i];
      if (obj.name) {
        args.push(location[obj.name][n]);
      }
      else { // for mLine and push attributes
        args.push(location[obj.names[i]]);
      }
    }
  }
  else {
    args.push(location[obj.name]);
  }
  return format.apply(null, args);
};

// RFC specified order
// TODO: extend this with all the rest
var defaultOuterOrder = [
  'v', 'o', 's', 'i',
  'u', 'e', 'p', 'c',
  'b', 't', 'r', 'z', 'a'
];
var defaultInnerOrder = ['i', 'c', 'b', 'a'];


module.exports = function (session, opts) {
  opts = opts || {};
  // ensure certain properties exist
  if (session.version == null) {
    session.version = 0; // "v=0" must be there (only defined version atm)
  }
  if (session.name == null) {
    session.name = " "; // "s= " must be there if no meaningful name set
  }
  session.media.forEach(function (mLine) {
    if (mLine.payloads == null) {
      mLine.payloads = "";
    }
  });

  var outerOrder = opts.outerOrder || defaultOuterOrder;
  var innerOrder = opts.innerOrder || defaultInnerOrder;
  var sdp = [];

  // loop through outerOrder for matching properties on session
  outerOrder.forEach(function (type) {
    grammar[type].forEach(function (obj) {
      if (obj.name in session && session[obj.name] != null) {
        sdp.push(makeLine(type, obj, session));
      }
      else if (obj.push in session && session[obj.push] != null) {
        session[obj.push].forEach(function (el) {
          sdp.push(makeLine(type, obj, el));
        });
      }
    });
  });

  // then for each media line, follow the innerOrder
  session.media.forEach(function (mLine) {
    sdp.push(makeLine('m', grammar.m[0], mLine));

    innerOrder.forEach(function (type) {
      grammar[type].forEach(function (obj) {
        if (obj.name in mLine && mLine[obj.name] != null) {
          sdp.push(makeLine(type, obj, mLine));
        }
        else if (obj.push in mLine && mLine[obj.push] != null) {
          mLine[obj.push].forEach(function (el) {
            sdp.push(makeLine(type, obj, el));
          });
        }
      });
    });
  });

  return sdp.join('\r\n') + '\r\n';
};

},{"./grammar":9}]},{},[1]);

  var ortcAdapter = ortcAdapterBundle(1);
  var exports = {};
  if (typeof window === 'undefined' || !window.navigator) {
    console.log('This does not appear to be a browser; WebRTC APIs are unavailable.');
  } else if (navigator.mozGetUserMedia && window.mozRTCPeerConnection) {
    console.log('This appears to be Firefox; using moz-prefixed WebRTC APIs.');
    /* globals mozRTCIceCandidate:true, mozRTCPeerConnection:true, mozRTCSessionDescription:true */
    exports.RTCIceCandidate = window.RTCIceCandidate || mozRTCIceCandidate;
    exports.RTCPeerConnection = mozRTCPeerConnection;
    exports.RTCSessionDescription = window.RTCSessionDescription || mozRTCSessionDescription;
  } else if (navigator.webkitGetUserMedia && window.chrome) {
    console.log('This appears to be Chrome; using webkit-prefixed WebRTC APIs.');
    /* globals RTCIceCandidate:true, webkitRTCPeerConnection:true, RTCSessionDescription:true */
    exports.RTCIceCandidate = RTCIceCandidate;
    exports.RTCPeerConnection = webkitRTCPeerConnection;
    exports.RTCSessionDescription = RTCSessionDescription;
  } else if (typeof RTCRtpSender) {
    console.log('This appears to be an ORTC-compatible browser; using ORTC to WebRTC adapter.');
    exports.RTCIceCandidate = ortcAdapter.RTCIceCandidate;
    exports.RTCPeerConnection = ortcAdapter.RTCPeerConnection;
    exports.RTCSessionDescription = ortcAdapter.RTCSessionDescription;
  }
  return exports;
}));
