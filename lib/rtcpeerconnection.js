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

  // HACK(mroberts): This shouldn't happen in our use case, but see below.
  if (++this._iceCandidatesAdded > 2) {
    return console.log(
      'Dropping ICE Candidate #' + this._iceCandidatesAdded + ': ' +
        candidate.candidate);
  }

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

  // HACK(mroberts): Here's a nasty hack--we don't send end-of-candidates from
  // our gateway, but we need this information in order to start checking
  // candidates. Right now we know that we always send two candidates, so just
  // wait for two.
  if (this._iceCandidatesAdded === 2) {
    console.log('Adding null ICE candidate');
    this._iceTransport.addRemoteCandidate({});
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
  // var fingerprint = dtlsParameters.fingerprints[0];

  var sessionId = Math.floor(Math.random() * 4294967296);

  var sdp = sdpTransform.parse(this.remoteDescription.sdp);
  sdp.origin = {
    username: '-',
    sessionId: sessionId,
    sessionVersion: 2,
    netType: 'IN',
    ipVer: 4,
    address: '127.0.0.1'
  };
  sdp.name = '-';
  sdp.timing = {
    start: 0,
    stop: 0
  };
  // sdp.connection = {
  //   version: 4,
  //   ip: '0.0.0.0'
  // };
  delete sdp.connection;
  // sdp.iceUfrag = iceParameters.usernameFragment;
  // sdp.icePwd = iceParameters.password;
  delete sdp.iceUfrag;
  delete sdp.icePwd;
  // sdp.fingerprint = {
  //   type: fingerprint.algorithm,
  //   hash: fingerprint.value
  // };
  delete sdp.fingerprint;
  sdp.media = [];

  var lines = sdpTransform.write(sdp).split('\r\n');
  lines = lines.slice(0, lines.length - 1);

  this._localStreams.forEach(function(stream) {
    var streamId = stream.id;
    var tracks = stream.getTracks();
    [].forEach.call(tracks, function(track) {
      var id = track.id;
      var kind = track.kind;

      var payloadTypes = [];
      var rtpMapLines = [];
      var fmtpLines = [];

      var capabilities = RTCRtpSender.getCapabilities(kind);
      capabilities.codecs.forEach(function(codec) {
        if (codec.name !== 'PCMU' && codec.name !== 'telephone-event') {
          return;
        }
        var payloadType = codec.preferredPayloadType;
        payloadTypes.push(payloadType);
        rtpMapLines.push([
          'a=rtpmap:' + payloadType,
          codec.name + '/' + codec.clockRate +
            (codec.numChannels > 1 ? ('/' + codec.numChannels) : '')
        ].join(' '));
      });

      var mLine = [
        'm=' + kind,
        9,
        'RTP/SAVPF'
      ].concat(payloadTypes).join(' ');

      var ssrc = Math.floor(Math.random() * 4294967296);

      lines = lines.concat([
        mLine,
        'c=IN IP4 0.0.0.0',
        // 'c=IN IP4 192.168.210.62',
        'a=rtcp:9 IN IP4 0.0.0.0'
      ]);
      /* lines = lines.concat([].map.call(this._iceGatherer.getLocalCandidates(), function(candidate) {
        var webrtcCandidate = makeWebRTCCandidate(candidate);
        return webrtcCandidate.candidate;
      })); */
      lines = lines.concat([
        'a=ice-ufrag:' + iceParameters.usernameFragment,
        'a=ice-pwd:' + iceParameters.password
      ]);
      lines = lines.concat(dtlsParameters.fingerprints.map(
        function(fingerprint) {
          return 'a=fingerprint:' + fingerprint.algorithm + ' ' +
            fingerprint.value;
        }));
      lines = lines.concat([
        'a=setup:active',
        'a=mid:' + kind,
        // 'a=extmap:1 urn:ietf:params:rtp-hdrext:ssrc-audio-level',
        // 'a=extmap:3 http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time',
        'a=sendrecv',
        'a=rtcp-mux'
      ]).concat(rtpMapLines)
        .concat(fmtpLines)
        .concat([
        // 'a=ssrc:' + ssrc + ' cname:' + cname,
        // 'a=ssrc:' + ssrc + ' cname:' + 'qipfi/n56YmUdc5Z',
        'a=ssrc:' + ssrc + ' msid:' + streamId + ' ' + id,
        'a=ssrc:' + ssrc + ' mslabel:' + id,
        'a=ssrc:' + ssrc + ' label:' + id
      ]);
    }, this);
  }, this);

  console.log(lines.join('\n'));

  var description = new RTCSessionDescription({
    sdp: lines.join('\r\n'),
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
 * @param {?object} [options]
 * @returns {Promise<RTCSessionDescription>}
 */
RTCPeerConnection.prototype.createOffer = function createOffer(onSuccess, onFailure, options) {
  // TODO(mroberts): Support options.
  void options;
  if (this.signalingState !== 'stable') {
    return void onFailure(invalidSignalingState(this.signalingState));
  }
  var iceParameters = this._iceGatherer.getLocalParameters();
  var dtlsParameters = this._dtlsTransport.getLocalParameters();

  var sessionId = Math.floor(Math.random() * 4294967296);

  // NOTE(mroberts): This SDP is specifically what we'd expect a twilio.js
  // client running in Chrome to send. Make changes as necessary to generalize.
  var streamId = this._localStreams[0].id;
  var bundleLine = ['a=group:BUNDLE'].concat(this._rtpSenders.forEach(
    function(rtpSender) {
      return rtpSender.track.kind;
    })).join(' ');

  var lines = [
    'v=0',
    'o=- ' + sessionId + ' 2 IN IP4 127.0.0.1',
    's=-',
    't=0 0',
    bundleLine,
    'a=msid-semantic: WMS ' + streamId
  ];

  this._localStreams.forEach(function(stream) {
    streamId = stream.id;
    var tracks = stream.getTracks();
    [].forEach.call(tracks, function(track) {
      var id = track.id;
      var kind = track.kind;

      var payloadTypes = [];
      var rtpMapLines = [];
      var fmtpLines = [];

      var capabilities = RTCRtpSender.getCapabilities(kind);
      capabilities.codecs.forEach(function(codec) {
        var payloadType = codec.preferredPayloadType;
        payloadTypes.push(payloadType);
        rtpMapLines.push([
          'a=rtpmap:' + payloadType,
          codec.name + '/' + codec.clockRate +
            (codec.numChannels > 1 ? ('/' + codec.numChannels) : '')
        ].join(' '));
      });

      var mLine = [
        'm=' + kind,
        9,
        'RTP/SAVPF'
      ].concat(payloadTypes).join(' ');

      var ssrc = Math.floor(Math.random() * 4294967296);

      lines = lines.concat([
        mLine,
        'c=IN IP4 0.0.0.0',
        'a=rtcp:9 IN IP4 0.0.0.0',
        'a=ice-ufrag:' + iceParameters.usernameFragment,
        'a=ice-pwd:' + iceParameters.password
      ]);
      lines = lines.concat(dtlsParameters.fingerprints.map(
        function(fingerprint) {
          return 'a=fingerprint:' + fingerprint.algorithm + ' ' +
            fingerprint.value;
        }));
      lines = lines.concat([
        'a=setup:actpass',
        'a=mid:' + kind,
        // 'a=extmap:1 urn:ietf:params:rtp-hdrext:ssrc-audio-level',
        // 'a=extmap:3 http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time',
        'a=sendrecv',
        'a=rtcp-mux'
      ]).concat(rtpMapLines)
        .concat(fmtpLines)
        .concat([
        // 'a=ssrc:' + ssrc + ' cname:' + cname,
        'a=ssrc:' + ssrc + ' msid:' + streamId + ' ' + id,
        'a=ssrc:' + ssrc + ' mslabel:' + id,
        'a=ssrc:' + ssrc + ' label:' + id
      ]);
    }, this);
  }, this);

  var description = new RTCSessionDescription({
    sdp: lines.join('\r\n'),
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

  var parameters = this._parseLocalDescription(description);

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

  var parameters = this._parseRemoteDescription(description);

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
RTCPeerConnection.prototype._parseLocalDescription = function _parseLocalDescription(description) {
  return this._parseRemoteDescription(description);
};

/**
 * Parse the SDP contained in an {@link RTCSessionDescription} into individual
 * {@link RTCIceParameters}, {@link RTCDtlsParameters}, and
 * {@link RTCRtpParameters}.
 * @access private
 * @param {RTCSessionDescription} description
 * @returns {object}
 */
RTCPeerConnection.prototype._parseRemoteDescription = function _parseRemoteDescription(description) {
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
      level.ssrcs.forEach(function(attribute) {
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

module.exports = RTCPeerConnection;