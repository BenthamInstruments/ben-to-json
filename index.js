//
// @file index.js
// @author David Hammond
// @author Richard Miller-Smith
// @date 1 May 2018
// @copyright Copyright © 2018 by Bentham Instruments Ltd. All Rights Reserved.
//

const BenToJSON = require('./lib/BenToJSON');

// Converts a Bentham Instruments measurement data file in .ben binary format
// to JSON.
//
// @param data (string|Buffer) The input file data
// @returns POD JS object
function parse(data) {
  return (new BenToJSON(data)).get_json();
}

module.exports = {
  parse: parse
};
