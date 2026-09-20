import * as THREE from 'three';
import {createLandscape} from './water-landscape.mjs';
import {frameDelta} from './water-timing.mjs';

window.HuanglongWaterScene={mount(host){
  let renderer,disposed=false,visible=false,frame=0,stage=0,grow=0,goal=0,yaw=.12,zoom=1,time=0,last=0,paused=false;
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  try{renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'low-power'});}catch{host.dataset.renderState='fallback';return null;}
  const scene=new THREE.Scene();const camera=new THREE.PerspectiveCamera(34,1,.1,80);
  camera.position.set(10,11.5,15);camera.lookAt(0,1,0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.65));renderer.setClearColor(0x000000,0);
  renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.0;
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  const canvas=renderer.domElement;canvas.setAttribute('aria-label','黄龙彩池低多边形模型；左右拖动旋转，可用旁边按钮调整视角');canvas.setAttribute('role','img');host.prepend(canvas);host.dataset.renderState='ready';
  const model=createLandscape();scene.add(model.root);
  scene.add(new THREE.HemisphereLight(0xf4fff5,0xbca17b,1.8));
  const sun=new THREE.DirectionalLight(0xfff4d7,2.5);sun.position.set(-6,13,7);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-9;sun.shadow.camera.right=9;sun.shadow.camera.top=10;sun.shadow.camera.bottom=-9;sun.shadow.normalBias=.05;sun.shadow.bias=-.0003;scene.add(sun);
  const fill=new THREE.DirectionalLight(0x9bede2,1.1);fill.position.set(6,5,-6);scene.add(fill);
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(200,200),new THREE.ShadowMaterial({color:0x254f43,opacity:.15}));floor.rotation.x=-Math.PI/2;floor.position.y=-1.07;floor.receiveShadow=true;scene.add(floor);
  function resize(){if(disposed)return;const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();drawOnce();}
  function render(){model.root.rotation.y=yaw;camera.zoom=zoom;camera.updateProjectionMatrix();model.update(time,stage,grow);renderer.render(scene,camera);}
  function drawOnce(){if(!disposed)render();}
  function animate(now){frame=0;if(disposed||!visible||document.hidden)return;const dt=frameDelta(now,last);last=now;if(!paused&&!reduced.matches)time+=dt;grow+= (goal-grow)*Math.min(1,dt*2.2);if(reduced.matches)grow=goal;render();if((!paused&&!reduced.matches)||Math.abs(goal-grow)>.002)frame=requestAnimationFrame(animate);}
  function schedule(){if(disposed||!visible||document.hidden||frame)return;last=null;frame=requestAnimationFrame(animate);}
  function visibility(){if(document.hidden){cancelAnimationFrame(frame);frame=0;}else schedule();}
  const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(!visible){cancelAnimationFrame(frame);frame=0;}else schedule();},{threshold:.03});observer.observe(host);
  const sizeObserver=new ResizeObserver(resize);sizeObserver.observe(host);
  document.addEventListener('visibilitychange',visibility);
  const motion=()=>{schedule();drawOnce();};reduced.addEventListener('change',motion);
  let pointer=null;
  function down(e){if(e.button!==0)return;pointer={id:e.pointerId,x:e.clientX,y:e.clientY,yaw};}
  function move(e){if(!pointer||pointer.id!==e.pointerId)return;const dx=e.clientX-pointer.x,dy=e.clientY-pointer.y;if(Math.abs(dy)>Math.abs(dx)&&Math.abs(dx)<12)return;yaw=pointer.yaw+dx*.009;drawOnce();}
  function up(){pointer=null;}
  canvas.addEventListener('pointerdown',down);canvas.addEventListener('pointermove',move);canvas.addEventListener('pointerup',up);canvas.addEventListener('pointercancel',up);canvas.addEventListener('pointerleave',up);
  const contextLost=e=>{e.preventDefault();cancelAnimationFrame(frame);frame=0;host.dataset.renderState='fallback';};canvas.addEventListener('webglcontextlost',contextLost);
  function restored(){host.dataset.renderState='ready';resize();schedule();}canvas.addEventListener('webglcontextrestored',restored);
  resize();
  return {
    setStage(value){stage=Math.max(0,Math.min(3,value));goal=[0,0,.3,1][stage];if(reduced.matches)grow=goal;drawOnce();schedule();},
    setGrowth(value){goal=.15+.85*THREE.MathUtils.clamp(value,0,1);if(reduced.matches)grow=goal;drawOnce();schedule();},
    rotate(direction){yaw+=direction*.32;drawOnce();},
    zoom(direction){zoom=THREE.MathUtils.clamp(zoom+direction*.13,.8,1.45);drawOnce();},
    reset(){yaw=.12;zoom=1;drawOnce();},
    pause(value){paused=value;drawOnce();schedule();},
    dispose(){disposed=true;cancelAnimationFrame(frame);observer.disconnect();sizeObserver.disconnect();document.removeEventListener('visibilitychange',visibility);reduced.removeEventListener('change',motion);canvas.removeEventListener('pointerdown',down);canvas.removeEventListener('pointermove',move);canvas.removeEventListener('pointerup',up);canvas.removeEventListener('pointercancel',up);canvas.removeEventListener('pointerleave',up);canvas.removeEventListener('webglcontextlost',contextLost);canvas.removeEventListener('webglcontextrestored',restored);model.dispose();floor.geometry.dispose();floor.material.dispose();renderer.dispose();canvas.remove();}
  };
}};
