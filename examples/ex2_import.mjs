// Swap the commented line below if importing from outside the  ben-to-json folder
//import { parse } from '@benthaminstruments/ben-to-json';
import { parse } from '../index.js';

import {readFileSync} from 'fs';

const ben_file_data = readFileSync('__tests__/data/ben/test_00024.ben');
let json = parse(ben_file_data);

console.log(json);
