Introduction
============
[![NPM](https://nodei.co/npm/systemjs-bundle-minify.png)](https://nodei.co/npm/systemjs-bundle-minify/)

This package contains special minification utilities for SystemJS self-executing bundles.
Currently it supports the following:
+ Minify modules names i.e. `github:jspm/some-really-long-module@1.2.3` -> `a`

Installation
============
From NPM:

    npm install systemjs-bundle-minify

Usage
=====
```js
var minifier = require('systemjs-bundle-minify');

// SystemJS builder
builder.buildSFX('myModule.js', options)
.then(function (output) {
    return minifier.minifyModuleNames(output.source);
});
```
