### BenWin+ .ben binary file to JSON converter

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
