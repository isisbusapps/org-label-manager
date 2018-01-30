let request = require('request-promise-native');
let fs = require('fs');

let config = JSON.parse(fs.readFileSync('./config.json', 'utf-8'));

let org = config.org;
let label = config.label;

let user = config.auth.user;
let token = config.auth.token;

let opts = {
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
      console.log(repo.url, label);

      let reqOpts = Object.assign({}, opts, {
        'json': label
      });
      let repoLabelUrl = repo.url + '/labels';

      request.post(repoLabelUrl, reqOpts)
        .then(() => console.log(`Added ${label} to ${repo.name}`));
      
    });
  });


