import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';
import {GLTFExporter} from 'three/addons/exporters/GLTFExporter.js';
import {createProcessScene} from '../src/water-processes.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
await build({entryPoints:[path.join(root,'src/water-scene.mjs')],outfile:path.join(root,'assets/water-scene.js'),bundle:true,minify:true,format:'iife',target:['es2020'],legalComments:'eof'});
fs.copyFileSync(path.join(root,'node_modules/three/LICENSE'),path.join(root,'assets/THREE-LICENSE'));
// Export has no textures; Node only needs FileReader's binary Blob conversion.
globalThis.FileReader=class{readAsArrayBuffer(blob){blob.arrayBuffer().then(result=>{this.result=result;this.onloadend?.();});}};
const dir=path.join(root,'assets/models');fs.mkdirSync(dir,{recursive:true});
const snapshots={flow:{channels:[1,0,1],runoff:1,won:true},dissolution:{charged:true,elapsed:8,won:true},emergence:{level:85,exposure:4,won:true},deposition:{sequence:9,fraction:0,running:false,won:true}};
for(const id of ['flow','dissolution','emergence','deposition']){
  const model=createProcessScene(id);
  model.update(2,snapshots[id],0,true);
  const binary=await new GLTFExporter().parseAsync(model.root,{binary:true,onlyVisible:true});
  const filename=id==='deposition'?'huanglong-water-landscape.glb':`huanglong-${id}.glb`;
  fs.writeFileSync(path.join(dir,filename),Buffer.from(binary));
  let triangles=0,meshes=0;model.root.traverse(o=>{if(o.isMesh){meshes++;triangles+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3;for(const v of o.geometry.attributes.position.array)if(!Number.isFinite(v))throw Error('Nonfinite model vertex');}});
  model.dispose();console.log(JSON.stringify({model:filename,bytes:binary.byteLength,triangles,meshes,bundleBytes:fs.statSync(path.join(root,'assets/water-scene.js')).size}));
}
