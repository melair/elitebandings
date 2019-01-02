const fs = require('fs');
const xml2js = require('xml-js').xml2js;

if (process.argv.length < 4) {
  console.log("You must provide a mapping file to validate and a bindings file to check against.");
  process.exit(1);
}

let mappingFile = process.argv[2];
let bindingsFile = process.argv[3];

console.log("Mapping: " + mappingFile);
console.log("Bindings: " + bindingsFile);

console.log("Loading mapping...");
let mappingRaw = fs.readFileSync(mappingFile, 'utf8');
let mapping = JSON.parse(mappingRaw);
let sectionNames = Object.keys(mapping);

console.log("Building RegEx mappings for " + sectionNames.length + " sections...");

let mappingCompiled = sectionNames.reduce((acc, key) => {
    acc[key] = mapping[key].map((regex) => new RegExp(regex)) 
    return acc;
  }, {});

console.log("Loading bindings...");
let bindingXML = fs.readFileSync(bindingsFile, 'utf8');

let binding = xml2js(bindingXML, { compact: true });

let keys = Object.keys(binding.Root).filter((name) => name !== "_attributes");

console.log("Found " + keys.length + " bindings...");

console.log("Matching...");

let output = {};

keys.forEach(key => {
  output[key] = {};

  sectionNames.forEach((section) => {
    let matchedRegex = mappingCompiled[section].filter((regex) => key.match(regex) !== null);
    
    if (matchedRegex.length > 0) {
      output[key][section] = matchedRegex;
    }
  })
});

console.log("Match completed, checking...");

let multipleSections = keys.filter((key) => Object.keys(output[key]).length > 1);

if (multipleSections.length > 0) {
  console.log("ERRORS: Bindings in multiple sections!");
  multipleSections.forEach((key) => console.log(" * " + key + " in: " + Object.keys(output[key]).join(", ")));
}

let missedKeys = keys.filter((key) => Object.keys(output[key]).length === 0);

if (missedKeys.length > 0) {
  console.log("ERRORS: Missing Bindings from Mapping!");
  missedKeys.forEach((key) => console.log(" * " + key));
}

let multipleMatches = keys.filter((key) => Object.keys(output[key]).length === 1).map((key) => {
  let section = Object.keys(output[key])[0];
  return { key: key, section: section, regex: output[key][section] }
}).filter((data) => data.regex.length > 1);

if (multipleMatches.length > 0) {
  console.log("ERRORS: Binding found with multiple regex!");
  multipleMatches.forEach((match) => console.log(" * " + match.key + "/" + match.section + ": " + match.regex.join(" ")));
}

console.log("Done.");