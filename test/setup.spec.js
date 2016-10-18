/* eslint-disable import/no-extraneous-dependencies */
import test from 'ava';
import Authorizr from '../src';

test('context returned via promise is passed to checks', async t => {
  const authorizr = new Authorizr(() => {
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
  const authorizr = new Authorizr(() => {
    return new Promise((resolve, reject) => {
      throw new Error('error!');
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
  const authorizr = new Authorizr(() => {
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

test('entityId is passed to checks', async t => {
  const authorizr = new Authorizr(() => {
    return { foo: 'bar' };
  });

  authorizr.addEntity(
    'entity',
    {
      check: (ctx, entityId, args) => t.is(entityId, 'bar')
    }
  );

  const auth = authorizr.newRequest({});
  return auth.entity('bar').check();
});

test('checkArgs are passed to checks', async t => {
  const authorizr = new Authorizr(() => {
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
