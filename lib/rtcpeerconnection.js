'use strict';

var MediaStreamEvent = require('./mediastreamevent');
var RTCIceCandidate = require('./rtcicecandidate');
var RTCPeerConnectionIceEvent = require('./rtcpeerconnectioniceevent');
var RTCSessionDescription = require('./rtcsessiondescription');
var sdpTransform = require('sdp-transform');

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

  // NOTE(mroberts): This is a hack. See addIceCandidate.
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
    iceConnectionState: {
      enumerable: true,
      get: function() {
        return iceTransport.state;
      }
    },
    iceGatheringState: {
      enumerable: true,
      get: function() {
        // NOTE(mroberts): RTCIceGatherer is never in state "new".
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
 * @param {Array<RTCRtpParameters>} rtpParameterss
 * @returns {this}
 */
RTCPeerConnection.prototype._sendRtp = function _sendRtp(rtpParameterss) {
  rtpParameterss.forEach(function(rtpParameters) {
    var type = rtpParameters.type;
    this._rtpSenders.forEach(function(rtpSender) {
      if (rtpSender.track.kind !== type) {
        return;
      }
      rtpSender.send(rtpParameters);
    });
  }, this);
  return this;
};

/**
 * Start receiving RTP.
 * @access private
 * @param {Array<RTCRtpParameters>} rtpParameterss
 * @returns {this}
 */
RTCPeerConnection.prototype._receiveRtp = function _receiveRtp(rtpParameterss) {
  rtpParameterss.forEach(function(rtpParameters) {
    var type = rtpParameters.type;
    /* global RTCRtpReceiver:true */
    var rtpReceiver = new RTCRtpReceiver(this._dtlsTransport, type);
    rtpReceiver.receive(rtpParameters);

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
  }, this);
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
      candidate.candidate);
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
  [].forEach.call(mediaStream.getTracks(), function(track) {
    /* eslint no-invalid-this:0 */
    /* global RTCRtpSender:true */
    var rtpSender = new RTCRtpSender(track, this._dtlsTransport);
    this._rtpSenders.set(track, rtpSender);
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
  var iceParameters = this._iceGatherer.getLocalParameters();
  var dtlsParameters = this._dtlsTransport.getLocalParameters();

  var streams = this.getLocalStreams();

  var sdp = makeInitialSDPBlob();
  addBundleToSDPBlob(sdp, streams);
  addMsidSemanticToSDPBlob(sdp, streams);

  var hasAudioTrack = false;
  var hasVideoTrack = false;
  streams.forEach(function(stream) {
    hasAudioTrack = hasAudioTrack || !!stream.getAudioTracks().length;
    hasVideoTrack = hasVideoTrack || !!stream.getVideoTracks().length;
  });

  var remote = sdpTransform.parse(this.remoteDescription.sdp);
  remote.media.forEach(function(media) {
    var hasTrack = media.type === 'audio' ? hasAudioTrack : hasVideoTrack;
    var localCapabilities = RTCRtpSender.getCapabilities(media.type);

    var remoteCodecs = makeCodecCapabilitiesFromMediaLevelRtpSettings(media.rtp);
    var sharedCodecs = intersectCodecs(localCapabilities, remoteCodecs);
    var sharedCapabilities = { codecs: sharedCodecs };

    if (media.direction === 'inactive' ||
      (media.direction === 'recvonly' && !hasTrack) ||
      !sharedCodecs.length)
    {
      addMediaToSDPBlob(sdp, media.type, localCapabilities, streams,
        'inactive', 'active');
    } else if (media.direction === 'recvonly') {
      addMediaToSDPBlob(sdp, media.type, sharedCapabilities, streams,
        'sendonly', 'active');
    } else if (media.direction === 'sendonly') {
      addMediaToSDPBlob(sdp, media.type, sharedCapabilities, null,
        'recvonly', 'active');
    } else if (media.direction === 'sendrecv') {
      addMediaToSDPBlob(sdp, media.type, sharedCapabilities, streams,
        'sendrecv', 'active');
    }
  });

  addIceParametersToSDPBlob(sdp, iceParameters);
  addDtlsParametersToSDPBlob(sdp, dtlsParameters);
  addCandidatesToSDPBlob(sdp, this._localCandidates);

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
  options = options || {};
  var mandatoryOptions = options.mandatory || {};
  var optionalOptions = options.optional || {};

  var offerToReceiveAudio = null;
  var offerToReceiveVideo = null;

  if ('OfferToReceiveAudio' in mandatoryOptions) {
    offerToReceiveAudio = mandatoryOptions.OfferToReceiveAudio;
  } else if ('OfferToReceiveAudio' in optionalOptions) {
    offerToReceiveAudio = optionalOptions.OfferToReceiveAudio;
  }

  if ('OfferToReceiveVideo' in mandatoryOptions) {
    offerToReceiveVideo = mandatoryOptions.OfferToReceiveVideo;
  } else if ('OfferToReceiveVideo' in optionalOptions) {
    offerToReceiveVideo = optionalOptions.OfferToReceiveVideo;
  }

  var iceParameters = this._iceGatherer.getLocalParameters();
  var dtlsParameters = this._dtlsTransport.getLocalParameters();

  var streams = this.getLocalStreams();

  var sdp = makeInitialSDPBlob();
  addBundleToSDPBlob(sdp, streams, offerToReceiveAudio, offerToReceiveVideo);
  addMsidSemanticToSDPBlob(sdp, streams);

  var hasAudioTrack = false;
  var hasVideoTrack = false;
  streams.forEach(function(stream) {
    hasAudioTrack = hasAudioTrack || !!stream.getAudioTracks().length;
    hasVideoTrack = hasVideoTrack || !!stream.getVideoTracks().length;
  });

  if (hasAudioTrack || offerToReceiveAudio) {
    var audioCapabilities = RTCRtpSender.getCapabilities('audio');
    var audioDirection;
    if (hasAudioTrack && offerToReceiveAudio !== false) {
      audioDirection = 'sendrecv';
    } else if (hasAudioTrack && offerToReceiveAudio === false) {
      audioDirection = 'sendonly';
    } else {
      audioDirection = 'recvonly';
    }
    addMediaToSDPBlob(sdp, 'audio', audioCapabilities, streams,
      audioDirection);
  }
  if (hasVideoTrack || offerToReceiveVideo) {
    var videoCapabilities = RTCRtpSender.getCapabilities('video');
    var videoDirection;
    if (hasVideoTrack && offerToReceiveVideo !== false) {
      videoDirection = 'sendrecv';
    } else if (hasVideoTrack && offerToReceiveVideo === false) {
      videoDirection = 'sendonly';
    } else {
      videoDirection = 'recvonly';
    }
    addMediaToSDPBlob(sdp, 'video', videoCapabilities, streams,
      videoDirection);
  }

  addIceParametersToSDPBlob(sdp, iceParameters);
  addDtlsParametersToSDPBlob(sdp, dtlsParameters);
  addCandidatesToSDPBlob(sdp, this._localCandidates);

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

  var parameters = parseDescription(description);

  if (this.signalingState === 'have-remote-offer') {
    this._receiveRtp(parameters.rtpParameters);
    this._sendRtp(parameters.rtpParameters);
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

  var parameters = parseDescription(description);

  this._startIceTransport(parameters.iceParameters[0]);
  this._startDtlsTransport(parameters.dtlsParameters[0]);

  if (this.signalingState === 'have-local-offer') {
    this._receiveRtp(parameters.rtpParameters);
    this._sendRtp(parameters.rtpParameters);
  }

  this._remoteDescription = description;
  this._signalingState = nextSignalingState;

  onSuccess();
};

/**
 * Parse the SDP contained in an {@link RTCSessionDescription} into individual
 * {@link RTCIceParameters}, {@link RTCDtlsParameters}, and
 * {@link RTCRtpParameters}.
 * @access private
 * @param {RTCSessionDescription} description
 * @returns {object}
 */
function parseDescription(description) {
  console.log(description.sdp);
  var sdp = sdpTransform.parse(description.sdp);

  var iceParameters = [];
  var dtlsParameters = [];
  var rtpParameters = [];

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
      var cname;
      var ssrc;
      (level.ssrcs || []).forEach(function(attribute) {
        if (attribute.attribute === 'cname') {
          ssrc = attribute.id;
          cname = attribute.value;
        }
      });
      rtpParameters.push({
        type: level.type,
        muxId: level.mid,
        codecs: level.rtp.map(function(rtp) {
          var codec = {
            name: rtp.codec,
            payloadType: parseInt(rtp.payload),
            clockRate: parseInt(rtp.rate),
            numChannels: 1,
            rtcpFeedback: [],
            parameters: {}
          };
          switch (rtp.codec) {
            case 'telephone-event':
              codec.parameters.events = '0-16';
              // codec.payloadType = 101;
              break;
          }
          return codec;
        }),
        headerExtensions: [],
        encodings: [
          {
            ssrc: ssrc,
            // FIXME(mroberts): We are selecting PCMU all the time.
            codecPayloadType: 0,
            // fec: 0,
            // rtx: 0,
            // priority: 1.0,
            // maxBitrate: 2000000.0,
            // minQuality: 0,
            // framerateBias: 0.5,
            // resolutionScale: 1.0,
            // framerateScale: 1.0,
            active: true
          },
          {
            ssrc: ssrc,
            codecPayloadType: 101,
            active: true
          }
        ],
        rtcp: {
          ssrc: ssrc,
          cname: cname,
          // reducedSize: false,
          // compound: false,
          mux: level.rtcpMux === 'rtcp-mux'
        }
      });
    }
  });

  return {
    iceParameters: iceParameters,
    dtlsParameters: dtlsParameters,
    rtpParameters: rtpParameters
  };
}

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
 * Construct codec capabilities from media-level RTP settings in an SDP blob.
 * @param {?Array<object>} [rtps]
 * @returns {object}
 */
function makeCodecCapabilitiesFromMediaLevelRtpSettings(rtps) {
  var codecs = [];
  if (!rtps) {
    return codecs;
  }
  rtps.forEach(function(rtp) {
    var codec = {
      name: rtp.codec,
      preferredPayloadType: parseInt(rtp.payload),
      clockRate: rtp.rate,
      numChannels: rtp.encoding || 1,
      rtcpFeedback: [],
      parameters: {}
    };
    switch (rtp.codec) {
      case 'telephone-event':
        codec.parameters.events = '0-16';
        break;
    }
    codecs.push(codec);
  });
  return codecs;
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
    msidSemantic: {
      semantic: 'WMS'
    }
  };
}

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
 * Add ICE candidates to the session- and media-levels of an SDP blob. Since
 * this adds to the media-levels, you should call this after you have added
 * all your media.
 * @param {?object} [sdp={}]
 * @param {?Array<RTCIceCandidate>} [candidates]
 * @param {?number} [component] - if unspecified, add both RTP and RTCP candidates
 * @returns {object}
 */
