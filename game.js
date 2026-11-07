import * as THREE from './vendor/three.module.js';

const canvas = document.querySelector('#game');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.7));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.16;

const scene = new THREE.Scene();
scene.background = new THREE.Color('#a9d8e7');
scene.fog = new THREE.Fog('#d2e8c4', 17, 34);
const camera = new THREE.PerspectiveCamera(44, innerWidth / innerHeight, .1, 100);
camera.position.set(0, 15, 17.5);
camera.lookAt(0, 0, 2.5);
scene.add(new THREE.HemisphereLight('#fff8dd', '#638349', 2.15));
const sun = new THREE.DirectionalLight('#fff3ce', 3.2);
sun.position.set(-5, 12, 6); sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024); sun.shadow.camera.left = -13; sun.shadow.camera.right = 13; sun.shadow.camera.top = 13; sun.shadow.camera.bottom = -13;
sun.shadow.bias = -.001;
scene.add(sun);

const mat = (color, roughness = .9) => new THREE.MeshStandardMaterial({ color, roughness });
const grassMat = mat('#8ebf69'), pathMat = mat('#d4b578'), woodMat = mat('#ac754b'), darkWood = mat('#79513c');
const white = mat('#fff4dd'), red = mat('#ee7559'), yellow = mat('#f3b84e'), brown = mat('#866047');
function mesh(geometry, material, parent = scene, x = 0, y = 0, z = 0) {
  const o = new THREE.Mesh(geometry, material); o.position.set(x, y, z); o.castShadow = true; o.receiveShadow = true; parent.add(o); return o;
}
function box(parent, x, y, z, w, h, d, material, bevel = false) {
  const g = mesh(new THREE.BoxGeometry(w, h, d), material, parent, x, y, z);
  if (bevel) { g.geometry.dispose(); g.geometry = new THREE.BoxGeometry(w, h, d); }
  return g;
}
function cylinder(parent, x, y, z, r1, r2, h, material, seg = 12) { return mesh(new THREE.CylinderGeometry(r1, r2, h, seg), material, parent, x, y, z); }
function sphere(parent, x, y, z, sx, sy, sz, material) { const o = mesh(new THREE.SphereGeometry(1, 16, 12), material, parent, x, y, z); o.scale.set(sx, sy, sz); return o; }

