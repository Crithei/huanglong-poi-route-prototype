import * as THREE from 'three';
import {createModelKit,COLORS,clamp,approach} from './water-model-kit.mjs';
import {createDepositionScene} from './water-deposition.mjs';

// Geological process illustrations: geometry is conceptual, not a site survey.
export const PROCESS_IDS=['flow','dissolution','emergence','deposition'];
export function createProcessScene(id){
  if(!PROCESS_IDS.includes(id))throw new Error('Unknown water process');
  if(id==='deposition')return createDepositionScene();
  if(id==='flow')return createFlowScene();
  if(id==='dissolution')return createDissolutionScene();
  return createEmergenceScene();
}

function createFlowScene(){
  const k=createModelKit('01 • Alpine runoff, branching channels and aquifer recharge');
  const {root}=k;k.base();
  const groundY=z=>2.08-.46*z;
  const outline=[[-2.6,-3.8],[1.95,-3.95],[2.65,-2.45],[2.75,.4],[2.15,2.6],[.65,3],[-2.1,2.65],[-2.85,.8],[-2.8,-1.7]],top=[],side=[];
  outline.forEach((a,i)=>{const b=outline[(i+1)%outline.length],av=[a[0],groundY(a[1]),a[1]],bv=[b[0],groundY(b[1]),b[1]];top.push(0,groundY(0),0,...bv,...av);side.push(...av,...bv,a[0],.09,a[1],...bv,b[0],.09,b[1],a[0],.09,a[1]);});
  k.surface(top,0xb1b48b);k.surface(side,0xc5b494);
  for(const [x,z,s] of [[-1.9,-2.5,.7],[1.65,-2.9,.76],[-2.2,.05,.7],[2.15,.6,.55],[-1.75,2.15,.48]])k.pine(x,groundY(z),z,s);
  const peak=k.rock([-1.17,3.89,-3.62],1.04,0x9da99a);peak.scale.set(1.2,1.42,.65);
  k.rock([-1.26,4.7,-3.64],.53,0xe4e8d8).scale.set(1.1,.72,.68);
  const centers=[[.42,groundY(-2.55)+.11,-2.55],[-.64,groundY(-.5)+.11,-.5],[.62,groundY(1.4)+.11,1.4]],end=[-.18,.81,2.94];
  const flowGraph=centers.map((point,i)=>({point,next:centers[i+1]||end}));
  k.pool([.55,3.81,-3.48],.23,.21,{name:'exposed-alpine-source'});
  const source=k.stream([[.55,3.83,-3.48],[.55,3.58,-3.03],centers[0]],{name:'flow-source',width:.28,count:12,speed:.29});
  const switches=[],branches=[],interactables=[];
  flowGraph.forEach(({point,next},index)=>{
    const socket=k.group('channel-junction-'+index);socket.position.fromArray(point);
    k.mesh(new THREE.CylinderGeometry(.43,.52,.15,10),0xe5d3a6,[0,-.035,0],socket);
    const pivot=k.group('rotating-channel-'+index,socket);switches.push(pivot);
    const pivotCurve=k.curve([[0,.035,-.32],[0,.035,.08],[0,.015,.56]]);
    k.ribbon(pivotCurve,.23,COLORS.water,pivot,8);
    for(const sign of [-1,1]){const rail=k.box([sign*.18,.07,.11],[.075,.15,.94],0xf2e3bc,pivot);rail.rotation.x=.03;}
    // An unnumbered brass grip makes the rotating part recognizable and touchable.
    k.mesh(new THREE.CylinderGeometry(.11,.11,.1,8),0xb29c6a,[0,.1,-.18],pivot);
    interactables.push({object:socket,action:'turn',value:index});
    const correctSign=Math.sign(next[0]-point[0]);
    for(const sign of [-1,1]){
      const isCorrect=sign===correctSign,target=isCorrect?next:[point[0]+sign*1.48,point[1]-.48,point[2]+.94];
      const points=[[point[0]+sign*.23,point[1]+.015,point[2]+.38],[point[0]+sign*.60,point[1]-.26,point[2]+.73],target];
      const stream=k.stream(points,{name:`flow-branch-${index}-${sign}`,width:.23,count:14,speed:.2});branches.push({index,sign,stream});
      if(!isCorrect){const patch=k.pool([target[0],target[1]-.02,target[2]],.28,.25,{name:'runoff-soakaway-'+index});patch.water.material=k.material(0x829c89,{roughness:.75});k.rock([target[0]+sign*.28,target[1]+.06,target[2]],.18,0xaca78b);}
    }
  });
  // A narrow open cut exposes recharge passing down through the permeable rock.
  k.rock([-.68,.63,3.05],.48,0xd6c49e).scale.set(.68,1.2,.62);
  k.rock([.36,.62,3.04],.46,0xd6c49e).scale.set(.6,1.15,.65);
  const recharge=k.stream([end,[-.2,.62,3.12],[-.16,.23,3.26],[.15,.09,3.56],[1.05,.09,3.86]],{name:'flow-aquifer-entry',width:.27,count:19,bed:false,speed:.18});
  recharge.particles.name='flow-aquifer-particles';
  const aquifer=k.pool([.78,.015,3.57],1.25,.58,{name:'flow-underground-aquifer',color:0x3b9ba5});
  const aquiferMaterial=k.material(COLORS.deep,{roughness:.2,metalness:.08},true);aquifer.water.material=aquiferMaterial;
  const aquiferColor=new THREE.Color(COLORS.deep),chargedColor=new THREE.Color(COLORS.water);
  const drop=k.droplet([.25,4.3,-3.4],.72);let solvedAmount=0;
  function update(time,p={},delta=1/60,snap=false){
    const channels=Array.isArray(p.channels)?p.channels:[0,0,0],correct=[1,0,1];let connected=0;
    while(connected<3&&channels[connected]===correct[connected])connected++;
    source.update(time,1,delta,snap);
    switches.forEach((pivot,i)=>pivot.rotation.y=approach(pivot.rotation.y,channels[i]===1?-.6:.6,delta,snap,11));
    branches.forEach(({stream,index,sign})=>stream.update(time,index<=connected&&sign===(channels[index]===1?-1:1)?1:0,delta,snap));
    recharge.update(time,connected===3?1:0,delta,snap);
    solvedAmount=approach(solvedAmount,connected===3?1:0,delta,snap,4);aquiferMaterial.color.copy(aquiferColor).lerp(chargedColor,solvedAmount*.75);
    const follow=source.path.getPoint(.30);drop.position.set(follow.x,follow.y+.53+Math.sin(time*2)*.045,follow.z);drop.rotation.y=.2;
  }
  update(0,{},0,true);
  return {root,markers:[],interactables,flowGraph,dropTarget:drop,update,dispose:k.dispose};
}

