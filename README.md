`org-label-manager` is an opinionated tool to add a label to a single
repo or every repo in an organisation.

### Usage

Here is the command line usage for the tool:

```
update-labels-in-github.js <labels-spec-file> <org>

Update labels for the specified repo to the given specification config file.
This will skip any archived repos or included repos that don't exist in an org.

The following environment variables must be set:
- GITHUB_USER - the git user that owns the token specified in GIT_API_TOKEN
- GITHUB_API_TOKEN - the git API token used to access the GitHub API


Positionals:
  labels-spec-file  The labels specification file to update the labels to.
                                                                        [string]
  org               The name of the org to update. By default, all repos in the
                    org will be updated. Use the options --include-repos and
                    --exclude-repos to limit the repos to update.       [string]

Options:
  --help               Show help                                       [boolean]
  --version            Show version number                             [boolean]
  --include-repos, -i  A list of repo names to update within the org. Only the
                       repos with the given names will be updated. If no list is
                       provided, all repos in the org will be updated.   [array]
  --exclude-repos, -e  A list of repos name to exclude from updating within the
                       org. Only repos without the given names will be updated.
                       If no list is provided, all repos in the org will be
                       updated.                                          [array]
```

### The config

The file for the config must follow the schema shown in [the config
schema](src/schema/github-labels.json). The tool will validate this
config.