// Soft-edged farm island and dusty walking paths
mesh(new THREE.CylinderGeometry(11, 11.5, .42, 64), grassMat, scene, 0, -.34, 0);
mesh(new THREE.CircleGeometry(10.98, 64), grassMat, scene, 0, -.115, 0).rotation.x = -Math.PI / 2;
const path = mesh(new THREE.PlaneGeometry(4.2, 15), pathMat, scene, 0, -.085, 1.3); path.rotation.x = -Math.PI / 2;
const crossPath = mesh(new THREE.PlaneGeometry(14, 2.7), pathMat, scene, 0, -.08, -1.5); crossPath.rotation.x = -Math.PI / 2;
// Fence around the play space
for (let i = -9; i <= 9; i += 1.5) {
  for (const z of [-8.7, 8.7]) { cylinder(scene, i, .18, z, .09, .11, .82, woodMat, 8); }
  for (const x of [-9.1, 9.1]) { cylinder(scene, x, .18, i, .09, .11, .82, woodMat, 8); }
}
for (const z of [-8.45, -8.05, 8.05, 8.45]) box(scene, 0, z > 0 ? .43 : .37, z, 18.3, .11, .12, white);
for (const x of [-8.85, -8.45, 8.45, 8.85]) box(scene, x, .4, 0, .12, .11, 17.5, white);
// Coop at the back
const coop = new THREE.Group(); scene.add(coop); coop.position.set(0, 0, -7.05);
box(coop, 0, 1.22, 0, 5.3, 2.4, 2.4, mat('#e9b86f'));
const roof = mesh(new THREE.ConeGeometry(4.05, 2.1, 4), mat('#d96f50'), coop, 0, 3.05, 0); roof.rotation.y = Math.PI / 4; roof.scale.z = .7;
box(coop, 0, .58, 1.23, 1.35, 1.25, .08, darkWood);
box(coop, 0, .4, 1.29, .75, .88, .04, mat('#342e2a'));
box(coop, -1.75, 1.64, 1.25, .9, .68, .06, white);
box(coop, -1.75, 1.64, 1.3, .1, .72, .07, red); box(coop, -1.75, 1.64, 1.3, .94, .1, .07, red);
box(coop, 1.7, .45, 1.27, .7, .08, .08, darkWood);
// Little garden details
const flowerColors = ['#ffdf78', '#f7a789', '#f4f0da'];
for (let i = 0; i < 38; i++) {
  const a = i * 2.399, r = 5.9 + (i % 5) * .55, x = Math.cos(a) * r, z = Math.sin(a) * r;
  if (z < -6 || Math.abs(x) > 8) continue;
  const stem = cylinder(scene, x, .08, z, .025, .025, .3, mat('#53894e'), 6); stem.rotation.z = .2;
  sphere(scene, x, .25, z, .105, .105, .105, mat(flowerColors[i % 3]));
}
// Bushes and round trees along the edge
for (const [x,z,s] of [[-7,-6,1],[7,-6,1.1],[-7,1,.85],[7,2,1.05],[-7,6,.8],[7,6,.9]]) {
  cylinder(scene,x,.65,z,.24,.3,1.3,woodMat,8); sphere(scene,x,.95,z,s,s*.8,s,mat('#6a9d58'));
  sphere(scene,x-.38,.79,z+.12,s*.57,s*.54,s*.58,mat('#77aa60')); sphere(scene,x+.36,.83,z-.1,s*.6,s*.58,s*.55,mat('#5f914e'));
}
// Straw nests and their egg stash
const nests = [];
function makeNest(x,z,count) {
  const group = new THREE.Group(); scene.add(group); group.position.set(x,0,z);
  const straw = mat('#c18a4d'), strawLight = mat('#d8aa65');
  const base = mesh(new THREE.CylinderGeometry(.8,.92,.16,18), straw, group,0,.08,0); base.scale.z=.82;
  const ring = mesh(new THREE.TorusGeometry(.61,.17,8,24), strawLight, group,0,.23,0); ring.rotation.x=Math.PI/2; ring.scale.z=.82;
  for(let i=0;i<8;i++){const twig=mesh(new THREE.CylinderGeometry(.035,.045,.95,6),i%2?straw:strawLight,group,0,.16,0);twig.rotation.y=i*Math.PI/4;twig.rotation.z=(i%2?.18:-.14);}
  const eggs=[];
  for(let i=0;i<count;i++){
    const e=makeEgg(group, (i-(count-1)/2)*.28, .42, (i%2?-.12:.12)); eggs.push(e);
  }
  nests.push({x,z,group,eggs});
}
function makeEgg(parent,x,y,z) {
  const g=new THREE.Group(); parent.add(g); g.position.set(x,y,z);
  const shape=new THREE.LatheGeometry([new THREE.Vector2(0,-.24),new THREE.Vector2(.13,-.2),new THREE.Vector2(.22,-.06),new THREE.Vector2(.235,.08),new THREE.Vector2(.18,.22),new THREE.Vector2(.08,.31),new THREE.Vector2(0,.33)],16);
  const e=mesh(shape,mat('#fff4dd'),g,0,.22,0); e.rotation.x=-.14; e.castShadow=true;
  return g;
}
makeNest(-4.4,-1.2,2); makeNest(4.25,-1.25,2); makeNest(0,-4.55,2);
// Safe basket and highlighted home base
const basket=new THREE.Group();scene.add(basket);basket.position.set(0,0,6.1);
const basketMat=mat('#d9904e');
mesh(new THREE.CylinderGeometry(.82,.72,.48,18,1,true),basketMat,basket,0,.28,0);
mesh(new THREE.CylinderGeometry(.72,.72,.1,18),mat('#f2d9a1'),basket,0,.08,0);
mesh(new THREE.TorusGeometry(.76,.11,8,24),mat('#f0bb70'),basket,0,.52,0).rotation.x=Math.PI/2;
for(let x=-.48;x<=.5;x+=.32) box(basket,x,.3,.04,.055,.44,.08,mat('#f5c27b'));
for(let z=-.43;z<=.45;z+=.3) box(basket,0,.3,z,.9,.42,.055,mat('#e9ad63'));
// home marker
const homeRing=mesh(new THREE.RingGeometry(1.05,1.35,40),mat('#f6dd8c'),scene,0,-.06,6.1);homeRing.rotation.x=-Math.PI/2;

