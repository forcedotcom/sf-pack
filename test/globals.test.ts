/* eslint-disable no-console */
import Utils from '../src/helpers/utils.js';
import Setup from './helpers/setup.js';

const clientId = '3MVG9ux34Ig8G5epxHFM0XYGUONe0UR3bJqoigGoSlLXIOIDXomyAVt2HN.Yl7UekI5MsA0n7UK.3Xyk8fcB1';
const certFilePath = './JWT/server.key';

before(async function () {
  this.timeout(0);
  const login = `sf org login jwt --alias sf-pack-org --username ${Setup.username} --jwt-key-file ${certFilePath} --client-id ${clientId} --json`;
  const result = await Utils.command(login, true);
  console.log(result);
});

/*
after(async function () {
  this.timeout(0);
  const logout = `sf org logout --target-org ${Setup.username}`;
  const result = await Utils.command(logout, true);
  console.log(result);
});
*/
