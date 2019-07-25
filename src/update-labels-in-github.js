const request = require('request-promise-native');
const fs = require('fs');

const validate = require('./config-validator.js');

const program = require('commander');

function commaSeparatedList(value) {
  return value.split(',');
}

program
    .usage('[options] <file>')
    .option('-o, --org [org]', 'name of the org')
    .option('-r, --repo [repo]', 'name of the repo in the format "<REPO_OWNER_NAME>/<REPO_NAME>"')
    .option('-e, --exclude [exclude]', 'comma separated list of repos to exclude, without the repo owner name, e.g. repo1,repo2', commaSeparatedList);

program.on('--help', function() {
  console.log(`
The following environment variables must be set:
 - GITHUB_USER - the git user that owns the token specified in GIT_API_TOKEN
 - GITHUB_API_TOKEN - the git API token used to access the GitHub API`);
});

program.parse(process.argv);

if ((program.org && program.repo) || !(program.org || program.repo)) {
  throw 'Either org or repo must be specified';
}

const configLocation = process.argv[process.argv.length - 1];
const toUpdate = program.org ? { "org": program.org, "exclude": program.exclude } : { "repo": program.repo };

const user = process.env.GITHUB_USER;
const token = process.env.GITHUB_API_TOKEN;

const config = JSON.parse(fs.readFileSync(configLocation, 'utf-8'));

validate(config);

const opts = {
  'headers': {
    'User-Agent': 'ISISBusApps-OrgLabels',
    'Accept': 'application/vnd.github.symmetra-preview+json',
    'Content-Type': 'application/vnd.github.symmetra-preview+json'
  },
  'auth': {
    'user': user,
    'pass': token,
    'sendImmediately': true
  },
  json: true
};

function readDeclaredLabelsFromConfig(config) {

  const labels = [];

  for (let category of config) {
    const priorities = category['visual-priorities'];

    if (!category.labels) {
      continue;
    }

    for (let [labelName, labelMeta] of Object.entries(category.labels)) {
      const labelPriority = labelMeta["visual-priority"];
      const color = priorities[labelPriority].replace('#', '');

      const fullName = category.name + ': ' + labelName;

      labels.push({
        name: fullName,
        description: labelMeta.description,
        color: color
      });
    }
  }

  return labels;
}

const declaredLabels = readDeclaredLabelsFromConfig(config);

async function fetchReposForOrg(orgName) {
  return await request.get(`https://api.github.com/orgs/${orgName}/repos?per_page=100`, opts);
}

async function fetchRepo(repoName) {
  return await request.get(`https://api.github.com/repos/${repoName}`, opts);
}

async function addLabelToRepo(label, repoLabelsUrl) {
  let reqOpts = Object.assign({}, opts, {
    'json': label
  });

  return await request.post(repoLabelsUrl, reqOpts);
}

async function updateLabelInRepo(label, repoLabelsUrl) {
  let reqOpts = Object.assign({}, opts, {
    'json': label
  });

  const url = repoLabelsUrl + '/' + encodeURIComponent(label.name);

  return await request.patch(url, reqOpts);
}

async function updateRepo(repo) {

  const repoLabelsUrl = repo["labels_url"].replace(/{[^{}]+}/, '');
  const remoteLabels = await request.get(repoLabelsUrl + "?per_page=100", opts);

  const declaredLabelsToAdd = declaredLabels.filter(dl => !remoteLabels.some(rl => dl.name === rl.name));

  let declaredLabelsToUpdate = [];

  const declaredLabelsInRepo = declaredLabels.filter(dl => remoteLabels.some(rl => dl.name === rl.name));

  for (let declaredLabel of declaredLabelsInRepo) {

    const labelName = declaredLabel.name;

    const remoteLabel = remoteLabels.find(l => l.name === labelName);

    const needsUpdate = declaredLabel.description !== remoteLabel.description
          || declaredLabel.color !== remoteLabel.color;

    // if none of the fields we care about match
    if (needsUpdate) {
      declaredLabelsToUpdate.push(declaredLabel);
    }

  }

  if (declaredLabelsToAdd.length === 0 && declaredLabelsToUpdate.length === 0) {
    console.log(`Nothing to change for "${repo.name}"`);
    return;
  }

  for (let declaredLabel of declaredLabelsToAdd) {
    console.log(`adding label to "${repo.name}": "${declaredLabel.name}"`);
    await addLabelToRepo(declaredLabel, repoLabelsUrl);
  }

  for (let declaredLabel of declaredLabelsToUpdate) {
    console.log(`updating label to "${repo.name}": "${declaredLabel.name}"`);
    await updateLabelInRepo(declaredLabel, repoLabelsUrl);
  }

}

function filterExcludedRepos(allRepos, excluded) {

  if (excluded !== null && excluded !== undefined) {
    return allRepos.filter(r => !excluded.includes(r.name));
  } else {
    return allRepos;
  }

}

async function run() {

  if (toUpdate.org) {
    const exclude = toUpdate.exclude;
    const allRepos = await fetchReposForOrg(toUpdate.org);

    const reposToUpdate = filterExcludedRepos(allRepos, exclude);

    reposToUpdate.forEach(r => updateRepo(r));

  } else if (toUpdate.repo) {
    const repo = await fetchRepo(toUpdate.repo);

    updateRepo(repo);
  }

}

run();

