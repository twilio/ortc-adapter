'use strict';

var sdpTransform = require('sdp-transform');

/**
 * Add the "a=group:BUNDLE" line to the SDP blob. If no mids are provided, this
 * is a noop.
 * @param {?object} [sdp={}]
 * @param {?Set<string>} [mids]
 * @returns {object}
 */
function addBundleToSDPBlob(sdp, set) {
  sdp = sdp || {};
  var mids = [];
  if (set) {
    set.forEach(function(mid) {
      mids.push(mid);
    });
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
 * Add ICE candidates to the session-level of an SDP blob.
 * media.
 * @param {?object} [sdp={}]
 * @param {?Array<RTCIceCandidate>} [candidates]
 * @param {?number} [component] - if unspecified, add both RTP and RTCP candidates
 * @returns {object}
 */
// var addCandidatesToSessionLevel = addCandidatesToLevel;

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
 * Add the DTLS fingerprint to the seesion-level of an SDP blob.
 * @param {?object} [sdp={}]
 * @param {RTCDtlsParameters} dtlsParameters
 * @returns {object}
 */
// var addDtlsParametersToSessionLevel = addDtlsParametersToLevel;

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
 * Add the ICE username fragment and password to the session-level of an SDP
 * blob. Since this adds to media-levels, you should call this after you have
 * added all your media.
 * @param {?object} [sdp={}]
 * @param {RTCIceParameters} parameters
 * @returns {object}
 */
// var addIceParametersToSessionLevel = addIceParametersToLevel;

/**
 * Add MediaStreams and MediaStreamTracks to an SDP blob.
 * @param {?object} [sdp={}]
 * @param {string} kind - one of "audio" or "video"
 * @param {RTCRtpCapabilities} capabilities - audio or video capabilities
 * @param {?Array<MediaStream>} [streams]
 * @param {?string} [direction] - one of "sendrecv", "sendonly", "recvonly", or "inactive"
 * @param {?string} [mid]
 * @param {?string} [setup='actpass']
 * @param {?boolean} [rtcpMux=true]
 * @returns {object}
 */
function addMediaToSDPBlob(sdp, kind, capabilities, streams, direction, mid, setup, rtcpMux) {
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

    switch (codec.name) {
      case 'telephone-event':
        fmtps.push({
          payload: payload,
          config: codec.parameters.events
        });
        break;
    }

    rtps.push(rtp);
  });

  var hasTrack = false;

  var ssrcs = [];

  streams.forEach(function(stream) {
    var tracks = kind === 'audio'
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
    type: kind,
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

  if (mid) {
    media.mid = mid;
  }

  if (rtcpMux !== false) {
    media.rtcpMux = 'rtcp-mux';
  }

  sdp.media.push(media);

  return sdp;
}

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
    /* connection: {
      version: 4,
      ip: '0.0.0.0'
    }, */
    msidSemantic: {
      semantic: 'WMS'
    }
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

module.exports.addBundleToSDPBlob = addBundleToSDPBlob;
module.exports.addCandidatesToSDPBlob = addCandidatesToSDPBlob;
module.exports.addDtlsParametersToSDPBlob = addDtlsParametersToSDPBlob;
module.exports.addIceParametersToSDPBlob = addIceParametersToSDPBlob;
module.exports.addMediaToSDPBlob = addMediaToSDPBlob;
module.exports.addMsidSemanticToSDPBlob = addMsidSemanticToSDPBlob;
module.exports.makeCodecCapabilitiesFromMediaLevelRtpSettings = makeCodecCapabilitiesFromMediaLevelRtpSettings;
module.exports.makeInitialSDPBlob = makeInitialSDPBlob;
module.exports.parseDescription = parseDescription;
