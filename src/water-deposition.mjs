import * as THREE from 'three';
import {createLandscape,POOLS} from './water-landscape.mjs';

const SEGMENTS=48;
const TAU=Math.PI*2;
const clamp=value=>Math.max(0,Math.min(1,value));

// Each three-step cycle constructs one complete terrace. Hidden terraces have no
// geometry in the static landscape, so neither the rims nor their glints leak out.
export function createDepositionScene(){
  const original=createLandscape({poolCount:3});
  const root=original.root;
  root.name='04 • Growing calcite terraces';
  original.drop.visible=false;
  root.getObjectByName('Moving water highlights').visible=false;
  root.getObjectByName('CO2 release illustration').visible=false;
  const materials=new Map();
  function material(color,water=false){
    const key=color+':'+water;
    if(!materials.has(key))materials.set(key,new THREE.MeshStandardMaterial({color,roughness:water?.24:.85,metalness:water?.08:0,flatShading:true,side:THREE.DoubleSide}));
    return materials.get(key);
  }
  function mesh(geometry,color,parent,name,water=false){
    const object=new THREE.Mesh(geometry,material(color,water));
    object.name=name;object.castShadow=!water;object.receiveShadow=true;parent.add(object);return object;
  }
  const particleGeometry=new THREE.IcosahedronGeometry(.055,0);
  const crystalGeometry=new THREE.OctahedronGeometry(.13,0);
  function outline(p,index){
    return Array.from({length:SEGMENTS},(_,i)=>{const a=i/SEGMENTS*TAU,w=1+.085*Math.sin(a*3+index)+.055*Math.cos(a*7-index);return [Math.cos(a)*p.rx*w,Math.sin(a)*p.rz*w];});
  }
  function ringGeometry(points){
    const vertices=[],colors=[],heights=[0,.10,.31,.54,.45],radii=[1.085,1.10,1.075,1,.935];
    const cream=new THREE.Color(0xead9a8);
    // Segment-major ordering lets drawRange trace a growing perimeter.
    for(let i=0;i<SEGMENTS;i++){
      const a=points[i],b=points[(i+1)%SEGMENTS],shade=.89+.11*Math.sin(i*2.17)**2;
      for(let band=0;band<4;band++){
        const v0=[a[0]*radii[band],heights[band],a[1]*radii[band]];
        const v1=[b[0]*radii[band],heights[band],b[1]*radii[band]];
        const v2=[b[0]*radii[band+1],heights[band+1],b[1]*radii[band+1]];
        const v3=[a[0]*radii[band+1],heights[band+1],a[1]*radii[band+1]];
        for(const vertex of [v0,v1,v3,v1,v2,v3]){vertices.push(...vertex);colors.push(cream.r*shade,cream.g*shade,cream.b*shade);}
      }
    }
    const geometry=new THREE.BufferGeometry();
    geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
    geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
    geometry.computeVertexNormals();return geometry;
  }
  function discGeometry(points,scale=1){
    const vertices=[];
    for(let i=0;i<SEGMENTS;i++){
      const a=points[i],b=points[(i+1)%SEGMENTS];
      vertices.push(0,0,0,b[0]*scale,0,b[1]*scale,a[0]*scale,0,a[1]*scale);
    }
    const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geometry.computeVertexNormals();return geometry;
  }
  function ribbon(start,end,parent,name){
    const positions=[],indices=[];
    for(let i=0;i<=20;i++){
      const t=i/20,curve=t*t*(3-2*t),x=THREE.MathUtils.lerp(start.x,end.x,t),y=THREE.MathUtils.lerp(start.y,end.y,curve),z=THREE.MathUtils.lerp(start.z,end.z,t);
      positions.push(x-.19,y,z,x+.19,y,z);
      if(i<20){const n=i*2;indices.push(n,n+1,n+2,n+1,n+3,n+2);}
    }
    const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setIndex(indices);geometry.computeVertexNormals();
    const sheet=mesh(geometry,0x79e5d4,parent,name,true);sheet.geometry.setDrawRange(0,0);
    return sheet;
  }
  const ponds=[];
  for(let index=0;index<3;index++){
    const p=POOLS[index+3],name=`Pond ${index+1}`,points=outline(p,index+3);
    const assembly=new THREE.Group();assembly.name=name+' assembly';root.add(assembly);
    assembly.position.set(p.x,p.y-.10,p.z);
    const rimMaterial=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.87,flatShading:true,side:THREE.DoubleSide});
    const rim=new THREE.Mesh(ringGeometry(points),rimMaterial);rim.name=name+' rim';rim.castShadow=true;rim.receiveShadow=true;assembly.add(rim);
    const floor=mesh(discGeometry(points,1.035),0xded8b0,assembly,name+' basin');floor.position.y=.018;
    const water=mesh(discGeometry(points,.936),p.color,assembly,name+' water',true);
    const details=new THREE.Group();details.name=name+' partitions';assembly.add(details);
    for(let line=0;line<2;line++){
      const path=Array.from({length:8},(_,k)=>{const t=k/7;return new THREE.Vector3((t*1.72-.86)*p.rx,0,(line?-.26:.23)*p.rz+Math.sin(t*TAU+index)*p.rz*.13);});
      const divider=mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(path),18,.04,4,false),0xeee2b7,details,name+' partition '+line);divider.position.y=.46;
    }
    const crystals=new THREE.Group();crystals.name=name+' crystals';assembly.add(crystals);
    for(let i=0;i<18;i++){
      const angle=i/18*TAU,w=1+.085*Math.sin(angle*3+index+3)+.055*Math.cos(angle*7-index-3);
      const crystal=mesh(crystalGeometry,i%3?0xf3e5b7:0xffefd1,crystals,name+' crystal '+i);
      crystal.position.set(Math.cos(angle)*p.rx*w,.49,Math.sin(angle)*p.rz*w);crystal.rotation.set(.1,i*.73,.18*Math.sin(i));
    }
    const glints=new THREE.Group();glints.name=name+' glints';assembly.add(glints);
    for(let i=0;i<10;i++){
      const angle=i*2.39,r=.2+(i%3)*.17;
      const glint=mesh(new THREE.PlaneGeometry(.17+(i%3)*.055,.023),0xcaffef,glints,name+' glint '+i,true);
      glint.rotation.x=-Math.PI/2;glint.position.set(Math.cos(angle)*p.rx*r,0,Math.sin(angle)*p.rz*r);
    }
    const dust=new THREE.Group();dust.name=name+' mineral particles';assembly.add(dust);
    for(let i=0;i<22;i++)mesh(particleGeometry,i%3?0xffe7a2:0xffffff,dust,name+' mineral '+i);
    const overflow=new THREE.Group();overflow.name=name+' overflow';assembly.add(overflow);
    const next=POOLS[index+4];
    const spillStart={x:Math.sin(index+.7)*p.rx*.19,y:.46,z:p.rz*.87};
    const spillEnd=next?{x:next.x-p.x,y:next.y+.08-(p.y-.10),z:next.z-p.z-.15}:{x:.48,y:-.72,z:p.rz+1.12};
    const sheet=ribbon(spillStart,spillEnd,overflow,name+' overflow sheet');
    const droplets=new THREE.Group();droplets.name=name+' overflow droplets';overflow.add(droplets);
    for(let i=0;i<22;i++)mesh(particleGeometry,i%4?0xd4fff0:0x8deee6,droplets,name+' overflow droplet '+i,true);
    const foam=new THREE.Group();foam.name=name+' landing spray';overflow.add(foam);
    for(let i=0;i<10;i++)mesh(particleGeometry,0xd4fff2,foam,name+' spray '+i,true);
    // Filling water visibly enters from the existing uphill basin. These short
    // streams do not expose a future terrace's silhouette.
    const prev=POOLS[index+2];
    const inletStart={x:prev.x-p.x,y:(index===0?prev.y+.12:prev.y+.34)-(p.y-.10),z:prev.z-p.z+prev.rz*.8};
    const inletEnd={x:0,y:.035,z:-p.rz*.3};
    const inletGroup=new THREE.Group();inletGroup.name=name+' inlet';assembly.add(inletGroup);
    const inlet=ribbon(inletStart,inletEnd,inletGroup,name+' inlet sheet');
    const incoming=new THREE.Group();inletGroup.add(incoming);
    for(let i=0;i<10;i++)mesh(particleGeometry,0xcdffeb,incoming,name+' inlet droplet '+i,true);
    ponds.push({assembly,rim,floor,water,details,crystals,glints,dust,overflow,sheet,droplets,foam,spillStart,spillEnd,inletGroup,inlet,incoming,inletStart,inletEnd,p,points,rimAmount:0,fillAmount:0,spillAmount:0});
  }

  function along(object,start,end,t,width=0){
    const curve=t*t*(3-2*t);
    object.position.set(THREE.MathUtils.lerp(start.x,end.x,t)+width,THREE.MathUtils.lerp(start.y,end.y,curve)+.025,THREE.MathUtils.lerp(start.z,end.z,t));
  }
  let disposed=false;
  function update(time=0,p={},delta=1/60,snap=false){
    if(disposed)return;
    const sequence=Number.isFinite(p.sequence)?Math.max(0,Math.min(9,Math.floor(p.sequence))):0;
    const fraction=Number.isFinite(p.fraction)?clamp(p.fraction):0;
    const progress=p.won?9:sequence+fraction;
    const seconds=Number.isFinite(time)?time:0;
    const speed=snap?1:1-Math.exp(-12*Math.max(0,Math.min(.1,Number.isFinite(delta)?delta:0)));
    for(let i=0;i<3;i++){
      const pond=ponds[i],start=i*3;
      const targetRim=clamp(progress-start),targetFill=clamp(progress-start-1),targetSpill=clamp(progress-start-2);
      // Zero is immediate on replay; finished phases settle exactly. Only the
      // active phase eases, so a waiting pond never inherits visible geometry.
      pond.rimAmount=targetRim===0||targetRim===1?targetRim:pond.rimAmount+(targetRim-pond.rimAmount)*speed;
      pond.fillAmount=targetFill===0||targetFill===1?targetFill:pond.fillAmount+(targetFill-pond.fillAmount)*speed;
      pond.spillAmount=targetSpill===0||targetSpill===1?targetSpill:pond.spillAmount+(targetSpill-pond.spillAmount)*speed;
      const rim=pond.rimAmount,fill=pond.fillAmount,spill=pond.spillAmount;
      pond.assembly.visible=rim>0;
      pond.rim.visible=rim>0;
      pond.rim.geometry.setDrawRange(0,Math.min(SEGMENTS,Math.ceil(rim*SEGMENTS))*24);
      pond.rim.scale.y=.06+.94*rim;
      pond.floor.visible=rim>.08;pond.floor.scale.setScalar(.08+.92*rim);
      pond.water.visible=fill>0;pond.water.position.y=.035+.405*fill;
      const wetArea=Math.sqrt(fill);pond.water.scale.set(wetArea,1,wetArea);
      pond.details.visible=rim>.58;pond.details.scale.set(rim,Math.max(.01,rim),rim);
      pond.crystals.visible=rim>0;
      for(let j=0;j<pond.crystals.children.length;j++){
        const crystal=pond.crystals.children[j],growth=clamp((rim-j/pond.crystals.children.length)*8);
        crystal.visible=growth>0;crystal.scale.setScalar((.65+(j%4)*.12)*growth);crystal.position.y=.49*rim;
      }
      pond.glints.visible=fill>0;pond.glints.position.y=pond.water.position.y+.008;pond.glints.scale.set(wetArea,1,wetArea);
      for(let j=0;j<pond.glints.children.length;j++)pond.glints.children[j].scale.x=.7+.3*Math.sin(seconds*2+j);
      pond.dust.visible=!!p.running&&sequence===start&&rim>0&&rim<1;
      for(let j=0;j<pond.dust.children.length;j++){
        const particle=pond.dust.children[j],u=((seconds*1.2+j/22)%1+1)%1,angle=(rim-.045+j*.004)*TAU;
        const wobble=1+.085*Math.sin(angle*3+i+3)+.055*Math.cos(angle*7-i-3);
        particle.position.set(Math.cos(angle)*pond.p.rx*wobble+Math.sin(j*2.3)*u*.22,.54*rim+.1+Math.sin(u*Math.PI)*.6,Math.sin(angle)*pond.p.rz*wobble+Math.cos(j*1.7)*u*.19);
        particle.scale.setScalar(.5+Math.sin(u*Math.PI)*.9);
      }
      pond.inletGroup.visible=fill>0&&fill<1;
      pond.inlet.geometry.setDrawRange(0,Math.ceil(Math.min(1,fill*3)*20)*6);
      for(let j=0;j<pond.incoming.children.length;j++){
        const particle=pond.incoming.children[j],u=((seconds*.68+j/10)%1+1)%1;
        along(particle,pond.inletStart,pond.inletEnd,u,Math.sin(j*2)*.075);particle.visible=u<Math.min(1,fill*3);
      }
      pond.overflow.visible=spill>0;
      pond.sheet.geometry.setDrawRange(0,Math.ceil(spill*20)*6);
      for(let j=0;j<pond.droplets.children.length;j++){
        const particle=pond.droplets.children[j],u=((seconds*.55+j/22)%1+1)%1;
        along(particle,pond.spillStart,pond.spillEnd,u,Math.sin(j*2.39)*.145);
        particle.visible=u<spill;particle.scale.set(.72,1.1+.3*Math.sin(seconds*3+j),.72);
      }
      pond.foam.visible=spill>.85;
      for(let j=0;j<pond.foam.children.length;j++){
        const particle=pond.foam.children[j],u=((seconds*.9+j/10)%1+1)%1;
        particle.position.set(pond.spillEnd.x+Math.sin(j*2.39)*u*.35,pond.spillEnd.y+Math.sin(u*Math.PI)*.33,pond.spillEnd.z+Math.cos(j*2.39)*u*.24);particle.scale.setScalar((1-u)*.95+.2);
      }
    }
  }
  update(0,{},0,true);
  return {root,markers:[],update,dispose(){
    if(disposed)return;disposed=true;
    const geometries=new Set(),allMaterials=new Set();
    root.traverse(object=>{if(object.geometry)geometries.add(object.geometry);if(object.material)for(const entry of Array.isArray(object.material)?object.material:[object.material])allMaterials.add(entry);});
    for(const geometry of geometries)geometry.dispose();for(const entry of allMaterials)entry.dispose();
  }};
}
