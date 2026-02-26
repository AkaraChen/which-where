/**
 * Analyzer index - exports all analyzers
 */

const { checkBrew } = require('./brew');
const { checkCargo } = require('./cargo');
const { checkGo } = require('./go');
const { checkNpm } = require('./npm');
const { checkYarn } = require('./yarn');
const { checkPnpm } = require('./pnpm');
const { checkSystem } = require('./system');

module.exports = {
  checkBrew,
  checkCargo,
  checkGo,
  checkNpm,
  checkYarn,
  checkPnpm,
  checkSystem
};
