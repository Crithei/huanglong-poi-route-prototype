import * as THREE from 'three';
import {createProcessScene} from './water-processes.mjs';
import {frameDelta} from './water-timing.mjs';

window.HuanglongWaterScene={mount(host,options={}){
  let renderer,disposed=false,visible=false,frame=0,yaw=.12,zoom=1,time=0,last=null,paused=false,chapter='flow',progress={},unlocked=false,entrance=1,lost=false;
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  try{renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'low-power'});}catch{host.dataset.renderState='fallback';return null;}
  const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(34,1,.1,80),raycaster=new THREE.Raycaster();
  camera.position.set(10,11.5,15);camera.lookAt(0,1,0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.65));renderer.setClearColor(0x000000,0);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1;
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  const canvas=renderer.domElement;canvas.setAttribute('role','img');host.prepend(canvas);host.dataset.renderState='ready';
  let model=createProcessScene(chapter);scene.add(model.root);
  scene.add(new THREE.HemisphereLight(0xf4fff5,0xbca17b,1.8));
  const sun=new THREE.DirectionalLight(0xfff4d7,2.5);sun.position.set(-6,13,7);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-9,right:9,top:10,bottom:-9});sun.shadow.normalBias=.05;sun.shadow.bias=-.0003;scene.add(sun);
  const fill=new THREE.DirectionalLight(0x9bede2,1.1);fill.position.set(6,5,-6);scene.add(fill);
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(200,200),new THREE.ShadowMaterial({color:0x254f43,opacity:.15}));floor.rotation.x=-Math.PI/2;floor.position.y=-1.07;floor.receiveShadow=true;scene.add(floor);
  function resize(){if(disposed)return;const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();render(0);}
  function render(dt=0){
    if(disposed||lost||!host.clientWidth||!host.clientHeight)return;
    if(reduced.matches)entrance=1;else entrance=Math.min(1,entrance+dt*2.8);
    const ease=1-Math.pow(1-entrance,3);model.root.rotation.y=yaw;model.root.scale.setScalar(.94+ease*.06);model.root.position.y=-.16*(1-ease);
    camera.zoom=zoom;camera.updateProjectionMatrix();model.update(time,progress,dt,reduced.matches||paused);renderer.render(scene,camera);
    if(chapter==='dissolution'&&!progress.charged){const drop=model.dropTarget||model.drop;if(drop){const p=drop.getWorldPosition(new THREE.Vector3());p.project(camera);const target=host.querySelector('#co2DropTarget');if(target){target.style.left=Math.max(42,Math.min(host.clientWidth-42,(p.x+1)*host.clientWidth/2))+'px';target.style.top=Math.max(105,Math.min(host.clientHeight-88,(1-p.y)*host.clientHeight/2))+'px';}}}
  }
  function animate(now){frame=0;if(disposed||!visible||document.hidden||lost)return;const dt=frameDelta(now,last);last=now;if(!paused&&!reduced.matches){time+=dt;options.onTick?.(chapter,dt);}render(paused?0:dt);if(!paused&&!reduced.matches&&!frame)frame=requestAnimationFrame(animate);}
  function schedule(){if(disposed||!visible||document.hidden||frame||lost)return;last=null;frame=requestAnimationFrame(animate);}
  function visibility(){if(document.hidden){cancelAnimationFrame(frame);frame=0;last=null;}else schedule();}
  const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(!visible){cancelAnimationFrame(frame);frame=0;last=null;}else schedule();},{threshold:.08});observer.observe(host);
  const sizeObserver=new ResizeObserver(resize);sizeObserver.observe(host);document.addEventListener('visibilitychange',visibility);
  const motion=()=>{schedule();render(0);};reduced.addEventListener('change',motion);
  let pointer=null;
  function down(e){if(e.button!==0)return;pointer={id:e.pointerId,x:e.clientX,y:e.clientY,yaw};}
  function move(e){if(!pointer||pointer.id!==e.pointerId)return;const dx=e.clientX-pointer.x,dy=e.clientY-pointer.y;if(Math.abs(dy)>Math.abs(dx)&&Math.abs(dx)<12)return;yaw=pointer.yaw+dx*.009;render(0);}
  function up(e){
    if(pointer&&e&&Math.hypot(e.clientX-pointer.x,e.clientY-pointer.y)<8&&unlocked){const rect=canvas.getBoundingClientRect();raycaster.setFromCamera(new THREE.Vector2((e.clientX-rect.left)/rect.width*2-1,1-(e.clientY-rect.top)/rect.height*2),camera);const targets=model.interactables||[];const hit=raycaster.intersectObjects(targets.map(t=>t.object),true)[0];if(hit){let object=hit.object;while(object){const target=targets.find(t=>t.object===object);if(target){options.onInteract?.(target.action,target.value);break;}object=object.parent;}}}
    pointer=null;
  }
  const cancel=()=>{pointer=null;};
  canvas.addEventListener('pointerdown',down);canvas.addEventListener('pointermove',move);canvas.addEventListener('pointerup',up);canvas.addEventListener('pointercancel',cancel);canvas.addEventListener('pointerleave',cancel);
  const contextLost=e=>{e.preventDefault();lost=true;cancelAnimationFrame(frame);frame=0;host.dataset.renderState='fallback';};canvas.addEventListener('webglcontextlost',contextLost);
  function restored(){lost=false;host.dataset.renderState='ready';resize();schedule();}canvas.addEventListener('webglcontextrestored',restored);
  resize();
  return {
    setChapter(id,value,canPlay){if(chapter!==id){scene.remove(model.root);model.dispose();model=createProcessScene(id);chapter=id;scene.add(model.root);yaw=.12;zoom=1;entrance=0;}progress=value||{};unlocked=canPlay;canvas.setAttribute('aria-label',({flow:'持续流水的山坡水道，轻点水槽转向',dissolution:'石灰岩溶解剖面，将 CO₂ 拖给水滴',emergence:'山体及地下水剖面，拖动下方水位滑杆',deposition:'彩池逐个生长、蓄水、溢流'})[id]);render(0);schedule();},
    rotate(direction){yaw+=direction*.32;render(0);},zoom(direction){zoom=THREE.MathUtils.clamp(zoom+direction*.13,.8,1.45);render(0);},reset(){yaw=.12;zoom=1;render(0);},pause(value){paused=value;render(0);schedule();},
    dispose(){disposed=true;cancelAnimationFrame(frame);observer.disconnect();sizeObserver.disconnect();document.removeEventListener('visibilitychange',visibility);reduced.removeEventListener('change',motion);canvas.removeEventListener('pointerdown',down);canvas.removeEventListener('pointermove',move);canvas.removeEventListener('pointerup',up);canvas.removeEventListener('pointercancel',cancel);canvas.removeEventListener('pointerleave',cancel);canvas.removeEventListener('webglcontextlost',contextLost);canvas.removeEventListener('webglcontextrestored',restored);model.dispose();floor.geometry.dispose();floor.material.dispose();renderer.dispose();canvas.remove();}
  };
}};
