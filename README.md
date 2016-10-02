# authorizr

Minimalist authorisation mechanism for node servers :zap:. Designed for efficient use in graphql servers, authorizr allows
flexible and easy to reason about authoristion checks. By creating a new authorizr object per request, the implementation
is free to pre-optimise as much or as little of the heavy lifting as desired.

## Install

`npm install authorizr`

## Usage

Create a new authorizr.

```js
import authorizr from 'authorizr';

// Create a new authorisation object
const auth = new authorizr(context => {
  
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

auth.addEntity(
  'team',
  {
    // Each check function is passed the pre-calculated global context, any arguments
    // passed into the entity and any arguments passed into the specific check
    isOwner: (ctx, entityArgs, args) => ctx.teams[entityArgs.teamId].owner === ctx.userId,
    isAdmin: (ctx, entityArgs, args) => ctx.teams[entityArgs.teamId].admin === ctx.userId
  }
);
```

Create a new authorizr instance using the context of the request (before the graphql query is executed). This allows the authorizr to
setup all the checks for the user making the request.

```js
req.ctx.auth = authorizr.createInstance(ctx);
```

Use the checks in an easily readable way in the resolve functions.

```js
resolve: function(id, args, { auth }) {

  Promise.all([
    auth.team(id)
      .isOwner()
      .isMember()
      .verify(),
      
    auth.user()
        .isAdmin()
        .verify()
  ]).then(res => 
    if (res[0] || res[1]) {
      // Do protected access
    }
  }
}
```
