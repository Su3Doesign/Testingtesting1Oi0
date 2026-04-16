/* sumanth.D - scene engine v6 */

(function(){

var $ = function(id){ return document.getElementById(id); };

/* STATE */
var S = {
  scrollY:0, smooth:0, progress:0,
  vw:innerWidth, vh:innerHeight,
  dpr:Math.min(devicePixelRatio||1, 1.5),
  mx:innerWidth/2, my:innerHeight/2, nx:0, ny:0,
  t:0, lt:0, dt:0,
  fps:60, fpsT:0, fpsC:0, lowFpsCount:0, perfMode:'high',
  modelReady:false, assetsReady:false,
  dialogueIdx:-1, mugenVisible:false,
  inkMode:false,
  lightning:[], lightningT:0, flashIntensity:0,
  inkClouds:[], inkPetals:[],
  bokeh:[], stars:[], petals:[], dandelions:[],
  booted:false
};

/* DIALOGUE - paced for breathing zones */
var DIALOGUE = [
  { at:0.09, who:'SENSEI MUGEN', text:'<em>Hmm.</em> So you finally crossed the line. Sit, traveler - the road is long, and the blade is older than your grandfather.' },
  { at:0.18, who:'SENSEI MUGEN', text:'I am <strong>Mugen</strong>, keeper of unfinished worlds. This katana has cut the dreams of seventeen apprentices. Each returned home a craftsman.' },
  { at:0.28, who:'SENSEI MUGEN', text:'But none - <em>none</em> - became a builder of worlds. Few inherit the will. Fewer still answer it.' },
  { at:0.36, who:'SENSEI MUGEN', text:'Tell me, then. <strong>What world do you intend to build?</strong>' },
  { at:0.42, who:'sumanth.D', text:'<em>The one I cannot find on any map.</em>' },
  { at:0.50, who:'SENSEI MUGEN', text:'Good. Then the blade goes with you. Through cloud. Through thunder. Through the breaking of this old world.' },
  { at:0.60, who:'SENSEI MUGEN', text:'They will tell you the sky has an edge. They are wrong. <em>You were made to find out.</em>' },
  { at:0.78, who:'SENSEI MUGEN', text:'These are your works. Not trophies - <em>evidence</em>. Proof the hand moves when the will points.' },
  { at:0.92, who:'SENSEI MUGEN', text:'Now look up. The dawn does not arrive. It is <em>answered</em>.' },
  { at:0.97, who:'SENSEI MUGEN', text:'Go on, builder. The world is waiting for yours.' }
];

/* WORKS */
var WORKS = [
  { no:'01', year:'2025', title:'Fudo Myoo',     role:'Environment - Hard-Surface' },
  { no:'02', year:'2025', title:'Midea - Canada', role:'Graphic Design' },
  { no:'03', year:'2024', title:'Kohaku',         role:'3D - Concept' },
  { no:'04', year:'2024', title:'KD Displays',    role:'Retail Environments' },
  { no:'05', year:'2024', title:'Onibi',          role:'Hard-Surface' },
  { no:'06', year:'2023', title:'Investohome',    role:'Brand - Identity' },
  { no:'07', year:'2023', title:'The Iron Garden', role:'Environment - Coursework' }
];

/* INK VAULT - all 7 works as scroll cards, with kanji numbers */
var KANJI_NUMS = ['','&#19968;','&#20108;','&#19977;','&#22235;','&#20116;','&#20845;','&#19971;'];
var STAMPS = ['','&#22633;','&#36899;','&#36796;','&#21295;','&#20303;','&#28988;','&#37428;'];
var INK_VAULT = [
  { tag:'CROWN JEWEL',  title:'Fudo Myoo',     meta:'2025 - Personal',     desc:'A sanctum of still fire. Personal exploration of Shingon iconography rendered as inhabitable space.' },
  { tag:'INDUSTRY',     title:'Midea Canada',  meta:'2025 - Toronto',      desc:'Five sub-brands across five months. Campaigns, visual systems, retail. Industry trial by fire.' },
  { tag:'LIVING ROOM',  title:'Kohaku',        meta:'2024 - Concept',      desc:'Silent koi study. Subsurface scattering and lanternlight as a meditation on stillness.' },
  { tag:'PLACEMENT',    title:'KD Displays',   meta:'2024 - Home Depot Canada', desc:'Environmental retail graphics. Functional design at industrial scale.' },
  { tag:'EMBER',        title:'Onibi',         meta:'2024 - Personal',     desc:'Wandering-flame lanterns. Small study in soft emissives, hand-tuned by candle.' },
  { tag:'IDENTITY',     title:'Investohome',   meta:'2023 - Toronto',      desc:'Full identity system for a real-estate venture. First professional brand build.' },
  { tag:'FIRST LIGHT',  title:'The Iron Garden', meta:'2023 - Coursework', desc:'Rust and cherry branches. A study in rain memory and decay as composition.' }
];

/* UTIL */
function smoothstep(a, b, x){
  var t = Math.max(0, Math.min(1, (x-a)/(b-a)));
  return t*t*(3 - 2*t);
}
function lerp(a, b, t){ return a + (b-a)*t; }
function toggle(el, cls, on){
  if(!el) return;
  if(on) el.classList.add(cls); else el.classList.remove(cls);
}

/* New beat structure with breathing zones */
function currentBeat(p){
  if(p < 0.07) return 1;
  if(p < 0.12) return 1.5;
  if(p < 0.22) return 2;
  if(p < 0.28) return 2.5;
  if(p < 0.40) return 3;
  if(p < 0.46) return 3.5;
  if(p < 0.56) return 4;
  if(p < 0.62) return 4.5;
  if(p < 0.68) return 5;
  if(p < 0.72) return 5.5;
  if(p < 0.78) return 7;
  if(p < 0.82) return 7.5;
  if(p < 0.88) return 7.7;
  if(p < 0.94) return 8;
  return 9;
}

/* SCROLL */
var scrollMax = 1;
function updateScrollMax(){ scrollMax = Math.max(1, document.documentElement.scrollHeight - innerHeight); }
addEventListener('scroll', function(){ S.scrollY = scrollY; }, {passive:true});
addEventListener('resize', function(){
  S.vw = innerWidth; S.vh = innerHeight;
  updateScrollMax();
  if(R){ R.setSize(S.vw, S.vh); CAM.aspect = S.vw/S.vh; CAM.updateProjectionMatrix(); }
  resizeCanvases();
});

/* CANVASES */
var stars = $('stars'), atmos = $('atmos'), inkAtmos = $('ink-atmos');
var sx = stars.getContext('2d');
var ax = atmos.getContext('2d');
var ix = inkAtmos.getContext('2d');

function resizeCanvases(){
  [[stars, sx], [atmos, ax], [inkAtmos, ix]].forEach(function(pair){
    pair[0].width = innerWidth * S.dpr;
    pair[0].height = innerHeight * S.dpr;
    pair[1].setTransform(S.dpr, 0, 0, S.dpr, 0, 0);
  });
}
resizeCanvases();

/* THREE.JS */
var R, SC, CAM, KAT, envMap;
var hemiL, keyL, fillL, rimL, edgeAccent, moonL, sunL, flashL;

function initThree(){
  R = new THREE.WebGLRenderer({ canvas:$('three'), antialias:true, alpha:true, powerPreference:'high-performance' });
  R.setPixelRatio(S.dpr);
  R.setSize(S.vw, S.vh);
  R.toneMapping = THREE.ACESFilmicToneMapping;
  R.toneMappingExposure = 0.95;
  R.outputEncoding = THREE.sRGBEncoding;
  R.setClearColor(0x000000, 0);

  SC = new THREE.Scene();
  CAM = new THREE.PerspectiveCamera(36, S.vw/S.vh, 0.01, 200);
  CAM.position.set(0, 0, 5);

  try {
    if(typeof THREE.RoomEnvironment === 'function' && typeof THREE.PMREMGenerator === 'function'){
      var pmrem = new THREE.PMREMGenerator(R);
      pmrem.compileEquirectangularShader();
      envMap = pmrem.fromScene(new THREE.RoomEnvironment(), 0.04).texture;
      SC.environment = envMap;
      pmrem.dispose();
    }
  } catch(e){ console.warn('PMREM init failed:', e); }

  hemiL = new THREE.HemisphereLight(0xffe0b8, 0x1a1512, 0.7);
  SC.add(hemiL);
  keyL = new THREE.DirectionalLight(0xffe0b8, 1.2);
  keyL.position.set(-3, 5, 4); SC.add(keyL);
  fillL = new THREE.DirectionalLight(0x402020, 0.45);
  fillL.position.set(4, -1, 2); SC.add(fillL);
  rimL = new THREE.DirectionalLight(0xff6030, 0.55);
  rimL.position.set(0, -3, -4); SC.add(rimL);
  edgeAccent = new THREE.PointLight(0xc83c28, 0, 6);
  edgeAccent.position.set(0, 0, 0.4); SC.add(edgeAccent);
  moonL = new THREE.DirectionalLight(0xb8cde8, 0);
  moonL.position.set(3, 4, 2); SC.add(moonL);
  sunL = new THREE.DirectionalLight(0xffa040, 0);
  sunL.position.set(-2, 2, 3); SC.add(sunL);
  flashL = new THREE.PointLight(0xddeeff, 0, 18);
  flashL.position.set(0, 4, 2); SC.add(flashL);

  KAT = new THREE.Group();
  SC.add(KAT);
}
initThree();

/* KATANA LOAD */
function getGLTFLoader(){
  if(typeof THREE.GLTFLoader === 'function') return new THREE.GLTFLoader();
  if(typeof window.GLTFLoader === 'function') return new window.GLTFLoader();
  return null;
}

function createStandinKatana(){
  var blade = new THREE.Mesh(new THREE.BoxGeometry(2.6, .085, .020), new THREE.MeshStandardMaterial({color:0x080910, metalness:.96, roughness:.06}));
  var handle = new THREE.Mesh(new THREE.CylinderGeometry(.055, .055, .82, 18), new THREE.MeshStandardMaterial({color:0x1a0510, metalness:.4, roughness:.55}));
  handle.rotation.z = Math.PI/2; handle.position.x = -1.7;
  var tsuba = new THREE.Mesh(new THREE.CylinderGeometry(.16, .16, .035, 28), new THREE.MeshStandardMaterial({color:0x4a2e1a, metalness:.7, roughness:.3}));
  tsuba.rotation.z = Math.PI/2; tsuba.position.x = -1.25;
  var g = new THREE.Group(); g.add(blade, handle, tsuba);
  return { group:g, meshes:[blade, handle, tsuba] };
}

function finalizeKatana(model, meshes){
  KAT.add(model);
  KAT.userData.model = model;
  KAT.userData.meshes = meshes;
  S.modelReady = true;
  console.log('katana ready');
  checkBoot();
}

function enhanceMat(m){
  var mat = m.clone();
  if(!mat.emissive) mat.emissive = new THREE.Color(0,0,0);
  var col = mat.color || new THREE.Color(1,1,1);
  var b = (col.r+col.g+col.b)/3;
  if(b < 0.18){ mat.metalness = 0.95; mat.roughness = 0.08; }
  else if(b < 0.5){ mat.metalness = 0.72; mat.roughness = 0.22; }
  mat.envMapIntensity = 1.6;
  return mat;
}

var gltfLoader = getGLTFLoader();
var gltfTimeout = setTimeout(function(){
  console.warn('GLTF load timeout');
  var sk = createStandinKatana();
  finalizeKatana(sk.group, sk.meshes);
}, 15000);

if(gltfLoader){
  gltfLoader.load('models/katana.glb',
    function(gltf){
      clearTimeout(gltfTimeout);
      var m = gltf.scene;
      var box = new THREE.Box3().setFromObject(m);
      var sz = box.getSize(new THREE.Vector3());
      var scale = 5.4 / Math.max(sz.x, sz.y, sz.z, 0.001);
      m.scale.setScalar(scale);
      var ctr = box.getCenter(new THREE.Vector3());
      m.position.set(-ctr.x*scale, -ctr.y*scale, -ctr.z*scale);
      var meshes = [];
      m.traverse(function(o){
        if(!o.isMesh) return;
        var ms = Array.isArray(o.material) ? o.material : [o.material];
        o.material = Array.isArray(o.material) ? ms.map(enhanceMat) : enhanceMat(ms[0]);
        meshes.push(o);
      });
      finalizeKatana(m, meshes);
    },
    function(xhr){
      if(xhr.total > 0){
        var pct = 50 + (xhr.loaded/xhr.total)*40;
        updateLoaderBar(pct);
      }
    },
    function(err){
      clearTimeout(gltfTimeout);
      console.warn('GLB missing', err);
      var sk = createStandinKatana();
      finalizeKatana(sk.group, sk.meshes);
    }
  );
} else {
  clearTimeout(gltfTimeout);
  var sk = createStandinKatana();
  finalizeKatana(sk.group, sk.meshes);
}

/* PARTICLES */
function initParticles(){
  for(var i=0; i<55; i++) S.petals.push(spawnPetal(true));
  for(var i=0; i<140; i++) S.stars.push({
    x:Math.random()*innerWidth, y:Math.random()*innerHeight,
    r:0.3 + Math.random()*1.2, depth:Math.random(),
    twink:Math.random()*Math.PI*2, twinkS:0.5 + Math.random()*1.5
  });
  for(var i=0; i<24; i++) S.bokeh.push({
    x:Math.random()*innerWidth, y:Math.random()*innerHeight,
    r:8 + Math.random()*22, vx:(Math.random()-.5)*0.3, vy:-(0.1+Math.random()*0.4),
    pulse:Math.random()*Math.PI*2, pulseS:0.6+Math.random()*1.2, depth:Math.random()
  });
  for(var i=0; i<22; i++) S.dandelions.push({
    x:Math.random()*innerWidth*1.3 - innerWidth*0.15, y:Math.random()*innerHeight,
    r:1.4+Math.random()*1.6, vx:0.16+Math.random()*0.4, vy:-0.04-Math.random()*0.06,
    rot:Math.random()*Math.PI*2, rotV:(Math.random()-.5)*0.018, op:0.5+Math.random()*0.4
  });
  /* ink particles - drops on z axis falling, leaves, stars */
  for(var i=0; i<30; i++) S.inkPetals.push({
    x:Math.random()*innerWidth, y:Math.random()*innerHeight,
    sz:6+Math.random()*16, depth:Math.random(),
    vy:0.5+Math.random()*1.5,
    rot:Math.random()*Math.PI*2, rotV:(Math.random()-.5)*0.015,
    type:Math.random()<0.35 ? 'drop' : (Math.random()<0.5 ? 'leaf' : (Math.random()<0.5 ? 'star' : 'silhouette')),
    op:0.3+Math.random()*0.5
  });
}

function spawnPetal(distribute){
  var close = Math.random() < 0.07;
  return {
    x:Math.random()*innerWidth+120,
    y:distribute?Math.random()*innerHeight:-30-Math.random()*80,
    sz:close?16+Math.random()*16:3+Math.random()*5,
    rot:Math.random()*Math.PI*2, rv:(Math.random()-.5)*.018,
    vx:-.3-Math.random()*.7-(close?.3:0),
    vy:.15+Math.random()*.4+(close?.3:0),
    sw:Math.random()*Math.PI*2, ss:.005+Math.random()*.012,
    sa:.3+Math.random()*1.0,
    op:close?.3+Math.random()*.25:.35+Math.random()*.5,
    glass:close
  };
}

/* STARS */
function drawStars(){
  var W = innerWidth, H = innerHeight;
  sx.clearRect(0, 0, W, H);
  var p = S.progress;
  var wStart = (1 - smoothstep(0.10, 0.18, p));
  var wEnd = smoothstep(0.82, 0.94, p);
  var w = Math.max(wStart, wEnd);
  if(w < 0.02) return;

  S.stars.forEach(function(st){
    st.twink += S.dt * st.twinkS;
    var base = 0.45 + 0.35 * Math.sin(st.twink);
    var px = st.x + S.nx * (8 + st.depth*16);
    var py = st.y + S.ny * (4 + st.depth*8) - p * (st.depth*40);
    var wrappedY = ((py % H) + H) % H;
    var r = st.r * (0.5 + st.depth*0.8);
    var haloOp = base * w * 0.25 * st.depth;
    if(haloOp > 0.02){
      var g = sx.createRadialGradient(px, wrappedY, 0, px, wrappedY, r*4);
      g.addColorStop(0, 'rgba(245,237,224,'+haloOp+')');
      g.addColorStop(1, 'rgba(245,237,224,0)');
      sx.fillStyle = g;
      sx.beginPath(); sx.arc(px, wrappedY, r*4, 0, Math.PI*2); sx.fill();
    }
    sx.fillStyle = 'rgba(245,237,224,'+(base * w)+')';
    sx.beginPath(); sx.arc(px, wrappedY, r, 0, Math.PI*2); sx.fill();
  });
}

/* BG cross-fade + parallax with breathing zones */
function updateBg(){
  var p = S.progress;
  var wHero    = smoothstep(0.04, 0.12, p) * (1 - smoothstep(0.40, 0.46, p));
  var wClouds  = smoothstep(0.40, 0.46, p) * (1 - smoothstep(0.66, 0.70, p));
  var wImpact  = smoothstep(0.66, 0.70, p) * (1 - smoothstep(0.74, 0.78, p));
  var wPaper   = smoothstep(0.74, 0.78, p) * (1 - smoothstep(0.92, 0.95, p));
  var wHilltop = smoothstep(0.92, 0.95, p) * (1 - smoothstep(0.96, 0.98, p));
  var wDawn    = smoothstep(0.96, 0.98, p);

  setLayerOpacity($('bg-hero'),    wHero);
  setLayerOpacity($('bg-clouds'),  wClouds);
  setLayerOpacity($('bg-impact'),  wImpact);
  setLayerOpacity($('bg-paper'),   wPaper);
  setLayerOpacity($('bg-hilltop'), wHilltop);
  setLayerOpacity($('bg-dawn'),    wDawn);

  setParallax($('bg-hero'),    p, 0.00, 0.40, 1.05, 1.12, S.nx*0.8, S.ny*0.6);
  setParallax($('bg-clouds'),  p, 0.40, 0.66, 1.02, 1.10, S.nx*1.2, S.ny*0.8);
  setParallax($('bg-paper'),   p, 0.74, 0.92, 1.00, 1.04, S.nx*0.3, S.ny*0.2);
  setParallax($('bg-hilltop'), p, 0.92, 0.97, 1.04, 1.12, S.nx*0.6, S.ny*0.4);
  setParallax($('bg-dawn'),    p, 0.96, 1.00, 1.02, 1.08, S.nx*0.4, S.ny*0.3);
}
function setLayerOpacity(el, w){
  if(!el) return;
  var v = w > 0.01 ? Math.min(1, w) : 0;
  el.style.opacity = v;
}
function setParallax(el, p, start, end, minS, maxS, mx, my){
  if(!el) return;
  var local = smoothstep(start, end, p);
  var scale = lerp(minS, maxS, local);
  el.style.transform = 'translate3d('+(mx*10).toFixed(1)+'px,'+(my*10 + local*-20).toFixed(1)+'px,0) scale('+scale.toFixed(4)+')';
}

/* SUMI INK BLEED - replaces glass crack */
function updateInkBleed(){
  var p = S.progress;
  /* fade in 0.62 -> 0.70, fade out 0.74 -> 0.78 */
  var bleed = smoothstep(0.62, 0.70, p) * (1 - smoothstep(0.74, 0.78, p));
  var el = $('ink-bleed');
  if(bleed > 0.01){
    el.classList.add('-on');
    el.style.opacity = bleed;
  } else {
    el.classList.remove('-on');
  }
}


/* ============== KATANA CHOREOGRAPHY ============== */
var lastSmooth = 0;
function updateKatana(){
  if(!KAT.userData.model) return;
  var p = S.progress;
  var kx, ky, kz, rX, rY, rZ;

  // 1. LOCKING THE AXIS: 
  // -Math.PI / 2 keeps it perfectly flat and horizontal across the screen.
  var baseY = -Math.PI / 2;

  // 2. FIXING THE MASSIVE SIZE:
  // We push the base Z-depth back to 5.2 (instead of 2.4) so the whole sword fits in the frame safely.
  var baseZ = 5.2;

  // 3. ELEGANT PANNING:
  // No wild tumbling. Just smooth left/right/up/down tracking.
  if(p < 0.12){
    var t = smoothstep(0, 0.12, p);
    kx = lerp(-4.0, -1.0, t);  ky = 0;  kz = baseZ;
    rX = 0;  rY = baseY;  rZ = 0;
  } else if(p < 0.28){
    var t = smoothstep(0.12, 0.28, p);
    kx = lerp(-1.0, 1.5, t);  ky = 0;  kz = baseZ;
    rX = 0;  rY = baseY;  rZ = 0;
  } else if(p < 0.45){
    // Ascent Beat (Your Screenshot 1)
    var t = smoothstep(0.28, 0.45, p);
    kx = lerp(1.5, 0.5, t);  ky = lerp(0, 0.8, t);  kz = baseZ - 0.4; // Slight zoom in
    rX = lerp(0, -0.06, t);  rY = baseY;  rZ = lerp(0, 0.04, t); // Very tiny, subtle tilt upward
  } else if(p < 0.62){
    var t = smoothstep(0.45, 0.62, p);
    kx = lerp(0.5, -1.0, t);  ky = lerp(0.8, -0.4, t);  kz = baseZ;
    rX = lerp(-0.06, 0, t);  rY = baseY;  rZ = lerp(0.04, -0.02, t);
  } else if(p < 0.80){
    var t = smoothstep(0.62, 0.80, p);
    kx = lerp(-1.0, -2.5, t);  ky = lerp(-0.4, 0, t);  kz = baseZ + 0.5; // Push back slightly for text
    rX = 0;  rY = baseY;  rZ = lerp(-0.02, 0, t);
  } else {
    // Dawn Beat (Your Screenshot 2)
    var t = smoothstep(0.80, 1.0, p);
    kx = lerp(-2.5, 0, t);  ky = lerp(0, -0.3, t);  kz = baseZ; // -0.3 keeps it safely visible above the bottom edge
    rX = 0;  rY = baseY;  rZ = 0;
  }

  // Gentle cinematic breathing hover (totally decoupled from mouse cursor)
  ky += Math.sin(S.t*0.6)*0.015;

  KAT.position.set(kx, ky, kz);
  KAT.rotation.set(rX, rY, rZ);

  // Lighting transitions based on scroll depth
  if(p < 0.38){
    keyL.color.setHex(0xffe0b8); keyL.intensity = 1.1;
    rimL.color.setHex(0xff6030); rimL.intensity = 0.5;
    moonL.intensity = 0; sunL.intensity = 0;
  } else if(p < 0.62){
    keyL.color.setHex(0xffc890); keyL.intensity = 1.3;
    rimL.color.setHex(0xc83c28); rimL.intensity = 0.7;
    moonL.intensity = 0; sunL.intensity = 0;
  } else if(p < 0.94){
    keyL.color.setHex(0xffe8d0); keyL.intensity = 1.2;
    rimL.color.setHex(0x8b6340); rimL.intensity = 0.3;
    moonL.intensity = 0; sunL.intensity = 0;
  } else if(p < 0.98){
    keyL.color.setHex(0xb8cde8); keyL.intensity = 0.7;
    rimL.color.setHex(0x3a4a6a); rimL.intensity = 0.5;
    moonL.intensity = smoothstep(0.94, 0.98, p)*1.1; sunL.intensity = 0;
  } else {
    keyL.color.setHex(0xffd890); keyL.intensity = 0.9;
    rimL.color.setHex(0xffa040); rimL.intensity = 0.9;
    moonL.intensity = 0; sunL.intensity = 1.3;
  }

  edgeAccent.intensity = smoothstep(0.25, 0.60, p)*0.9 + smoothstep(0.92, 1.0, p)*0.8;
  edgeAccent.position.set(KAT.position.x, KAT.position.y, KAT.position.z + 0.4);

  if(S.flashIntensity > 0){
    flashL.intensity = S.flashIntensity * 12;
    S.flashIntensity *= 0.85;
  } else {
    flashL.intensity = 0;
  }

  if(KAT.userData.meshes){
    var eW = smoothstep(0.34, 0.66, p)*0.35 + smoothstep(0.92, 1.0, p)*0.25;
    for(var i=0; i<KAT.userData.meshes.length; i++){
      var m = KAT.userData.meshes[i];
      if(m.material && m.material.emissive){
        var col = m.material.color;
        var b = (col.r+col.g+col.b)/3;
        if(b < 0.18){ m.material.emissive.setRGB(eW*0.28, eW*0.05, eW*0.02); }
      }
    }
  }
}

/* PETAL HELPER */
function drawPetalShape(ctx, sz, stroke){
  for(var i=0; i<5; i++){
    ctx.save();
    ctx.rotate(i * Math.PI*2/5);
    ctx.beginPath();
    ctx.ellipse(0, -sz*.5, sz*.26, sz*.52, 0, 0, Math.PI*2);
    if(stroke) ctx.stroke(); else ctx.fill();
    ctx.restore();
  }
}

/* ATMOS */
function drawAtmos(){
  var W = innerWidth, H = innerHeight;
  ax.clearRect(0, 0, W, H);
  var p = S.progress;

  /* PETALS beats 1-3 */
  var petalW = smoothstep(0.04, 0.12, p) * (1 - smoothstep(0.36, 0.44, p));
  if(petalW > 0.01){
    var wind = Math.sin(S.t*0.4)*1.1;
    S.petals.forEach(function(pe){
      pe.sw += pe.ss;
      pe.x += pe.vx + Math.sin(pe.sw)*pe.sa + wind;
      pe.y += pe.vy;
      pe.rot += pe.rv;
      if(pe.y > H+40 || pe.x < -60){ Object.assign(pe, spawnPetal(false)); }
      ax.save();
      ax.translate(pe.x, pe.y);
      ax.rotate(pe.rot);
      ax.globalAlpha = pe.op * petalW;
      if(pe.glass){
        ax.filter = 'blur(.5px)';
        var g = ax.createRadialGradient(0, 0, 0, 0, 0, pe.sz);
        g.addColorStop(0, 'rgba(255,210,220,.45)');
        g.addColorStop(.6, 'rgba(240,160,180,.22)');
        g.addColorStop(1, 'rgba(200,100,120,0)');
        ax.fillStyle = g;
        drawPetalShape(ax, pe.sz);
        ax.filter = 'none';
        ax.strokeStyle = 'rgba(255,220,230,.55)';
        ax.lineWidth = 0.6;
        drawPetalShape(ax, pe.sz, true);
      } else {
        ax.fillStyle = 'rgba(220,80,60,1)';
        drawPetalShape(ax, pe.sz);
      }
      ax.restore();
    });
  }

  /* BOKEH per beat */
  var bokehColor = null;
  if(p > 0.40 && p < 0.68) bokehColor = [255, 180, 100];
  else if(p > 0.92 && p < 0.96) bokehColor = [180, 210, 240];
  else if(p > 0.96) bokehColor = [255, 200, 120];
  else if(p < 0.40) bokehColor = [220, 100, 80];

  if(bokehColor && S.perfMode === 'high'){
    S.bokeh.forEach(function(b){
      b.x += b.vx; b.y += b.vy;
      b.pulse += S.dt * b.pulseS;
      if(b.y < -30) { b.y = H+30; b.x = Math.random()*W; }
      if(b.x < -30) b.x = W+30;
      if(b.x > W+30) b.x = -30;
      var pulse = 0.5 + 0.5*Math.sin(b.pulse);
      var px = b.x + S.nx * (10 + b.depth*20);
      var py = b.y + S.ny * (6 + b.depth*12);
      var r = b.r * (0.7 + b.depth*0.6);
      var op = pulse * (0.18 + b.depth*0.18);
      var g = ax.createRadialGradient(px, py, 0, px, py, r);
      g.addColorStop(0, 'rgba('+bokehColor[0]+','+bokehColor[1]+','+bokehColor[2]+','+op+')');
      g.addColorStop(.4, 'rgba('+bokehColor[0]+','+bokehColor[1]+','+bokehColor[2]+','+(op*0.4)+')');
      g.addColorStop(1, 'rgba('+bokehColor[0]+','+bokehColor[1]+','+bokehColor[2]+',0)');
      ax.fillStyle = g;
      ax.beginPath(); ax.arc(px, py, r, 0, Math.PI*2); ax.fill();
    });
  }

  /* LIGHTNING */
  if(p > 0.50 && p < 0.66){
    S.lightningT -= S.dt;
    if(S.lightningT <= 0){
      spawnLightning();
      S.lightningT = 0.6 + Math.random()*1.0;
    }
  }
  drawLightning();

  /* DANDELIONS */
  var dandW = smoothstep(0.92, 0.96, p);
  if(dandW > 0.01){
    S.dandelions.forEach(function(d){
      d.x += d.vx + Math.sin(S.t*0.3 + d.rot)*0.4;
      d.y += d.vy;
      d.rot += d.rotV;
      if(d.x > W+40) d.x = -40;
      if(d.y < -20) d.y = H+20;
      ax.save();
      ax.translate(d.x, d.y);
      ax.rotate(d.rot);
      ax.globalAlpha = d.op * dandW;
      ax.fillStyle = 'rgba(245,238,220,.78)';
      ax.beginPath(); ax.arc(0, 0, d.r*0.5, 0, Math.PI*2); ax.fill();
      ax.strokeStyle = 'rgba(245,238,220,.5)';
      ax.lineWidth = 0.5;
      var bristles = 10;
      for(var i=0; i<bristles; i++){
        var a = i/bristles * Math.PI*2;
        ax.beginPath();
        ax.moveTo(0, 0);
        ax.lineTo(Math.cos(a)*d.r*2.6, Math.sin(a)*d.r*2.6);
        ax.stroke();
      }
      ax.fillStyle = 'rgba(250,245,230,.65)';
      for(var i=0; i<bristles; i++){
        var a = i/bristles * Math.PI*2;
        ax.beginPath();
        ax.arc(Math.cos(a)*d.r*2.6, Math.sin(a)*d.r*2.6, 0.7, 0, Math.PI*2);
        ax.fill();
      }
      ax.restore();
    });
  }
}

/* LIGHTNING */
function spawnLightning(){
  var x1 = innerWidth * (0.15 + Math.random()*0.7);
  var y1 = -20;
  var x2 = x1 + (Math.random()-0.5)*innerWidth*0.4;
  var y2 = innerHeight * (0.45 + Math.random()*0.35);
  S.lightning.push({
    x1:x1, y1:y1, x2:x2, y2:y2,
    life:1, decay:0.04+Math.random()*0.03,
    seed:Math.random()*1000,
    branches:Math.floor(Math.random()*3)+1
  });
  S.flashIntensity = 1.0;
  toggle($('overlay-chromatic'), '-strong', true);
  setTimeout(function(){ toggle($('overlay-chromatic'), '-strong', false); }, 220);
}
/* LIGHTNING */
function lightningSegments(x1, y1, x2, y2, detail, seed){
  var segs = [[x1, y1]];
  var N = 16; // More segments for sharper zig-zags
  function rng(s){ var x = Math.sin(s+seed)*43758.5; return x - Math.floor(x); }
  for(var i=1; i<N; i++){
    var t = i/N;
    var tx = x1+(x2-x1)*t, ty = y1+(y2-y1)*t;
    // High variance for jagged, realistic breaks
    var offset = detail*(rng(i*3.7)-0.5)*80;
    // Occasional sharp, unpredictable spikes
    if(rng(i*7.1) > 0.85) offset *= 2.2;
    var perpX = -(y2-y1), perpY = (x2-x1);
    var pl = Math.hypot(perpX, perpY);
    segs.push([tx+perpX/pl*offset, ty+perpY/pl*offset]);
  }
  segs.push([x2, y2]);
  return segs;
}

function drawLightning(){
  S.lightning = S.lightning.filter(function(b){ return b.life > 0; });
  S.lightning.forEach(function(b){
    b.life -= b.decay;
    var op = Math.max(0, b.life);
    var segs = lightningSegments(b.x1, b.y1, b.x2, b.y2, b.life, b.seed);
    
    ax.lineCap = 'round'; ax.lineJoin = 'round';
    
    // Realistic electric blue and intense white cores
    ax.strokeStyle = 'rgba(150, 180, 255,'+(op*0.15)+')'; ax.lineWidth = 18;
    drawPath(ax, segs);
    
    ax.strokeStyle = 'rgba(210, 230, 255,'+(op*0.6)+')'; ax.lineWidth = 4;
    drawPath(ax, segs);
    
    ax.strokeStyle = 'rgba(255, 255, 255,'+op+')'; ax.lineWidth = 1.2;
    drawPath(ax, segs);
    
    for(var k=0; k<b.branches; k++){
      var si = Math.floor(segs.length*(0.3+k*0.18));
      if(si >= segs.length-1) continue;
      var sp = segs[si];
      var bAng = Math.atan2(b.y2-b.y1, b.x2-b.x1) + (Math.random()-0.5)*1.5;
      var bLen = 30+Math.random()*60; 
      var bx2 = sp[0]+Math.cos(bAng)*bLen;
      var by2 = sp[1]+Math.sin(bAng)*bLen;
      var bSegs = lightningSegments(sp[0], sp[1], bx2, by2, b.life*0.8, b.seed+k*7);
      
      // Stark, jagged branches
      ax.strokeStyle = 'rgba(180, 210, 255,'+(op*0.25)+')'; ax.lineWidth = 3;
      drawPath(ax, bSegs);
      ax.strokeStyle = 'rgba(255, 255, 255,'+(op*0.7)+')'; ax.lineWidth = 0.8;
      drawPath(ax, bSegs);
    }
  });
}
function drawPath(ctx, segs){
  ctx.beginPath();
  segs.forEach(function(p, i){ if(i) ctx.lineTo(p[0], p[1]); else ctx.moveTo(p[0], p[1]); });
  ctx.stroke();
}

/* M-GLYPH MORPH */
function updateMGlyph(){
  var cycle = (S.t % 12) / 12;
  var glyph = 'm', rot = 0;
  if(cycle < 0.30){ glyph = 'm'; rot = cycle*8; }
  else if(cycle < 0.36){ glyph = '3'; rot = (cycle-0.30) * 4 * 180; }
  else if(cycle < 0.63){ glyph = '3'; rot = 90 + (cycle-0.36)*8; }
  else if(cycle < 0.70){ glyph = 'D'; rot = 180 + (cycle-0.63) * 4 * 180; }
  else if(cycle < 0.94){ glyph = 'D'; rot = 360 + (cycle-0.70)*8; }
  else { glyph = 'm'; rot = 360 + (cycle-0.94) * 4 * 360; }

  [$('brand-m'), $('load-m'), $('hm-m')].forEach(function(el){
    if(!el) return;
    if(el.textContent !== glyph) el.textContent = glyph;
    el.style.transform = 'rotate('+rot.toFixed(1)+'deg)';
  });
}

/* GLITCH SCRAMBLER */
var KANA = 'aiueokakikukekosashisusesotachitsutetonaninunenohachifuhema';
var KANJI = 'kentoukokoroyumegen';
var SYMBOLS = '|/\\-_+';
function runScramble(el){
  if(el._scrambling) return;
  var target = el.dataset.target;
  if(!target) return;
  el._scrambling = true;
  var lines = target.split('|');
  var plainLines = lines.map(function(l){ return l.replace(/<[^>]+>/g, ''); });
  var steps = 14;
  var step = 0;
  var tick = function(){
    step++;
    var prog = step/steps;
    if(step >= steps){
      el.innerHTML = lines.join('<br>'); // Fixed target
      el._scrambling = false;
      return;
    }
    var mixed = lines.map(function(line, li){
      var plain = plainLines[li];
      var reveal = Math.floor(plain.length * prog);
      var scrLen = Math.min(plain.length - reveal, 5);
      var s = plain.slice(0, reveal);
      for(var i=0; i<scrLen; i++) s += scrambleChar();
      return s;
    });
    el.innerHTML = mixed.join('<br>'); // Fixed target
    setTimeout(tick, 50);
  };
  tick();
}

/* DIALOGUE TYPEWRITER */
var typingJob = null;
function showDialogue(idx){
  if(idx === S.dialogueIdx) return;
  S.dialogueIdx = idx;
  var d = DIALOGUE[idx];
  if(!d) return;
  if(!S.mugenVisible){ $('mugen').classList.add('-on'); S.mugenVisible = true; }
  $('mb-who').textContent = d.who;
  if(typingJob) clearInterval(typingJob);
  var target = d.text;
  var i = 0;
  $('mb-text').innerHTML = '';
  typingJob = setInterval(function(){
    i++;
    var preview = target.slice(0, i);
    var openMatches = preview.match(/<(\w+)[^>]*>/g) || [];
    var closeMatches = preview.match(/<\/(\w+)>/g) || [];
    var open = openMatches.map(function(m){ var x = m.match(/<(\w+)/); return x ? x[1] : ''; });
    var close = closeMatches.map(function(m){ var x = m.match(/<\/(\w+)>/); return x ? x[1] : ''; });
    var unclosed = open.filter(function(t){
      var oi = open.indexOf(t);
      var ci = close.indexOf(t);
      return oi !== -1 && (ci === -1 || ci < oi);
    });
    var display = preview;
    unclosed.forEach(function(t){ display += '</'+t+'>'; });
    $('mb-text').innerHTML = display;
    if(i >= target.length){ clearInterval(typingJob); typingJob = null; }
  }, 22);
}

/* BEATS */
function updateBeats(){
  var p = S.progress;

  /* hero monogram only beat 1 */
  toggle($('hero-monogram'), '-on', p < 0.07);

  /* captions */
  toggle($('cap-chapter'), '-on', p < 0.12);
  toggle($('cap-bottom'),  '-on', p > 0.10 && p < 0.28);
  toggle($('cap-folio'),   '-on', p > 0.46 && p < 0.62);

  /* beat titles - aligned to actual beat ranges */
  applyBeatTitle('bt-sacred',   p > 0.13 && p < 0.22);
  applyBeatTitle('bt-dialogue', p > 0.30 && p < 0.40);
  applyBeatTitle('bt-ascent',   p > 0.48 && p < 0.58);

  /* impact quote - paper backdrop, no glass */
  toggle($('bt-impact'), '-on', p > 0.70 && p < 0.74);

  /* skill hub - 3 sub-sections */
  toggle($('skillhub-intro'),   '-on', p > 0.74 && p < 0.80);
  toggle($('skillhub-list'),    '-on', p > 0.80 && p < 0.86);
  toggle($('skillhub-feature'), '-on', p > 0.86 && p < 0.92);

  /* dawn */
  toggle($('dawn-title'), '-on', p > 0.95);
  toggle($('jumper'), '-on', p > 0.95);
  toggle($('scroll-hint'), '-on', p < 0.04);

  /* sun position */
  var jumper = $('jumper');
  if(p > 0.97){
    jumper.style.setProperty('--sun-x', '50%');
    jumper.style.setProperty('--sun-y', '48%');
  } else if(p > 0.92){
    jumper.style.setProperty('--sun-x', '38%');
    jumper.style.setProperty('--sun-y', '24%');
  }

  /* dialogue */
  for(var i = 0; i < DIALOGUE.length; i++){
    if(p >= DIALOGUE[i].at && i > S.dialogueIdx){ showDialogue(i); break; }
  }
  if(p < DIALOGUE[0].at && S.mugenVisible){
    $('mugen').classList.remove('-on');
    S.mugenVisible = false;
    S.dialogueIdx = -1;
  }
  /* hide mugen during skill hub - this beat is about works, not dialogue */
  if(p > 0.74 && p < 0.92 && S.mugenVisible){
    $('mugen').classList.remove('-on');
  } else if(p > 0.92 && S.dialogueIdx >= 0){
    $('mugen').classList.add('-on');
    S.mugenVisible = true;
  }

  /* chrome */
  $('scroll-pct').textContent = Math.round(p*100) + '%';
  $('progress').style.width = (p*100) + '%';
  $('stat-run').textContent = Math.round(p*100);

  var b = currentBeat(p);
  var bInt = Math.floor(b);
  var sectionNames = ['', 'Codex', 'Sacred Tree', 'Dialogue', 'Ascent', 'Thunder', '', 'Skill Hub', 'Moonlit', 'Dawn'];
  $('ch-label').textContent = sectionNames[bInt] || 'Codex';
  $('ch-num').textContent = (bInt < 10 ? '0'+bInt : ''+bInt);
  $('stat-mode').textContent = (sectionNames[bInt] || 'Codex').toUpperCase();

  toggle($('meta-widget'), '-on', p > 0.10 && p < 0.95 && !(p > 0.74 && p < 0.92));
  $('mw-hour').textContent = ['', 'Nightfall', 'Dusk', 'Witching', 'Witching', 'The Break', '', 'Paper Hour', 'Blue Hour', 'Daybreak'][bInt] || '';
  $('mw-wind').textContent = (bInt >= 4 && bInt <= 5) ? 'SW GALE' : (bInt === 8) ? 'NE SEA' : 'NE LOW';
}

function applyBeatTitle(id, on){
  var el = $(id);
  if(!el) return;
  if(on){
    if(!el.classList.contains('-on')){
      el.classList.add('-on');
      runScramble(el);
    }
  } else {
    el.classList.remove('-on');
  }
}

/* SKILL HUB POPULATE */
function buildSkillHub(){
  var container = $('sh-ledger');
  if(!container) return;
  container.innerHTML = WORKS.map(function(w){
    return '<div class="sh-row">'+
      '<div class="sh-num">'+w.no+'</div>'+
      '<div class="sh-title-row">'+w.title+'</div>'+
      '<div class="sh-role">'+w.role+'</div>'+
      '<div class="sh-year">'+w.year+'</div>'+
    '</div>';
  }).join('');
}
function buildInkVault(){
  $('ink-vault').innerHTML = INK_VAULT.map(function(v, i){
    return '<div class="ink-card">'+
      '<div class="ic-no">'+KANJI_NUMS[i+1]+'</div>'+
      '<div class="ic-body">'+
        '<div class="ic-tag">'+v.tag+'</div>'+
        '<div class="ic-title">'+v.title+'</div>'+
        '<div class="ic-meta">'+v.meta+'</div>'+
        '<div class="ic-desc">'+v.desc+'</div>'+
      '</div>'+
      '<div class="ic-stamp">'+STAMPS[i+1]+'</div>'+
    '</div>';
  }).join('');
}
buildSkillHub();
buildInkVault();

/* CHAPTER JUMP */
$('ch-expand').addEventListener('click', function(e){
  var item = e.target.closest('[data-jump]');
  if(!item) return;
  var pct = parseFloat(item.dataset.jump);
  if(!isNaN(pct)){
    updateScrollMax();
    scrollTo({ top: scrollMax * pct, behavior:'smooth' });
  }
});

/* JELLY LENS for beat titles */
function setupJellyLens(){
  document.querySelectorAll('.beat-title').forEach(function(el){
    el.addEventListener('mousemove', function(e){
      var rect = el.getBoundingClientRect();
      var x = ((e.clientX - rect.left) / rect.width) * 100;
      var y = ((e.clientY - rect.top) / rect.height) * 100;
      el.style.setProperty('--mx', x+'%');
      el.style.setProperty('--my', y+'%');
    });
  });
}
setupJellyLens();

/* INK MODE */
$('jumper').addEventListener('click', function(e){
  e.preventDefault();
  toggleInkMode();
});

function toggleInkMode(){
  S.inkMode = !S.inkMode;
  $('stage').classList.toggle('-ink', S.inkMode);
  $('ink-system').classList.toggle('-on', S.inkMode);
  $('ink-system').setAttribute('aria-hidden', S.inkMode ? 'false' : 'true');

  if(S.inkMode){
    /* lock body scroll - ink scroll has own scrolling */
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = '';
  }
}

function drawInk(){
  if(!S.inkMode){
    if(S.inkClouds.length){ ix.clearRect(0, 0, innerWidth, innerHeight); S.inkClouds.length = 0; }
    return;
  }
  ix.clearRect(0, 0, innerWidth, innerHeight);

  /* falling ink elements - drops, leaves, stars, silhouettes - on z axis */
  S.inkPetals.forEach(function(ip){
    /* fall straight down with z-depth scaling */
    ip.y += ip.vy * (0.5 + ip.depth);
    ip.rot += ip.rotV;
    if(ip.y > innerHeight+30){
      ip.y = -30;
      ip.x = Math.random()*innerWidth;
    }

    var px = ip.x + S.nx * (8 + ip.depth*16);
    var py = ip.y;
    var scale = 0.4 + ip.depth*0.8;
    var blur = (1 - ip.depth) * 1.5;

    ix.save();
    ix.translate(px, py);
    ix.rotate(ip.rot);
    ix.scale(scale, scale);
    ix.globalAlpha = ip.op * (0.4 + ip.depth*0.6);
    ix.filter = 'blur('+blur+'px)';
    ix.fillStyle = '#0a0906';

    if(ip.type === 'drop'){
      /* tear-drop ink shape */
      ix.beginPath();
      ix.moveTo(0, -ip.sz*.7);
      ix.bezierCurveTo(ip.sz*.5, -ip.sz*.5, ip.sz*.5, ip.sz*.6, 0, ip.sz*.7);
      ix.bezierCurveTo(-ip.sz*.5, ip.sz*.6, -ip.sz*.5, -ip.sz*.5, 0, -ip.sz*.7);
      ix.fill();
    } else if(ip.type === 'leaf'){
      ix.beginPath();
      ix.ellipse(0, 0, ip.sz*0.4, ip.sz, 0, 0, Math.PI*2);
      ix.fill();
      ix.strokeStyle = 'rgba(245,237,224,.25)';
      ix.lineWidth = 0.5;
      ix.beginPath();
      ix.moveTo(0, -ip.sz);
      ix.lineTo(0, ip.sz);
      ix.stroke();
    } else if(ip.type === 'star'){
      /* 4-point sparkle */
      ix.beginPath();
      var pts = 4;
      for(var i=0; i<pts*2; i++){
        var ang = (i/(pts*2)) * Math.PI*2;
        var r = i%2 === 0 ? ip.sz*0.5 : ip.sz*0.18;
        var x = Math.cos(ang)*r, y = Math.sin(ang)*r;
        if(i===0) ix.moveTo(x, y); else ix.lineTo(x, y);
      }
      ix.closePath();
      ix.fill();
    } else {
      /* silhouette - small mugen-like or jumper-like shape */
      ix.beginPath();
      ix.arc(0, -ip.sz*.35, ip.sz*.25, 0, Math.PI*2);
      ix.fill();
      ix.fillRect(-ip.sz*.18, -ip.sz*.1, ip.sz*.36, ip.sz*.5);
    }
    ix.filter = 'none';
    ix.restore();
  });
}

/* CURSOR */
var cursor = $('cursor');
addEventListener('mousemove', function(e){
  S.mx = e.clientX; S.my = e.clientY;
  S.nx = (e.clientX/innerWidth)*2 - 1;
  S.ny = -((e.clientY/innerHeight)*2 - 1);
  cursor.style.left = e.clientX + 'px';
  cursor.style.top  = e.clientY + 'px';
});
document.addEventListener('mouseover', function(e){
  if(e.target.closest('button, .shl-row, .ch-item, .chapter-pill, .ink-card, .beat-title, .brand')){
    cursor.classList.add('-hover');
  }
});
document.addEventListener('mouseout', function(e){
  if(e.target.closest('button, .shl-row, .ch-item, .chapter-pill, .ink-card, .beat-title, .brand')){
    cursor.classList.remove('-hover');
  }
});

/* PERF */
function checkPerf(){
  if(S.fps < 50){
    S.lowFpsCount++;
    if(S.lowFpsCount > 3 && S.perfMode === 'high'){
      S.perfMode = 'low';
      console.log('low perf mode');
      var grain = document.querySelector('.overlay-grain');
      if(grain) grain.style.display = 'none';
      S.dpr = 1;
      resizeCanvases();
      if(R) R.setPixelRatio(1);
    }
  } else S.lowFpsCount = Math.max(0, S.lowFpsCount-1);
}

/* MAIN LOOP */
function loop(ts){
  requestAnimationFrame(loop);
  S.dt = Math.min((ts - S.lt)*0.001, 0.05);
  S.lt = ts;
  S.t += S.dt;

  S.fpsC++; S.fpsT += S.dt;
  if(S.fpsT >= 1){
    S.fps = Math.round(S.fpsC/S.fpsT);
    $('stat-fps').textContent = S.fps;
    S.fpsT = 0; S.fpsC = 0;
    checkPerf();
  }

  S.smooth += (S.scrollY - S.smooth) * 0.09;
  S.progress = Math.min(1, Math.max(0, S.smooth/scrollMax));

  if(!S.inkMode){
    updateBg();
    updateKatana();
    updateBeats();
    updateInkBleed();
    drawStars();
    drawAtmos();
    if(R) R.render(SC, CAM);
  } else {
    drawInk();
  }
  updateMGlyph();
}

/* BOOT */
var ldText = $('loader-text');
var ldBar = $('loader-bar');
var ldPct = $('loader-pct');
var STAGES = ['Forging', 'Tempering', 'Polishing', 'Awakening'];

function updateLoaderBar(pct){
  ldBar.style.width = pct + '%';
  ldPct.textContent = (pct < 100 ? (pct < 10 ? '00' : pct < 100 ? '0' : '') + Math.round(pct) : '100') + ' %';
}

var ldP = 0, ldStage = 0;
var ldInt = setInterval(function(){
  if(S.assetsReady && S.modelReady) return;
  ldP += 0.4 + Math.random()*1.2;
  if(ldP > 30) ldP = 30;
  updateLoaderBar(ldP);
  if(ldP > 12 && ldStage === 0){ ldStage = 1; ldText.textContent = STAGES[1]; }
  if(ldP > 22 && ldStage === 1){ ldStage = 2; ldText.textContent = STAGES[2]; }
  if(ldP >= 30) clearInterval(ldInt);
}, 100);

setTimeout(function(){ $('loader-skip').classList.add('-show'); }, 8000);
$('loader-skip').addEventListener('click', function(){
  S.modelReady = true;
  S.assetsReady = true;
  checkBoot();
});

function checkBoot(){
  if(S.modelReady && S.assetsReady) boot();
}

function boot(){
  if(S.booted) return;
  S.booted = true;
  updateLoaderBar(100);
  ldText.textContent = STAGES[3];
  initParticles();
  setTimeout(function(){
    $('loader').classList.add('-out');
    S.lt = performance.now();
    updateScrollMax();
    scrollTo(0, 0);
    requestAnimationFrame(loop);
    setTimeout(function(){ var l = $('loader'); if(l) l.remove(); }, 2000);
  }, 700);
}

function preloadImages(urls){
  return Promise.all(urls.map(function(u){
    return new Promise(function(resolve){
      var img = new Image();
      img.onload = img.onerror = function(){ resolve(u); };
      img.src = u;
    });
  }));
}

preloadImages([
  'assets/bg-hero.png','assets/bg-clouds.png','assets/bg-hilltop.png','assets/bg-dawn.png',
  'assets/sensei-mugen.png','assets/jumper-silhouette.png','assets/texture-paper.jpg'
]).then(function(){
  S.assetsReady = true;
  console.log('images loaded');
  updateLoaderBar(45);
  checkBoot();
});

setTimeout(function(){
  if(!S.modelReady){ console.warn('model failsafe'); S.modelReady = true; }
  if(!S.assetsReady){ console.warn('assets failsafe'); S.assetsReady = true; }
  checkBoot();
}, 20000);

updateScrollMax();

})();