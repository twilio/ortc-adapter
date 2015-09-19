/*! ${name}.js ${version}

#include "LICENSE.md"
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
    require('./ortc-adapter-bundle');
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
