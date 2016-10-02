function Authorizr(setupFn) {
  this.__setupFn = setupFn;
}

Authorizr.prototype.newRequest = function (input) {
  this.__ready = false;
  
  Promise.resolve(this.__setupFn(input))
    .then(res => {
      this.__globalCtx = res;
      this.__ready = true;
    });

  return this;
};

Authorizr.prototype.addEntity = function (name, checks) {
  const entity = new Entity(name, checks, this);
  this[name] = this.__createEntityCallHandler(entity);
}

Authorizr.prototype.__createEntityCallHandler = function (entity) {
  return () => {
    entity.__setEntityArgs(arguments);
    return entity;
  };
}

function Entity(name, checks, authorizr) {
  this.__name = name;
  this.__authorizr = authorizr;
  this.__hasFailed = false;
  this.entityArgs = null;

  for (let check in checks) {
    if (checks.hasOwnProperty(check)) {

      console.log(check, checks[check]);
      const fn = checks[check];

      // Add error checking and account for promises in user-defined check
      const check = wrapCheck(fn);
      // Attach a generic check handler to catch the check calls
      this[check] = this.__createCheckCallHandler(check);
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
  return () => {
    if (this.__hasFailed) {
      return this;
    }

    if (!this.__authorizr.__ready) {
      // If the setup code isn't done yet, need to wait
      //
      // NOTE: This condition will always be caught by the first
      //       check in the chain.

    }

    const checkArgs = arguments;
    // Call the wrapped user-defined check
    const resPromise = check(this.__authorizr.__globalCtx, this.__entityArgs, checkArgs);

    // Chainable
    return this;
  };
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
