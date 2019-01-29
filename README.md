`org-label-manager` is an opinionated tool to add a label to a single
repo or every repo in an organisation.

### Usage

Here is the command line usage for the tool:

```
usage: update-labels-in-github [options] <file>

Options:
  -o, --org [org]    the name of the org
  -r, --repo [repo]  the name of the repo in the format "<REPO_OWNER_NAME>/<REPO_NAME>"
  -h, --help         output usage information

The following environment variables must be set:
 - GITHUB_USER - the git user that owns the token specified in GIT_API_TOKEN
 - GITHUB_API_TOKEN - the git API token used to access the GitHub API

```

### The config

The file for the config must follow the schema shown in [the config
schema](src/schema/github-labels.json). The tool will validate this
config.