// Hero: a cheeky little farmhand
const player=new THREE.Group();scene.add(player);
const skin=mat('#f3c58e'), shirt=mat('#5eaf73'), pants=mat('#547890'), capMat=mat('#e96e51');
sphere(player,0,.72,0,.32,.38,.28,shirt);
sphere(player,0,1.24,0,.25,.27,.25,skin);
sphere(player,-.095,1.28,.221,.035,.045,.025,mat('#3b3934'));sphere(player,.095,1.28,.221,.035,.045,.025,mat('#3b3934'));
sphere(player,0,1.13,.225,.07,.025,.025,mat('#c66b53'));
const hat=mesh(new THREE.CylinderGeometry(.23,.24,.11,12),capMat,player,0,1.48,0);mesh(new THREE.ConeGeometry(.19,.2,12),capMat,player,0,1.62,0);
for(const x of [-.14,.14]){const leg=mesh(new THREE.CylinderGeometry(.08,.09,.38,8),pants,player,x,.25,0);leg.rotation.z=x*.4;box(player,x,.06,.09,.2,.11,.29,darkWood);}
const pack=box(player,0,.85,-.27,.28,.32,.14,mat('#ca8a53'));
const carried=new THREE.Group();player.add(carried);carried.position.set(0,1.68,-.08);
const carriedShape=new THREE.LatheGeometry([new THREE.Vector2(0,-.24),new THREE.Vector2(.13,-.2),new THREE.Vector2(.22,-.06),new THREE.Vector2(.235,.08),new THREE.Vector2(.18,.22),new THREE.Vector2(.08,.31),new THREE.Vector2(0,.33)],16);
mesh(carriedShape,mat('#fff4dd'),carried,0,.2,0); carried.visible=false;
// Three vigilant hens
function makeHen(x,z,phase) {
  const root=new THREE.Group();scene.add(root);root.position.set(x,0,z);
  const body=new THREE.Group();root.add(body);
  sphere(body,0,.62,0,.54,.42,.45,white);
  sphere(body,0,.91,-.08,.32,.36,.32,white);
  sphere(body,-.14,.93,.205,.035,.045,.025,mat('#2d3027'));sphere(body,.14,.93,.205,.035,.045,.025,mat('#2d3027'));
  const beak=mesh(new THREE.ConeGeometry(.14,.28,5),yellow,body,0,.82,.39);beak.rotation.x=Math.PI/2;
  const comb=mesh(new THREE.ConeGeometry(.12,.28,5),red,body,0,1.26,-.04);comb.rotation.z=Math.PI;
  sphere(body,-.52,.68,0,.17,.12,.19,mat('#f7e5cd'));
  for(const zleg of [-.18,.18]){cylinder(body,-.18,.16,zleg,.045,.055,.3,yellow,7);cylinder(body,.2,.16,zleg,.045,.055,.3,yellow,7);}
  const shadow=mesh(new THREE.CircleGeometry(.65,20),mat('#4b653c'),scene,x,.005,z);shadow.rotation.x=-Math.PI/2;shadow.material.transparent=true;shadow.material.opacity=.13;shadow.castShadow=false;
  return {root,body,x,z,phase,alert:0,shadow};
}
const hens=[makeHen(-5.3,1.2,0),makeHen(5.2,1.4,2.1),makeHen(1.5,-3.15,4.2)];
// Decorative clouds and floating dust motes
for(let i=0;i<7;i++){
 const x=(i-3)*3.2,z=-8.8-(i%2)*2.5;
 const cloud=new THREE.Group();scene.add(cloud);cloud.position.set(x,5.5+(i%3)*.65,z);
 const cm=mat('#ffffff');for(let j=0;j<4;j++)sphere(cloud,(j-1.5)*.52,j%2*.16,0,.67,.32,.33,cm);
}

