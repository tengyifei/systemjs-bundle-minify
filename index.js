var _ = require('lodash');
var recast = require('recast');
var types = require('ast-types');

module.exports = {

  /**
   * Minifies module names.
   *
   * @param {String} src - Javascript source of the bundle
   * @returns {String} bundle with minified module names
   */
  function minifyModuleNames (src) {
    var n = types.namedTypes;

    var ast = recast.parse(src);
    var knownModules = {};

    /**
     * @constructor
     */
    function Module (name) {
      this.name = name;
      this.count = 0;
      this.nameSetters = [];
    }

    var visitorBase = {
      isRegisterCall: function (callExpr) {
        n.CallExpression.assert(callExpr);
        return n.MemberExpression.check(callExpr.callee)
            && n.Identifier.check(callExpr.callee.object)
            && callExpr.callee.object.name === 'System'
            && n.Identifier.check(callExpr.callee.property)
            && callExpr.callee.property.name === 'register';
      },

      isRequireCall: function (callExpr) {
        n.CallExpression.assert(callExpr);
        return n.Identifier.check(callExpr.callee)
            && callExpr.callee.name === 'require'
            && callExpr.arguments.length === 1
            && n.Literal.check(callExpr.arguments[0]);
      },

      isMainModuleCall: function (callExpr) {
        n.CallExpression.assert(callExpr);

        /* Match this format:
         * (function (mains, declare) { ... } )( ... )(['mainModule'], function(System) { ... })
         */
        return n.CallExpression.check(callExpr.callee)
            && callExpr.arguments.length === 2
            && n.ArrayExpression.check(callExpr.arguments[0])
            && n.FunctionExpression.check(callExpr.arguments[1])
            && callExpr.arguments[1].params.length === 1
            && n.Identifier.check(callExpr.arguments[1].params[0])
            && callExpr.arguments[1].params[0].name === 'System';
      },

      /**
       * Registers a module with corresponding location in AST.
       * @param {Literal} nameLiteral - A literal wrapping the module name
       */
      registerModule: function (nameLiteral) {
        var name = nameLiteral.value;
        knownModules[name] = knownModules[name] || new Module(name);
        knownModules[name].count++;
        knownModules[name].nameSetters.push(function (newName) {
          nameLiteral.value = newName;
        });
      }
    };

    // Collect module names
    types.visit(ast, _.assign({
      visitCallExpression: function (path) {
        var node = path.node;
        if (this.isRegisterCall(node)) {
          // Figure out module and dependencies
          n.Literal.assert(node.arguments[0]);
          this.registerModule(node.arguments[0]);
          n.ArrayExpression.assert(node.arguments[1]);
          node.arguments[1].elements.forEach(function (element) {
            n.Literal.assert(element);
            this.registerModule(element);
          }.bind(this));
        }
        this.traverse(path);
      }
    }, visitorBase));

    // Second pass: collect required modules and main module
    types.visit(ast, _.assign({
      visitCallExpression: function (path) {
        var node = path.node;
        if (this.isRequireCall(node)) {
          if (knownModules[node.arguments[0].value])
            this.registerModule(node.arguments[0]);
        }

        if (this.isMainModuleCall(node)) {
          var mainModules = node.arguments[0].elements;
          mainModules.forEach(function (element) {
            n.Literal.assert(element);
            this.registerModule(element);
          }.bind(this));
        }

        this.traverse(path);
      }
    }, visitorBase));

    var modules = [];
    for (var name in knownModules) modules.push(knownModules[name]);
    modules = _.sortBy(modules, function (m) { return -m.count });   // sort from most used to least used
    // Rename
    function setName(newName, setter) {
      setter(newName);
    }
    for (var i = 0; i < modules.length; i++) {
      var newName = Number(i).toString(36);
      modules[i].nameSetters.forEach(setName.bind(null, newName));
    }
    return recast.print(ast).code;
  }
}
