import * as THREE from 'three';

export const COLORS={water:0x63d8d4,deep:0x358f99,foam:0xe0fff3,cream:0xe9d8ae,rock:0xb9a58b,land:0x9fae81,pine:0x456c60,solute:0xf4d994};
export const clamp=(value,min=0,max=1)=>Math.min(max,Math.max(min,Number.isFinite(value)?value:min));
export const approach=(value,target,delta,snap,rate=7)=>snap?target:THREE.MathUtils.lerp(value,target,1-Math.exp(-rate*clamp(delta,0,.1)));

// Geometry is created once; updates change transforms and material uniforms only.
export function createModelKit(name){
  const root=new THREE.Group();root.name=name;
  const geometries=new Set(),materials=new Set(),cache=new Map();
  function material(color,options={},unique=false){
    const key=JSON.stringify([color,options]);if(!unique&&cache.has(key))return cache.get(key);
    const m=new THREE.MeshStandardMaterial({color,roughness:.86,flatShading:true,...options});materials.add(m);if(!unique)cache.set(key,m);return m;
  }
  function mesh(geometry,color,position=[0,0,0],parent=root,options={}){
    geometries.add(geometry);const m=new THREE.Mesh(geometry,color?.isMaterial?color:material(color,options));
    m.position.fromArray(position);m.castShadow=!m.material.transparent;m.receiveShadow=true;parent.add(m);return m;
  }
  function group(name,parent=root){const g=new THREE.Group();g.name=name;parent.add(g);return g;}
  function box(position,size,color,parent=root){return mesh(new THREE.BoxGeometry(...size),color,position,parent);}
  function rock(position,size=.3,color=COLORS.rock,parent=root){const o=mesh(new THREE.IcosahedronGeometry(size,0),color,position,parent);o.rotation.set(position[0]*.47,position[1]*.74,position[2]*.43);return o;}
  function surface(vertices,color,parent=root){if(!vertices.length)return group('unexposed-stratum',parent);const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.computeVertexNormals();return mesh(g,color,[0,0,0],parent,{side:THREE.DoubleSide});}
  function pine(x,y,z,s=1){
    const g=group('alpine-conifer');g.position.set(x,y,z);
    mesh(new THREE.CylinderGeometry(.045*s,.085*s,.9*s,5),0x7e7059,[0,.4*s,0],g);
    for(let i=0;i<3;i++)mesh(new THREE.ConeGeometry((.47-i*.105)*s,(1.0-i*.13)*s,6),[0x496f5e,0x638461,0x899e72][i],[0,(.75+i*.31)*s,0],g);
    return g;
  }
  function base(){
    const g=group('geological-plinth');
    for(let i=0;i<3;i++){const o=mesh(new THREE.CylinderGeometry(4.52+i*.07,4.36+i*.08,.25,11),[0x8f8170,0xb3a188,0xcfbea0][i],[0,-.77+i*.25,0],g);o.scale.z=1.05;}
    const top=mesh(new THREE.CylinderGeometry(4.65,4.65,.13,11),0xa2af8a,[0,-.055,0],g);top.scale.z=1.05;
    return g;
  }
  function curve(points){return new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)),false,'centripetal');}
  function tube(path,radius,color,parent=root,segments=32){return mesh(new THREE.TubeGeometry(path,segments,radius,5,false),color,[0,0,0],parent);}
  function ribbon(path,width,color,parent=root,steps=40,yOffset=0){
    const data=[],a=new THREE.Vector3(),b=new THREE.Vector3();
    for(let i=0;i<steps;i++){
      const u=i/steps,v=(i+1)/steps,pa=path.getPoint(u),pb=path.getPoint(v),ta=path.getTangent(u),tb=path.getTangent(v);
      a.set(ta.z,0,-ta.x).normalize().multiplyScalar(width/2);b.set(tb.z,0,-tb.x).normalize().multiplyScalar(width/2);
      const al=[pa.x-a.x,pa.y+yOffset,pa.z-a.z],ar=[pa.x+a.x,pa.y+yOffset,pa.z+a.z],bl=[pb.x-b.x,pb.y+yOffset,pb.z-b.z],br=[pb.x+b.x,pb.y+yOffset,pb.z+b.z];
      data.push(...al,...bl,...ar,...ar,...bl,...br);
    }
    return surface(data,color,parent);
  }
  function stream(points,{name='stream',width=.25,count=13,bed=true,color=COLORS.water,speed=.18,underground=false,parent=root}={}){
    const path=curve(points),g=group(name,parent),wetMaterial=material(color,{roughness:.23,metalness:.05,transparent:true,opacity:.92,depthWrite:false,side:THREE.DoubleSide},true);
    if(bed)ribbon(path,width+.2,COLORS.cream,parent,40,-.045);
    const water=underground?tube(path,width*.3,wetMaterial,g):ribbon(path,width,wetMaterial,g);
    water.name=name+'-water';
    const particles=group(name+'-particles',g),particleMaterial=material(COLORS.foam,{roughness:.2,transparent:true,opacity:1,depthWrite:false},true),particleGeometry=new THREE.IcosahedronGeometry(.037,0);
    for(let i=0;i<count;i++){const o=mesh(particleGeometry,particleMaterial,[0,0,0],particles);o.scale.set(.65,.65,1.8);}
    let amount=0;const forward=new THREE.Vector3(0,0,1),tangent=new THREE.Vector3();
    return {group:g,particles,path,water,get amount(){return amount;},update(time,target=1,delta=1/60,snap=false){
      amount=approach(amount,clamp(target),delta,snap,9);g.visible=amount>.008;wetMaterial.opacity=.88*amount;particleMaterial.opacity=amount;
      particles.children.forEach((o,i)=>{const u=((time*speed+i/count)%1+1)%1;path.getPoint(u,o.position);o.position.y+=underground?0:.04;path.getTangent(u,tangent);o.quaternion.setFromUnitVectors(forward,tangent);});
    }};
  }
  function droplet(position=[0,0,0],scale=1){
    const g=group('travelling-water-drop');g.position.fromArray(position);g.scale.setScalar(scale);
    const shape=[new THREE.Vector2(0,-.23),new THREE.Vector2(.19,-.18),new THREE.Vector2(.29,.04),new THREE.Vector2(.23,.24),new THREE.Vector2(.10,.43),new THREE.Vector2(0,.66)];
    const body=mesh(new THREE.LatheGeometry(shape,10),material(0x78e3e4,{roughness:.22,metalness:.08}),[0,0,0],g);body.name='water-drop-body';
    for(const x of [-.095,.095])mesh(new THREE.SphereGeometry(.027,6,4),0x244f57,[x,.09,.262],g);
    const gleam=mesh(new THREE.IcosahedronGeometry(.044,0),0xe7fff3,[-.12,.27,.21],g);gleam.scale.set(.6,1.8,.4);
    return g;
  }
  function pool(position,rx,rz,{name='aquifer-pool',color=COLORS.water,parent=root}={}){
    const g=group(name,parent);g.position.fromArray(position);
    const rim=mesh(new THREE.CylinderGeometry(rx+.13,rx+.27,.16,15),COLORS.cream,[0,-.07,0],g);rim.scale.z=rz/rx;
    const water=mesh(new THREE.CylinderGeometry(rx,rx,.032,20),material(color,{roughness:.18,metalness:.08}),[0,.018,0],g);water.scale.z=rz/rx;
    return {group:g,water};
  }
  function mountain(){
    const g=group('mountain-cutaway'),cut=.45;
    const height=(x,z)=>.22+3.75*Math.exp(-((x+1.05)**2/7+(z+1.8)**2/12))+1.08*Math.exp(-((x-1.75)**2/2.3+(z+1.75)**2/7));
    const xs=[-3.65,-2.9,-2.15,-1.4,-.65,.1,.85,1.6,2.35,3.1,3.65],zs=[-3.65,-2.85,-2.1,-1.35,-.55,cut];
    const topBuckets=[[],[],[],[]];
    for(let zi=0;zi<zs.length-1;zi++)for(let xi=0;xi<xs.length-1;xi++){
      const a=[xs[xi],height(xs[xi],zs[zi]),zs[zi]],b=[xs[xi+1],height(xs[xi+1],zs[zi]),zs[zi]],c=[xs[xi],height(xs[xi],zs[zi+1]),zs[zi+1]],d=[xs[xi+1],height(xs[xi+1],zs[zi+1]),zs[zi+1]];
      const bucket=(xi+zi)%3;topBuckets[(a[1]+b[1]+c[1]+d[1])/4>3.38?3:bucket].push(...a,...c,...b,...b,...c,...d);
    }
    topBuckets.forEach((v,i)=>surface(v,[0xa0ad83,0x919f79,0xb0b58d,0xb9b9a4][i],g));
    // The exposed face is a clipped mountain profile, divided into bedding strata.
    const beds=[0,.65,1.3,1.95,2.6,3.25,4.5],bedColors=[0x918d83,0xb6a68d,0xd1bf9f,0xbcac90,0xdccbaf,0xbdb9a4];
    for(let layer=0;layer<beds.length-1;layer++){
      const front=[];
      for(let i=0;i<xs.length-1;i++){
        const x=xs[i],next=xs[i+1],ha=height(x,cut),hb=height(next,cut),low=beds[layer],high=beds[layer+1];
        if(Math.max(ha,hb)<=low)continue;
        const xa=ha<low?THREE.MathUtils.lerp(x,next,(low-ha)/(hb-ha)):x,xb=hb<low?THREE.MathUtils.lerp(x,next,(low-ha)/(hb-ha)):next;
        const ya=Math.min(high,Math.max(low,ha)),yb=Math.min(high,Math.max(low,hb));
        front.push(xa,low,cut,xb,low,cut,xa,ya,cut,xa,ya,cut,xb,low,cut,xb,yb,cut);
      }
      surface(front,bedColors[layer],g);
    }
    const perimeter=[...xs.map(x=>[x,-3.65]),...zs.slice(1).map(z=>[3.65,z]),...xs.slice(0,-1).reverse().map(x=>[x,cut]),...zs.slice(1,-1).reverse().map(z=>[-3.65,z])];
    const side=[];perimeter.forEach((a,i)=>{const b=perimeter[(i+1)%perimeter.length];if(a[1]===cut&&b[1]===cut)return;side.push(a[0],0,a[1],b[0],0,b[1],a[0],height(...a),a[1],a[0],height(...a),a[1],b[0],0,b[1],b[0],height(...b),b[1]);});surface(side,0xa5977e,g);
    for(const [x,z,s] of [[-2.7,-1.2,.72],[-.15,-2.9,.55],[2.45,-1.6,.66],[1.7,-.25,.48]])pine(x,height(x,z),z,s);
    for(let i=0;i<13;i++){const x=-3.05+i*.46,y=.25+(i%3)*.6;if(y<height(x,cut)-.15)rock([x,y,cut+.018],.05,0xe6d8bd,g).scale.set(2.6,.35,.6);}
    return {group:g,height,cut};
  }
  function dispose(){geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());}
  return {root,material,mesh,group,box,rock,surface,pine,base,curve,tube,ribbon,stream,droplet,pool,mountain,dispose};
}