function createDissolutionScene(){
  const k=createModelKit('02 • CO₂ enriched water dissolves fractured limestone');const {root}=k;k.base();
  const mountain=k.mountain();
  const points=[[-1.5,2.95,.10],[-1.34,2.53,.60],[-.65,2.18,.82],[.28,1.89,1.03],[-.35,1.27,1.52],[.5,.65,2.17],[1.4,.16,3.02]];
  // A grounded limestone section continues beneath the exposed lower fissure.
  // Its sides retain bedding, so the water reads as travelling inside a cutaway.
  const ledge=k.group('dissolution-lower-rock-section');
  const rows=[[-.05,2.25,.60,.95],[-.08,1.76,1.05,1.03],[-.20,1.10,1.62,.80],[.51,.48,2.24,.78],[1.17,.10,2.91,.66]],top=[];
  const beds=[.04,.48,.98,1.48,1.98,2.5],bedColors=[0xa69880,0xc3b18f,0xd5c3a3,0xbba98d,0xe0ceb0];
  for(let i=0;i<rows.length-1;i++){
    const [x,y,z,w]=rows[i],[nx,ny,nz,nw]=rows[i+1];
    top.push(x-w,y,z,x+w,y,z,nx-nw,ny,nz,x+w,y,z,nx+nw,ny,nz,nx-nw,ny,nz);
    for(const sign of [-1,1])for(let layer=0;layer<beds.length-1;layer++){
      const low=beds[layer],high=beds[layer+1];if(Math.max(y,ny)<=low)continue;
      let a=[x+sign*w,z,y],b=[nx+sign*nw,nz,ny];
      if(a[2]<low){const t=(low-a[2])/(b[2]-a[2]);a=[THREE.MathUtils.lerp(a[0],b[0],t),THREE.MathUtils.lerp(a[1],b[1],t),low];}
      if(b[2]<low){const t=(low-b[2])/(a[2]-b[2]);b=[THREE.MathUtils.lerp(b[0],a[0],t),THREE.MathUtils.lerp(b[1],a[1],t),low];}
      k.surface([a[0],low,a[1],b[0],low,b[1],a[0],Math.min(a[2],high),a[1],a[0],Math.min(a[2],high),a[1],b[0],low,b[1],b[0],Math.min(b[2],high),b[1]],bedColors[layer],ledge);
    }
  }
  k.surface(top,0xd6c4a0,ledge);
  const fracture=k.curve(points),fissure=k.tube(fracture,.14,0x746f64,root,38);fissure.position.z=-.12;
  const wet=k.stream(points,{name:'dissolution-stream',width:.25,count:27,bed:false,speed:.15,underground:true});
  const sites=[],minerals=[],startAt=[.2,.43,.68];
  startAt.forEach((u,i)=>{
    const position=fracture.getPoint(u);position.x+=(i%2?.17:-.17);position.z+=.15;
    const stone=k.rock(position.toArray(),.40,[0xebdabc,0xdcc9a7,0xf1dfbb][i]);stone.name='dissolving-limestone-'+i;stone.scale.set(1.2,.87,.87);sites.push(stone);
    for(let j=0;j<3;j++)k.rock([position.x+Math.cos(j*2.1)*.33,position.y+Math.sin(j*2.1)*.23,position.z-.12],.10,0xd3c3a7);
    const g=k.group('dissolved-minerals-'+i),material=k.material(COLORS.solute,{roughness:.24,transparent:true,opacity:0,depthWrite:false},true),geometry=new THREE.OctahedronGeometry(.037,0);
    for(let j=0;j<10;j++)k.mesh(geometry,material,[0,0,0],g);
    minerals.push({group:g,material,amount:0});
  });
  k.pool([1.05,.08,3.0],1.62,.65,{name:'dissolution-mineral-bearing-water'});
  const drop=k.droplet([-1.50,3.7,.62],1.05),body=drop.getObjectByName('water-drop-body');
  body.material=k.material(0x78e3e4,{roughness:.22,metalness:.08},true);
  const plain=new THREE.Color(0x78e3e4),charged=new THREE.Color(0xa6e8d0),halo=k.group('dissolution-charge-glow',drop);
  const haloMaterial=k.material(0xe5f5c0,{roughness:.4,transparent:true,opacity:.0,depthWrite:false},true);
  const ring=k.mesh(new THREE.TorusGeometry(.49,.018,4,22),haloMaterial,[0,.07,0],halo);ring.rotation.x=Math.PI/2;
  // CO₂ is an illustrative gas puff, separate from the recurring water character.
  // Its model position is never read back from the renderer's temporary drag pose.
  const cloud=k.group('dissolution-co2-cloud'),cloudHome=new THREE.Vector3(2.55,3.55,.52),cloudDestination=new THREE.Vector3(-1.5,3.86,.62),cloudPosition=cloudHome.clone();
  const cloudMaterials=[0xe6efd8,0xc6dbc6,0xf5f1df].map(color=>k.material(color,{roughness:.94,transparent:true,opacity:.97,depthWrite:false},true));
  const puffGeometry=new THREE.IcosahedronGeometry(1,1),puffs=[];
  for(const [i,[x,y,z,s]] of [[-.41,-.02,0,.30],[-.13,.13,-.04,.41],[.22,.20,.0,.36],[.48,.02,.01,.27],[.08,-.09,.17,.35],[-.26,-.09,.18,.30],[.26,-.07,-.15,.26]].entries()){
    const puff=k.mesh(puffGeometry,cloudMaterials[i%3],[x,y,z],cloud);puff.name='co2-cloud-puff-'+i;puff.rotation.set(i*.63,i*.47,i*.28);puff.scale.set(s,s*.85,s*.86);puffs.push({puff,x,y,z,s});
  }
  const wisps=k.group('dissolution-co2-wisps'),wispGeometry=new THREE.IcosahedronGeometry(.10,0),wispMaterial=k.material(0xe3eed2,{roughness:.85,transparent:true,opacity:0,depthWrite:false},true);
  for(let i=0;i<9;i++){const wisp=k.mesh(wispGeometry,wispMaterial,[0,0,0],wisps);wisp.rotation.set(i*.52,i*.31,i*.17);}
  for(let i=0;i<6;i++)k.rock([-1.84+i*.13,mountain.height(-1.84+i*.13,.12)+.025,.12],.075,0x786f50).scale.set(1.3,.6,.9);
  let charge=0;const progress=[0,0,0];
  function update(time,p={},delta=1/60,snap=false){
    const elapsed=p.charged?clamp(p.elapsed,0,8):0;
    charge=approach(charge,p.charged?1:0,delta,snap,6);wet.update(time,p.charged?1:0,delta,snap);
    body.material.color.copy(plain).lerp(charged,charge);haloMaterial.opacity=charge*.65;halo.rotation.y=time*.3;
    const gasClock=p.charged?elapsed:time,travel=p.charged?THREE.MathUtils.smoothstep(elapsed,0,.9):0;
    const dissolve=p.charged?THREE.MathUtils.smoothstep(elapsed,.28,1):0;
    cloudPosition.copy(cloudHome).lerp(cloudDestination,travel);
    cloudPosition.x+=Math.sin(gasClock*.42)*.055*(1-travel);
    cloudPosition.y+=Math.sin(gasClock*.8)*.055*(1-travel)+Math.sin(travel*Math.PI)*.26;
    cloud.position.copy(cloudPosition);cloud.rotation.set(0,Math.sin(gasClock*.48)*.07,Math.sin(gasClock*.6)*.025);
    cloud.scale.setScalar((1+Math.sin(gasClock*.9)*.025)*(1-THREE.MathUtils.smoothstep(elapsed,.12,1)));
    cloud.visible=!p.charged||elapsed<1;cloudMaterials.forEach(material=>material.opacity=.97*(1-dissolve));
    puffs.forEach(({puff,x,y,z,s},i)=>{const breath=1+Math.sin(gasClock*.85+i*.7)*.035;puff.position.set(x,y+Math.sin(gasClock*.72+i)*.012,z);puff.scale.set(s*breath,s*.85*breath,s*.86*breath);});
    const wispAmount=p.charged?THREE.MathUtils.smoothstep(elapsed,.05,.25)*(1-THREE.MathUtils.smoothstep(elapsed,.7,1.15)):0;
    wisps.visible=wispAmount>.01;wispMaterial.opacity=wispAmount*.72;
    wisps.children.forEach((wisp,i)=>{const u=clamp((elapsed-.05-i*.035)/.68),bend=Math.sin(u*Math.PI);wisp.position.copy(cloudHome).lerp(cloudDestination,u);wisp.position.x+=Math.sin(i*2.3)*.19*bend;wisp.position.y+=.15+bend*(.17+Math.sin(i*1.7)*.16);wisp.position.z+=Math.cos(i*2.2)*.16*bend;wisp.scale.setScalar((.65+(i%3)*.16)*(1-u*.87));});
    sites.forEach((stone,i)=>{
      const target=clamp((elapsed-i*2.35)/2.7);progress[i]=approach(progress[i],target,delta,snap,7);
      const shrink=1-.62*progress[i];stone.scale.set(1.2*shrink,.87*shrink,.87*shrink);
      const mineral=minerals[i];mineral.amount=approach(mineral.amount,target>0?.45+.55*target:0,delta,snap,7);mineral.group.visible=mineral.amount>.01;mineral.material.opacity=mineral.amount;
      mineral.group.children.forEach((o,j)=>{const v=((time*.13+j/10)%1+1)%1,u=startAt[i]+v*(1-startAt[i]);fracture.getPoint(u,o.position);o.position.x+=Math.sin(j*2.4)*.10;o.position.z+=.12+Math.cos(j*1.7)*.06;o.scale.setScalar(.8+v*.32);});
    });
    drop.position.set(-1.5,3.7+Math.sin(time*2)*.06,.62);drop.rotation.y=.16;
  }
  update(0,{},0,true);
  return {root,markers:[],interactables:[],dragSource:cloud,dropTarget:drop,update,dispose:k.dispose};
}

