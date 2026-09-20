import * as THREE from 'three';
import {createLandscape,POOLS} from './water-landscape.mjs';

// Four educational dioramas; subsurface geometry is conceptual, not a site survey.
export const PROCESS_IDS=['flow','dissolution','emergence','deposition'];
export function createProcessScene(id){
  if(!PROCESS_IDS.includes(id))throw new Error('Unknown water process');
  if(id==='deposition'){
    const original=createLandscape();
    return {...original,markers:POOLS.slice(3).map((p,i)=>({label:String(i+1),position:new THREE.Vector3(p.x+p.rx*.5,p.y+.3,p.z+.25),action:'rim',value:i})),
      update(time,p={}){const layers=p.layers||[0,0,0];original.update(time,2,0,layers);}};
  }
  const root=new THREE.Group();root.name='Huanglong educational '+id;
  const palette={rock:0xb7a17d,cream:0xf1dfb5,land:0xa3b18b,water:0x50c8c6,deep:0x328e9e,dark:0x315965};
  const materials=new Map(),markers=[];
  function mat(color,opts={}){const key=JSON.stringify([color,opts]);if(!materials.has(key))materials.set(key,new THREE.MeshStandardMaterial({color,roughness:.8,flatShading:true,...opts}));return materials.get(key);}
  function mesh(geometry,color,x=0,y=0,z=0,parent=root,opts={}){const m=new THREE.Mesh(geometry,mat(color,opts));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
  function box(x,y,z,w,h,d,color,parent=root){return mesh(new THREE.BoxGeometry(w,h,d),color,x,y,z,parent);}
  function rock(x,y,z,size,color=palette.rock,parent=root){const m=mesh(new THREE.IcosahedronGeometry(size,0),color,x,y,z,parent);m.rotation.set(x*.4,z*.3,y*.6);return m;}
  function tube(points,r,color,parent=root){const curve=new THREE.CatmullRomCurve3(points.map(v=>new THREE.Vector3(...v)));const m=mesh(new THREE.TubeGeometry(curve,28,r,5,false),color,0,0,0,parent,{roughness:.3});m.userData.curve=curve;return m;}
  function pine(x,y,z,s=1){mesh(new THREE.CylinderGeometry(.07,.1,s,5),0x806950,x,y+s*.4,z);for(let i=0;i<3;i++)mesh(new THREE.ConeGeometry((.65-i*.15)*s,(1.3-i*.18)*s,5),[0x3b6c60,0x648b69,0x94ad7d][i],x,y+(.85+i*.5)*s,z);}
  function foundation(){for(let i=0;i<3;i++){const m=mesh(new THREE.CylinderGeometry(4.55+i*.07,4.3+i*.07,.32,9),[0x9b8467,0xc4b28d,0xdcccaa][i],0,-.72+i*.28,0);m.scale.z=1.08;}mesh(new THREE.CylinderGeometry(4.62,4.62,.15,9),palette.land,0,.02,0).scale.z=1.08;}
  function droplet(){const d=new THREE.Group();root.add(d);d.name='The travelling droplet';mesh(new THREE.LatheGeometry([new THREE.Vector2(0,-.2),new THREE.Vector2(.2,-.16),new THREE.Vector2(.26,.06),new THREE.Vector2(.15,.35),new THREE.Vector2(0,.65)],9),0x7de6eb,0,0,0,d,{roughness:.25});for(const x of [-.085,.085])mesh(new THREE.SphereGeometry(.027,6,4),0x244b51,x,.08,.245,d);return d;}
  function dots(curve,count=18,color=0xdafff6){const group=new THREE.Group();root.add(group);for(let i=0;i<count;i++)mesh(new THREE.IcosahedronGeometry(.048,0),color,0,0,0,group);return {group,update(t,speed=.05,limit=1){group.children.forEach((o,i)=>{const u=(t*speed+i/count)%1;o.visible=u<=limit;o.position.copy(curve.getPoint(u));});}};}
  foundation();const drop=droplet();let update,flowGraph=null;
  if(id==='flow'){
    root.name='01 • Forest slope and branching watercourse';
    const groundY=z=>1.458-.355*z;
    const outline=[[-2.3,-3.8],[1.8,-3.9],[2.65,-2],[2.7,.6],[2.1,3.4],[.5,4],[-2,3.4],[-2.8,1],[-2.6,-1.7]];
    const top=[],sides=[];
    outline.forEach((a,i)=>{const b=outline[(i+1)%outline.length],av=[a[0],groundY(a[1]),a[1]],bv=[b[0],groundY(b[1]),b[1]],ab=[a[0],.08,a[1]],bb=[b[0],.08,b[1]];top.push(0,groundY(0),0,...bv,...av);sides.push(...av,...bv,...ab,...bv,...bb,...ab);});
    for(const [positions,color] of [[top,0xd9cf9f],[sides,0xb1b082]]){const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.computeVertexNormals();mesh(geo,color,0,0,0,root,{side:THREE.DoubleSide});}
    for(const [x,z,s] of [[-1.8,-2.6,.9],[1.8,-2.8,1.1],[-2.1,.5,.8],[2,1.1,.65],[-1.5,2.8,.55]])pine(x,groundY(z),z,s);
    const peak=rock(-.7,3,-3.7,1.45,0x94a897);peak.scale.set(1.4,1.5,.7);const snow=rock(-.7,4.25,-3.7,.75,0xebeeda);snow.scale.set(1,.7,.7);
    const switches=[],streams=[];
    const centers=[[.5,2.5,-2.6],[-.5,1.8,-.45],[.5,1.1,1.7]],end=[-.2,.23,3.8];
    flowGraph=centers.map((point,i)=>({point,next:centers[i+1]||end}));
    const source=tube([[.2,3,-3.9],centers[0]],.19,palette.water),sourceDots=dots(source.userData.curve,7);
    centers.forEach(([x,y,z],i)=>{
      const base=mesh(new THREE.CylinderGeometry(.54,.62,.15,8),0xebddb3,x,y-.07,z);base.name='Junction '+(i+1);
      const pivot=new THREE.Group();pivot.position.set(x,y+.03,z);root.add(pivot);
      box(0,0,0,.32,.09,1.0,palette.water,pivot);box(-.21,.08,0,.09,.2,1.12,palette.cream,pivot);box(.21,.08,0,.09,.2,1.12,palette.cream,pivot);switches.push(pivot);
      const next=flowGraph[i].next,correctSign=Math.sign(next[0]-x);
      for(const sign of [-1,1]){const target=sign===correctSign?next:[x+sign*1.35,y-.28,z+.95],points=[[x,y,z],[x+sign*.5,y-.2,z+.65],target];
        const bed=tube(points,.23,palette.cream);bed.position.y=-.15;const path=tube(points,.135,palette.water);const moving=dots(path.userData.curve,8);streams.push({path,moving,index:i,sign});
        if(sign===correctSign){const arrow=mesh(new THREE.ConeGeometry(.15,.38,3),0xf6ebbe,next[0],next[1]+.16,next[2]-.27);arrow.rotation.x=Math.PI/2;arrow.rotation.z=sign*.45;}
      }
      markers.push({label:String(i+1),position:new THREE.Vector3(x,y+.5,z),action:'turn',value:i});
    });
    for(let i=0;i<10;i++)rock(Math.sin(i*2)*3.7,.18,Math.cos(i*2)*3.8,.2+i%3*.08,0x839779);
    update=(time,p={})=>{const channels=p.channels||[0,0,0],correct=flowGraph.map(({point,next})=>next[0]<point[0]?1:0);let connected=0;while(connected<3&&channels[connected]===correct[connected])connected++;
      switches.forEach((o,i)=>o.rotation.y=channels[i]?-.65:.65);streams.forEach(({path,moving,index,sign})=>{path.visible=index<=connected&&sign===(channels[index]?-1:1);moving.group.visible=path.visible;moving.update(time,.12);});
      sourceDots.update(time,.12);drop.position.fromArray(connected===3?end:centers[connected]);drop.position.y+=.6+Math.sin(time*2)*.07;};
  }else if(id==='dissolution'){
    root.name='02 • Cutaway limestone and mineral dissolution';
    // Back wall and side columns deliberately leave the forward cross-section open.
    for(let i=0;i<4;i++){
      box(0,.46+i*.65,-1.55,7.2,.63,2.4,[0x9a877d,0xb49b83,0xc5b399,0xd9c6a3][i]);
      box(-3.1,.46+i*.65,.1,1.0,.63,2.5,[0xaa9783,0xbca38b,0xcbb595,0xe0cdaa][i]);
      box(3.1,.46+i*.65,.1,1.0,.63,2.5,[0xaa9783,0xbca38b,0xcbb595,0xe0cdaa][i]);
    }
    box(0,2.8,-1.55,7.35,.18,2.65,0x9daf86);for(const [x,z,s] of [[-2.5,-1.6,.75],[2.4,-1.7,1],[.7,-2.4,.7]])pine(x,2.89,z,s);
    const fissure=tube([[-1.2,3.4,-1],[-1.1,2.7,-.2],[.6,2.1,.25],[-.4,1.35,1],[.7,.55,2.8]],.1,0x526d70);fissure.name='Open fracture path';
    const wet=tube([[-1.2,3.4,-.98],[-1.1,2.7,-.18],[.6,2.1,.27],[-.4,1.35,1.02],[.7,.55,2.82]],.13,palette.water);
    const flow=dots(wet.userData.curve,19);const sites=[],mineral=[];
    const centers=[[-1,2.65,.32],[.65,1.9,.85],[-.55,1.0,1.65]];
    centers.forEach(([x,y,z],i)=>{const stone=rock(x,y,z,.5,0xf0dfbb);stone.scale.set(1.35,.9,1);sites.push(stone);const ring=mesh(new THREE.TorusGeometry(.58,.035,4,18),0xe9bf72,x,y,z+.16);ring.rotation.x=-.3;markers.push({label:String(i+1),position:new THREE.Vector3(x,y+.5,z+.3),action:'observe',value:i});
      const g=new THREE.Group();root.add(g);for(let j=0;j<6;j++)mesh(new THREE.OctahedronGeometry(.04,0),0xf6dd9b,x,y,z,g);mineral.push(g);});
    const aquifer=mesh(new THREE.CylinderGeometry(2.3,2.4,.22,10),palette.water,.4,.18,2.15,root,{transparent:true,opacity:.8,roughness:.25});aquifer.scale.z=.48;
    // Golden particles represent dissolved material, never pieces of rock.
    update=(time,p={})=>{wet.visible=!!p.charged;flow.group.visible=!!p.charged;flow.update(time,.06);sites.forEach((stone,i)=>{const dissolved=p.sites?.includes(i);stone.scale.set(dissolved?.75:1.35,dissolved?.65:.9,dissolved?.65:1);mineral[i].visible=!!dissolved;mineral[i].children.forEach((m,j)=>{const u=(time*.09+j/6)%1;m.position.copy(wet.userData.curve.getPoint(Math.min(1,.18+i*.24+u*.3)));m.position.x+=Math.sin(j*2)*.12;});});drop.position.copy(wet.userData.curve.getPoint(p.charged?.62:.04));drop.position.y+=.48+Math.sin(time*2)*.06;};
  }else{
    root.name='03 • Groundwater emerging into a surface spring';
    for(let i=0;i<4;i++)box(-1,.42+i*.65,-1.65,5.5,.63,3,[0x9c8e82,0xb9a48b,0xd3c09b,0xb9b791][i]);
    box(-1,2.8,-1.65,5.65,.18,3.15,0x9cab83);pine(-2.7,2.89,-2,.9);pine(.1,2.89,-2.4,1.05);
    // Visible underground reservoir against the open cross-section.
    const reservoir=box(-1.1,1.3,.1,3.9,2.1,.55,palette.deep);reservoir.material=mat(palette.water,{transparent:true,opacity:.67,roughness:.18});
    const levelLine=box(-1.1,1.78,.43,4,.045,.04,0xf4de91);levelLine.name='Outlet elevation reference';
    for(let i=0;i<3;i++){const z=.05+i*.72,y=[1.25,1.78,2.3][i];tube([[.7,y,z],[1.3,y,z],[1.8,y,z]],.12,i===1?0x60948d:0x877b6e);if(i!==1)rock(1.85,y,z,.22,0xb5a080);markers.push({label:String(i+1),position:new THREE.Vector3(1.8,y+.2,z),action:'outlet',value:i});}
    const spring=tube([[.8,1.78,.77],[1.8,1.78,.77],[2.15,1.45,1.2],[2.2,.65,1.9],[1.5,.2,2.6],[-.2,.18,3.9]],.24,0x76d6c8);spring.name='Emerging spring and falling water';
    const runoff=dots(spring.userData.curve,22);const bubbles=new THREE.Group();root.add(bubbles);for(let i=0;i<9;i++)mesh(new THREE.IcosahedronGeometry(.06+(i%3)*.02,0),0xf1ffe7,0,0,0,bubbles);
    const basin=mesh(new THREE.CylinderGeometry(1.75,1.9,.18,10),0xdccc9f,1.1,.14,2.8);basin.scale.z=.62;
    const pool=mesh(new THREE.CylinderGeometry(1.61,1.61,.04,10),palette.water,1.1,.25,2.8);pool.scale.z=.59;
    for(let i=0;i<7;i++)rock(2.7+Math.sin(i)*.45,.3,1.4+i*.25,.23+i%2*.09,0xb6b48c);pine(-3.4,.2,1.8,.7);
    update=(time,p={})=>{const level=(p.level||0)/100,open=p.outlet===1&&level>=.65,height=.1+2.2*level;reservoir.scale.y=height/2.1;reservoir.position.y=.25+height/2;spring.visible=open;runoff.group.visible=open;bubbles.visible=open;pool.material=mat(open?palette.water:0xadc4af,{roughness:.25});runoff.update(time,.09);bubbles.children.forEach((o,i)=>{const u=(time*.3+i/9)%1;o.position.set(2+Math.sin(i*2)*.3,1+u*1.5,1.5+Math.cos(i)*.3);});drop.position.set(open?2:-1.1,open?1.7:.25+height+.3,open?1.4:.7);drop.position.y+=Math.sin(time*2)*.06;};
  }
  update(0,{});
  return {root,markers,flowGraph,update,dispose(){const geometries=new Set();root.traverse(o=>{if(o.geometry)geometries.add(o.geometry);});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());}};
}
