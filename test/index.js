var should = require('chai').should();
var minifier = require('../index');
var path = require('path');
var util = require('util');
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
  { name: 'v0.10', module: require('systemjs-builder-10') },
];

for (var builder of builders) {
  describe('Against systemjs-builder version: ' + builder.name, (function (builder) {
    return function () { testWithBuilder(builder.module); };
  })(builder));
}

function testWithBuilder (Builder) {
  for (var suite of suites) {
    describe('minifyModuleNames ' + suite.name, (function (suite) { return function () {
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
        })
      });

      it('minified program should run correctly', function () {
        return buildResult
        .then(function (source) {
          // Run minified code
          var sandbox = { moduleResult: false, global: global };
          vm.createContext(sandbox);
          vm.runInContext(minifyName(source), sandbox);
          sandbox.moduleResult.should.be.equal(42);
        })
        .catch(function (err) {
          if (typeof err === 'object' && err.message)
            throw err.message;    // unwrap error message for mocha
          else
            throw err;
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

    }})(suite));
  }
}