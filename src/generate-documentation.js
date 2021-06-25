const fs = require('fs');
const validate = require('./config-validator.js');

const configLocation = process.argv[process.argv.length - 1];

const config = JSON.parse(fs.readFileSync(configLocation, 'utf-8'));

validate(config);

let doc = `

This page describes the labels that we use in GitHub.

**NB**: This is automatically generated.

## Labels overview

Label Category | Description | Possible values
---|---|---
`;

for(let category of config) {

  const name = category.name;
  const description = category.description;
  const values = category.labels
                    ? Object.keys(category.labels).map(l => "`" + l + "`").join(", ")
                    : "Repo/team dependent";

  doc += "`" + name + "` | " + description + " | " + values + "\n";
}

for(let category of config) {
  const name = category.name;
  const description = category.description;

  const colorLow = category["visual-priorities"].low;
  const colorMedium = category["visual-priorities"].medium;
  const colorHigh = category["visual-priorities"].high;

  const generateColorUrl = color => `https://via.placeholder.com/12/${color.replace("#", '')}/000000?text=+`
  const generateColorImage = color => `![${color}](${generateColorUrl(color)})`

  const generateColorDescriptor = color => `\`${color}\` ${generateColorImage(color)}`

  doc += `

### \`${name}\`

${description}

#### Colors

  - Low visual priority: ${generateColorDescriptor(colorLow)}
  - Medium visual priority: ${generateColorDescriptor(colorMedium)}
  - High visual priority: ${generateColorDescriptor(colorHigh)}

#### Types
`

  if (!category.labels) {
    doc += "\nThe types for this category are repo specific.";
    continue;
  }

  doc += `
The following are the label types for "${name}".

Label | Description | Color/Priority
---|---|---
`

  for (let [labelName, labelInfo] of Object.entries(category.labels)) {
    const color = generateColorImage(category["visual-priorities"][labelInfo["visual-priority"]]);
    doc += `\`${name}: ${labelName}\` | ${labelInfo.description} | ${color} ${labelInfo["visual-priority"]}` + '\n';

  }
}


console.log(doc);


