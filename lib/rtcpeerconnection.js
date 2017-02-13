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
      value: new Set()
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
};

/**
 * This method is assigned to the {@link RTCIceTransport}'s "onicestatechange" event handler.
 * @access private
 * @param {object} event
 */
RTCPeerConnection.prototype._onicestatechange = function _onicestatechange(event) {
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
 * @param {function} onSuccess
 * @param {function} onFailure
 *//**
 * Add an {@link RTCIceCandidate} to the {@link RTCPeerConnection}.
 * @param {RTCIceCandidate} candidate -the remote ICE candidate
 * @returns {Promise}
 */
RTCPeerConnection.prototype.addIceCandidate = function addIceCandidate(candidate, onSuccess, onFailure) {
  if (!onSuccess) {
    return new Promise(this.addIceCandidate.bind(this, candidate));
  }

  // NOTE(mroberts): I'm not sure there is a scenario where we'd ever call
  // onFailure.
  void onFailure;

  this._iceCandidatesAdded++;

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
 * @returns {void}
 */
RTCPeerConnection.prototype.addStream = function addStream(mediaStream) {
  this._localStreams.add(mediaStream);
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
 * Construct an {@link RTCSessionDescription} containing an SDP offer.
 * @param {RTCSessionDescriptionCallback} onSuccess
 * @param {function} onFailure
 *//**
 * Construct an {@link RTCSessionDescription} containing an SDP offer.
 * @returns {Promise<RTCSessionDescription>}
 */
RTCPeerConnection.prototype.createAnswer = function createAnswer(onSuccess, onFailure) {
  if (typeof onSuccess !== 'function') {
    return new Promise(this.createAnswer.bind(this));
  }

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

  // FIXME(mroberts): We should probably provision an ICE transport for each
  // MediaSection in the event BUNDLE is not supported.
  mediaSections.forEach(function(mediaSection) {
    this._localCandidates.forEach(mediaSection.addCandidate, mediaSection);
  }, this);

  var sdp = sdpUtils.makeInitialSDPBlob();
  sdpUtils.addMediaSectionsToSDPBlob(sdp, mediaSections);
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
 * @param {RTCSessionDescriptionCallback} onSuccess
 * @param {function} onFailure
 * @param {?RTCOfferOptions} [options]
 *//**
 * Construct an {@link RTCSessionDescription} containing an SDP offer.
 * @param {?RTCOfferOptions} [options]
 * @returns {Promise<RTCSessionDescription>}
 */
RTCPeerConnection.prototype.createOffer = function createOffer(onSuccess, onFailure, options) {
  if (typeof onSuccess !== 'function') {
    return new Promise(function(resolve, reject) {
      this.createOffer(resolve, reject, onSuccess);
    }.bind(this));
  }

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

  // FIXME(mroberts): We should probably provision an ICE transport for each
  // MediaSection in the event BUNDLE is not supported.
  mediaSections.forEach(function(mediaSection) {
    this._localCandidates.forEach(mediaSection.addCandidate, mediaSection);
  }, this);

  var sdp = sdpUtils.makeInitialSDPBlob();
  sdpUtils.addMediaSectionsToSDPBlob(sdp, mediaSections);
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
  return Array.from(this._localStreams);
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
 * Remove a {@link MediaStream} from the {@link RTCPeerConnection}.
 * @param {MediaStream} stream
 * @returns {void}
 */
RTCPeerConnection.prototype.removeStream = function removeStream(mediaStream) {
  this._localStreams.delete(mediaStream);
  mediaStream.getTracks().forEach(function(track) {
    /* eslint no-invalid-this:0 */
    this._rtpSenders.get(track).stop();
    this._rtpSenders.delete(track);
    this._streamIds.delete(track);
  }, this);
};

/**
 * Apply the supplied {@link RTCSessionDescription} as the local description.
 * @param {RTCSessionDescription}
 * @param {function} onSuccess
 * @param {function} onFailure
 *//**
 * Apply the supplied {@link RTCSessionDescription} as the local description.
 * @param {RTCSessionDescription}
 * @returns {Promise}
 */
RTCPeerConnection.prototype.setLocalDescription = function setLocalDescription(description, onSuccess, onFailure) {
  if (!onSuccess) {
    return new Promise(this.setLocalDescription.bind(this, description));
  }

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
 * @param {function} onSuccess
 * @param {function} onFailure
 *//**
 * Apply the supplied {@link RTCSessionDescription} as the remote offer or answer.
 * @param {RTCSessionDescription}
 * @returns {Promise}
 */
RTCPeerConnection.prototype.setRemoteDescription = function setRemoteDescription(description, onSuccess, onFailure) {
  if (!onSuccess) {
    return new Promise(this.setRemoteDescription.bind(this, description));
  }

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

  if (this._iceTransport.state !== 'closed' &&
      this._iceTransport.state !== 'completed') {
    parsed.mediaSections.forEach(function(mediaSection) {
      mediaSection.candidates.forEach(this._iceTransport.addRemoteCandidate,
        this._iceTransport);
    }, this);
    this._startIceTransport(parsed.iceParameters[0]);
    this._startDtlsTransport(parsed.dtlsParameters[0]);
  }

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
