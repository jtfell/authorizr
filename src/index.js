/**
 * Constructor function
 *
 * @param {Function} setupFn
 */
function Authorizr(setupFn) {
  this.__setupFn = setupFn;
}

/**
 * Creates a new request instance and runs the setup function
 * based on the input obj passed in.
 *
 * @param {Object} input - An arbitrary object to be passed into
 *     the setup Function
 */
Authorizr.prototype.newRequest = function (input) {
  this.__setupResult = Promise.resolve(this.__setupFn(input));
  return this;
};

/**
 * Defines a new entity to be used on any request instance.
 *
 * @param {String} name - Name of entity
 * @param {Object} checks - Mapping from check name to check
 *     function for entity
 */
Authorizr.prototype.addEntity = function (name, checks) {
  this[name] = this.__createEntityCallHandler(name, checks);
};

/**
 * Uses a closure to return a function that sets the entity ID, then returns
 * the entity.
 *
 * @param {Entity} entity
 */
Authorizr.prototype.__createEntityCallHandler = function (name, checks) {
  return function entityCallHandler(entityId) {
    const entity = new Entity(name, checks);
    entity.__setContext(entityId, this.__setupResult);
    return entity;
  }.bind(this);
};

/**
 * Entity type constructor. Handles chaining checks together from a
 * single entity ID.
 *
 * @param {String} name
 * @param {Object} checks
 */
function Entity(name, checks) {
  this.__entityId = null;
  this.__name = name;

  this.__setupResult = null;
  this.__setupErr = null;

  this.__activeChecks = [];

  Object.keys(checks).forEach(checkName => {

    const fn = checks[checkName];

    // Add error checking and account for promises in user-defined check
    const check = wrapCheck(fn);
    // Attach a generic check handler to catch the check calls
    this[checkName] = this.__createCheckCallHandler(check);
  });
}

/**
 * Setter function for entity ID.
 *
 * @param {Any} id
 */
Entity.prototype.__setContext = function (id, setupResult) {
  this.__entityId = id;
  this.__setupResult = setupResult;
};

/**
 * Returns a promise that resolves to true if any of the
 * checks resolve to true.
 */
Entity.prototype.any = function () {
  if (this.__setupErr) {
    throw this.__setupErr;
  }
  return Promise.all(this.__activeChecks)
    .then(checkResults => {
      this.__activeChecks = [];

      checkResults.forEach(res => {
        if (res instanceof Error) {
          throw res;
        }
      });

      // Start with false, then let any true value switch the final
      // result to true
      return checkResults.reduce((prev, result) => prev || result, false);
    });
};

/**
 * Returns a promise that resolves to true if all of the
 * checks resolve to true.
 */
Entity.prototype.all = function () {
  if (this.__setupErr) {
    throw this.__setupErr;
  }
  return Promise.all(this.__activeChecks)
    .then(checkResults => {
      this.__activeChecks = [];

      checkResults.forEach(res => {
        if (res instanceof Error) {
          throw res;
        }
      });

      // Start with true, then let any false value switch the final
      // result to false
      return checkResults.reduce((prev, result) => prev && result, true);
    });
};

/**
 * Creates a check handler that allows chainable check calls.
 *
 * @param {Function} check
 */
Entity.prototype.__createCheckCallHandler = function (check) {
  return function checkCallHandler() {
    const checkArgs = arguments;

    const newCheckRes = this.__setupResult.then(globalCtx => {
      return check(globalCtx, this.__entityId, checkArgs);
    }).catch(err => {
      return err;
    });

    this.__activeChecks.push(newCheckRes);

    // Chainable
    return this;
  }.bind(this);
};


/**
 * Helper function to wrap check functions in a try/catch and
 * handle promises and direct return values consistently.
 *
 * @param {Function} fn
 */
function wrapCheck(fn) {
  return (globalCtx, entityId, checkArgs) => {
    return new Promise(resolve => {

      // Call the user-defined check
      try {
        const res = fn(globalCtx, entityId, checkArgs);
        const p = Promise.resolve(res);
        return p.then(result => resolve(result))
          .catch(err => resolve(err));

      } catch (e) {
        // Resolve the error to be handled in the final call of the chain
        return resolve(e);
      }

    });
  };
}

export default Authorizr;