function addCandidatesToSDPBlob(sdp, candidates, component) {
  sdp = sdp || {};
  /* eslint no-use-before-define:0 */
  addCandidatesToSessionLevel(sdp, candidates, component);
  addCandidatesToMediaLevels(sdp, candidates, component);
  return sdp;
}

/**
 * Add ICE candidates to the session-level of an SDP blob.
 * media.
 * @param {?object} [sdp={}]
 * @param {?Array<RTCIceCandidate>} [candidates]
 * @param {?number} [component] - if unspecified, add both RTP and RTCP candidates
 * @returns {object}
 */
var addCandidatesToSessionLevel = addCandidatesToLevel;

/**
 * Add the "a=group:BUNDLE" line to the SDP blob. If no mids are provided, this
 * is a noop.
 * @param {?object} [sdp={}]
 * @param {?Array<MediaStream>} [streams]
 * @param {?boolean} [offerToReceiveAudio]
 * @param {?boolean} [offerToReceiveVideo]
 * @returns {object}
 */
function addBundleToSDPBlob(sdp, streams, offerToReceiveAudio, offerToReceiveVideo) {
  sdp = sdp || {};
  var hasAudio = false;
  var hasVideo = false;
  if (streams) {
    streams.forEach(function(stream) {
      var audioTracks = stream.getAudioTracks();
      var videoTracks = stream.getVideoTracks();
      hasAudio = hasAudio || !!audioTracks.length;
      hasVideo = hasVideo || !!videoTracks.length;
    });
  }
  var mids = [];
  if (hasAudio || (!hasAudio && offerToReceiveAudio)) {
    mids.push('audio');
  }
  if (hasVideo || (!hasVideo && offerToReceiveVideo)) {
    mids.push('video');
  }
  if (mids.length) {
    sdp.groups = sdp.groups || [];
    sdp.groups.push({
      type: 'BUNDLE',
      mids: mids.join(' ')
    });
  }
  return sdp;
}

