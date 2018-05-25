//
// @file tests.js
// @author David Hammond
// @author Richard Miller-Smith
// @date 1 May 2018
// @copyright Copyright © 2018 by Bentham Instruments Ltd. All Rights Reserved.
//

const fs = require('fs');
const path = require('path');

const deepMap = require('deep-map');
var _ = require('lodash');

const { parse } = require('../index');

// Directories for test set data
const ben_dir  = path.join(__dirname, '/data/ben');
const json_dir = path.join(__dirname, '/data/json');

// Limit all numbers to common max precision
function toPrecision(obj) {
  return deepMap(obj, (value, key) => {
    return _.isNumber(value) ? Number(value.toPrecision(10)) : value;
  });
}

// Test test_00024.ben
test('test_00024.ben', (done) => {  
  const ben_input = fs.readFileSync(path.join(ben_dir, 'test_00024.ben'));
  const json_output = JSON.parse(fs.readFileSync(path.join(json_dir, 'test_00024.json')));
  
  let json_test = null;
  expect(() => { json_test = parse(ben_input); }).not.toThrow();
  expect(toPrecision(json_test)).toEqual(toPrecision(json_output));
  done();
});
