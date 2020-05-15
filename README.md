## BenWin+ .ben binary file to JSON converter

![Node CI](https://github.com/BenthamInstruments/ben-to-json/workflows/Node%20CI/badge.svg)
![Publish package on release](https://github.com/BenthamInstruments/ben-to-json/workflows/Publish%20package%20on%20release/badge.svg)

#### Prerequisites

nodejs build with full ICU support.

##### Unix/macOS:

```console
$ ./configure --with-intl=full-icu --download=all
```

##### Windows:

```console
> .\vcbuild full-icu download-all
```

#### Install
- `npm install`


#### Test
- `npm test`


#### Usage

```javascript
const { parse } = require('ben-to-json');

...

let json = parse(ben_file_data);
```
