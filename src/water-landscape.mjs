import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

// Original procedural miniature. Geometry illustrates a process, not surveyed terrain.
export const POOLS=[
  {x:-.3,z:-3.8,y:2.9,rx:1.3,rz:1.0,color:0x47cbbd},
  {x:.8,z:-2.05,y:2.35,rx:1.8,rz:1.15,color:0x20b9ae},
  {x:-.85,z:-.25,y:1.8,rx:2.05,rz:1.25,color:0x66d6ba},
  {x:.65,z:1.45,y:1.25,rx:2.2,rz:1.3,color:0x29c6c4},
  {x:-.65,z:3.05,y:.7,rx:2.4,rz:1.4,color:0x72d8c6},
  {x:.5,z:4.5,y:.23,rx:1.9,rz:1.0,color:0x34bab7},
];
export function createLandscape(){
  let seed=19092026;
  const random=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};
  const root=new THREE.Group();root.name='Huanglong • a drop through time';
  const land=new THREE.Group();land.name='Static miniature';root.add(land);
  const water=new THREE.Group();water.name='Turquoise pools';root.add(water);
  const growth=new THREE.Group();growth.name='New calcite deposits';root.add(growth);
  const materials=new Map();
  function mat(color,roughness=.9){const key=color+':'+roughness;if(!materials.has(key))materials.set(key,new THREE.MeshStandardMaterial({color,roughness,flatShading:true}));return materials.get(key);}
  function mesh(geo,material,parent=land){const m=new THREE.Mesh(geo,material);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
  const groundY=z=>.18+(5.3-z)*.19;
  function rock(x,y,z,size,color=0x738d67){const r=mesh(new THREE.IcosahedronGeometry(size,0),mat(color));r.position.set(x,y,z);r.scale.set(1.25,.8,.95);r.rotation.set(random(),random()*3,random());return r;}
  function polygonRing(points,heights,scales,color,parent=land){
    const pos=[],colors=[];const base=new THREE.Color(color);
    for(let k=0;k<heights.length-1;k++)for(let j=0;j<points.length;j++){
      const n=(j+1)%points.length;
      const a=[points[j][0]*scales[k],heights[k],points[j][1]*scales[k]];
      const b=[points[n][0]*scales[k],heights[k],points[n][1]*scales[k]];
      const c=[points[n][0]*scales[k+1],heights[k+1],points[n][1]*scales[k+1]];
      const d=[points[j][0]*scales[k+1],heights[k+1],points[j][1]*scales[k+1]];
      const shade=base.clone().multiplyScalar(.88+random()*.18);
      for(const v of [a,b,d,b,c,d]){pos.push(...v);colors.push(shade.r,shade.g,shade.b);}
    }
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.computeVertexNormals();
    return mesh(g,new THREE.MeshStandardMaterial({vertexColors:true,roughness:.88,flatShading:true,side:THREE.DoubleSide}),parent);
  }
  const outline=Array.from({length:18},(_,i)=>{const t=i/18*Math.PI*2,r=1+random()*.055;return [Math.cos(t)*4.2*r,Math.sin(t)*6*r];});
  const island=polygonRing(outline,[-1.0,-.78,-.42,-.18],[.76,.91,1,1.01],0x9b8b68);island.name='Faceted limestone foundation';
  const edge=island.geometry.attributes.position;for(let i=0;i<edge.count;i++)if(Math.abs(edge.getY(i)+.18)<.001)edge.setY(i,groundY(edge.getZ(i))-.2);edge.needsUpdate=true;island.geometry.computeVertexNormals();
  const topPositions=[],topColors=[];
  const topColor=new THREE.Color(0xb7c096);
  for(let i=0;i<outline.length;i++){
    const a=outline[i],b=outline[(i+1)%outline.length];const color=topColor.clone().multiplyScalar(.88+random()*.2);
    for(const p of [[0,groundY(0)-.2,0],[a[0],groundY(a[1])-.2,a[1]],[b[0],groundY(b[1])-.2,b[1]]]){topPositions.push(...p);topColors.push(color.r,color.g,color.b);}
  }
  const terrainGeo=new THREE.BufferGeometry();terrainGeo.setAttribute('position',new THREE.Float32BufferAttribute(topPositions,3));terrainGeo.setAttribute('color',new THREE.Float32BufferAttribute(topColors,3));terrainGeo.computeVertexNormals();
  mesh(terrainGeo,new THREE.MeshStandardMaterial({vertexColors:true,flatShading:true,side:THREE.DoubleSide,roughness:1})).name='Mossy hillside';
  const surfaces=[];
  POOLS.forEach((p,index)=>{
    const points=Array.from({length:36},(_,j)=>{const angle=j/36*Math.PI*2;const wobble=1+.085*Math.sin(angle*3+index)+.055*Math.cos(angle*7-index);return [Math.cos(angle)*p.rx*wobble,Math.sin(angle)*p.rz*wobble];});
    const rim=polygonRing(points,[Math.min(-.46,groundY(p.z)-p.y-.4),-.2,.035,.115,.045],[1.05,1.075,1.055,1,.94],0xe8d8a7);rim.position.set(p.x,p.y,p.z);rim.name='Calcite rim '+(index+1);
    const band=polygonRing(points,[-.2,-.165],[1.076,1.08],0xf7e8bd);band.position.copy(rim.position);
    if(index>1){
      for(let line=0;line<2;line++){
        const path=Array.from({length:7},(_,k)=>{const t=k/6;return new THREE.Vector3(p.x+(t*1.75-.875)*p.rx,p.y+.09,p.z+(line?-.24:.23)*p.rz+Math.sin(t*Math.PI*2+index)*p.rz*.15);});
        const divider=mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(path),18,.047,4,false),mat(0xe6dbaf));divider.name='Small natural pool partitions';
      }
    }
    if(index>2){const fresh=polygonRing(points,[0,.06,.15],[1.008,1.007,.973],0xf3e5b7,growth);fresh.position.set(p.x,p.y+.08,p.z);fresh.userData.rim=true;fresh.name='Accumulating rim '+index;}
    const positions=[],colors=[];const base=new THREE.Color(p.color);
    for(let i=0;i<points.length;i++){
      const n=(i+1)%points.length;const shade=base.clone().lerp(new THREE.Color(0x90e6d1),random()*.2);
      for(const v of [[.15,0,-.12],[points[n][0]*.945,0,points[n][1]*.945],[points[i][0]*.945,0,points[i][1]*.945]]){positions.push(...v);colors.push(shade.r,shade.g,shade.b);}
    }
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geo.computeVertexNormals();
    const surface=mesh(geo,new THREE.MeshStandardMaterial({vertexColors:true,roughness:.24,metalness:.1,side:THREE.DoubleSide}),water);surface.position.set(p.x,p.y+.06,p.z);surface.name='Water surface '+(index+1);surface.castShadow=false;surfaces.push(surface);
    for(let i=0;i<6;i++){
      const t=random()*Math.PI*2,r=.3+random()*.38;
      const glint=mesh(new THREE.PlaneGeometry(.12+random()*.25,.018),mat(0xc3f6dd,.3),water);glint.rotation.x=-Math.PI/2;glint.position.set(p.x+Math.cos(t)*p.rx*r,p.y+.069,p.z+Math.sin(t)*p.rz*r);glint.castShadow=false;
    }
    if(index>2)for(let i=0;i<12;i++){
      const t=i/12*Math.PI*.95+.05;
      const crystal=mesh(new THREE.OctahedronGeometry(.095+random()*.075,0),mat(0xffefbb),growth);crystal.position.set(p.x+Math.cos(t)*p.rx,p.y+.09,p.z+Math.sin(t)*p.rz);crystal.rotation.z=random();crystal.userData.fullScale=.5+random()*.7;
    }
  });
  // Thin sheets of water link consecutive pools; no expensive fluid simulation.
  const streamPoints=[];
  POOLS.forEach((p,i)=>{
    streamPoints.push(new THREE.Vector3(p.x,p.y+.12,p.z));
    if(i===POOLS.length-1)return;
    const next=POOLS[i+1];const start=new THREE.Vector3(p.x*.65+next.x*.35,p.y+.13,p.z+p.rz*.78);
    const end=new THREE.Vector3(next.x,next.y+.09,next.z-.2);
    streamPoints.push(start,end);
    const vertices=[];for(let k=0;k<8;k++){
      const t=k/7;const x=THREE.MathUtils.lerp(start.x,end.x,t),y=THREE.MathUtils.lerp(start.y,end.y,t),z=THREE.MathUtils.lerp(start.z,end.z,t);vertices.push(x-.21,y,z,x+.21,y,z);
    }
    const indices=[];for(let k=0;k<7;k++){let a=k*2;indices.push(a,a+1,a+2,a+1,a+3,a+2);}
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geo.setIndex(indices);geo.computeVertexNormals();
    const sheet=mesh(geo,new THREE.MeshStandardMaterial({color:0x99efdb,roughness:.3,transparent:true,opacity:.76,side:THREE.DoubleSide}),water);sheet.name='Overflow '+i;sheet.castShadow=false;
  });
  function tree(x,z,scale){
    const y=groundY(z),trunk=mesh(new THREE.CylinderGeometry(.065,.095,.85,5),mat(0x7b6850));trunk.position.set(x,y+.32*scale,z);trunk.scale.setScalar(scale);
    const colors=[0x426f59,0x60896a,0x82a076];
    for(let i=0;i<3;i++){
      const cone=mesh(new THREE.ConeGeometry((.6-i*.11)*scale,(1.1-i*.13)*scale,6,1),mat(colors[i]));cone.position.set(x,y+(.8+i*.44)*scale,z);cone.rotation.y=i*.48+random();
    }
  }
  for(const [x,z,s] of [[-2.6,-3.4,1.2],[-2.6,-4.5,.9],[-1.6,-5.1,1.05],[.6,-5.2,.8],[2.3,-4.3,1.25],[3,-3.3,.9],[-3.05,-1.7,1.1],[-3.3,.1,.82],[-3.15,2,.72],[2.9,-.4,.72],[3.4,1.2,.6]])tree(x,z,s);
  for(let i=0;i<22;i++){
    const a=random()*Math.PI*2,x=Math.cos(a)*(3.25+random()*.65),z=Math.sin(a)*5.35;
    rock(x,groundY(z)-.04,z,.15+random()*.3,[0x90a681,0x7d9474,0xa4ad8e][i%3]);
  }
  for(let i=0;i<8;i++){
    const x=-3.1+random()*.65,z=1.5+random()*1.6,y=groundY(z)+.18;
    rock(x,y,z,.13,0x8d9a62);const flower=mesh(new THREE.IcosahedronGeometry(.065,0),mat(i%2?0xdeb8aa:0xe5d4aa));flower.position.set(x,y+.12,z);
  }
  function beam(a,b,width,color){const delta=new THREE.Vector3().subVectors(b,a);const m=mesh(new THREE.BoxGeometry(width,delta.length(),width),mat(color));m.position.copy(a).add(b).multiplyScalar(.5);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());return m;}
  // A modest boardwalk follows the edge, reinforcing the keep-to-path idea.
  const walkPoints=[];
  for(let i=0;i<27;i++){
    const z=-3.2+i*.28,x=3.0+Math.sin(i*.16)*.4,y=groundY(z)+.16;
    const board=mesh(new THREE.BoxGeometry(.72,.1,.255),mat(i%3?0xac8961:0xc5a178));board.position.set(x,y,z);board.rotation.y=-Math.cos(i*.16)*.12;
    if(i%3===0){const a=new THREE.Vector3(x+.37,y,z),b=a.clone().add(new THREE.Vector3(0,.48,0));beam(a,b,.045,0x876d50);walkPoints.push(b);}
  }
  for(let i=0;i<walkPoints.length-1;i++)beam(walkPoints[i],walkPoints[i+1],.045,0x9b7d56);
  // Merge static meshes by material so the miniature stays light on mobile GPUs.
  land.updateMatrixWorld(true);const buckets=new Map();
  for(const child of [...land.children]){
    const g=child.geometry.clone();g.applyMatrix4(child.matrixWorld);const flat=g.index?g.toNonIndexed():g;
    // Buffer attributes must agree within each material bucket.
    flat.deleteAttribute('uv');
    const key=child.material.uuid;const bucket=buckets.get(key)||{material:child.material,geos:[]};bucket.geos.push(flat);buckets.set(key,bucket);
    land.remove(child);child.geometry.dispose();
  }
  for(const {material,geos} of buckets.values()){const merged=mergeGeometries(geos);const m=mesh(merged,material);m.name='Merged terrain detail';geos.forEach(g=>g.dispose());}
  const drop=new THREE.Group();drop.name='Travelling water droplet';root.add(drop);
  const profile=[new THREE.Vector2(0,-.24),new THREE.Vector2(.21,-.2),new THREE.Vector2(.3,-.02),new THREE.Vector2(.28,.16),new THREE.Vector2(.14,.4),new THREE.Vector2(0,.7)];
  const body=mesh(new THREE.LatheGeometry(profile,10),mat(0x78e8ed,.2),drop);body.name='Drop body';
  for(const x of [-.09,.09]){const eye=mesh(new THREE.SphereGeometry(.035,6,4),mat(0x244a50),drop);eye.position.set(x,.1,.265);}
  const shine=mesh(new THREE.IcosahedronGeometry(.045,0),mat(0xe8ffff),drop);shine.position.set(-.12,.3,.17);
  const halo=mesh(new THREE.RingGeometry(.37,.4,32),new THREE.MeshBasicMaterial({color:0xfdf4b9,side:THREE.DoubleSide}),drop);halo.rotation.x=-Math.PI/2;halo.position.y=-.35;
  const flow=new THREE.Group();flow.name='Moving water highlights';root.add(flow);
  for(let i=0;i<12;i++){const m=mesh(new THREE.IcosahedronGeometry(.045,0),mat(0xe1fff2,.2),flow);m.castShadow=false;}
  const curve=new THREE.CatmullRomCurve3(streamPoints,false,'centripetal');
  const bubbles=new THREE.Group();bubbles.name='CO2 release illustration';root.add(bubbles);
  for(let i=0;i<7;i++)mesh(new THREE.IcosahedronGeometry(.04+(i%3)*.017,0),new THREE.MeshBasicMaterial({color:0xf6ffed,transparent:true,opacity:.75}),bubbles);
  function update(time=0,stage=0,grow=0){
    const t=stage===0?.12:stage===1?.39:stage===2?.68:.84;
    const p=curve.getPoint(t);drop.position.copy(p);drop.position.y+=.55+Math.sin(time*1.8)*.065;drop.rotation.y=.3+Math.sin(time*.5)*.15;
    flow.children.forEach((m,i)=>{m.position.copy(curve.getPoint((time*.04+i/12)%1));});
    growth.children.forEach(m=>{if(m.userData.rim)m.scale.set(1,Math.max(.001,grow),1);else m.scale.setScalar(Math.max(.001,grow)*m.userData.fullScale);m.visible=grow>.005;});
    bubbles.visible=stage===1;
    bubbles.children.forEach((b,i)=>{const h=(time*.5+i*.14)%1;b.position.set(p.x+Math.sin(i*2)*.22,p.y+.1+h*1.1,p.z+Math.cos(i)*.18);b.scale.setScalar(.4+h*.8);});
  }
  update();
  return {root,update,curve,drop,growth,dispose(){root.traverse(o=>{o.geometry?.dispose();if(o.material){for(const m of Array.isArray(o.material)?o.material:[o.material])m.dispose();}});}};
}
