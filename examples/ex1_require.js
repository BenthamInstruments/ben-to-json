// Swap the commented line below if importing from outside the  ben-to-json folder
//const { parse } = require('@benthaminstruments/ben-to-json');
const { parse } = require('..');

const fs = require('fs');

const ben_file_data = fs.readFileSync('__tests__/data/ben/test_00024.ben');
let json = parse(ben_file_data);

console.log(json);
