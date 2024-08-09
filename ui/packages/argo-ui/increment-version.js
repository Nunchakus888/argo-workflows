const fs = require('fs');
const path = require('path');

const packageJsonPath = path.join(__dirname, 'package.json');
const packageJson = require(packageJsonPath);

const newVersion = packageJson.version.replace(/(\d+)$/, (match, p1) => {
    console.log(`Current version: ${packageJson.version}`, `New version: ${parseInt(p1) + 1}`);
    return parseInt(p1) + 1;
});

packageJson.version = newVersion;
fs.writeFileSync
(
    packageJsonPath,
    JSON.stringify(packageJson, null, 4)
);

console.log(`Updated version to ${newVersion}`);


