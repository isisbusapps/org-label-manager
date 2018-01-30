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
  .get(`https://api.github.com/orgs/${org}/repos`, opts)
  .then(repos => {
    repos.forEach(repo => {

      let reqOpts = Object.assign({}, opts, {
        'json': label
      });
      let repoLabelUrl = repo.url + '/labels';

      request.post(repoLabelUrl, reqOpts)
        .then(() => console.log(`Added ${label} to ${repo.name}`));
      
    });
  });


