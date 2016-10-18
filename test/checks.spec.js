/* eslint-disable import/no-extraneous-dependencies */
import test from 'ava';
import Authorizr from '../src';

let authorizr;
test.before(() => {
  authorizr = new Authorizr(() => {
    return { foo: 'bar' };
  });
});

test('throwing an error in a check will cause any to resolve to false', async t => {
  authorizr.addEntity(
    'entity',
    {
      check: () => {
        throw new Error('error!');
      }
    }
  );

  const auth = authorizr.newRequest({});
  return auth.entity().check().any().then(res => t.is(res, false));
});

test('throwing an error in a check will cause all to resolve to false', async t => {
  authorizr.addEntity(
    'entity',
    {
      check: () => {
        throw new Error('error!');
      }
    }
  );

  const auth = authorizr.newRequest({});
  return auth.entity().check().all().then(res => t.is(res, false));
});

test('returning false in single check will cause all to resolve to false', async t => {
  authorizr.addEntity(
    'entity',
    {
      check: () => false
    }
  );

  const auth = authorizr.newRequest({});
  return auth.entity().check().all().then(res => t.is(res, false));
});

test('returning a rejected promise will cause all to resolve to false', async t => {
  authorizr.addEntity(
    'entity',
    {
      check: () => Promise.reject('error!')
    }
  );

  const auth = authorizr.newRequest({});
  return auth.entity().check().all().then(res => t.is(res, false));
});

test('returning a promise that resolves to true will cause all to resolve to true', async t => {
  authorizr.addEntity(
    'entity',
    {
      check: () => Promise.resolve(true)
    }
  );

  const auth = authorizr.newRequest({});
  return auth.entity().check().all().then(res => t.is(res, true));
});

test('returning true in single check will cause all to resolve to true', async t => {
  authorizr.addEntity(
    'entity',
    {
      check: () => true
    }
  );

  const auth = authorizr.newRequest({});
  return auth.entity().check().all().then(res => t.is(res, true));
});

test('returning false in any check will cause all to resolve to false', async t => {
  authorizr.addEntity(
    'entity',
    {
      check: () => true,
      check2: () => false
    }
  );

  const auth = authorizr.newRequest({});
  return auth.entity()
    .check()
    .check2()
    .all()
    .then(res => t.is(res, false));
});

test('returning true in any check will cause any to resolve to true', async t => {
  authorizr.addEntity(
    'entity',
    {
      check: () => true,
      check2: () => false
    }
  );

  const auth = authorizr.newRequest({});
  return auth.entity()
    .check()
    .check2()
    .any()
    .then(res => t.is(res, true));
});
