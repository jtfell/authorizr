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

function configure(context) {

  // Do any pre-authorisation optimisation here. 
  // eg. construct auth object from database for easy access

  return {
    // Define the entities to check against (usually corresponding to models in your database)
    user: {
      init: function() {
        // Save references to values needed for authorisation checks
        this.viewerId = context.id;
        this.admin = context.admin;
      },
      checks: {
        isAdmin: function() {
          return this.admin;
        }
      }
    },
    team: {
      init: function(team) {
        this.viewerId = context.id;
        this.team = team;
      },
      checks: {
        isOwner: function() {
          return this.viewerId === this.team.ownerId;
        },
        isMember: function() {
          return this.viewerId === this.team.memberId;
        }
      }
    } 
  }
}
const Authorizr = authorizr(configure);
```

Create a new authorizr instance using the context of the request (before the graphql query is executed). This allows the authorizr to
setup all the checks for the user making the request.

```js
req.ctx.auth = new Authorizr(ctx);
```

Use the checks in an easily readable way in the resolve functions.

```js
resolve: function(id, args, { auth }) {
  if (auth.team(id).isOwner().isMember() || auth.user().isAdmin()) {
    // Do protected access
  }
}
```
