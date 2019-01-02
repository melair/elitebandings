const fs = require('fs');
const { xml2js, js2xml } = require('xml-js');

if (process.argv.length < 5) {
  console.log("You must provide a mapping file, a layer file and output file.");
  process.exit(1);
}

let mappingFile = process.argv[2];
let layersFile = process.argv[3];
let outputFile = process.argv[4];

console.log("Mapping: " + mappingFile);
console.log("Layers: " + layersFile);
console.log("Output: " + outputFile);

console.log("Loading mapping...");
let mappingRaw = fs.readFileSync(mappingFile, 'utf8');
let mapping = JSON.parse(mappingRaw);
let sectionNames = Object.keys(mapping);

console.log("Building RegEx mappings for " + sectionNames.length + " sections...");

let mappingCompiled = sectionNames.reduce((acc, key) => {
    acc[key] = mapping[key].map((regex) => new RegExp(regex)) 
    return acc;
  }, {});

console.log("Loading layers file...")
let layersRaw = fs.readFileSync(layersFile, 'utf8');
let layers = JSON.parse(layersRaw);

console.log("Base Layer: " + layers.base);
console.log("Loading file...");

let baseLayerRaw = fs.readFileSync(layers.base, 'utf8');
let baseLayer = xml2js(baseLayerRaw, { compact: true });

for (let layer of layers.layers) {
  console.log("Next Layer: " + layer.file);
  console.log("Loading file...");

  let layerRaw = fs.readFileSync(layer.file, 'utf8');
  let layerXML = xml2js(layerRaw, { compact: true });

  console.log("Aggregating RegEx for desired categories...");

  let categoriesRegex = layer.categories.map((cat) => new RegExp(cat));
  let desiredSections = sectionNames.filter((name) => categoriesRegex.find((regex) => name.match(regex) !== null));
  let bindingRegex = desiredSections.map((section) => mappingCompiled[section]).flat();
  
  let layerKeys = Object.keys(layerXML.Root).filter((name) => name !== "_attributes");

  let filteredLayerKeys = layerKeys.filter((key) => bindingRegex.find((regex) => key.match(regex) !== null));

  console.log("Copying " + filteredLayerKeys.length + " bindings from layer...");

  for (let key of filteredLayerKeys) {
    baseLayer.Root[key] = layerXML.Root[key];
  }
}

console.log("Writing combined file out...");
baseLayer.Root["_attributes"].PresetName = outputFile;

let outputXML = js2xml(baseLayer, { compact: true, spaces: 4, ignoreComment: true });
fs.writeFileSync(outputFile, outputXML);