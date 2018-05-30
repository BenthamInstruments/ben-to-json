//
// @file tests.js
// @author David Hammond
// @author Richard Miller-Smith
// @date 1 May 2018
// @copyright Copyright © 2018 by Bentham Instruments Ltd. All Rights Reserved.
//

const fs = require('fs');
const path = require('path');
const util = require('util');

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

// Test set of .ben and verified .json files
const TEST_SET = [
   ['test_00024.ben', 'test_00024.json']
  ,['test_00453.ben', 'test_00453.json']
  ,['test_combo.ben', 'test_combo.json']
];

// Loop through and test the test set
TEST_SET.forEach(TEST => {
  test(util.format('parse(%s) === %s' ,TEST[0], TEST[1]), (done) => {  
    const ben_input = fs.readFileSync(path.join(ben_dir, TEST[0]));
    const json_output = JSON.parse(fs.readFileSync(path.join(json_dir, TEST[1])));
    
    let json_test = null;
    expect(() => { json_test = parse(ben_input); }).not.toThrow();
//    expect(toPrecision(json_test)).toEqual(toPrecision(json_output));
    done();
  });
});
