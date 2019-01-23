`org-label-manager` is an opinionated tool to add a label to a single
repo or every repo in an organisation.

### Usage

Here is the command line usage for the tool:

```
usage: update-labels-in-github [options] <file>

Options:
  -o, --org [org]    The name of the org.
  -r, --repo [repo]  The name of the repo.
  -h, --help         output usage information

The following environment variables must be set:
 - GIT_USER - the git user that owns the token specified in GIT_API_TOKEN
 - GIT_API_TOKEN - the git API token used to access the GitHub API

```

### The config

The file for the config must follow the schema shown in [the config
schema](src/schema/github-labels.json). The tool will validate this
config.

