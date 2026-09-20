import * as THREE from 'three';
import {createProcessScene} from './water-processes.mjs';
import {frameDelta} from './water-timing.mjs';

window.HuanglongWaterScene={mount(host,options={}){
  let renderer,disposed=false,visible=false,frame=0,yaw=.12,zoom=1,time=0,last=null,paused=false,chapter='flow',progress={},unlocked=false,entrance=1,lost=false,dragging=null,settling=null;
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
  const projected=new THREE.Vector3(),dragPoint=new THREE.Vector3(),destination=new THREE.Vector3();
  function projectAnchor(object,selector){
    const element=host.querySelector(selector);if(!object||!element)return;
    object.getWorldPosition(projected);projected.project(camera);
    element.style.left=((projected.x+1)*host.clientWidth/2)+'px';element.style.top=((1-projected.y)*host.clientHeight/2)+'px';
    element.style.visibility=projected.z>1||Math.abs(projected.x)>1.16||Math.abs(projected.y)>1.16?'hidden':'';
  }
  function pointOnPlane(x,y,plane){
    const rect=canvas.getBoundingClientRect();if(!rect.width||!rect.height)return null;
    raycaster.setFromCamera(new THREE.Vector2((x-rect.left)/rect.width*2-1,1-(y-rect.top)/rect.height*2),camera);
    return raycaster.ray.intersectPlane(plane,dragPoint);
  }
  function beginDrag(x,y){
    const available=chapter==='dissolution'?!progress.charged:chapter==='deposition'&&!progress.running&&!progress.won&&progress.sequence%3===0;
    if(disposed||lost||!unlocked||!model.dragSource||!available)return false;
    model.root.updateMatrixWorld(true);camera.updateMatrixWorld(true);
    const source=model.dragSource,world=source.getWorldPosition(new THREE.Vector3()),normal=camera.getWorldDirection(new THREE.Vector3());
    const plane=new THREE.Plane().setFromNormalAndCoplanarPoint(normal,world),hit=pointOnPlane(x,y,plane);if(!hit)return false;
    dragging={object:source,plane,offset:world.clone().sub(hit),local:source.position.clone()};settling=null;return true;
  }
  function moveDrag(x,y){
    if(!dragging||lost)return;const hit=pointOnPlane(x,y,dragging.plane);if(!hit)return;
    dragging.object.parent.updateMatrixWorld(true);dragging.local.copy(hit).add(dragging.offset);dragging.object.parent.worldToLocal(dragging.local);render(0);
  }
  function endDrag(accepted=false){
    if(!dragging)return;settling={object:dragging.object,from:dragging.local.clone(),age:0,accepted};dragging=null;render(0);schedule();
  }
  function applyDrag(dt){
    const source=model.dragSource;if(!source)return;
    if(dragging?.object===source){source.position.copy(dragging.local);return;}
    if(settling?.object!==source)return;
    const active=settling;
    if(active.accepted){
      const target=model.dropLanding||model.dropTarget;
      if(target){target.getWorldPosition(destination);source.parent.worldToLocal(destination);}else destination.copy(source.position);
      active.age+=reduced.matches||paused?1:dt;
      source.position.lerpVectors(active.from,destination,Math.min(1,active.age/.22));
      // Hand the same mesh back only when its model reaches the accepted location.
      if(chapter==='dissolution'&&!source.visible)settling=null;
      else if(chapter==='deposition'&&progress.running&&progress.travel>=1){active.accepted=false;active.age=0;active.from.copy(source.position);}
    }else{
      active.age+=reduced.matches||paused?1:dt;const amount=Math.min(1,active.age/.28),ease=1-Math.pow(1-amount,3);
      source.position.lerpVectors(active.from,source.position.clone(),ease);if(amount===1)settling=null;
    }
  }
  function resize(){if(disposed)return;const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();render(0);}
  function render(dt=0){
    if(disposed||lost||!host.clientWidth||!host.clientHeight)return;
    if(reduced.matches)entrance=1;else entrance=Math.min(1,entrance+dt*2.8);
    const ease=1-Math.pow(1-entrance,3);model.root.rotation.y=yaw;model.root.scale.setScalar(.94+ease*.06);model.root.position.y=-.16*(1-ease);
    camera.zoom=zoom;camera.updateProjectionMatrix();model.update(time,progress,dt,reduced.matches||paused);model.root.updateMatrixWorld(true);applyDrag(dt);
    if(chapter==='deposition'&&model.dropTarget)model.dropTarget.visible=model.dropTarget.visible&&unlocked;
    renderer.render(scene,camera);
    if(chapter==='dissolution'&&!progress.charged){projectAnchor(model.dragSource,'#co2Token');projectAnchor(model.dropTarget||model.drop,'#co2DropTarget');}
    if(chapter==='deposition'){projectAnchor(model.dragSource,'#waterDropHandle');projectAnchor(model.dropTarget,'#waterDropNextTarget');}
  }
  function animate(now){frame=0;if(disposed||!visible||document.hidden||lost)return;const dt=frameDelta(now,last);last=now;if(!paused&&!reduced.matches){time+=dt;options.onTick?.(chapter,dt);}render(paused?0:dt);if(!paused&&!reduced.matches&&!frame)frame=requestAnimationFrame(animate);}
  function schedule(){if(disposed||!visible||document.hidden||frame||lost)return;last=null;frame=requestAnimationFrame(animate);}
  function visibility(){if(document.hidden){endDrag();cancelAnimationFrame(frame);frame=0;last=null;}else schedule();}
  const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(!visible){endDrag();options.onDragCancel?.();cancelAnimationFrame(frame);frame=0;last=null;}else schedule();},{threshold:.08});observer.observe(host);
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
  const contextLost=e=>{e.preventDefault();dragging=null;settling=null;lost=true;cancelAnimationFrame(frame);frame=0;host.dataset.renderState='fallback';};canvas.addEventListener('webglcontextlost',contextLost);
  function restored(){lost=false;host.dataset.renderState='ready';resize();schedule();}canvas.addEventListener('webglcontextrestored',restored);
  resize();
  return {
    setChapter(id,value,canPlay){if(chapter!==id){dragging=null;settling=null;scene.remove(model.root);model.dispose();model=createProcessScene(id);chapter=id;scene.add(model.root);yaw=.12;zoom=1;entrance=0;}progress=value||{};unlocked=canPlay;canvas.setAttribute('aria-label',({flow:'持续流水的山坡水道，轻点水槽转向',dissolution:'拖动 CO₂ 气团，把它交给水滴',emergence:'山体及地下水剖面，拖动下方水位滑杆',deposition:'拖动水滴到下一处，让彩池逐个生长、蓄水、溢流'})[id]);render(0);schedule();},
    beginDrag,moveDrag,endDrag,
    rotate(direction){yaw+=direction*.32;render(0);},zoom(direction){zoom=THREE.MathUtils.clamp(zoom+direction*.13,.8,1.45);render(0);},reset(){yaw=.12;zoom=1;render(0);},pause(value){endDrag();paused=value;render(0);schedule();},
    dispose(){dragging=null;settling=null;disposed=true;cancelAnimationFrame(frame);observer.disconnect();sizeObserver.disconnect();document.removeEventListener('visibilitychange',visibility);reduced.removeEventListener('change',motion);canvas.removeEventListener('pointerdown',down);canvas.removeEventListener('pointermove',move);canvas.removeEventListener('pointerup',up);canvas.removeEventListener('pointercancel',cancel);canvas.removeEventListener('pointerleave',cancel);canvas.removeEventListener('webglcontextlost',contextLost);canvas.removeEventListener('webglcontextrestored',restored);model.dispose();floor.geometry.dispose();floor.material.dispose();renderer.dispose();canvas.remove();}
  };
}};
