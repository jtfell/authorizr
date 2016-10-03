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
  const entity = new Entity(name, checks, this);
  this[name] = this.__createEntityCallHandler(entity);
}

Authorizr.prototype.__createEntityCallHandler = function (entity) {
  return function entityCallHandler() {
    entity.__setEntityArgs(arguments);
    return entity;
  };
}

function Entity(name, checks, authorizr) {
  this.__name = name;
  this.__authorizr = authorizr;
  this.__entityArgs = null;
  this.__activeChecks = [];
  this.__numActiveChecks = 0;
  this.__setupErr = null;

  Object.keys(checks).forEach(name => {

      const fn = checks[name];

      // Add error checking and account for promises in user-defined check
      const check = wrapCheck(fn);
      // Attach a generic check handler to catch the check calls
      this[name] = this.__createCheckCallHandler(check);
  });
}

Entity.prototype.__setEntityArgs = function (args) {
  this.__entityArgs = args;
};

Entity.prototype.verify = function () {
  if (this.__authorizr.__setupErr) {
    // Pass the setup error back to the user
    return Promise.reject(this.__authorizr.__setupErr);
  }
  if (this.__numActiveChecks !== this.__activeChecks.length) {
    // If we haven't started all the checks, try again later
    return Promise.resolve().then(() => this.verify());
  }
  return Promise.all(this.__activeChecks)
    .then(checkResults => {
      this.__numActiveChecks = 0;

      // Start with true, then let any false value switch the final
      // result to false
      return checkResults.reduce((prev, result) => prev && result, true)
    });
};

/**
 * Creates a check handler that allows chainable check calls.
 */
Entity.prototype.__createCheckCallHandler = function (check) {
  return function checkCallHandler() {
    const checkArgs = arguments;
    this.__numActiveChecks += 1;

    this.__authorizr.__setupResult.then(globalCtx => {
      // Call the wrapped user-defined check
      this.__activeChecks.push(check(globalCtx, this.__entityArgs, checkArgs));
    }).catch(err => {
      this.__numActiveChecks -= 1;
      this.__setupErr = err
    });

    // Chainable
    return this;
  }.bind(this);
}

function wrapCheck(fn) {
  return (globalCtx, entityArgs, checkArgs) => {
    return new Promise(resolve => {

      // Call the user-defined check
      try {
        const res = fn(globalCtx, entityArgs, checkArgs);
        const p = Promise.resolve(res);
        p.then(res => resolve(res)).catch(() => resolve(false));
      } catch (e) {
        return resolve(false);
      }

    });
  };
}

export default Authorizr;
