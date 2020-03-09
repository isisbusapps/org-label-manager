const request = require('request-promise-native');
const fs = require('fs');

const validate = require('./config-validator.js');

const argv = require('yargs')
  .command('$0 <labels-spec-file> <org>',
  `Update labels for the specified repo to the given specification config file.
  This will skip any archived repos or included repos that don't exist in an org.

  The following environment variables must be set:
   - GITHUB_USER - the git user that owns the token specified in GIT_API_TOKEN
   - GITHUB_API_TOKEN - the git API token used to access the GitHub API
  `,
    yargs => {
    yargs
      .positional('labels-spec-file', {
        type: 'string',
        describe: 'The labels specification file to update the labels to.',
      })
      .positional('org', {
        type: 'string',
        describe: 'The name of the org to update. By default, all repos in the org will be updated.'
          + ' Use the options --include-repos and --exclude-repos to limit the repos to update.'
      })
      .option('include-repos', {
        type: 'array',
        alias: 'i',
        describe: 'A list of repo names to update within the org. Only the repos with the given names will be updated. If no list is provided, all repos in the org will be updated.'
      })
      .option('exclude-repos', {
        type: 'array',
        alias: 'e',
        describe: 'A list of repos name to exclude from updating within the org. Only repos without the given names will be updated. If no list is provided, all repos in the org will be updated.'
      })
  }).argv;



const configLocation = argv.labelsSpecFile;
const toUpdate = {
  org: argv.org,
  includeRepos: argv.includeRepos,
  excludeRepos: argv.excludeRepos
};

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

function filterRepos(allRepos, options) {
  let filteredRepos = allRepos;

  const includeRepos = options.includeRepos;
  const excludeRepos = options.excludeRepos;

  if (includeRepos !== undefined) {
    /*
     * We only want to include repos that are explicitly in the include
     * list, if it's defined.
     */
    filteredRepos = filteredRepos.filter(r => includeRepos.includes(r.name));
  }
  
  if (excludeRepos !== undefined) {
    /*
     * We only want to exclude repos that are explictily in the exclude
     * list, if it's defined.
     */
    filteredRepos = filteredRepos.filter(r => !excludeRepos.includes(r.name));
  }

  filteredRepos = filteredRepos.filter(r => !r.archived);

  return filteredRepos;
}

async function run(options) {

    const allRepos = await fetchReposForOrg(options.org);

    const reposToUpdate = filterRepos(allRepos, options);

    await Promise.all(reposToUpdate.map(updateRepo));

}

run(toUpdate);

