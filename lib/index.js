"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
/**
 * Constructor function
 *
 * @param {Function} setupFn
 */
function Authorizr(setupFn) {
  this.__setupFn = setupFn;
}

Authorizr.prototype.newRequest = function (input) {
  this.__setupResult = Promise.resolve(this.__setupFn(input));
  return this;
};

Authorizr.prototype.addEntity = function (name, checks) {
  var entity = new Entity(name, checks, this);
  this[name] = this.__createEntityCallHandler(entity);
};

Authorizr.prototype.__createEntityCallHandler = function (entity) {
  return function entityCallHandler() {
    entity.__setEntityArgs(arguments);
    return entity;
  };
};

function Entity(name, checks, authorizr) {
  var _this = this;

  this.__name = name;
  this.__authorizr = authorizr;
  this.__entityArgs = null;
  this.__activeChecks = [];
  this.__numActiveChecks = 0;
  this.__setupErr = null;

  Object.keys(checks).forEach(function (name) {

    var fn = checks[name];

    // Add error checking and account for promises in user-defined check
    var check = wrapCheck(fn);
    // Attach a generic check handler to catch the check calls
    _this[name] = _this.__createCheckCallHandler(check);
  });
}

Entity.prototype.__setEntityArgs = function (args) {
  this.__entityArgs = args;
};

Entity.prototype.verify = function () {
  var _this2 = this;

  if (this.__authorizr.__setupErr) {
    // Pass the setup error back to the user
    return Promise.reject(this.__authorizr.__setupErr);
  }
  if (this.__numActiveChecks !== this.__activeChecks.length) {
    // If we haven't started all the checks, try again later
    return Promise.resolve().then(function () {
      return _this2.verify();
    });
  }
  return Promise.all(this.__activeChecks).then(function (checkResults) {
    _this2.__numActiveChecks = 0;

    // Start with true, then let any false value switch the final
    // result to false
    return checkResults.reduce(function (prev, result) {
      return prev && result;
    }, true);
  });
};

/**
 * Creates a check handler that allows chainable check calls.
 */
Entity.prototype.__createCheckCallHandler = function (check) {
  return function checkCallHandler() {
    var _this3 = this;

    var checkArgs = arguments;
    this.__numActiveChecks += 1;

    this.__authorizr.__setupResult.then(function (globalCtx) {
      // Call the wrapped user-defined check
      _this3.__activeChecks.push(check(globalCtx, _this3.__entityArgs, checkArgs));
    }).catch(function (err) {
      _this3.__numActiveChecks -= 1;
      _this3.__setupErr = err;
    });

    // Chainable
    return this;
  }.bind(this);
};

function wrapCheck(fn) {
  return function (globalCtx, entityArgs, checkArgs) {
    return new Promise(function (resolve) {

      // Call the user-defined check
      try {
        var res = fn(globalCtx, entityArgs, checkArgs);
        var p = Promise.resolve(res);
        p.then(function (res) {
          return resolve(res);
        }).catch(function () {
          return resolve(false);
        });
      } catch (e) {
        return resolve(false);
      }
    });
  };
}

exports.default = Authorizr;