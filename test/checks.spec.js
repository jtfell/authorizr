import Authorizr from '../src';
import test from 'ava';

let authorizr;
test.before(() => {
  authorizr = new Authorizr(context => {
    return { foo: 'bar' };
  });
});

test('throwing an error in a check will cause verify to resolve to false', async t => {
  authorizr.addEntity(
    'entity',
    {
      check: () => {
        throw new Error('error!');
      }
    }
  );

  const auth = authorizr.newRequest({});
  return auth.entity().check().verify().then(res => t.is(res, false));
});

test('returning false in single check will cause verify to resolve to false', async t => {
  authorizr.addEntity(
    'entity',
    {
      check: () => false
    }
  );

  const auth = authorizr.newRequest({});
  return auth.entity().check().verify().then(res => t.is(res, false));
});

test('returning a rejected promise will cause verify to resolve to false', async t => {
  authorizr.addEntity(
    'entity',
    {
      check: () => Promise.reject('error!')
    }
  );

  const auth = authorizr.newRequest({});
  return auth.entity().check().verify().then(res => t.is(res, false));
});

test('returning a promise that resolves to true will cause verify to resolve to true', async t => {
  authorizr.addEntity(
    'entity',
    {
      check: () => Promise.resolve(true)
    }
  );

  const auth = authorizr.newRequest({});
  return auth.entity().check().verify().then(res => t.is(res, true));
});

test('returning true in single check will cause verify to resolve to true', async t => {
  authorizr.addEntity(
    'entity',
    {
      check: () => true
    }
  );

  const auth = authorizr.newRequest({});
  return auth.entity().check().verify().then(res => t.is(res, true));
});

test('returning false in any check will cause verify to resolve to false', async t => {
  authorizr.addEntity(
    'entity',
    {
      check: () => true,
      check2: () => false
    }
  );

  const auth = authorizr.newRequest({});
  return auth.entity().check().check2().verify().then(res => t.is(res, false));
});
