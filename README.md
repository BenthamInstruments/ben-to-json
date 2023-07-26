## BenWin+ .ben binary file to JSON converter

![Node CI](https://github.com/BenthamInstruments/ben-to-json/workflows/Node%20CI/badge.svg)
![Publish package on release](https://github.com/BenthamInstruments/ben-to-json/workflows/Publish%20package%20on%20release/badge.svg)

# ben-to-json

Read spectrum files produced by [Bentham's BenWin+ Software](https://www.bentham.co.uk/products/components/software/benwin-spectral-acquisition-software-71/) in Javascript

## Install

- `npm install @bentham-instruments/ben-to-json`


## Examples

### Using require

```javascript
const { parse } = require('@benthaminstruments/ben-to-json');

const fs = require('fs');

const ben_file_data = fs.readFileSync('spectra.ben');
let json = parse(ben_file_data);

console.log(json);
```

### Using import

```javascript
import { parse } from '@benthaminstruments/ben-to-json';

import {readFileSync} from 'fs';

const ben_file_data = readFileSync('spectra.ben');
let json = parse(ben_file_data);

console.log(json);
```

## Full-ICU (Pre Node v13)

If you are using an old version of node, pre v13, then it needs to be run with 
in a special way as these older versions were not built with full international 
support by default.

This support can  be added by using the NODE_ICU_DATA to point to an installed version of the 
[full-icu]([Title](https://www.npmjs.com/package/full-icu))
package. e.g. `"cross-env NODE_ICU_DATA=./node_modules/full-icu node script.js`
