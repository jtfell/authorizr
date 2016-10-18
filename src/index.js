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
  const entity = new Entity(name, checks, this);
  this[name] = this.__createEntityCallHandler(entity);
};

/**
 * Uses a closure to return a function that sets the entity ID, then returns
 * the entity.
 *
 * @param {Entity} entity
 */
Authorizr.prototype.__createEntityCallHandler = function (entity) {
  return function entityCallHandler(entityId) {
    entity.__setEntityId(entityId);
    return entity;
  };
};

/**
 * Entity type constructor. Handles chaining checks together from a
 * single entity ID.
 *
 * @param {String} name
 * @param {Object} checks
 * @param {Authorizr} authorizr - Instance of authorizr
 */
function Entity(name, checks, authorizr) {
  this.__name = name;
  this.__authorizr = authorizr;
  this.__entityId = null;
  this.__activeChecks = [];
  this.__numActiveChecks = 0;
  this.__setupErr = null;

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
Entity.prototype.__setEntityId = function (id) {
  this.__entityId = id;
};

/**
 * Returns a promise that resolves to true if any of the
 * checks resolve to true.
 */
Entity.prototype.any = function () {
  if (this.__numActiveChecks !== this.__activeChecks.length) {
    // If we haven't started all the checks, try again later
    return Promise.resolve().then(() => this.any());
  }
  return Promise.all(this.__activeChecks)
    .then(checkResults => {
      this.__numActiveChecks = 0;

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
  if (this.__numActiveChecks !== this.__activeChecks.length) {
    // If we haven't started all the checks, try again later
    return Promise.resolve().then(() => this.all());
  }
  return Promise.all(this.__activeChecks)
    .then(checkResults => {
      this.__numActiveChecks = 0;

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
    this.__numActiveChecks += 1;

    this.__authorizr.__setupResult.then(globalCtx => {
      // Call the wrapped user-defined check
      this.__activeChecks.push(check(globalCtx, this.__entityId, checkArgs));
    }).catch(err => {
      this.__numActiveChecks -= 1;
      this.__setupErr = err;
    });

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
        return p.then(result => resolve(result)).catch(() => resolve(false));
      } catch (e) {
        return resolve(false);
      }

    });
  };
}

export default Authorizr;
