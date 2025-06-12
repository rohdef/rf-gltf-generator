#!/usr/bin/env node
"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// generate-gltf-structure.ts
var fs = __toESM(require("fs"), 1);
var import_node_path = __toESM(require("path"), 1);
var import_node_three_gltf = require("node-three-gltf");
var import_three = require("three");
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
  const loader = new import_node_three_gltf.GLTFLoader();
  const fileData = fs.readFileSync(gltfPath2);
  const outputFilename = import_node_path.default.basename(gltfPath2);
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

export const GltfStructure = {
${structureCode}
}
`;
  if (!fs.existsSync(path)) {
    fs.mkdirSync(path, { recursive: true });
  }
  fs.writeFileSync(`${path}/${outputFilename}.ts`, code);
}
function dumpObject3d(object3d, indent = "  ") {
  let element;
  switch (object3d.constructor) {
    case import_three.Object3D:
      element = `${indent}element: (contained: Object3D) => (contained.getObjectByName("${object3d.name}") as Object3D),`;
      break;
    case import_three.Group:
      element = `${indent}element: (contained: Object3D) => (contained.getObjectByName("${object3d.name}") as Group),`;
      break;
    case import_three.Mesh:
      element = `${indent}element: (contained: Object3D) => (contained.getObjectByName("${object3d.name}") as Mesh),`;
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
