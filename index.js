const request = require('request-promise-native');
const fs = require('fs');

const config = JSON.parse(fs.readFileSync('./config.json', 'utf-8'));

const org = config.org;
const label = config.label;

const user = config.auth.user;
const token = config.auth.token;

const opts = {
  'headers': {
    'User-Agent': 'ISISBusApps-OrgLabels'
  },
  'auth': {
    'user': user,
    'pass': token,
    'sendImmediately': true
  },
  json: true
};

request
  .get(`https://api.github.com/orgs/${org}/repos?per_page=100`, opts)
  .then(repos => {
    repos.forEach(repo => {

      let reqOpts = Object.assign({}, opts, {
        'json': label
      });
      let repoLabelUrl = repo.url + '/labels';

      request.post(repoLabelUrl, reqOpts)
        .then(() => console.log(`Added "${label.name}" to "${repo.name}"`))
        .catch(e => {
            let error = e.error;
            let errorPrefix = `Could not add "${label.name}" for "${repo.name}"`;
            if (error.message === 'Validation Failed' && error.errors.length === 1 && error.errors[0].field === 'name') {
              console.log(`${errorPrefix} because it already exists.`);
            } else if (error.message === 'Not Found') {
              console.log(`${errorPrefix} due to insufficient permissions.`);
            } else {
              console.log(`${errorPrefix} due to unexpected error: ${error.message}.`);
            }
          }); 
    });
  });


