SystemJS Bundle Minifier [![Build Status](https://travis-ci.org/tengyifei/systemjs-bundle-minify.svg?branch=master)](https://travis-ci.org/tengyifei/systemjs-bundle-minify)
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

Module maps
===========
The returned string object has a `moduleMap` field that allows you to inspect the correspondence between modules names before and after minification.
```js
builder.buildSFX('myModule.js', options)
.then(function (output) {
    var code = minifier.minifyModuleNames(output.source);
    for (var key in code.moduleMap) {
        console.log(key, '->', code.moduleMap[key]));
    }
});
// Output:
// adderModule -> 0
// callerModule -> 1
// mainModule -> 2
```
