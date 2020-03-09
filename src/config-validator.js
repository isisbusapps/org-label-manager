const config = require('./schema/github-labels.json');

const Ajv = require('ajv');

const ajv = new Ajv();

const validate = ajv.compile(config);

module.exports = function(data) {
  if(!validate(data)) {
    console.error('Invalid configuration provided: ' + ajv.errorsText(validate.errors));
    throw new Error('Invalid configuration provided.');
  }
};

