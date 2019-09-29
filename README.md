# authorizr

[![Build Status](https://travis-ci.org/jtfell/authorizr.svg?branch=master)](https://travis-ci.org/jtfell/authorizr)
[![Coverage Status](https://coveralls.io/repos/github/jtfell/authorizr/badge.svg?branch=master)](https://coveralls.io/github/jtfell/authorizr?branch=master)

Minimalist authorisation mechanism for node servers :zap:. Designed for efficient use in GraphQL servers, authorizr allows
flexible and easy to reason about authoristion checks. By creating a new authorizr object per request, the implementation
is free to pre-optimise as much or as little of the heavy lifting as desired.

I've written a little on the idea behind this library on [my blog](https://jtfell.com/blog/posts/2017-02-06-authorisation-revisited.html).

## Install

`npm install authorizr`

## Example Usage

Create a new authorizr.

```js
import Authorizr from 'authorizr';

// Create a new authorisation object
const authorizr = new Authorizr(context => {
  
  // Do any pre-calculation per instance (eg. get commonly used info from db)
  return new Promise((resolve, reject) => {
    const teams = db.findUserTeams(context.userId);
    const perms = db.findUserPermissions(context.userId);
    
    Promise.all([teams, perms])
      .then(res => {
      
        // Resolve the promise with data that is passed into every auth check
        resolve({ userId: context.userId, teams: res[0], perms: res[1] })
      });
  });
});

authorizr.addEntity(
  'team',
  {
    // Each check function is passed the pre-calculated global context, any arguments
    // passed into the entity and any arguments passed into the specific check
    isOwner: (ctx, entityId, args) => ctx.teams[entityId].owner === ctx.userId,
    isAdmin: (ctx, entityId, args) => ctx.teams[entityId].admin === ctx.userId
  }
);
```

Create a new authorizr instance using the context of the request (before the graphql query is executed). This allows the authorizr to
setup all the checks for the user making the request.

```js
req.ctx.auth = authorizr.newRequest(ctx);
```

Use the checks in an easily readable way in the resolve functions.

```js
resolve: function(id, args, { auth }) {

  auth.team(id)
      .isOwner()
      .isAdmin()
      .any()
      .then(res => 
    if (res) {
      // Do protected access
    }
  }
}
```

## API

#### `new Authorizr(setupFn [, options])`

Create a new `Authorizr` instance.

- *setupFn*: A function that accepts arbitrary inputs and does pre-optimisation for each request. Returns an arbitrary object, or a promise resolving to an arbitrary object, that will be passed to each individual authorisation check.

- *options*: An optional object of options:
  - *cache*: Default `true`. Set to false to disable caching each authorisation check.
  
#### `addEntity(name, checks)`

Adds an entity for doing authorisation checks against.

- *name*: The name of the function to be called when authorising requests.
- *checks*: An object with check names mapping to functions for completing each check. Each check has the signature:
  `check(globalCtx, entityArgs, checkArgs)`
  - *globalCtx*: The result of the `setupFn` for this request.
  - *entityId*: The argument passed to the entity auth call (usually identifying the entity to perform the check against.
  - *checkArgs*: The arguments passed to the individual auth check.

#### `newRequest(context)`

Creates a new context for authorisation calls. The `setupFn` will be called as part of this initialisation.

- *context*: Any context needed for authorisation, passed directly into `setupFn`. Usually identification about who is making the request.

#### `entity(entityId)`

Identifies an entity for completing authorisation checks against and returns an object with chainable check methods from the `addEntity` call.

- *entityId*: Argument used to identify the entity.

#### `check(checkArgs)`

Completes an authorisation check using context from the request and entity calls. Th

- *checkArgs*: Arguments used to pass in information needed for the check

#### `all()`

Returns a promise resolving to true if *all* the checks passed, otherwise resolving to false.

#### `any()`

Returns a promise resolving to true if *any* the checks passed, otherwise resolving to false.
