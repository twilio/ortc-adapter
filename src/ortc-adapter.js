/*!
 * ${name}.js ${version}
 *
 * Copyright (c) 2015 Twilio, Inc. All rights reserved. <https://twilio.com>
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 *   - Redistributions of source code must retain the above copyright notice,
 *     this list of conditions and the following disclaimer.
 *
 *   - Redistributions in binary form must reproduce the above copyright
 *     notice, this list of conditions and the following disclaimer in the
 *     documentation and/or other materials provided with the distribution.
 *
 *   - Neither the name of Twilio nor the names of its contributors may be used
 *     to endorse or promote products derived from this software without
 *     specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 * ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
 * LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 * POSSIBILITY OF SUCH DAMAGE.
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
