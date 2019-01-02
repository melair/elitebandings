const fs = require('fs');
const xml2js = require('xml-js').xml2js;

if (process.argv.length < 4) {
  console.log("You must provide a bindings file and test regex.");
  process.exit(1);
}

let bindingsFile = process.argv[2];
let testRegex = process.argv[3];

console.log("Bindings: " + bindingsFile);
console.log("Test Regex: " + testRegex);

console.log("Loading bindings...");
let bindingXML = fs.readFileSync(bindingsFile, 'utf8');

let binding = xml2js(bindingXML, { compact: true });

let keys = Object.keys(binding.Root).filter((name) => name !== "_attributes");

console.log("Found " + keys.length + " bindings...");

let regex = new RegExp(testRegex);

console.log("Filtering...");

let found = keys.filter((key) => key.match(regex) !== null);

found.forEach((key) => console.log(" * " + key));