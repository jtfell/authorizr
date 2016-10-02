"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
function Authorizr(setupFn) {
  this.__setupFn = wrapSetupFn(setupFn);
}

Authorizr.prototype.newRequest = function (input) {
  this.__globalCtx = this.__setupFn(input);
};

Authorizr.prototye.addEntity = function (name, checks) {
  var entity = new Entity(name, checks, this);
  this[name] = this.__createEntityCallHandler(entity);
};

Authorizr.prototype.__createEntityCallHandler = function (entity) {
  var _arguments = arguments;

  return function () {
    entity.__setEntityArgs(_arguments);
    return entity;
  };
};

function Entity(name, checks, authorizr) {
  this.__name = name;
  this.__authorizr = authorizr;
  this.__hasFailed = false;
  this.entityArgs = null;

  for (var check in checks) {
    if (checks.hasOwnProperty(check)) {
      var fn = checks[_check];

      // Add error checking and account for promises in user-defined check
      var _check = wrapCheck(fn);
      // Attach a generic check handler to catch the check calls
      this[_check] = this.__createCheckCallHandler(_check);
    }
  }
}

Entity.prototype.__setEntityArgs = function (args) {
  this.__entityArgs = args;
};

/**
 * Creates a check handler that allows chainable check calls.
 */
Entity.prototype.__createCheckCallHandler = function (check) {
  var _this = this,
      _arguments2 = arguments;

  return function () {
    if (_this.__hasFailed) {
      return _this;
    }

    var checkArgs = _arguments2;
    // Call the wrapped user-defined check
    var resPromise = check(_this.__authorizr.__globalCtx, _this.__entityArgs, checkArgs);

    // Chainable
    return _this;
  };
};

function wrapCheck(fn) {
  return function (globalCtx, entityArgs, checkArgs) {
    return new Promise(function (resolve) {

      // Call the user-defined check
      try {
        var _res = fn(globalCtx, entityArgs, checkArgs);
      } catch (e) {
        return resolve(false);
      }

      var p = Promise.resolve(res);
      p.then(function (res) {
        return resolve(res);
      }).catch(function () {
        return resolve(false);
      });
    });
  };
}

exports.default = Authorizr;