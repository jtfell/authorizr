import Authorizr from '../src';
import test from 'ava';

test('context returned via promise is passed to checks', async t => {
  const authorizr = new Authorizr(context => {
    return new Promise((resolve, reject) => {
      resolve({ foo: 'bar' });
    });
  });

  authorizr.addEntity(
    'entity',
    {
      check: (ctx, entityArgs, args) => t.is(ctx.foo, 'bar')
    }
  );

  const auth = authorizr.newRequest({});
  return auth.entity().check();
});

test('rejected promise causes no checks to be run', async t => {
  const authorizr = new Authorizr(context => {
    return new Promise((resolve, reject) => {
      reject();
    });
  });

  authorizr.addEntity(
    'entity',
    {
      check: (ctx, entityArgs, args) => t.fail()
    }
  );

  const auth = authorizr.newRequest({});
  return auth.entity().check();
});

test('context returned directly is passed to checks', async t => {
  const authorizr = new Authorizr(context => {
    return { foo: 'bar' };
  });

  authorizr.addEntity(
    'entity',
    {
      check: (ctx, entityArgs, args) => t.is(ctx.foo, 'bar')
    }
  );

  const auth = authorizr.newRequest({});
  return auth.entity().check();
});

test('entityArgs are passed to checks', async t => {
  const authorizr = new Authorizr(context => {
    return { foo: 'bar' };
  });

  authorizr.addEntity(
    'entity',
    {
      check: (ctx, entityArgs, args) => t.is(entityArgs[0], 'bar')
    }
  );

  const auth = authorizr.newRequest({});
  return auth.entity('bar').check();
});

test('checkArgs are passed to checks', async t => {
  const authorizr = new Authorizr(context => {
    return { foo: 'bar' };
  });

  authorizr.addEntity(
    'entity',
    {
      check: (ctx, entityArgs, args) => t.is(args[0], 'bar')
    }
  );

  const auth = authorizr.newRequest({});
  return auth.entity().check('bar');
});
