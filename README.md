ORTC to WebRTC adapter
======================

[![NPM](https://nodei.co/npm/ortc-adapter.png?downloads=true&stars=true)](https://nodei.co/npm/ortc-adapter/)

[![Build Status](https://secure.travis-ci.org/twilio/ortc-adapter.svg)](http://travis-ci.org/twilio/ortc-adapter)

ortc-adapter is an implementation of WebRTC's
[`RTCPeerConnection`](https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection)
and related APIs in terms of [Object RTC](http://ortc.org/) (ORTC). WebRTC
applications can use this adapter to target browsers, such as
[Microsoft Edge](https://www.microsoft.com/en-us/windows/microsoft-edge), that
only support ORTC.

Install
-------

[Download ortc-adapter from NPM](https://www.npmjs.com/package/ortc-adapter)
using [bower](http://bower.io) or npm with one of the following commands:

### Bower

```
bower install ortc-adapter
```

### NPM

```
npm install ortc-adapter
```

Inclusion in the Browser
------------------------

### Bower

```html
<script src="bower_components/ortc-adapter/ortc-adapter.js"></script>
```

### NPM

Copy ortc-adapter.js to the desired location in your source tree, or use a tool
like [browserify](http://browserify.org/) or
[webpack](https://webpack.github.io/) to include the source as part of your
build process.

Refer to [examples](examples) for an example of how you can do this.