/**
 * Add the DTLS fingerprint to the session- and media-levels of an SDP blob.
 * Since this adds to media-levels, you should call this after you have added
 * all your media.
 * @param {?object} [sdp={}]
 * @param {RTCDtlsParameters} dtlsParameters
 * @returns {object}
 */
function addDtlsParametersToSDPBlob(sdp, dtlsParameters) {
  sdp = sdp || {};
  addDtlsParametersToSessionLevel(sdp, dtlsParameters);
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
 * Add the DTLS fingerprint to the seesion-level of an SDP blob.
 * @param {?object} [sdp={}]
 * @param {RTCDtlsParameters} dtlsParameters
 * @returns {object}
 */
var addDtlsParametersToSessionLevel = addDtlsParametersToLevel;

/**
 * Add the ICE username fragment and password to the session- and media-levels
 * of an SDP blob. Since this adds to media-levels, you should call this after
 * you have added all your media.
 * @param {?object} [sdp={}]
 * @param {RTCIceParameters} parameters
 * @returns {object}
 */
function addIceParametersToSDPBlob(sdp, iceParameters) {
  sdp = sdp || {};
  addIceParametersToSessionLevel(sdp, iceParameters);
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
 * Add the ICE username fragment and password to the session-level of an SDP
 * blob. Since this adds to media-levels, you should call this after you have
 * added all your media.
 * @param {?object} [sdp={}]
 * @param {RTCIceParameters} parameters
 * @returns {object}
 */
var addIceParametersToSessionLevel = addIceParametersToLevel;

/**
 * Add the "a=msid-semantic:WMS" line to the SDP blob.
 * @param {?object} [sdp={}]
 * @param {?Array<MediaStream>} [streams]
 * @returns {object}
 */
function addMsidSemanticToSDPBlob(sdp, streams) {
  sdp = sdp || {};
  sdp.msidSemantic = {
    semantic: 'WMS'
  };
  if (streams && streams.length) {
    sdp.msidSemantic.token = streams.map(function(stream) {
      return stream.id;
    }).join(' ');
  }
  return sdp;
}

/**
 * Add MediaStreams and MediaStreamTracks to an SDP blob.
 * @param {?object} [sdp={}]
 * @param {string} mid - one of "audio" or "video"
 * @param {RTCRtpCapabilities} capabilities - audio or video capabilities
 * @param {?Array<MediaStream>} [streams]
 * @param {?string} [direction] - one of "sendrecv", "sendonly", "recvonly", or "inactive"
 * @param {?string} [setup='actpass']
 * @param {?boolean} [rtcpMux=true]
 * @returns {object}
 */
function addMediaToSDPBlob(sdp, mid, capabilities, streams, direction, setup, rtcpMux) {
  sdp = sdp || {};
  sdp.media = sdp.media || [];

  var rtps = [];
  var fmtps = [];
  var payloads = [];

  capabilities.codecs.forEach(function(codec) {
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

    /* if (codec.name === 'telephone-event') {
      fmtps.push({
        // ...
      });
    } */

    rtps.push(rtp);
  });

  var hasTrack = false;

  var ssrcs = [];

  streams.forEach(function(stream) {
    var tracks = mid === 'audio'
      ? stream.getAudioTracks()
      : stream.getVideoTracks();
    hasTrack = hasTrack || !!tracks.length;
    tracks.forEach(function(track) {
      var id = track.id;
      // TODO(mroberts): Able to specify SSRC?
      var ssrc = Math.floor(Math.random() * 4294967296);
      ssrcs = ssrcs.concat([
        {
          id: ssrc,
          attribute: 'msid',
          value: stream.id + ' ' + id
        },
        {
          id: ssrc,
          attribute: 'mslabel',
          value: id
        },
        {
          id: ssrc,
          attribute: 'label',
          value: id
        }
      ]);
    });
  });

  var media = {
    rtp: rtps,
    fmtp: fmtps,
    type: mid,
    mid: mid,
    port: 9,
    payloads: payloads.join(' '),
    protocol: 'RTP/SAVPF',
    direction: direction,
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
    setup: setup || 'actpass',
    ssrcs: ssrcs
  };

  if (rtcpMux !== false) {
    media.rtcpMux = 'rtcp-mux';
  }

  sdp.media.push(media);

  return sdp;
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
  if (!candidate.candidate) {
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
 * Intersect RTCRtpCapabilities with codec capabilities.
 * @param {RTCRtpCapabilities} localCapabilities
 * @param {Array<object>} remoteCodecs
 * @returns {Array<object>}
 */
function intersectCodecs(localCapabilities, remoteCodecs) {
  var sharedCodecs = [];
  localCapabilities.codecs.forEach(function(localCodec) {
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
