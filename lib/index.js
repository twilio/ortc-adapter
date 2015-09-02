'use strict';

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

  // ICE Transport

  var iceTransport = new RTCIceTransport(iceGatherer);
  var oniceconnectionstatechange = null;

  iceTransport.onicestatechange = this._onicestatechange.bind(this);

  // DTLS Transport

  var dtlsTransport = new RTCDtlsTransport(iceTransport);

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
    _remoteDescription: {
      get: function() {
        return remoteDescription;
      },
      set: function(_remoteDescription) {
        remoteDescription = _remoteDescription;
      }
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
            void error;
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
    signalingState: {
      enumerable: true,
      get: function() {
        return signalingState;
      }
    }
  });
}

RTCPeerConnection.prototype._onicestatechange =
  function _onicestatechange(event)
{
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
    var webrtcIceCandidateEvent = makeWebRTCCandidateEvent(event.candidate);
    this.onicecandidate(webrtcIceCandidateEvent);
  }
};

RTCPeerConnection.prototype.createOffer =
  function createOffer(options, onSuccess, onFailure)
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

RTCPeerConnection.prototype.createAnswer =
  function createAnswer(options, onSuccess, onFailure)
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
  this._signalingState = nextState;
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
  this._remoteDescription = description;
  this._signalingState = nextSignalingState;
  onSuccess(description);
};

RTCPeerConnection.prototype.addIceCandidate =
  function addIceCandidate(candidate, onSuccess, onFailure)
{
  var ortcCandidate = makeORTCCandidate(candidate);
  this._iceTransport.addRemoteCandidate(ortcCandidate);
  onSuccess();
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
  if (!candidate) {
    return {};
  }
  line = candidate.candidate.replace(/ +/g, ' ').split(' ');
  var ortcIceCandidate = {
    foundation: line[1],
    protocol: line[3],
    priority: parseInt(line[4]),
    ip: line[5],
    port: parseInt(line[6]),
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

function makeWebRTCCandidateEvent(candidate) {
  if (isNullDictionary(candidate)) {
    return makeWebRTCNullCandidateEvent();
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
  return {
    candidate: new RTCIceCandidate({
      candidate: line.join(' '),
      sdpMLineIndex: 0
    })
  }
}

function makeWebRTCNullCandidateEvent() {
  return {
    candidate: null
  };
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

/*var configuration = {
  iceServers: [
    {
      urls: 'turn:global.turn.twilio.com:3478?transport=udp',
      username: '3818124b412ddd4a6ad7f75953116c126fd391187ee94c61fa61dea90f41423a',
      credential: 'GBh/BqvfGhXJoAaaJUCYccpGQHNRB7C7xwiqnpkKVR0='
    }
  ]
};

var peerConnection = new RTCPeerConnection(configuration);

peerConnection.onicecandidate = function onicecandidate(event) {
  var webrtcCandidate = event.candidate;
  peerConnection.addIceCandidate(
    event.candidate,
    console.log.bind(console),
    console.error.bind(console));
};*/

if (typeof module !== 'undefined') {
  module.exports.RTCIceCandidate = RTCIceCandidate;
  module.exports.RTCPeerConnection = RTCPeerConnection;
  module.exports.RTCSessionDescription = RTCSessionDescription;
}