function createEmergenceScene(){
  const k=createModelKit('03 • Mountain aquifer, rising water table and natural spring');const {root}=k;k.base();const mountain=k.mountain();
  const bottom=.18,span=2.22,outletY=bottom+span*.65;
  // A fixed aquifer base and moving water table make the threshold visible.
  const aquifer=k.group('emergence-aquifer');
  const waterMaterial=k.material(0x64c4c5,{roughness:.25,transparent:true,opacity:.60,depthWrite:false,side:THREE.DoubleSide},true),tableMaterial=k.material(0xc9fff0,{roughness:.2,side:THREE.DoubleSide});
  const slices=24,waterPositions=new Float32Array((slices+1)*6),tablePositions=new Float32Array((slices+1)*6),indices=[],ceilings=[];
  for(let i=0;i<=slices;i++){
    const x=-3.09+i*4.38/slices;ceilings.push(mountain.height(x,mountain.cut)-.055);
    waterPositions.set([x,bottom,.60,x,bottom+.025,.60],i*6);tablePositions.set([x,0,.615,x,.027,.615],i*6);
    if(i<slices){const j=i*2;indices.push(j,j+2,j+1,j+1,j+2,j+3);}
  }
  const waterGeometry=new THREE.BufferGeometry();waterGeometry.setAttribute('position',new THREE.BufferAttribute(waterPositions,3));waterGeometry.setIndex(indices);waterGeometry.computeVertexNormals();
  const tableGeometry=new THREE.BufferGeometry();tableGeometry.setAttribute('position',new THREE.BufferAttribute(tablePositions,3));tableGeometry.setIndex(indices);tableGeometry.computeVertexNormals();
  const reservoir=k.mesh(waterGeometry,waterMaterial,[0,0,0],aquifer);reservoir.name='emergence-water-volume';
  const table=k.mesh(tableGeometry,tableMaterial,[0,bottom,0],aquifer);table.name='emergence-water-table';
  // Both bounds cover all slider states; no geometry or bounds are recreated per frame.
  const waterBounds=new THREE.Box3(new THREE.Vector3(-3.1,bottom,.59),new THREE.Vector3(1.3,bottom+span+.03,.63));
  waterGeometry.boundingBox=waterBounds;waterGeometry.boundingSphere=waterBounds.getBoundingSphere(new THREE.Sphere());
  tableGeometry.boundingBox=new THREE.Box3(new THREE.Vector3(-3.1,-span,.61),new THREE.Vector3(1.3,.03,.63));tableGeometry.boundingSphere=tableGeometry.boundingBox.getBoundingSphere(new THREE.Sphere());
  const boundary=k.curve([[-3.05,bottom,.64],[-1.25,bottom-.03,.68],[.45,bottom,.72],[1.38,bottom+.11,.80]]);k.tube(boundary,.055,0x777c73);
  // A single natural outlet at the lower edge of the permeable bed.
  const mouth=k.rock([1.28,outletY,.51],.32,0x787c6a);mouth.scale.set(.85,.56,.4);mouth.name='natural-spring-mouth';
  for(const [x,y,s] of [[1.54,outletY+.13,.24],[1.31,outletY+.33,.2],[1.0,outletY+.12,.15]])k.rock([x,y,.57],s,0xbcb399);
  const seepage=k.stream([[-2.76,outletY-.3,.68],[-1.67,outletY-.17,.71],[-.7,outletY-.07,.75],[.3,outletY,.76],[1.27,outletY,.77]],{name:'emergence-underground-seepage',width:.16,count:23,bed:false,underground:true,speed:.13,color:0xa3e4d7});
  const spring=k.stream([[1.27,outletY,.78],[1.72,outletY-.03,1.0],[2.03,1.36,1.48],[2.0,.75,2.05],[1.46,.28,2.77],[.3,.24,3.48],[-.7,.23,3.92]],{name:'emergence-spring',width:.37,count:32,bed:true,speed:.15,color:0x75ddd0});
  const basin=k.pool([.53,.15,3.15],1.82,.80,{name:'emergence-surface-pool'}),poolMaterial=k.material(0x8cb9a8,{roughness:.2,metalness:.03},true);basin.water.material=poolMaterial;
  const dryColor=new THREE.Color(0x8cb9a8),wetColor=new THREE.Color(0x61d1cb);
  // Bubbles leave water only after pressure drops at the exposed spring.
  const bubbles=k.group('emergence-co2-bubbles'),bubbleMaterial=k.material(0xf0fff1,{roughness:.2,transparent:true,opacity:.85,depthWrite:false},true),bubbleGeometry=new THREE.IcosahedronGeometry(.049,0);
  for(let i=0;i<15;i++)k.mesh(bubbleGeometry,bubbleMaterial,[0,0,0],bubbles);
  const ripple=k.group('spring-impact-ripples'),rings=[];
  for(let i=0;i<3;i++){const material=k.material(0xc8fff0,{roughness:.2,transparent:true,opacity:.8,depthWrite:false},true);const ring=k.mesh(new THREE.TorusGeometry(.25,.015,4,24),material,[1.5,.31,2.78],ripple);ring.rotation.x=-Math.PI/2;rings.push(ring);}
  for(let i=0;i<8;i++)k.rock([2.4+Math.sin(i*2.1)*.26,.19+i*.025,1.3+i*.3],.18+(i%2)*.05,0xaab293);
  k.pine(-3.4,.13,1.55,.68);
  const drop=k.droplet([-1.7,1.6,.84],.79);let displayedLevel=0,flowAmount=0;
  function update(time,p={},delta=1/60,snap=false){
    const desiredLevel=clamp(p.level,0,100);displayedLevel=approach(displayedLevel,desiredLevel,delta,snap,7);
    const waterY=bottom+span*displayedLevel/100;
    table.position.y=waterY;
    for(let i=0;i<=slices;i++){
      const top=Math.min(Math.max(bottom+.025,waterY),ceilings[i]);waterPositions[i*6+4]=top;
      const edgeTop=Math.min(waterY,ceilings[i]);tablePositions[i*6+1]=edgeTop-waterY;tablePositions[i*6+4]=edgeTop-waterY+(waterY<=ceilings[i]?.027:0);
    }
    waterGeometry.attributes.position.needsUpdate=true;tableGeometry.attributes.position.needsUpdate=true;
    const flowing=desiredLevel>=65&&displayedLevel>=64.8;
    flowAmount=approach(flowAmount,flowing?1:0,delta,snap,7);spring.update(time,flowing?1:0,delta,snap);seepage.update(time,flowing?1:0,delta,snap);
    bubbles.visible=flowAmount>.01;bubbleMaterial.opacity=flowAmount*.9;ripple.visible=flowAmount>.01;poolMaterial.color.copy(dryColor).lerp(wetColor,flowAmount);
    bubbles.children.forEach((o,i)=>{const u=((time*.32+i/15)%1+1)%1;o.position.set(1.65+Math.sin(i*2.2)*.28,outletY-.12+u*1.25,1.13+Math.cos(i*1.7)*.20);o.scale.setScalar((.45+u*.9)*(1-u*.3));});
    rings.forEach((o,i)=>{const u=((time*.48+i/3)%1+1)%1;o.scale.setScalar(.4+u*2.5);o.material.opacity=flowAmount*(1-u)*.7;});
    drop.position.set(-1.9,waterY+.46+Math.sin(time*2)*.04,.81);drop.rotation.y=.18;
  }
  update(0,{},0,true);
  return {root,markers:[],interactables:[],dropTarget:drop,update,dispose:k.dispose};
}
