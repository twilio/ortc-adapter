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

  // draft-ietf-rtcweb-jsep-11, Section 5.2.2:
  //
  //     Each "m=" and c=" line MUST be filled in with the port, protocol,
  //     and address of the default candidate for the m= section, as
  //     described in [RFC5245], Section 4.3.  Each "a=rtcp" attribute line
  //     MUST also be filled in with the port and address of the
  //     appropriate default candidate, either the default RTP or RTCP
  //     candidate, depending on whether RTCP multiplexing is currently
  //     active or not.
  //
  var defaultCandidate = mediaSection.defaultCandidate;

  var media = {
    rtp: rtps,
    fmtp: fmtps,
    type: mediaSection.kind,
    port: defaultCandidate ? defaultCandidate.port : 9,
    payloads: payloads.join(' '),
    protocol: 'RTP/SAVPF',
    direction: mediaSection.direction,
    connection: {
      version: 4,
      ip: defaultCandidate ? defaultCandidate.ip : '0.0.0.0'
    },
    rtcp: {
      port: defaultCandidate ? defaultCandidate.port : 9,
      netType: 'IN',
      ipVer: 4,
      address: defaultCandidate ? defaultCandidate.ip : '0.0.0.0'
    },
    ssrcs: ssrcs
  };
  if (mid) {
    media.mid = mid;
  }
  if (mediaSection.rtcpMux) {
    media.rtcpMux = 'rtcp-mux';
  }
  addCandidatesToLevel(media, mediaSection.candidates);
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

      if (level.endOfCandidates === 'end-of-candidates') {
        mediaSection.addCandidate({});
      }

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
