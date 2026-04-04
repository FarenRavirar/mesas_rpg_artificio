#!/bin/sh
node -e "
try {
  var fs = require('fs');
  var data = fs.readFileSync('/tmp/export_exemple.json', 'utf8');
  JSON.parse(data);
  console.log('JSON OK - bytes:', data.length);
} catch(e) {
  console.log('ERRO:', e.message.substring(0, 200));
}
"