const scoreEl=document.querySelector('#score'), timerEl=document.querySelector('#timer'), missionEl=document.querySelector('#mission');
const startScreen=document.querySelector('#startScreen'), endScreen=document.querySelector('#endScreen'), hint=document.querySelector('#hint'), toast=document.querySelector('#toast');
const actionButton=document.querySelector('#actionButton'), actionIcon=document.querySelector('#actionIcon'), actionLabel=document.querySelector('#actionLabel');
let running=false, timeLeft=75, delivered=0, carriedEgg=null, caughtCooldown=0, toastTimer=0, last=performance.now();
const keys=new Set(), move={x:0,z:0};
const playerPos=player.position;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function showToast(text){toast.textContent=text;toast.classList.add('show');toastTimer=1.65;}
function setHUD(){scoreEl.innerHTML=`${delivered} <i>/ 5</i>`;timerEl.textContent=`${Math.floor(timeLeft/60)}:${String(Math.ceil(timeLeft%60)).padStart(2,'0')}`;}
function startGame(){
 delivered=0;timeLeft=75;carriedEgg=null;carried.visible=false;player.position.set(0,0,6.05);player.rotation.y=0;running=true;
 startScreen.classList.add('hidden');endScreen.classList.add('hidden');missionEl.textContent='¡Consigue 5 huevos y vuelve a la cesta!';setHUD();showToast('¡A robar!');
}
function finish(win){running=false;endScreen.classList.remove('hidden');document.querySelector('#endStamp').textContent=win?'🏆':'🐔';document.querySelector('#endEyebrow').textContent=win?'MISIÓN CUMPLIDA':'¡TE PILLARON!';document.querySelector('#endTitle').innerHTML=win?'¡QUÉ<br><em>CRACK!</em>':'¡OTRA<br><em>VEZ!</em>';document.querySelector('#endCopy').textContent=win?'Desayuno asegurado. La cesta está llena.':timeLeft<=0?'Se acabó el tiempo. ¡Las gallinas ganan esta vez!':'Las gallinas recuperaron el gallinero. ¡Inténtalo de nuevo!';document.querySelector('#finalScore').textContent=delivered;}
function interact(){
 if(!running)return;
 if(carriedEgg){if(Math.hypot(playerPos.x,playerPos.z-6.1)<1.55){delivered++;carriedEgg=null;carried.visible=false;setHUD();showToast(delivered>=5?'¡Cesta llena! ¡Lo lograste!':'¡Huevo a salvo! +1');if(delivered>=5){finish(true);} }else showToast('¡Vuelve a la cesta! 🧺');return;}
 let best=null,dist=Infinity;
 for(const n of nests)for(const e of n.eggs){if(e.visible){const d=Math.hypot(playerPos.x-(n.x+e.position.x),playerPos.z-(n.z+e.position.z));if(d<dist){dist=d;best=e;}}}
 if(best&&dist<1.65){best.visible=false;carriedEgg=best;carried.visible=true;showToast('¡Huevo robado! ¡A la cesta!');}
 else showToast('Acércate a un nido para robar');
}
actionButton.addEventListener('pointerdown',e=>{e.preventDefault();interact();});
document.querySelector('#startButton').addEventListener('click',startGame);
document.querySelector('#restartButton').addEventListener('click',startGame);
window.addEventListener('keydown',e=>{const k=e.key.toLowerCase();if(['arrowup','arrowdown','arrowleft','arrowright',' '].includes(k))e.preventDefault();keys.add(k);if((k==='e'||k===' '||k==='enter')&&!e.repeat)interact();if(k==='enter'&&!running)startGame();});
window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
const joystick=document.querySelector('#joystick'),knob=document.querySelector('#joyKnob');let joyPointer=null;
function joyMove(e){const r=joystick.getBoundingClientRect(),cx=r.left+58,cy=r.top+60,dx=e.clientX-cx,dy=e.clientY-cy,len=Math.hypot(dx,dy),max=33,mul=len>max?max/len:1;const x=dx*mul,y=dy*mul;knob.style.transform=`translate(${x}px,${y}px)`;move.x=x/max;move.z=y/max;}
joystick.addEventListener('pointerdown',e=>{e.preventDefault();joyPointer=e.pointerId;joystick.setPointerCapture(joyPointer);joyMove(e);});
joystick.addEventListener('pointermove',e=>{if(e.pointerId===joyPointer)joyMove(e);});
function joyEnd(e){if(e.pointerId===joyPointer){joyPointer=null;move.x=0;move.z=0;knob.style.transform='translate(0,0)';}}
joystick.addEventListener('pointerup',joyEnd);joystick.addEventListener('pointercancel',joyEnd);
function distance(a,b){return Math.hypot(a.x-b.x,a.z-b.z);}
function update(dt,t){
 if(toastTimer>0){toastTimer-=dt;if(toastTimer<=0)toast.classList.remove('show');}
 if(!running)return;
 timeLeft=Math.max(0,timeLeft-dt);setHUD();if(timeLeft<=0){finish(false);return;}
 let mx=move.x+(keys.has('a')||keys.has('arrowleft')?-1:0)+(keys.has('d')||keys.has('arrowright')?1:0);
 let mz=move.z+(keys.has('w')||keys.has('arrowup')?-1:0)+(keys.has('s')||keys.has('arrowdown')?1:0);
 const length=Math.hypot(mx,mz);if(length>1){mx/=length;mz/=length;}
 const speed=4.25;
 playerPos.x=clamp(playerPos.x+mx*speed*dt,-8.05,8.05);playerPos.z=clamp(playerPos.z+mz*speed*dt,-7.8,7.8);
 if(length>.08){player.rotation.y=Math.atan2(mx,mz);player.position.y=Math.sin(t*12)*.045;}
 else player.position.y=0;
 carried.position.y=1.65+Math.sin(t*5)*.045;
 // Hens patrol in short looping routes and react when the player gets close
 let danger=false;
 hens.forEach((h,i)=>{
   const angle=t*.58+h.phase;
   h.root.position.x=h.x+Math.sin(angle)*1.45;
   h.root.position.z=h.z+Math.cos(angle*.83)*.8;
   h.root.rotation.y=Math.sin(angle+1)*.52;
   h.body.position.y=Math.abs(Math.sin(t*6+i))*0.045;
   const d=distance(playerPos,h.root.position);h.alert=d<3.05?1-d/3.05:0;
   if(d<.88&&caughtCooldown<=0){
     caughtCooldown=1.5;
     if(carriedEgg){carriedEgg.visible=true;carriedEgg=null;carried.visible=false;showToast('¡Te atraparon! ¡Perdiste el huevo!');}
     else showToast('¡Casi te pillan! Corre 🏃');
     playerPos.x=0;playerPos.z=6.05;
   }
   if(h.alert>.22)danger=true;
 });
 caughtCooldown=Math.max(0,caughtCooldown-dt);
 hint.style.opacity=danger?'1':'.76';hint.innerHTML=danger?'<span>🚨</span> ¡CUIDADO, TE HAN VISTO!':'<span>👀</span> ¡Que no te vean!';
 if(carriedEgg){actionIcon.textContent='🧺';actionLabel.textContent='DEJAR';}else{actionIcon.textContent='✋';actionLabel.textContent='ROBAR';}
 missionEl.textContent=carriedEgg?'¡Lleva el huevo a la cesta!':`¡Consigue ${5-delivered} ${5-delivered===1?'huevo':'huevos'} y vuelve a la cesta!`;
 // smooth camera follow while keeping all controls anchored
 camera.position.x+=(playerPos.x*.19-camera.position.x)*Math.min(1,dt*1.6);
 camera.position.z+=(17.5+(playerPos.z-6)*.18-camera.position.z)*Math.min(1,dt*1.15);
 camera.lookAt(playerPos.x*.12,0,2.5+playerPos.z*.08);
}
function animate(now){requestAnimationFrame(animate);const dt=Math.min(.04,(now-last)/1000);last=now;update(dt,now/1000);renderer.render(scene,camera);}
requestAnimationFrame(animate);
window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.7));});
