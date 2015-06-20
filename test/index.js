var should = require('chai').should();
var minifier = require('../index');
var Builder = require('systemjs-builder');
var path = require('path');
var util = require('util');
var vm = require('vm');

var minifyName = minifier.minifyModuleNames;

describe('minifyModuleNames', function () {

  var builder;
  var buildResult;
  beforeEach(function () {
    builder = new Builder({
      baseURL: path.join(__dirname, 'fixtures'),
      transpiler: 'babel'
    });
    buildResult = builder.buildSFX('mainModule.js')
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

  it('should eliminate module names', function () {
    return buildResult
    .then(function (source) {
      var minified = minifyName(source);
      minified.indexOf('mainModule.js').should.be.equal(-1);
      minified.indexOf('adderModule.js').should.be.equal(-1);
      minified.indexOf('callerModule.js').should.be.equal(-1);
      minified.indexOf('System.register').should.not.be.equal(-1);
    });
  });

});

