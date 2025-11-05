const chardet = require('chardet');
const encoding = chardet.detectFileSync('251102_182955_Q.json');
console.log('Encoding:', encoding);
