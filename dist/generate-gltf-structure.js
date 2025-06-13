#!/usr/bin/env node

// generate-gltf-structure.ts
import * as fs from "fs";
import Path from "path";
import { GLTFLoader } from "node-three-gltf";
import { Group, Mesh, Object3D } from "three";
if (process.argv.length != 4) {
  console.error("Usage: generateClasses [gltfPath] [outputPath]");
  console.error("    [gltfPath]   - the glb/gltf file to parse");
  console.error("    [outputPath] - where to put the resulting typescript");
  process.exit();
}
var gltfPath = process.argv[2];
var outputPath = process.argv[3];
parseGltf(gltfPath, outputPath);
function parseGltf(gltfPath2, outputPath2) {
  const loader = new GLTFLoader();
  const fileData = fs.readFileSync(gltfPath2);
  const outputFilename = Path.parse(gltfPath2).name;
  loader.parse(
    fileData,
    "",
    (gltf) => dumpFile(gltf.scene, outputPath2, outputFilename),
    (err) => {
      console.error(`Could not parse input file as gltf: ${gltfPath2}`);
      console.error(err);
    }
  );
}
function dumpFile(obj, path, outputFilename) {
  const structureCode = dumpObject3d(obj);
  const code = `import {Group, Mesh, Object3D} from "three"

export function GltfStructure(contained: Object3D) {
  return {
${structureCode}
  }
}
`;
  if (!fs.existsSync(path)) {
    fs.mkdirSync(path, { recursive: true });
  }
  fs.writeFileSync(`${path}/${outputFilename}.ts`, code);
}
function dumpObject3d(object3d, indent = "    ") {
  let element;
  switch (object3d.constructor) {
    case Object3D:
      element = `${indent}get element() { return (contained.getObjectByName("${object3d.name}") as Object3D) },`;
      break;
    case Group:
      element = `${indent}get element() { return (contained.getObjectByName("${object3d.name}") as Group) },`;
      break;
    case Mesh:
      element = `${indent}element() { return (contained.getObjectByName("${object3d.name}") as Mesh) },`;
      break;
    default:
      throw new Error(`Unsupported Object3D type: ${object3d.constructor.name} for object with name: ${object3d.name}`);
  }
  const newIndent = `${indent}  `;
  object3d.children.forEach((child) => dumpObject3d(child, newIndent));
  const childen = object3d.children.map((child) => `${indent}"${sanitizeName(child.name)}": {
${dumpObject3d(child, newIndent)}
${indent}},`).join("\n");
  return `${element}
${childen}`;
}
function sanitizeName(name) {
  const nameBits = name.trim().split("_").filter((name2) => name2 != null && name2 != "");
  const car = nameBits[0];
  const cdr = nameBits.slice(1).map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join();
  return `${car}${cdr}`;
}
