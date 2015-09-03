'use strict';

var sdpTransform = require('sdp-transform');

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

function RTCPeerConnection(configuration) {
  if (!(this instanceof RTCPeerConnection)) {
    return new RTCPeerConnection(configuration);
  }

  // ICE Gatherer

  var gatherOptions = makeGatherOptions(configuration);
  var iceGatherer = new RTCIceGatherer(gatherOptions);
  var iceGatheringCompleted = false;

  iceGatherer.onlocalcandidate = this._onlocalcandidate.bind(this);

  var onicecandidate = null;
  var onicecandidateWasSet = false;

  // NOTE(mroberts): This is a hack. See addIceCandidate.
  var iceCandidatesAdded = 0;

  // ICE Transport

  var iceTransport = new RTCIceTransport();
  var oniceconnectionstatechange = null;

  iceTransport.onicestatechange = this._onicestatechange.bind(this);

  // DTLS Transport

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
    _localTracks: {
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
    _remoteTracks: {
      value: []
    },
    _rtpReceivers: {
      value: []
    },
    _rtpSenders: {
      value: []
    },
    _signalingState: {
      get: function() {
        return signalingState;
      },
      set: function(_signalingState) {
        signalingState = _signalingState;
        if (onsignalingstatechange) {
          setTimeout(onsignalingstatechange);
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

RTCPeerConnection.prototype._ondtlsstatechange =
  function ondtlsstatechange(event)
{
  console.log('DTLS transport state: ' + this._dtlsTransport.state);
};

RTCPeerConnection.prototype._onicestatechange =
  function _onicestatechange(event)
{
  console.log('ICE transport state: ' + this._iceTransport.state);
  if (this.oniceconnectionstatechange) {
    this.oniceconnectionstatechange(event);
  }
};

RTCPeerConnection.prototype._onlocalcandidate =
  function _onlocalcandidate(event)
{
  if (isNullDictionary(event.candidate)) {
    this._iceGatheringCompleted = true;
  }
  if (this.onicecandidate) {
    var webrtcCandidate = makeWebRTCCandidate(event.candidate);
    this.onicecandidate(makeOnIceCandidateEvent(webrtcCandidate));
  }
};

RTCPeerConnection.prototype.addIceCandidate =
  function addIceCandidate(candidate, onSuccess, onFailure)
{
  // HACK(mroberts): This shouldn't happen in our use case, but see below.
  if (++this._iceCandidatesAdded > 2) {
    return console.log(
      'Dropping ICE Candidate #' + this._iceCandidatesAdded + ': ' + candidate.candidate);
  }

  console.log(
    'Adding ICE Candidate #' + this._iceCandidatesAdded + ': ' + candidate.candidate);
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

RTCPeerConnection.prototype.addStream = function addStream(mediaStream) {
  this._localStreams.push(mediaStream);
  [].forEach.call(mediaStream.getTracks(), function(track) {
    this._localTracks.push(track);
    var rtpSender = new RTCRtpSender(track, this._dtlsTransport);
    this._rtpSenders.push(rtpSender);
  }, this);
};

RTCPeerConnection.prototype.close = function close() {
  this._signalingState = 'closed';
  this._rtpReceivers.forEach(function(rtpReceiver) {
    rtpReceiver.stop();
  });
  this._dtlsTransport.stop();
  this._iceTransport.stop();
};

RTCPeerConnection.prototype.createAnswer =
  function createAnswer(onSuccess, onFailure, options)
{
  if (this.signalingState !== 'have-remote-offer') {
    return void onFailure(invalidSignalingState(this.signalingState));
  }
  var iceParameters = this._iceGatherer.getLocalParameters();
  var dtlsParameters = this._dtlsTransport.getLocalParameters();

  var description = new RTCSessionDescription({
    sdp: null,
    type: 'answer'
  });

  onSuccess(description);
};

RTCPeerConnection.prototype.createOffer =
  function createOffer(onSuccess, onFailure, options)
{
  if (this.signalingState !== 'stable') {
    return void onFailure(invalidSignalingState(this.signalingState));
  }
  var iceParameters = this._iceGatherer.getLocalParameters();
  var dtlsParameters = this._dtlsTransport.getLocalParameters();

  // NOTE(mroberts): This SDP is specifically what we'd expect a twilio.js
  // client running in Chrome to send. Make changes as necessary to generalize. 
  var lines = [
    'v=0',
    'o=- 3142774810005113780 2 IN IP4 127.0.0.1',
    's=-',
    't=0 0',
    'a=group:BUNDLE audio',
    'a=msid-semantic: WMS SFTQsfPWqHyKAm0eVtKrzvF2NO12W6UsLMjq',
    'm=audio 9 RTP/SAVPF 111 103 104 9 0 8 106 105 13 126',
    'c=IN IP4 0.0.0.0',
    'a=rtcp:9 IN IP4 0.0.0.0',
    'a=ice-ufrag:' + iceParameters.usernameFragment,
    'a=ice-pwd:' + iceParameters.password
  ];
  lines = lines.concat(dtlsParameters.fingerprints.map(function(fingerprint) {
    return 'a=fingerprint:' + fingerprint.algorithm + ' ' + fingerprint.value;
  }));
  lines = lines.concat([
    'a=setup:actpass',
    'a=mid:audio',
    'a=extmap:1 urn:ietf:params:rtp-hdrext:ssrc-audio-level',
    'a=extmap:3 http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time',
    'a=sendrecv',
    'a=rtcp-mux',
    'a=rtpmap:111 opus/48000/2',
    'a=fmtp:111 minptime=10; useinbandfec=1',
    'a=rtpmap:103 ISAC/16000',
    'a=rtpmap:104 ISAC/32000',
    'a=rtpmap:9 G722/8000',
    'a=rtpmap:0 PCMU/8000',
    'a=rtpmap:8 PCMA/8000',
    'a=rtpmap:106 CN/32000',
    'a=rtpmap:105 CN/16000',
    'a=rtpmap:13 CN/8000',
    'a=rtpmap:126 telephone-event/8000',
    'a=maxptime:60',
    'a=ssrc:3956715131 cname:3F74+tCOjjaLptiT',
    'a=ssrc:3956715131 msid:SFTQsfPWqHyKAm0eVtKrzvF2NO12W6UsLMjq 9d442883-f410-48a3-a4c9-fec983f224b7',
    'a=ssrc:3956715131 mslabel:SFTQsfPWqHyKAm0eVtKrzvF2NO12W6UsLMjq',
    'a=ssrc:3956715131 label:9d442883-f410-48a3-a4c9-fec983f224b7'
  ]);

  var description = new RTCSessionDescription({
    sdp: lines.join('\r\n'),
    type: 'offer'
  });
  
  onSuccess(description);
};

RTCPeerConnection.prototype.getLocalStreams =
  function getLocalStreams()
{
  return this._localStreams.slice();
};

RTCPeerConnection.prototype.getRemoteStreams =
  function getRemoteStreams()
{
  return this._remoteStreams.slice();
};

RTCPeerConnection.prototype.setLocalDescription =
  function setLocalDescription(description, onSuccess, onFailure)
{
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
  this._localDescription = description;
  this._signalingState = nextSignalingState;
  onSuccess();
};

RTCPeerConnection.prototype.setRemoteDescription =
  function setRemoteDescription(description, onSuccess, onFailure)
{
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

  this._iceTransport.start(this._iceGatherer, parameters.iceParameters[0], 'controlling');
  this._dtlsTransport.start(parameters.dtlsParameters[0]);

  parameters.rtpParameters.forEach(function(rtpParameters) {
    var type = rtpParameters.type;
    delete rtpParameters.type;

    var rtpReceiver = new RTCRtpReceiver(this._dtlsTransport, type);
    this._rtpReceivers.push(rtpReceiver);
    rtpReceiver.receive(rtpParameters);

    var track = rtpReceiver.track;
    this._remoteTracks.push(track);

    // NOTE(mroberts): Without any source-level msid attribute, we are just
    // going to assume a one-to-one mapping between MediaStreams and
    // MediaStreamTracks.
    var mediaStream = new MediaStream();
    mediaStream.addTrack(track);
    this._remoteStreams.push(mediaStream);

    if (this.onaddstream) {
      this.onaddstream(makeOnAddStreamEvent(mediaStream));
    }
  }, this);

  this._remoteDescription = description;
  this._signalingState = nextSignalingState;

  onSuccess(description);
};

RTCPeerConnection.prototype._parseRemoteDescription =
  function _parseRemoteDescription(description)
{
  var sdp = sdpTransform.parse(description.sdp);

  var iceParameters = [];
  var dtlsParameters = [];
  var rtpParameters = [];

  var levels = [sdp];
  if (sdp.media) {
    levels = levels.concat(sdp.media);
  }

  var parameters = [];
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
        if (attribute.attribute == 'cname') {
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

function invalidSignalingState(signalingState) {
  return new Error('Invalid signaling state: ' + signalingState);
}

function isNullDictionary(dictionary) {
  return !Object.keys(dictionary).length;
}

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

function makeORTCCandidate(candidate) {
  if (!candidate.candidate) {
    return {};
  }
  var start = candidate.candidate.indexOf('candidate:');
  var line = candidate.candidate.slice(start + 10).replace(/ +/g, ' ').split(' ');
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

function makeWebRTCCandidate(candidate) {
  if (isNullDictionary(candidate)) {
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

function makeOnIceCandidateEvent(candidate) {
  return new RTCPeerConnectionIceEvent('icecandidate', {
    candidate: candidate
  });
}

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

function makeOnAddStreamEvent(stream) {
  return new MediaStreamEvent('addstream', {
    stream: stream
  });
}

if (typeof module !== 'undefined') {
  module.exports.RTCIceCandidate = RTCIceCandidate;
  module.exports.RTCPeerConnection = RTCPeerConnection;
  module.exports.RTCSessionDescription = RTCSessionDescription;
}
