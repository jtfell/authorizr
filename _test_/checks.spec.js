import Authorizr from '../src';
import test from 'ava';

let authorizr;
test.before(() => {
  authorizr = new Authorizr(context => {
    return { foo: 'bar' };
  });
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
