`org-label-manager` is a small tool to add a label to every repo in a GitHub organisation.

### Usage

The tool takes no arguments.

It can be ran from the command line, after using `npm install`, with `node index.js`.

This application relies on a config file like the following. All of the fields are mandatory. The config file must be in the directory that you're currently in.

#### `config.json`
```json
{
  'org': 'org-name',
  'label': {
    'name': 'label-name',
    'color': '89abcd'
  },
  'auth': {
    'user': 'user',
    'token': '## generate one from https://github.com/settings/tokens ##'
  }
}
```

