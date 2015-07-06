'use strict';

var should = require('should');
var minifier = require('../index');
var path = require('path');
var vm = require('vm');

var minifyName = minifier.minifyModuleNames;

var suites = [
  { name: '(with unminified bundle)', options: { minify: false, mangle: false } },
  { name: '(with minified bundle)', options: { minify: true, mangle: true } }
];

var builders = [
  { name: 'current', module: require('systemjs-builder') },
  { name: 'v0.12', module: require('systemjs-builder-12') },
  { name: 'v0.11', module: require('systemjs-builder-11') },
  { name: 'v0.10', module: require('systemjs-builder-10') }
];


function testWithBuilder (Builder) {
  for (var _suite of suites) {
    describe('minifyModuleNames ' + _suite.name, (function (suite) { return function () {
      var builder;
      var buildResult;
      beforeEach(function () {
        builder = new Builder({
          baseURL: path.join(__dirname, 'fixtures'),
          transpiler: 'traceur',
          defaultJSExtensions: true
        });
        buildResult = builder.buildSFX('mainModule', suite.options)
        .then(function (output) {
          return output.source;
        });
      });

      it('minified program should run correctly', function () {
        return buildResult
        .then(function (source) {
          // Run minified code
          global.moduleResult = false;
          var sandbox = { global: global };
          vm.createContext(sandbox);
          var code;
          vm.runInContext(code = minifyName(source), sandbox);
          should(global.moduleResult).be.equal(42);
        });
      });

      if (suite.options.minify) {
        it('should eliminate module names', function () {
          return buildResult
          .then(function (source) {
            var minified = minifyName(source);
            minified.indexOf('mainModule.js').should.be.equal(-1);
            minified.indexOf('adderModule.js').should.be.equal(-1);
            minified.indexOf('callerModule.js').should.be.equal(-1);
          });
        });
      }

    }; })(_suite));
  }
}

for (var _builder of builders) {
  describe('Against systemjs-builder version: ' + _builder.name, (function (builder) {
    return function () { testWithBuilder(builder.module); };
  })(_builder));
}
