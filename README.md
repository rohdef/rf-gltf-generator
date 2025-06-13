# rf-gltf-generator

Small tool for generating a [threejs](https://threejs.org) Typescript structure for a GLTF file.
It the structure ensures that the Typescript matches the underlying 3D model.
This can be useful for things as GLTF-pipeline.

## Installation

```bash
npm install --save-dev https://github.com/rohdef/rf-gltf-generator 
```

## Generating output

The command takes exactly 2 parameters:
- `inputFile`: the gltf/glb-file to generate structure from
- `outputFolder`: the folder to place the generated structure. 
    The output will be named the same as the first part of the input file without extensions.
    E.g., if the input is named `foo.funky.glb` and output folder is `generated`, then it will output `generated/foo.ts` 

Provided a `foo.glb` file it's used as follows:

```bash
npx generate-gltf-structure ./foo.glb ./genrated
```

## Useing the generated output

```typescript
import {type GLTF, GLTFLoader} from "three/examples/jsm/loaders/GLTFLoader"
import {GltfStructure} from "generated/foo.ts"

const gltfLoader = new GLTFLoader()
const gltf = await gltfLoader.loadAsync("./foo.glb")
const structure = GltfStructure(gltf.scene)
```

## Example usage of pipeline

A more complete usage could be using a complete pipeline to render/export a gltf from a "raw" 3D model,
and building a npm module for usage. For [blender](https://www.blender.org) that could look as follows:

```yaml
jobs:
  build:
    steps:
# steps omitted, checkout, node environment needs to be configured per the default way
      - name: Render from blender
        run: |
          # Based on https://github.khronos.org/glTF-Tutorials/BlenderGltfConverter/
          blender -b -P blender_gltf_converter.py -- --mp foo.blender
      - name: Create module
        run: |
          npm ci
          npx generate-gltf-structure ./foo.glb ./genrated
          npm --no-git-tag-version version "1.0.${{github.run_number}}" -m "Upgrade to new version"
          # Here tsup is used, but any can do. It assumes a configuration that includes the glb as a resouce
          npx tsup

      - name: Deploy
        run: |
          # Commit the output to a git repository or deploy through other mechanism
```

The output module can then be installed, and utilized to load the gltf file with threejs and the structure for ease of use.