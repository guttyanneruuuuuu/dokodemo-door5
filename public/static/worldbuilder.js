// ============================================================
// WARPDOOR ULTRA — Procedural World Builder
// Generates a full explorable 3D scene for each world id.
// Returns: { group, spawn: Vector3, spawnYaw, returnDoor,
//            groundHeightAt(x,z), collide(x,z,r), tick(t,dt),
//            skyDome, name }
// ============================================================

export function buildWorld(world, THREE) {
  const root = new THREE.Group();
  root.name = `world-${world.id}`;

  const p = world.palette;

  // ------- Sky / Sun / Lighting ----------
  const skyDome = makeSkyDome(THREE, p);

  const ambient = new THREE.AmbientLight(p.ambient, p.ambientI);
  root.add(ambient);

  const sun = new THREE.DirectionalLight(p.sun, p.sunI);
  sun.position.set(...p.sunPos);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.left = -60;
  sun.shadow.camera.right = 60;
  sun.shadow.camera.top = 60;
  sun.shadow.camera.bottom = -60;
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 300;
  root.add(sun);

  // hemisphere for natural fill
  const hemi = new THREE.HemisphereLight(p.sky[0], p.ground, 0.45);
  root.add(hemi);

  // ------- Dispatch to biome builder ------
  const collidables = []; // array of {x,z,r} OR {type:'box', cx, cz, hx, hz, angle}
  const dynamicTickers = [];
  const api = { THREE, world, root, collidables, dynamicTickers };

  let spawn = new THREE.Vector3(0, 0, 0);
  let spawnYaw = 0;

  switch (world.biome) {
    case 'mediterranean': ({ spawn, spawnYaw } = buildRome(api)); break;
    case 'sakura':        ({ spawn, spawnYaw } = buildEdo(api));  break;
    case 'desert':        ({ spawn, spawnYaw } = buildEgypt(api));break;
    case 'meadow':        ({ spawn, spawnYaw } = buildMedieval(api)); break;
    case 'city-old':      ({ spawn, spawnYaw } = buildNYC(api));  break;
    case 'cyberpunk':     ({ spawn, spawnYaw } = buildNeoTokyo(api)); break;
    case 'mars':          ({ spawn, spawnYaw } = buildMars(api)); break;
    case 'underwater':    ({ spawn, spawnYaw } = buildAtlantis(api));break;
    case 'plaza':         ({ spawn, spawnYaw } = buildChangAn(api)); break;
    case 'venice':        ({ spawn, spawnYaw } = buildVenice(api)); break;
    case 'space':         ({ spawn, spawnYaw } = buildSpaceStation(api)); break;
    default:              ({ spawn, spawnYaw } = buildRome(api));
  }

  // ------- Return door (always add one behind spawn) -------
  const returnDoor = makeReturnDoor(THREE);
  returnDoor.position.copy(spawn);
  returnDoor.position.y = 0;
  // behind spawn, offset by yaw + PI
  returnDoor.position.x += Math.sin(spawnYaw) * 3.5;
  returnDoor.position.z += Math.cos(spawnYaw) * 3.5;
  returnDoor.rotation.y = spawnYaw + Math.PI;
  root.add(returnDoor);

  // ------- Ground height function --------
  const groundHeightAt = (x, z) => 0; // flat ground for now

  // ------- Collision fn ------------------
  // Simple: checks circle vs stored obstacles
  const collide = (x, z, r) => {
    for (const c of collidables) {
      if (c.type === 'box') {
        // transform point into box space
        const cos = Math.cos(-c.angle || 0), sin = Math.sin(-c.angle || 0);
        const dx = x - c.cx, dz = z - c.cz;
        const lx = dx*cos - dz*sin, lz = dx*sin + dz*cos;
        if (Math.abs(lx) < c.hx + r && Math.abs(lz) < c.hz + r) return c;
      } else {
        const dx = x - c.x, dz = z - c.z;
        if (dx*dx + dz*dz < (c.r + r) * (c.r + r)) return c;
      }
    }
    return null;
  };

  // ------- Tick function -----------------
  const tick = (t, dt) => {
    for (const fn of dynamicTickers) fn(t, dt);
    // gentle sky rotation
    if (skyDome) skyDome.rotation.y = t * 0.003;
  };

  return {
    group: root,
    spawn,
    spawnYaw,
    returnDoor,
    groundHeightAt,
    collide,
    tick,
    skyDome,
    name: world.name,
  };
}

// ============================================================
// SHARED HELPERS
// ============================================================
function makeSkyDome(THREE, p) {
  const geo = new THREE.SphereGeometry(900, 32, 16);
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    uniforms: {
      topColor:    { value: new THREE.Color(p.sky[2]) },
      midColor:    { value: new THREE.Color(p.sky[0]) },
      bottomColor: { value: new THREE.Color(p.sky[1]) },
      offset:      { value: 33 },
      exponent:    { value: 0.6 },
    },
    vertexShader: `
      varying vec3 vWorldPos;
      void main(){
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorldPos = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: `
      varying vec3 vWorldPos;
      uniform vec3 topColor;
      uniform vec3 midColor;
      uniform vec3 bottomColor;
      uniform float offset;
      uniform float exponent;
      void main(){
        float h = normalize(vWorldPos + vec3(0.0, offset, 0.0)).y;
        vec3 col;
        if (h > 0.0) {
          col = mix(midColor, topColor, pow(max(h, 0.0), exponent));
        } else {
          col = mix(midColor, bottomColor, pow(max(-h, 0.0), exponent));
        }
        gl_FragColor = vec4(col, 1.0);
      }
    `,
    depthWrite: false,
  });
  return new THREE.Mesh(geo, mat);
}

function makeReturnDoor(THREE) {
  const g = new THREE.Group();
  g.name = 'return-door';
  const gold = new THREE.MeshStandardMaterial({ color: 0xd4b174, roughness: 0.25, metalness: 0.95, emissive: 0x3a2a10, emissiveIntensity: 0.8 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x100a18, roughness: 0.4, metalness: 0.8, emissive: 0x100a18 });
  const doorW=2.2, doorH=4.0, frameTh=0.22;
  g.add(meshBox(THREE, doorW+frameTh*2+0.2, frameTh*1.3, 0.4, 0, doorH+frameTh*0.6, 0, gold));
  g.add(meshBox(THREE, frameTh, doorH+frameTh, 0.4, -doorW/2-frameTh/2, doorH/2, 0, gold));
  g.add(meshBox(THREE, frameTh, doorH+frameTh, 0.4, doorW/2+frameTh/2, doorH/2, 0, gold));
  g.add(meshBox(THREE, doorW+frameTh*2+0.3, 0.1, 0.5, 0, 0.05, 0, gold));
  // portal
  const portalMat = new THREE.ShaderMaterial({
    transparent: true,
    uniforms: {
      uTime: { value: 0 },
      uOpacity: { value: 0.15 },
      uColorA: { value: new THREE.Color(0xc9a96a) },
      uColorB: { value: new THREE.Color(0xa86bff) },
      uColorC: { value: new THREE.Color(0xffffff) },
    },
    vertexShader: `varying vec2 vUv; void main(){vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader: `
      varying vec2 vUv; uniform float uTime; uniform float uOpacity;
      uniform vec3 uColorA, uColorB, uColorC;
      float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      float noise(vec2 p){vec2 i=floor(p),f=fract(p); float a=hash(i),b=hash(i+vec2(1,0)),c=hash(i+vec2(0,1)),d=hash(i+vec2(1,1)); vec2 u=f*f*(3.-2.*f); return mix(mix(a,b,u.x),mix(c,d,u.x),u.y);}
      void main(){
        vec2 p = vUv - 0.5; float r=length(p); float a=atan(p.y,p.x);
        float swirl = sin(a*4.+uTime*1.5+r*8.)*.5+.5;
        float n = noise(p*8.+uTime*0.4);
        vec3 col = mix(uColorA, uColorB, swirl);
        col = mix(col, uColorC, n*0.4);
        float glow = smoothstep(0.5,0.0,r);
        col += uColorC * pow(glow,3.)*0.5;
        gl_FragColor = vec4(col, smoothstep(0.5,0.35,r) * uOpacity);
      }`,
    side: THREE.DoubleSide,
  });
  const portal = new THREE.Mesh(new THREE.PlaneGeometry(doorW*0.97, doorH*0.97), portalMat);
  portal.position.set(0, doorH/2, 0.05);
  g.add(portal);
  g.userData.portalMat = portalMat;

  // Glow halo
  const glowMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 } },
    vertexShader: `varying vec2 vUv; void main(){vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader: `varying vec2 vUv; uniform float uTime;
      void main(){ vec2 p=vUv-0.5; float r=length(p*vec2(2.5,1.0));
        float g=smoothstep(0.6,0.,r)*(0.6+0.4*sin(uTime*1.5));
        gl_FragColor = vec4(mix(vec3(0.82,0.66,0.43),vec3(0.66,0.42,1.0),sin(uTime)*.5+.5), g*0.9); }`,
  });
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(doorW*3, doorH*1.8), glowMat);
  glow.position.set(0, doorH/2, -0.3);
  g.add(glow);
  g.userData.glowMat = glowMat;

  // Sign above
  const signCanvas = document.createElement('canvas');
  signCanvas.width=512; signCanvas.height=128;
  const sctx = signCanvas.getContext('2d');
  sctx.fillStyle = 'rgba(10,6,24,0.85)';
  sctx.fillRect(0,0,512,128);
  sctx.fillStyle = '#d4b174';
  sctx.font = 'bold 38px "Shippori Mincho", serif';
  sctx.textAlign = 'center';
  sctx.fillText('RETURN · 戻る扉', 256, 80);
  const signTex = new THREE.CanvasTexture(signCanvas);
  const sign = new THREE.Mesh(
    new THREE.PlaneGeometry(2.6, 0.65),
    new THREE.MeshBasicMaterial({ map: signTex, transparent: true })
  );
  sign.position.set(0, doorH+0.9, 0);
  g.add(sign);

  return g;
}

function meshBox(THREE, w, h, d, x, y, z, mat) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  m.castShadow = true; m.receiveShadow = true;
  return m;
}
function addGround(THREE, root, color, size=400, receiveShadow=true) {
  const g = new THREE.Mesh(
    new THREE.PlaneGeometry(size, size, 40, 40),
    new THREE.MeshStandardMaterial({ color, roughness: 0.95, metalness: 0.0 })
  );
  g.rotation.x = -Math.PI/2;
  g.receiveShadow = receiveShadow;
  root.add(g);
  return g;
}

function randRange(min, max) { return min + Math.random()*(max-min); }
function seededRand(seed) {
  let s = seed | 0;
  return () => {
    s = Math.imul(48271, s) | 0;
    return ((s >>> 0) % 100000) / 100000;
  };
}

// ============================================================
// BIOME: ROME — Forum with columns, Colosseum, fountain
// ============================================================
function buildRome(api) {
  const { THREE, world, root, collidables, dynamicTickers } = api;
  const rand = seededRand(12345);

  // Ground — marble plaza
  const ground = addGround(THREE, root, 0xc9a674, 500);
  // Plaza tiles pattern
  const plaza = new THREE.Mesh(
    new THREE.PlaneGeometry(80, 80, 1, 1),
    new THREE.MeshStandardMaterial({ color: 0xdccaa8, roughness: 0.7 })
  );
  plaza.rotation.x = -Math.PI/2;
  plaza.position.y = 0.01;
  plaza.receiveShadow = true;
  root.add(plaza);

  // Colosseum (circular arena)
  const colo = new THREE.Group();
  const ringMat = new THREE.MeshStandardMaterial({ color: 0xb69a6e, roughness: 0.85 });
  const colR = 22, colH = 14;
  // Two tiers of arches
  for (let tier=0; tier<3; tier++) {
    const tierY = tier * 4.5 + 0.5;
    for (let i=0; i<24; i++) {
      const a = (i/24) * Math.PI*2;
      // wedge segment (box)
      const w = (colR * 2 * Math.PI)/24 * 0.9;
      const wall = meshBox(THREE, w, 4, 1.2, Math.cos(a)*colR, tierY + 2, Math.sin(a)*colR, ringMat);
      wall.rotation.y = -a + Math.PI/2;
      colo.add(wall);
      // arch opening (darker rect cut look: use a dark inset)
      if (tier < 2) {
        const arch = meshBox(THREE, w*0.55, 2.6, 0.1, Math.cos(a)*(colR-0.55), tierY + 1.6, Math.sin(a)*(colR-0.55),
          new THREE.MeshStandardMaterial({ color: 0x20180c, roughness: 1 }));
        arch.rotation.y = -a + Math.PI/2;
        colo.add(arch);
      }
    }
  }
  colo.position.set(0, 0, -55);
  root.add(colo);
  // ring collision
  for (let i=0;i<24;i++){
    const a = (i/24)*Math.PI*2;
    collidables.push({ x: Math.cos(a)*colR + 0, z: Math.sin(a)*colR - 55, r: 2.2 });
  }

  // Approach way — lined with marble columns
  const colMat = new THREE.MeshStandardMaterial({ color: 0xf0e6d0, roughness: 0.5, metalness: 0.1 });
  const capMat = new THREE.MeshStandardMaterial({ color: 0xd4b174, roughness: 0.3, metalness: 0.6 });
  function column(x, z, h=7) {
    const col = new THREE.Group();
    const base = meshBox(THREE, 1.6, 0.4, 1.6, 0, 0.2, 0, capMat);
    col.add(base);
    const shaft = new THREE.Mesh(
      new THREE.CylinderGeometry(0.55, 0.65, h, 16, 1, false),
      colMat
    );
    shaft.position.y = 0.4 + h/2; shaft.castShadow = true; shaft.receiveShadow = true;
    col.add(shaft);
    const cap = meshBox(THREE, 1.7, 0.5, 1.7, 0, 0.4 + h + 0.25, 0, capMat);
    col.add(cap);
    col.position.set(x, 0, z);
    root.add(col);
    collidables.push({ x, z, r: 0.9 });
  }
  // Two rows of columns leading to Colosseum
  for (let i=0;i<8;i++){
    const z = -10 - i*5;
    column(-7, z);
    column( 7, z);
  }

  // Temple (Pantheon-like) in front
  const temple = new THREE.Group();
  // Pediment base
  temple.add(meshBox(THREE, 18, 0.8, 14, 0, 0.4, 0, capMat));
  // Columns facade
  for (let i=0;i<6;i++){
    const x = -7.5 + i*3;
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.6, 8, 16), colMat);
    shaft.position.set(x, 4.8, 5);
    shaft.castShadow = true;
    temple.add(shaft);
    collidables.push({ x, z: 5 + 25, r: 0.8 });
  }
  // Roof (triangular)
  const roofMat = new THREE.MeshStandardMaterial({ color: 0x8a6d48, roughness: 0.8 });
  const roof = new THREE.Mesh(
    new THREE.CylinderGeometry(0.01, 7, 3, 3),
    roofMat
  );
  roof.rotation.x = Math.PI/2; roof.rotation.z = Math.PI/6;
  // simpler: use a box roof
  const pediment = meshBox(THREE, 18, 2, 2, 0, 10, 5, roofMat);
  temple.add(pediment);
  const body = meshBox(THREE, 14, 7, 10, 0, 4.5, -1, new THREE.MeshStandardMaterial({ color: 0xe8dcc0, roughness: 0.7 }));
  temple.add(body);

  temple.position.set(0, 0, 25);
  root.add(temple);
  collidables.push({ type:'box', cx: 0, cz: 25 + -1, hx: 7, hz: 5, angle: 0 });

  // Fountain in center
  const fountain = new THREE.Group();
  const basin = new THREE.Mesh(new THREE.CylinderGeometry(3, 3.2, 0.8, 32), capMat);
  basin.position.y = 0.4; basin.castShadow = true; basin.receiveShadow = true;
  fountain.add(basin);
  const water = new THREE.Mesh(
    new THREE.CylinderGeometry(2.8, 2.8, 0.2, 32),
    new THREE.MeshStandardMaterial({ color: 0x4ab0d0, roughness: 0.1, metalness: 0.5, transparent: true, opacity: 0.85 })
  );
  water.position.y = 0.75;
  fountain.add(water);
  const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 2, 16), capMat);
  pillar.position.y = 1.8;
  fountain.add(pillar);
  fountain.position.set(0, 0, -20);
  root.add(fountain);
  collidables.push({ x: 0, z: -20, r: 3.4 });

  dynamicTickers.push((t) => {
    water.position.y = 0.75 + Math.sin(t*2)*0.03;
  });

  // Cypress trees around
  for (let i=0;i<40;i++){
    const angle = rand()*Math.PI*2;
    const dist = 30 + rand()*100;
    const x = Math.cos(angle)*dist;
    const z = Math.sin(angle)*dist;
    if (Math.abs(x) < 10 && z > -90 && z < 40) continue;
    cypress(THREE, root, x, z, capMat, collidables);
  }

  // Distant mountains
  addDistantMountains(THREE, root, 0x8a6a4a, 200, 18);

  // Some birds
  addFlock(THREE, root, dynamicTickers, 0x2a1810, 6, 120);

  const spawn = new THREE.Vector3(0, 0, 0);
  return { spawn, spawnYaw: Math.PI };
}

function cypress(THREE, root, x, z, trunkMat, collidables) {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.35, 1, 8), new THREE.MeshStandardMaterial({ color: 0x4a2a18, roughness: 1 }));
  trunk.position.y = 0.5;
  g.add(trunk);
  const top = new THREE.Mesh(new THREE.ConeGeometry(1.1, 6.5, 10), new THREE.MeshStandardMaterial({ color: 0x1e3a1e, roughness: 1 }));
  top.position.y = 4;
  top.castShadow = true;
  g.add(top);
  g.position.set(x, 0, z);
  root.add(g);
  collidables.push({ x, z, r: 0.5 });
}

function addDistantMountains(THREE, root, color, dist=200, count=16) {
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 1, fog: false });
  for (let i=0;i<count;i++){
    const a = (i/count)*Math.PI*2;
    const h = 20 + Math.random()*30;
    const m = new THREE.Mesh(new THREE.ConeGeometry(20 + Math.random()*15, h, 6), mat);
    m.position.set(Math.cos(a)*dist, h/2 - 2, Math.sin(a)*dist);
    m.rotation.y = Math.random()*Math.PI;
    root.add(m);
  }
}

function addFlock(THREE, root, tickers, color, count=6, radius=80) {
  const birds = [];
  for (let i=0;i<count;i++){
    const b = new THREE.Mesh(
      new THREE.ConeGeometry(0.3, 1, 4),
      new THREE.MeshBasicMaterial({ color })
    );
    b.rotation.x = Math.PI/2;
    b.position.set(Math.random()*radius-radius/2, 30 + Math.random()*20, Math.random()*radius-radius/2);
    b.userData.speed = 0.5 + Math.random()*0.5;
    b.userData.phase = Math.random()*Math.PI*2;
    root.add(b);
    birds.push(b);
  }
  tickers.push((t) => {
    birds.forEach(b => {
      b.position.x += b.userData.speed * 0.1;
      b.position.y = 30 + Math.sin(t + b.userData.phase)*4;
      if (b.position.x > radius) b.position.x = -radius;
      b.rotation.y = Math.PI/2;
    });
  });
}

// ============================================================
// BIOME: EDO — Japanese town with torii, pagoda, cherry blossoms
// ============================================================
function buildEdo(api) {
  const { THREE, world, root, collidables, dynamicTickers } = api;
  // Ground — stone paved street
  addGround(THREE, root, 0x4a3a2a, 500);
  const street = new THREE.Mesh(
    new THREE.PlaneGeometry(12, 180),
    new THREE.MeshStandardMaterial({ color: 0x6a5040, roughness: 0.9 })
  );
  street.rotation.x = -Math.PI/2;
  street.position.y = 0.01;
  street.receiveShadow = true;
  root.add(street);

  // Torii gate at origin
  const torii = new THREE.Group();
  const toriiMat = new THREE.MeshStandardMaterial({ color: 0x9c2020, roughness: 0.6 });
  const toriiDark = new THREE.MeshStandardMaterial({ color: 0x2a0808, roughness: 0.8 });
  const pillarL = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.4, 7, 12), toriiMat);
  pillarL.position.set(-4, 3.5, 0); torii.add(pillarL);
  const pillarR = pillarL.clone(); pillarR.position.x = 4; torii.add(pillarR);
  const topBar = meshBox(THREE, 10.5, 0.5, 0.7, 0, 7.1, 0, toriiDark);
  torii.add(topBar);
  const capBar = meshBox(THREE, 12, 0.7, 0.9, 0, 7.7, 0, toriiMat);
  torii.add(capBar);
  const midBar = meshBox(THREE, 9, 0.3, 0.5, 0, 6, 0, toriiMat);
  torii.add(midBar);
  torii.position.set(0, 0, -8);
  root.add(torii);
  collidables.push({ x: -4, z: -8, r: 0.45 });
  collidables.push({ x:  4, z: -8, r: 0.45 });

  // Houses lining the street
  for (let i=0;i<8;i++){
    const z = -25 - i*12;
    edoHouse(THREE, root, -10, z, Math.PI/2, collidables);
    edoHouse(THREE, root,  10, z, -Math.PI/2, collidables);
  }
  // Opposite direction
  for (let i=0;i<4;i++){
    const z = 20 + i*12;
    edoHouse(THREE, root, -10, z, Math.PI/2, collidables);
    edoHouse(THREE, root,  10, z, -Math.PI/2, collidables);
  }

  // Pagoda at the far end
  pagoda(THREE, root, 0, -95, collidables);

  // Cherry trees along street
  for (let i=0;i<16;i++){
    const z = -15 - i*8 + Math.random()*3;
    const x = (Math.random()>0.5 ? -15 : 15) + (Math.random()-0.5)*2;
    sakuraTree(THREE, root, x, z, collidables);
  }

  // Falling petals
  const petals = makeFallingParticles(THREE, 0xffd0e0, 600, 40);
  root.add(petals);
  dynamicTickers.push((t, dt) => updateFallingParticles(petals, dt));

  // Stone lanterns
  for (let i=0;i<6;i++){
    const z = -10 - i*15;
    stoneLantern(THREE, root, -7, z, collidables);
    stoneLantern(THREE, root,  7, z, collidables);
  }

  // Distant mountains
  addDistantMountains(THREE, root, 0x3a2a4a, 180, 18);

  return { spawn: new THREE.Vector3(0, 0, 4), spawnYaw: 0 };
}
function edoHouse(THREE, root, x, z, rotY, collidables) {
  const g = new THREE.Group();
  const wallMat = new THREE.MeshStandardMaterial({ color: 0xdcc9a8, roughness: 0.85 });
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x4a2a18, roughness: 0.8 });
  const roofMat = new THREE.MeshStandardMaterial({ color: 0x2a1a12, roughness: 0.7 });
  // body
  g.add(meshBox(THREE, 7, 3.2, 6, 0, 1.6, 0, wallMat));
  // wood beams
  g.add(meshBox(THREE, 7.2, 0.25, 6.2, 0, 3.0, 0, woodMat));
  g.add(meshBox(THREE, 7.2, 0.25, 6.2, 0, 0.2, 0, woodMat));
  // pillars
  for (let i=0;i<2;i++) for (let j=0;j<2;j++){
    g.add(meshBox(THREE, 0.3, 3.2, 0.3, -3.3+i*6.6, 1.6, -2.9+j*5.8, woodMat));
  }
  // sliding door
  g.add(meshBox(THREE, 2.0, 2.4, 0.1, 0, 1.2, 3.01, woodMat));
  // Tiered roof (large overhang)
  const roof1 = meshBox(THREE, 9, 0.3, 8, 0, 3.4, 0, roofMat);
  g.add(roof1);
  const roof2 = new THREE.Mesh(
    new THREE.ConeGeometry(5.5, 1.8, 4),
    roofMat
  );
  roof2.rotation.y = Math.PI/4;
  roof2.position.y = 4.4;
  g.add(roof2);
  // paper lantern
  const lantern = new THREE.Mesh(
    new THREE.SphereGeometry(0.3, 12, 8),
    new THREE.MeshStandardMaterial({ color: 0xff8040, emissive: 0xff6020, emissiveIntensity: 0.8, roughness: 0.6 })
  );
  lantern.position.set(2, 2.6, 3.15);
  g.add(lantern);

  g.position.set(x, 0, z);
  g.rotation.y = rotY;
  root.add(g);
  collidables.push({ type:'box', cx: x, cz: z, hx: 3.5, hz: 3, angle: rotY });
}
function pagoda(THREE, root, x, z, collidables) {
  const g = new THREE.Group();
  const wallMat = new THREE.MeshStandardMaterial({ color: 0xe8d8b0, roughness: 0.8 });
  const roofMat = new THREE.MeshStandardMaterial({ color: 0x2a1a12, roughness: 0.8 });
  const tiers = 5;
  let y = 0;
  for (let i=0; i<tiers; i++){
    const scale = 1 - i*0.15;
    const body = meshBox(THREE, 8*scale, 2.4, 8*scale, 0, y + 1.2, 0, wallMat);
    g.add(body);
    // roof overhang
    const roofW = 9.5*scale;
    const roof = new THREE.Mesh(
      new THREE.ConeGeometry(roofW*0.72, 1.4, 4),
      roofMat
    );
    roof.rotation.y = Math.PI/4;
    roof.position.y = y + 2.4 + 0.7;
    g.add(roof);
    y += 3.3;
  }
  // spire
  const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.2, 3, 8), roofMat);
  spire.position.y = y + 1.5;
  g.add(spire);
  g.position.set(x, 0, z);
  root.add(g);
  collidables.push({ x, z, r: 5 });
}
function sakuraTree(THREE, root, x, z, collidables) {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.2, 0.35, 3, 8),
    new THREE.MeshStandardMaterial({ color: 0x3a2010, roughness: 1 })
  );
  trunk.position.y = 1.5; trunk.castShadow = true;
  g.add(trunk);
  // Pink blossom cluster — multiple spheres
  const bloomMat = new THREE.MeshStandardMaterial({ color: 0xffc2d8, roughness: 0.9, emissive: 0x3a1a28, emissiveIntensity: 0.2 });
  for (let i=0;i<6;i++){
    const s = 0.8 + Math.random()*0.6;
    const b = new THREE.Mesh(new THREE.SphereGeometry(s, 10, 8), bloomMat);
    b.position.set((Math.random()-0.5)*2.2, 3 + Math.random()*1.5, (Math.random()-0.5)*2.2);
    b.castShadow = true;
    g.add(b);
  }
  g.position.set(x, 0, z);
  root.add(g);
  collidables.push({ x, z, r: 0.4 });
}
function stoneLantern(THREE, root, x, z, collidables) {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: 0x9a8a7a, roughness: 0.95 });
  g.add(meshBox(THREE, 0.6, 0.3, 0.6, 0, 0.15, 0, mat));
  g.add(meshBox(THREE, 0.4, 0.8, 0.4, 0, 0.7, 0, mat));
  const top = meshBox(THREE, 0.8, 0.3, 0.8, 0, 1.15, 0, mat);
  g.add(top);
  const light = new THREE.Mesh(
    new THREE.BoxGeometry(0.25, 0.3, 0.25),
    new THREE.MeshStandardMaterial({ color: 0xffa060, emissive: 0xff7020, emissiveIntensity: 1.5, roughness: 0.5 })
  );
  light.position.y = 0.95; g.add(light);
  g.position.set(x, 0, z); root.add(g);
  collidables.push({ x, z, r: 0.4 });
}

function makeFallingParticles(THREE, color, count=400, spread=40) {
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(count*3);
  const vel = new Float32Array(count*3);
  for (let i=0;i<count;i++){
    pos[i*3]   = (Math.random()-0.5)*spread*2;
    pos[i*3+1] = Math.random()*25;
    pos[i*3+2] = (Math.random()-0.5)*spread*2;
    vel[i*3]   = (Math.random()-0.5)*0.3;
    vel[i*3+1] = -(0.4 + Math.random()*0.6);
    vel[i*3+2] = (Math.random()-0.5)*0.3;
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.userData.vel = vel;
  geo.userData.spread = spread;
  const mat = new THREE.PointsMaterial({ color, size: 0.18, transparent: true, opacity: 0.9, depthWrite: false });
  return new THREE.Points(geo, mat);
}
function updateFallingParticles(points, dt) {
  const pos = points.geometry.attributes.position;
  const vel = points.geometry.userData.vel;
  const spread = points.geometry.userData.spread;
  for (let i=0;i<pos.count;i++){
    pos.array[i*3]   += vel[i*3]*dt;
    pos.array[i*3+1] += vel[i*3+1]*dt;
    pos.array[i*3+2] += vel[i*3+2]*dt;
    if (pos.array[i*3+1] < 0) {
      pos.array[i*3]   = (Math.random()-0.5)*spread*2;
      pos.array[i*3+1] = 25;
      pos.array[i*3+2] = (Math.random()-0.5)*spread*2;
    }
  }
  pos.needsUpdate = true;
}

// ============================================================
// BIOME: EGYPT — Pyramids + Sphinx-ish + obelisk
// ============================================================
function buildEgypt(api) {
  const { THREE, world, root, collidables, dynamicTickers } = api;
  addGround(THREE, root, 0xe0b875, 600);
  // Sand dunes texture: use bumpy planes
  for (let i=0;i<30;i++){
    const dune = new THREE.Mesh(
      new THREE.SphereGeometry(18+Math.random()*14, 12, 6, 0, Math.PI*2, 0, Math.PI/2),
      new THREE.MeshStandardMaterial({ color: 0xd4a868, roughness: 1 })
    );
    dune.position.set((Math.random()-0.5)*300, -2, (Math.random()-0.5)*300);
    dune.scale.y = 0.25;
    root.add(dune);
  }

  // Great Pyramid
  const pyramidMat = new THREE.MeshStandardMaterial({ color: 0xd0a868, roughness: 0.9 });
  const p1 = new THREE.Mesh(new THREE.ConeGeometry(32, 28, 4), pyramidMat);
  p1.rotation.y = Math.PI/4;
  p1.position.set(0, 14, -60);
  p1.castShadow = true;
  root.add(p1);
  collidables.push({ x: 0, z: -60, r: 26 });

  // Second pyramid
  const p2 = new THREE.Mesh(new THREE.ConeGeometry(26, 22, 4), pyramidMat);
  p2.rotation.y = Math.PI/4;
  p2.position.set(-50, 11, -90);
  p2.castShadow = true;
  root.add(p2);
  collidables.push({ x: -50, z: -90, r: 21 });

  // Third smaller pyramid
  const p3 = new THREE.Mesh(new THREE.ConeGeometry(16, 14, 4), pyramidMat);
  p3.rotation.y = Math.PI/4;
  p3.position.set(50, 7, -100);
  p3.castShadow = true;
  root.add(p3);
  collidables.push({ x: 50, z: -100, r: 13 });

  // Obelisks flanking the path
  const obeliskMat = new THREE.MeshStandardMaterial({ color: 0xc0966a, roughness: 0.7 });
  function obelisk(x, z){
    const g = new THREE.Group();
    const base = meshBox(THREE, 2, 1, 2, 0, 0.5, 0, obeliskMat);
    g.add(base);
    const shaft = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 10, 1.2),
      obeliskMat
    );
    shaft.position.y = 6; shaft.castShadow = true;
    g.add(shaft);
    const pyr = new THREE.Mesh(new THREE.ConeGeometry(1, 1.8, 4), new THREE.MeshStandardMaterial({ color: 0xffdfa0, metalness: 0.9, roughness: 0.2, emissive: 0x553a1a }));
    pyr.rotation.y = Math.PI/4;
    pyr.position.y = 11.9;
    g.add(pyr);
    g.position.set(x, 0, z);
    root.add(g);
    collidables.push({ x, z, r: 1 });
  }
  obelisk(-10, 0); obelisk(10, 0);
  obelisk(-14, -22); obelisk(14, -22);

  // Temple with hieroglyphic columns
  const colMat = new THREE.MeshStandardMaterial({ color: 0xc49864, roughness: 0.85 });
  for (let i=0;i<6;i++){
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.1, 9, 12), colMat);
    shaft.position.set(-6+i*2.4, 4.5, 20);
    shaft.castShadow = true;
    root.add(shaft);
    collidables.push({ x: -6+i*2.4, z: 20, r: 1.1 });
  }
  const lintel = meshBox(THREE, 18, 1.5, 3, 0, 10, 20, obeliskMat);
  root.add(lintel);

  // Sun high
  const sunSprite = makeSunSprite(THREE, 0xffd88a, 25);
  sunSprite.position.set(120, 120, -60);
  root.add(sunSprite);

  // Sandstorm haze (dust particles)
  const dust = makeFallingParticles(THREE, 0xffd8a0, 150, 60);
  dust.material.size = 0.08;
  dust.material.opacity = 0.4;
  root.add(dust);
  dynamicTickers.push((t, dt) => updateFallingParticles(dust, dt*0.4));

  return { spawn: new THREE.Vector3(0, 0, 8), spawnYaw: Math.PI };
}
function makeSunSprite(THREE, color, size) {
  const c = document.createElement('canvas'); c.width=c.height=128;
  const ctx = c.getContext('2d');
  const grd = ctx.createRadialGradient(64,64,4,64,64,60);
  const hex = '#' + color.toString(16).padStart(6,'0');
  grd.addColorStop(0, '#ffffff');
  grd.addColorStop(0.2, hex);
  grd.addColorStop(1, 'rgba(255,200,100,0)');
  ctx.fillStyle = grd;
  ctx.beginPath(); ctx.arc(64,64,60,0,Math.PI*2); ctx.fill();
  const tex = new THREE.CanvasTexture(c);
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  const s = new THREE.Sprite(mat); s.scale.set(size, size, 1);
  return s;
}

// ============================================================
// BIOME: MEDIEVAL — stone village, castle on hill, mist
// ============================================================
function buildMedieval(api) {
  const { THREE, world, root, collidables, dynamicTickers } = api;
  addGround(THREE, root, 0x5a6b4a, 600);
  // cobblestone road
  const road = new THREE.Mesh(new THREE.PlaneGeometry(8, 200), new THREE.MeshStandardMaterial({ color: 0x4a4238, roughness: 0.95 }));
  road.rotation.x = -Math.PI/2; road.position.y = 0.02; road.receiveShadow = true;
  root.add(road);

  // Timbered houses
  for (let i=0;i<6;i++){
    const z = -8 - i*12;
    medievalHouse(THREE, root, -7, z, Math.PI/2, collidables);
    medievalHouse(THREE, root,  7, z, -Math.PI/2, collidables);
  }

  // Castle on a hill at the far end
  const hill = new THREE.Mesh(
    new THREE.ConeGeometry(32, 8, 32),
    new THREE.MeshStandardMaterial({ color: 0x4a5a3a, roughness: 1 })
  );
  hill.position.set(0, 4, -120);
  hill.receiveShadow = true;
  root.add(hill);

  const castle = buildCastle(THREE);
  castle.position.set(0, 8, -120);
  castle.scale.set(1.4, 1.4, 1.4);
  root.add(castle);
  collidables.push({ x: 0, z: -120, r: 12 });

  // Pine forest
  for (let i=0;i<100;i++){
    const x = (Math.random()-0.5)*260;
    const z = (Math.random()-0.5)*260;
    if (Math.abs(x) < 10 && z > -95 && z < 10) continue;
    if (Math.hypot(x, z+120) < 30) continue;
    pineTree(THREE, root, x, z, collidables);
  }

  // Mist
  const mist = makeFogParticles(THREE, 0xc0c8d8, 80);
  root.add(mist);
  dynamicTickers.push((t)=>{ mist.rotation.y = t*0.02; });

  // Torches flickering light
  for (let i=0;i<4;i++){
    const z = -12 - i*22;
    const torch = new THREE.PointLight(0xffa050, 2.2, 14);
    torch.position.set((i%2===0?-5:5), 3, z);
    torch.userData.base = torch.intensity;
    root.add(torch);
    dynamicTickers.push((t) => {
      torch.intensity = torch.userData.base * (0.85 + Math.sin(t*7 + i)*0.12);
    });
  }

  return { spawn: new THREE.Vector3(0, 0, 10), spawnYaw: Math.PI };
}
function medievalHouse(THREE, root, x, z, rotY, collidables) {
  const g = new THREE.Group();
  const wallMat = new THREE.MeshStandardMaterial({ color: 0xeadcc2, roughness: 0.9 });
  const beamMat = new THREE.MeshStandardMaterial({ color: 0x3a2818, roughness: 0.95 });
  const roofMat = new THREE.MeshStandardMaterial({ color: 0x8a3a28, roughness: 0.85 });
  g.add(meshBox(THREE, 6, 3, 5, 0, 1.5, 0, wallMat));
  // timber frame beams
  g.add(meshBox(THREE, 6.2, 0.25, 5.2, 0, 0.1, 0, beamMat));
  g.add(meshBox(THREE, 6.2, 0.25, 5.2, 0, 3.0, 0, beamMat));
  g.add(meshBox(THREE, 0.25, 3, 5.2, -3, 1.5, 0, beamMat));
  g.add(meshBox(THREE, 0.25, 3, 5.2, 3, 1.5, 0, beamMat));
  // diagonal
  const diag = meshBox(THREE, 0.2, 4, 0.2, -1.2, 1.5, 2.55, beamMat);
  diag.rotation.z = Math.PI/4; g.add(diag);
  // roof triangular prism
  const roof = new THREE.Mesh(
    new THREE.CylinderGeometry(0.01, 4, 2.6, 3, 1),
    roofMat
  );
  roof.rotation.z = Math.PI/2;
  roof.rotation.y = Math.PI/2;
  roof.position.y = 4.2;
  roof.scale.z = 1.4;
  g.add(roof);
  // chimney
  g.add(meshBox(THREE, 0.6, 1.5, 0.6, 1.5, 5.1, 0, new THREE.MeshStandardMaterial({ color: 0x6a4030, roughness: 1 })));
  // window
  const window1 = new THREE.Mesh(
    new THREE.PlaneGeometry(0.8, 0.8),
    new THREE.MeshStandardMaterial({ color: 0xffb050, emissive: 0xff7020, emissiveIntensity: 1.2 })
  );
  window1.position.set(0, 1.8, 2.55);
  g.add(window1);

  g.position.set(x, 0, z);
  g.rotation.y = rotY;
  root.add(g);
  collidables.push({ type:'box', cx:x, cz:z, hx:3, hz:2.5, angle: rotY });
}
function buildCastle(THREE) {
  const g = new THREE.Group();
  const stoneMat = new THREE.MeshStandardMaterial({ color: 0x6a6458, roughness: 0.95 });
  const roofMat = new THREE.MeshStandardMaterial({ color: 0x2a2018, roughness: 0.85 });
  // outer walls (square)
  for (let i=0;i<4;i++){
    const a = i*Math.PI/2;
    const wall = meshBox(THREE, 14, 6, 1.5, Math.sin(a)*7, 3, Math.cos(a)*7, stoneMat);
    wall.rotation.y = a;
    g.add(wall);
  }
  // corner towers
  for (let ix=-1;ix<=1;ix+=2) for (let iz=-1;iz<=1;iz+=2) {
    const t = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.6, 10, 12), stoneMat);
    t.position.set(ix*7, 5, iz*7);
    g.add(t);
    const cone = new THREE.Mesh(new THREE.ConeGeometry(1.8, 3, 12), roofMat);
    cone.position.set(ix*7, 11.5, iz*7);
    g.add(cone);
  }
  // keep tower
  const keep = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 3, 14, 12), stoneMat);
  keep.position.y = 7;
  g.add(keep);
  const keepRoof = new THREE.Mesh(new THREE.ConeGeometry(3.5, 5, 12), roofMat);
  keepRoof.position.y = 16.5;
  g.add(keepRoof);
  // flag
  const flag = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.8), new THREE.MeshBasicMaterial({ color: 0xc92028, side: THREE.DoubleSide }));
  flag.position.set(0.7, 19, 0); g.add(flag);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05,0.05,3), stoneMat);
  pole.position.set(0, 18.5, 0); g.add(pole);
  return g;
}
function pineTree(THREE, root, x, z, collidables) {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.28, 2.5, 6),
    new THREE.MeshStandardMaterial({ color: 0x3a2a18, roughness: 1 })
  );
  trunk.position.y = 1.2; g.add(trunk);
  const top = new THREE.Mesh(new THREE.ConeGeometry(1.6, 5, 8), new THREE.MeshStandardMaterial({ color: 0x2a4a1e, roughness: 1 }));
  top.position.y = 4; top.castShadow = true;
  g.add(top);
  const top2 = new THREE.Mesh(new THREE.ConeGeometry(1.2, 3.5, 8), new THREE.MeshStandardMaterial({ color: 0x1e3a18, roughness: 1 }));
  top2.position.y = 5.5; g.add(top2);
  g.position.set(x, 0, z);
  root.add(g);
  collidables.push({ x, z, r: 0.6 });
}
function makeFogParticles(THREE, color, count=50) {
  const geo = new THREE.SphereGeometry(60, 16, 8);
  const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.03, side: THREE.BackSide, depthWrite: false });
  return new THREE.Mesh(geo, mat);
}

// ============================================================
// BIOME: NYC 1920s — Art deco skyscrapers
// ============================================================
function buildNYC(api) {
  const { THREE, world, root, collidables, dynamicTickers } = api;
  addGround(THREE, root, 0x4a4638, 500);
  const street = new THREE.Mesh(new THREE.PlaneGeometry(16, 300), new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.95 }));
  street.rotation.x = -Math.PI/2; street.position.y = 0.01;
  street.receiveShadow = true;
  root.add(street);
  // street markings
  for (let i=0;i<60;i++){
    const mark = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 2.5), new THREE.MeshStandardMaterial({ color: 0xeee0a8, roughness: 1 }));
    mark.rotation.x = -Math.PI/2;
    mark.position.set(0, 0.02, -140 + i*5);
    root.add(mark);
  }

  // Skyscrapers (art deco style)
  const buildingMat = (shade) => new THREE.MeshStandardMaterial({ color: shade, roughness: 0.55, metalness: 0.3 });
  const windowMat = new THREE.MeshStandardMaterial({ color: 0xffd470, emissive: 0xffc060, emissiveIntensity: 0.9 });
  function skyscraper(x, z, w, d, levels, shade) {
    const g = new THREE.Group();
    let y = 0;
    let cw = w, cd = d;
    for (let i=0;i<levels;i++){
      const lh = 6 + Math.random()*3;
      const body = meshBox(THREE, cw, lh, cd, 0, y + lh/2, 0, buildingMat(shade));
      g.add(body);
      // windows (lit rects on surface)
      addBuildingWindows(THREE, g, cw, cd, y, lh, windowMat);
      y += lh;
      // step back each level
      cw *= 0.85; cd *= 0.85;
    }
    // spire
    const spire = new THREE.Mesh(new THREE.ConeGeometry(cw*0.6, 3, 8), new THREE.MeshStandardMaterial({ color: 0x8a7048, metalness: 0.9, roughness: 0.3 }));
    spire.position.y = y + 1.5;
    g.add(spire);
    g.position.set(x, 0, z);
    root.add(g);
    collidables.push({ type:'box', cx: x, cz: z, hx: w/2+0.3, hz: d/2+0.3, angle: 0 });
  }
  // rows of buildings
  for (let i=0; i<10; i++){
    const z = -15 - i*20;
    const shade = 0x302820 + Math.floor(Math.random()*0x202020);
    skyscraper(-18, z, 12+Math.random()*4, 14, 3+Math.floor(Math.random()*3), shade);
    skyscraper( 18, z, 12+Math.random()*4, 14, 3+Math.floor(Math.random()*3), shade);
  }

  // Classic car
  const car = buildClassicCar(THREE);
  car.position.set(0, 0, -10);
  root.add(car);
  dynamicTickers.push((t) => {
    car.position.z = -10 - ((t*6) % 200);
    if (car.position.z < -160) car.position.z = 40;
  });

  // Streetlights
  for (let i=0;i<16;i++){
    const z = -12 - i*12;
    streetLamp(THREE, root, -10, z, dynamicTickers);
    streetLamp(THREE, root,  10, z, dynamicTickers);
  }

  return { spawn: new THREE.Vector3(0, 0, 0), spawnYaw: Math.PI };
}
function addBuildingWindows(THREE, group, w, d, baseY, h, mat) {
  const winH = 0.6, winW = 0.5;
  const rows = Math.floor(h/1.2);
  const colsW = Math.floor(w/1.2);
  const colsD = Math.floor(d/1.2);
  // front / back
  for (let r=0;r<rows;r++) for (let c=0;c<colsW;c++){
    if (Math.random() < 0.25) continue;
    for (let face=0;face<2;face++){
      const win = new THREE.Mesh(new THREE.PlaneGeometry(winW, winH), mat);
      win.position.set(-w/2 + 0.6 + c*1.2, baseY + 0.7 + r*1.2, (face===0? d/2 + 0.01 : -d/2 - 0.01));
      win.rotation.y = face===0 ? 0 : Math.PI;
      group.add(win);
    }
  }
  // left / right
  for (let r=0;r<rows;r++) for (let c=0;c<colsD;c++){
    if (Math.random() < 0.25) continue;
    for (let face=0;face<2;face++){
      const win = new THREE.Mesh(new THREE.PlaneGeometry(winW, winH), mat);
      win.position.set(face===0 ? w/2 + 0.01 : -w/2 - 0.01, baseY + 0.7 + r*1.2, -d/2 + 0.6 + c*1.2);
      win.rotation.y = face===0 ? Math.PI/2 : -Math.PI/2;
      group.add(win);
    }
  }
}
function buildClassicCar(THREE) {
  const g = new THREE.Group();
  const body = meshBox(THREE, 2.2, 1, 5, 0, 0.7, 0, new THREE.MeshStandardMaterial({ color: 0x202028, metalness: 0.7, roughness: 0.25 }));
  g.add(body);
  const cabin = meshBox(THREE, 1.8, 0.7, 2.2, 0, 1.5, 0.3, new THREE.MeshStandardMaterial({ color: 0x0a0a10, metalness: 0.5, roughness: 0.3 }));
  g.add(cabin);
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x101010, roughness: 1 });
  for (let ix=-1;ix<=1;ix+=2) for (let iz=-1;iz<=1;iz+=2){
    const w = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.25, 16), wheelMat);
    w.rotation.z = Math.PI/2;
    w.position.set(ix*1.15, 0.45, iz*1.8);
    g.add(w);
  }
  // headlights
  const hl = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 8), new THREE.MeshStandardMaterial({ color: 0xffe8b0, emissive: 0xffd090, emissiveIntensity: 1.2 }));
  hl.position.set(0.7, 0.9, 2.5);
  g.add(hl);
  const hl2 = hl.clone(); hl2.position.x = -0.7; g.add(hl2);
  return g;
}
function streetLamp(THREE, root, x, z, tickers) {
  const g = new THREE.Group();
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 5, 8), new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.8, roughness: 0.3 }));
  pole.position.y = 2.5; g.add(pole);
  const globe = new THREE.Mesh(
    new THREE.SphereGeometry(0.3, 12, 10),
    new THREE.MeshStandardMaterial({ color: 0xffe8b0, emissive: 0xffc870, emissiveIntensity: 1.4, roughness: 0.4 })
  );
  globe.position.y = 5.2; g.add(globe);
  const pt = new THREE.PointLight(0xffc870, 1, 15);
  pt.position.y = 5.2; g.add(pt);
  g.position.set(x, 0, z);
  root.add(g);
  if (tickers) {
    const base = pt.intensity;
    tickers.push((t) => { pt.intensity = base * (0.92 + Math.sin(t*8 + x)*0.05); });
  }
}

// ============================================================
// BIOME: NEO TOKYO — Cyberpunk neon city at night
// ============================================================
function buildNeoTokyo(api) {
  const { THREE, world, root, collidables, dynamicTickers } = api;
  addGround(THREE, root, 0x0b0b16, 600);
  // wet asphalt reflection look
  const street = new THREE.Mesh(new THREE.PlaneGeometry(18, 400), new THREE.MeshStandardMaterial({ color: 0x10101c, metalness: 0.7, roughness: 0.2 }));
  street.rotation.x = -Math.PI/2; street.position.y = 0.01; street.receiveShadow = true;
  root.add(street);

  // Rain (falling particles)
  const rain = makeFallingParticles(THREE, 0x88aadd, 1200, 50);
  rain.material.size = 0.08;
  rain.material.opacity = 0.5;
  root.add(rain);
  dynamicTickers.push((t, dt) => updateFallingParticles(rain, dt*3));

  // Cyberpunk towers with neon signs
  const neonColors = [0xff2e8a, 0x2ee8ff, 0xc974ff, 0xffdd00, 0xa8ff40, 0xff8030];
  for (let i=0;i<18;i++){
    const z = -10 - i*15;
    const side = i % 2;
    const x = side===0 ? -16 - Math.random()*8 : 16 + Math.random()*8;
    cyberTower(THREE, root, x, z, 5 + Math.random()*10, 4+Math.random()*4, 12+Math.random()*20, neonColors, collidables);
  }
  for (let i=0;i<12;i++){
    const z = 5 - i*18;
    cyberTower(THREE, root, -30 - Math.random()*14, z, 6+Math.random()*6, 6+Math.random()*4, 20+Math.random()*28, neonColors, collidables);
    cyberTower(THREE, root,  30 + Math.random()*14, z, 6+Math.random()*6, 6+Math.random()*4, 20+Math.random()*28, neonColors, collidables);
  }

  // Flying cars
  for (let i=0;i<4;i++){
    const fc = buildFlyingCar(THREE, i%2===0? 0xff2e8a : 0x2ee8ff);
    fc.position.set((Math.random()-0.5)*40, 12+Math.random()*10, -50 - i*30);
    root.add(fc);
    const speed = 8 + Math.random()*6;
    dynamicTickers.push((t) => {
      fc.position.z = ((fc.position.z + speed*0.06) % 300) - 150;
      fc.position.y = 15 + Math.sin(t*0.8 + i)*3;
      fc.rotation.y = Math.PI;
    });
  }

  // Ground neon glow
  const neonGlow = new THREE.Mesh(
    new THREE.RingGeometry(1, 60, 64),
    new THREE.MeshBasicMaterial({ color: 0xa86bff, transparent: true, opacity: 0.08, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending })
  );
  neonGlow.rotation.x = -Math.PI/2;
  neonGlow.position.y = 0.05;
  root.add(neonGlow);

  // Hologram billboards
  for (let i=0;i<6;i++){
    const z = -25 - i*30;
    const side = i%2===0? -12 : 12;
    const board = new THREE.Mesh(
      new THREE.PlaneGeometry(6, 3),
      new THREE.MeshBasicMaterial({ color: neonColors[i%neonColors.length], transparent: true, opacity: 0.85 })
    );
    board.position.set(side, 6, z);
    board.rotation.y = side<0 ? Math.PI/2 : -Math.PI/2;
    root.add(board);
  }

  // Moon (dim)
  const moon = makeSunSprite(THREE, 0xffc5ff, 18);
  moon.position.set(80, 90, -100);
  root.add(moon);

  return { spawn: new THREE.Vector3(0, 0, 5), spawnYaw: Math.PI };
}
function cyberTower(THREE, root, x, z, w, d, h, neonColors, collidables) {
  const g = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x080818, roughness: 0.5, metalness: 0.4, emissive: 0x020208 });
  const body = meshBox(THREE, w, h, d, 0, h/2, 0, bodyMat);
  g.add(body);
  // Neon strips going up
  const stripColor = neonColors[Math.floor(Math.random()*neonColors.length)];
  const strip = new THREE.Mesh(
    new THREE.BoxGeometry(0.12, h*0.9, 0.05),
    new THREE.MeshBasicMaterial({ color: stripColor })
  );
  strip.position.set(-w/2 - 0.05, h/2, d/2 - 0.5);
  g.add(strip);
  strip.userData.glow = stripColor;
  const stripL = new THREE.PointLight(stripColor, 0.8, 12);
  stripL.position.copy(strip.position); g.add(stripL);

  const strip2 = strip.clone(); strip2.position.x = w/2 + 0.05;
  g.add(strip2);

  // Windows: irregular lit grid
  const winRows = Math.floor(h/1.8);
  const winColsW = Math.floor(w/1.2);
  for (let r=0;r<winRows;r++){
    for (let c=0;c<winColsW;c++){
      if (Math.random()>0.4) continue;
      const color = Math.random()<0.3 ? neonColors[Math.floor(Math.random()*neonColors.length)] : 0xffb048;
      const win = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.7), new THREE.MeshBasicMaterial({ color }));
      win.position.set(-w/2 + 0.6 + c*1.2, 1 + r*1.8, d/2 + 0.01);
      g.add(win);
    }
  }
  // neon kanji sign (canvas)
  if (Math.random()<0.8) {
    const signs = ['電','夢','禁','開','愛','極','超','星','閃','影','炎','灯'];
    const signC = document.createElement('canvas'); signC.width=signC.height=256;
    const ctx = signC.getContext('2d');
    ctx.fillStyle = 'rgba(0,0,0,0.85)'; ctx.fillRect(0,0,256,256);
    const col = '#' + stripColor.toString(16).padStart(6,'0');
    ctx.fillStyle = col;
    ctx.font = 'bold 190px serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.shadowColor = col; ctx.shadowBlur = 30;
    ctx.fillText(signs[Math.floor(Math.random()*signs.length)], 128, 140);
    const tex = new THREE.CanvasTexture(signC);
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 2.5), new THREE.MeshBasicMaterial({ map: tex, transparent: true }));
    sign.position.set(0, h*0.6, d/2 + 0.08);
    g.add(sign);
  }
  g.position.set(x, 0, z);
  root.add(g);
  collidables.push({ type:'box', cx:x, cz:z, hx: w/2+0.3, hz: d/2+0.3, angle: 0 });
}
function buildFlyingCar(THREE, color) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(2.5, 0.6, 5),
    new THREE.MeshStandardMaterial({ color: 0x101018, metalness: 0.8, roughness: 0.25 })
  );
  body.position.y = 0; g.add(body);
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(2, 0.5, 2.5), new THREE.MeshStandardMaterial({ color: 0x0a0a18, metalness: 0.5, roughness: 0.2, emissive: 0x3040a0, emissiveIntensity: 0.4 }));
  cabin.position.set(0, 0.5, -0.5); g.add(cabin);
  // glowing underside
  const under = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 4.8), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.8 }));
  under.rotation.x = Math.PI/2;
  under.position.y = -0.3; g.add(under);
  // trail
  const trail = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 6), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.4 }));
  trail.rotation.x = Math.PI/2; trail.position.set(0, 0, 4); g.add(trail);
  return g;
}

// ============================================================
// BIOME: MARS — Red planet colony with domes
// ============================================================
function buildMars(api) {
  const { THREE, world, root, collidables, dynamicTickers } = api;
  addGround(THREE, root, 0x9c4628, 600);
  // rocky terrain (random rocks)
  for (let i=0;i<90;i++){
    const x = (Math.random()-0.5)*300;
    const z = (Math.random()-0.5)*300;
    if (Math.abs(x)<8 && Math.abs(z)<8) continue;
    const rock = new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.5 + Math.random()*2),
      new THREE.MeshStandardMaterial({ color: 0x7a3a20, roughness: 1 })
    );
    rock.position.set(x, -0.2, z);
    rock.rotation.set(Math.random()*Math.PI, Math.random()*Math.PI, Math.random()*Math.PI);
    rock.castShadow = true;
    root.add(rock);
    if (Math.hypot(x, z) > 6) collidables.push({ x, z, r: 1 });
  }
  // Mountains in distance
  addDistantMountains(THREE, root, 0x5a2818, 250, 14);

  // Big glass dome colony
  function dome(x, z, radius, ringMat) {
    const g = new THREE.Group();
    const glass = new THREE.Mesh(
      new THREE.SphereGeometry(radius, 32, 16, 0, Math.PI*2, 0, Math.PI/2),
      new THREE.MeshStandardMaterial({ color: 0xc0e4ff, metalness: 0.3, roughness: 0.05, transparent: true, opacity: 0.32, side: THREE.DoubleSide, emissive: 0x203040 })
    );
    g.add(glass);
    // ring base
    const ring = new THREE.Mesh(
      new THREE.CylinderGeometry(radius*1.02, radius*1.02, 0.6, 32),
      ringMat
    );
    ring.position.y = 0.3; g.add(ring);
    // Internal buildings silhouette
    for (let i=0;i<6;i++){
      const bh = 2 + Math.random()*3;
      const b = meshBox(THREE, 1.5+Math.random(), bh, 1.5+Math.random(),
        (Math.random()-0.5)*radius*1.2, bh/2, (Math.random()-0.5)*radius*1.2,
        new THREE.MeshStandardMaterial({ color: 0xeeecea, roughness: 0.8 }));
      g.add(b);
    }
    // tree / green (life support)
    const tree = new THREE.Mesh(new THREE.SphereGeometry(0.8, 10, 8), new THREE.MeshStandardMaterial({ color: 0x4a8030, roughness: 0.8, emissive: 0x0a3010 }));
    tree.position.set(1, 1.2, 0); g.add(tree);
    g.position.set(x, 0, z);
    root.add(g);
    collidables.push({ x, z, r: radius+0.3 });
  }
  const ringMat = new THREE.MeshStandardMaterial({ color: 0xdad6cc, metalness: 0.6, roughness: 0.3 });
  dome(-30, -40, 9, ringMat);
  dome(0, -70, 14, ringMat);
  dome(30, -40, 9, ringMat);
  dome(-50, 10, 7, ringMat);
  dome(55, 5, 7, ringMat);

  // Connecting tubes between domes
  function tube(x1,z1,x2,z2) {
    const dx = x2-x1, dz = z2-z1;
    const len = Math.hypot(dx, dz);
    const tube = new THREE.Mesh(
      new THREE.CylinderGeometry(1.5, 1.5, len, 12, 1, true),
      new THREE.MeshStandardMaterial({ color: 0xc0e4ff, transparent: true, opacity: 0.3, side: THREE.DoubleSide, metalness: 0.5 })
    );
    tube.rotation.z = Math.PI/2;
    tube.rotation.y = -Math.atan2(dz, dx);
    tube.position.set((x1+x2)/2, 1.5, (z1+z2)/2);
    root.add(tube);
  }
  tube(-30, -40, 0, -70);
  tube(30, -40, 0, -70);
  tube(-50, 10, -30, -40);
  tube(55, 5, 30, -40);

  // Two moons
  const moonA = makeSunSprite(THREE, 0xf0e8e0, 7);
  moonA.position.set(100, 140, -80);
  root.add(moonA);
  const moonB = makeSunSprite(THREE, 0xffe0c0, 4);
  moonB.position.set(-70, 110, 30);
  root.add(moonB);

  // Dust particles
  const dust = makeFallingParticles(THREE, 0xcc8040, 200, 80);
  dust.material.size = 0.07; dust.material.opacity = 0.5;
  root.add(dust);
  dynamicTickers.push((t, dt) => updateFallingParticles(dust, dt*0.2));

  // Lander
  const lander = new THREE.Group();
  const lb = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.8, 2, 12), new THREE.MeshStandardMaterial({ color: 0xd8d4cc, metalness: 0.7, roughness: 0.3 }));
  lb.position.y = 1; lander.add(lb);
  const top = new THREE.Mesh(new THREE.ConeGeometry(1.2, 1.5, 12), new THREE.MeshStandardMaterial({ color: 0xd8d4cc, metalness: 0.7, roughness: 0.3 }));
  top.position.y = 2.8; lander.add(top);
  for (let i=0;i<4;i++){
    const a=i*Math.PI/2;
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.08,0.1,1.8,6), new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.8, roughness: 0.3 }));
    leg.position.set(Math.cos(a)*1.3, 0.5, Math.sin(a)*1.3);
    leg.rotation.z = Math.cos(a)*0.3; leg.rotation.x = Math.sin(a)*0.3;
    lander.add(leg);
  }
  lander.position.set(15, 0, 15);
  root.add(lander);
  collidables.push({ x: 15, z: 15, r: 2.2 });

  return { spawn: new THREE.Vector3(0, 0, 0), spawnYaw: Math.PI };
}

// ============================================================
// BIOME: ATLANTIS — underwater city
// ============================================================
function buildAtlantis(api) {
  const { THREE, world, root, collidables, dynamicTickers } = api;
  addGround(THREE, root, 0x0a3848, 500);
  // sea floor sand
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(400, 400, 32, 32),
    new THREE.MeshStandardMaterial({ color: 0x1a6070, roughness: 1 })
  );
  floor.rotation.x = -Math.PI/2; floor.position.y = 0.01;
  floor.receiveShadow = true;
  root.add(floor);

  // Temple (Atlantean)
  const marbleMat = new THREE.MeshStandardMaterial({ color: 0xe8e4d8, roughness: 0.5, metalness: 0.3, emissive: 0x104050, emissiveIntensity: 0.3 });
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xffd080, metalness: 0.95, roughness: 0.2, emissive: 0x5a3010, emissiveIntensity: 0.5 });
  const temple = new THREE.Group();
  temple.add(meshBox(THREE, 20, 1, 18, 0, 0.5, 0, marbleMat));
  for (let i=0;i<6;i++){
    const sh = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.9, 9, 12), marbleMat);
    sh.position.set(-7.5+i*3, 5.5, 8);
    temple.add(sh);
    collidables.push({ x: -7.5+i*3, z: 8 - 40, r: 1 });
  }
  const roof = meshBox(THREE, 22, 2, 3, 0, 11, 8, goldMat);
  temple.add(roof);
  temple.add(meshBox(THREE, 16, 7, 14, 0, 5, -1, marbleMat));
  // Big dome on top
  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(7, 24, 12, 0, Math.PI*2, 0, Math.PI/2),
    goldMat
  );
  dome.position.set(0, 8.5, -1);
  temple.add(dome);
  temple.position.set(0, 0, -40);
  root.add(temple);
  collidables.push({ type:'box', cx:0, cz:-40, hx:10, hz:9, angle:0 });

  // Smaller buildings around
  for (let i=0;i<8;i++){
    const a = (i/8)*Math.PI*2;
    const dist = 55;
    const x = Math.cos(a)*dist, z = Math.sin(a)*dist - 40;
    const b = new THREE.Group();
    b.add(meshBox(THREE, 5, 6, 5, 0, 3, 0, marbleMat));
    const d = new THREE.Mesh(
      new THREE.SphereGeometry(3.3, 20, 12, 0, Math.PI*2, 0, Math.PI/2),
      goldMat
    );
    d.position.y = 6; b.add(d);
    b.position.set(x, 0, z);
    root.add(b);
    collidables.push({ x, z, r: 3 });
  }

  // Light rays from above
  for (let i=0;i<6;i++){
    const ray = new THREE.Mesh(
      new THREE.ConeGeometry(6+Math.random()*4, 80, 16, 1, true),
      new THREE.MeshBasicMaterial({ color: 0x80e0ff, transparent: true, opacity: 0.06, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending })
    );
    ray.position.set((Math.random()-0.5)*120, 40, (Math.random()-0.5)*120 - 40);
    root.add(ray);
  }

  // Bubbles rising
  const bubbles = makeRisingParticles(THREE, 0xc0f0ff, 300, 60);
  root.add(bubbles);
  dynamicTickers.push((t,dt) => updateRisingParticles(bubbles, dt));

  // Fish
  for (let i=0;i<12;i++){
    const fish = new THREE.Mesh(new THREE.SphereGeometry(0.25, 8, 6), new THREE.MeshStandardMaterial({ color: [0xffcc50, 0xff5050, 0x50c0ff, 0xc8a0ff][i%4], emissive: 0x202020, metalness: 0.3, roughness: 0.5 }));
    fish.scale.set(1, 0.6, 1.8);
    fish.userData.angle = Math.random()*Math.PI*2;
    fish.userData.radius = 15 + Math.random()*20;
    fish.userData.speed = 0.3 + Math.random()*0.4;
    fish.userData.height = 2 + Math.random()*6;
    fish.userData.phase = Math.random()*Math.PI*2;
    root.add(fish);
    dynamicTickers.push((t) => {
      fish.userData.angle += fish.userData.speed * 0.02;
      fish.position.x = Math.cos(fish.userData.angle)*fish.userData.radius;
      fish.position.z = Math.sin(fish.userData.angle)*fish.userData.radius - 40;
      fish.position.y = fish.userData.height + Math.sin(t + fish.userData.phase)*0.4;
      fish.rotation.y = -fish.userData.angle + Math.PI/2;
    });
  }

  return { spawn: new THREE.Vector3(0, 0, 10), spawnYaw: Math.PI };
}
function makeRisingParticles(THREE, color, count, spread) {
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(count*3);
  const vel = new Float32Array(count*3);
  for (let i=0;i<count;i++){
    pos[i*3]   = (Math.random()-0.5)*spread*2;
    pos[i*3+1] = Math.random()*30;
    pos[i*3+2] = (Math.random()-0.5)*spread*2 - 40;
    vel[i*3]   = (Math.random()-0.5)*0.1;
    vel[i*3+1] = 0.3 + Math.random()*0.3;
    vel[i*3+2] = (Math.random()-0.5)*0.1;
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.userData.vel = vel;
  geo.userData.spread = spread;
  const mat = new THREE.PointsMaterial({ color, size: 0.25, transparent: true, opacity: 0.7, depthWrite: false, blending: THREE.AdditiveBlending });
  return new THREE.Points(geo, mat);
}
function updateRisingParticles(points, dt) {
  const pos = points.geometry.attributes.position;
  const vel = points.geometry.userData.vel;
  const sp = points.geometry.userData.spread;
  for (let i=0;i<pos.count;i++){
    pos.array[i*3]   += vel[i*3]*dt;
    pos.array[i*3+1] += vel[i*3+1]*dt;
    pos.array[i*3+2] += vel[i*3+2]*dt;
    if (pos.array[i*3+1] > 40) {
      pos.array[i*3]   = (Math.random()-0.5)*sp*2;
      pos.array[i*3+1] = 0;
      pos.array[i*3+2] = (Math.random()-0.5)*sp*2 - 40;
    }
  }
  pos.needsUpdate = true;
}

// ============================================================
// BIOME: CHANG'AN (Tang dynasty plaza with pagoda)
// ============================================================
function buildChangAn(api) {
  const { THREE, world, root, collidables, dynamicTickers } = api;
  addGround(THREE, root, 0x7a5234, 500);
  const plaza = new THREE.Mesh(new THREE.PlaneGeometry(40, 60), new THREE.MeshStandardMaterial({ color: 0x9a6a46, roughness: 0.9 }));
  plaza.rotation.x = -Math.PI/2; plaza.position.y = 0.01;
  plaza.receiveShadow = true;
  root.add(plaza);

  // Great Tang pagoda
  const g = new THREE.Group();
  const wallMat = new THREE.MeshStandardMaterial({ color: 0xe4b880, roughness: 0.8 });
  const roofMat = new THREE.MeshStandardMaterial({ color: 0x7a2020, roughness: 0.7 });
  let y = 0;
  for (let i=0; i<6; i++){
    const scale = 1 - i*0.12;
    g.add(meshBox(THREE, 9*scale, 2.6, 9*scale, 0, y+1.3, 0, wallMat));
    const roof = new THREE.Mesh(new THREE.ConeGeometry(7*scale, 1.5, 4), roofMat);
    roof.rotation.y = Math.PI/4;
    roof.position.y = y + 2.6 + 0.75;
    g.add(roof);
    y += 3.5;
  }
  g.position.set(0, 0, -30);
  root.add(g);
  collidables.push({ x: 0, z: -30, r: 6 });

  // Two palace buildings flanking
  function palace(x, z) {
    const p = new THREE.Group();
    p.add(meshBox(THREE, 14, 5, 8, 0, 2.5, 0, wallMat));
    // upturned roof
    const roof = new THREE.Mesh(new THREE.ConeGeometry(10, 2.5, 4), roofMat);
    roof.rotation.y = Math.PI/4;
    roof.position.y = 5.5; p.add(roof);
    // red pillars
    const pillarMat = new THREE.MeshStandardMaterial({ color: 0x8a2020, roughness: 0.5 });
    for (let i=0;i<5;i++){
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.25, 4, 8), pillarMat);
      col.position.set(-6+i*3, 2, 4.2);
      p.add(col);
    }
    p.position.set(x, 0, z);
    root.add(p);
    collidables.push({ x, z, r: 7 });
  }
  palace(-20, -25);
  palace( 20, -25);

  // Lanterns along path
  for (let i=0;i<10;i++){
    const z = 5 - i*4;
    hangingLantern(THREE, root, -3, z, 0xff4020);
    hangingLantern(THREE, root,  3, z, 0xff4020);
  }

  // Willow trees
  for (let i=0;i<20;i++){
    const x = (Math.random()-0.5)*100;
    const z = (Math.random()-0.5)*100;
    if (Math.abs(x)<6 && z>-40 && z<15) continue;
    willowTree(THREE, root, x, z, collidables);
  }

  // Mountains distant
  addDistantMountains(THREE, root, 0x6a4028, 220, 16);

  return { spawn: new THREE.Vector3(0, 0, 10), spawnYaw: Math.PI };
}
function hangingLantern(THREE, root, x, z, color) {
  const g = new THREE.Group();
  const str = new THREE.Mesh(new THREE.CylinderGeometry(0.02,0.02,2.5,6), new THREE.MeshStandardMaterial({ color: 0x202010 }));
  str.position.y = 4; g.add(str);
  const l = new THREE.Mesh(
    new THREE.SphereGeometry(0.35, 12, 10),
    new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 1.5, roughness: 0.5 })
  );
  l.position.y = 2.5; g.add(l);
  g.position.set(x, 0, z);
  root.add(g);
}
function willowTree(THREE, root, x, z, collidables) {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, 3, 6), new THREE.MeshStandardMaterial({ color: 0x3a2818 }));
  trunk.position.y = 1.5; g.add(trunk);
  for (let i=0;i<8;i++){
    const a = (i/8)*Math.PI*2;
    const branch = new THREE.Mesh(
      new THREE.ConeGeometry(0.6, 2.5, 6),
      new THREE.MeshStandardMaterial({ color: 0x6a8030, roughness: 1, emissive: 0x102010 })
    );
    branch.position.set(Math.cos(a)*1.3, 2.5, Math.sin(a)*1.3);
    branch.rotation.z = Math.cos(a)*0.5;
    branch.rotation.x = Math.sin(a)*0.5;
    g.add(branch);
  }
  g.position.set(x, 0, z);
  root.add(g);
  collidables.push({ x, z, r: 0.5 });
}

// ============================================================
// BIOME: VENICE — canals, gondolas, palazzi
// ============================================================
function buildVenice(api) {
  const { THREE, world, root, collidables, dynamicTickers } = api;
  addGround(THREE, root, 0x7a6a5a, 400);
  // Canal
  const canal = new THREE.Mesh(
    new THREE.PlaneGeometry(14, 200),
    new THREE.MeshStandardMaterial({ color: 0x2a5060, metalness: 0.5, roughness: 0.1, transparent: true, opacity: 0.85 })
  );
  canal.rotation.x = -Math.PI/2; canal.position.y = -0.3;
  root.add(canal);
  // Canal walls (raised platforms for walking)
  const wallMat = new THREE.MeshStandardMaterial({ color: 0xd4c2a0, roughness: 0.85 });
  const leftWalk = meshBox(THREE, 4, 0.3, 200, -9, 0.15, 0, wallMat);
  const rightWalk = meshBox(THREE, 4, 0.3, 200, 9, 0.15, 0, wallMat);
  root.add(leftWalk); root.add(rightWalk);

  // Palazzi on both sides
  for (let i=0;i<8;i++){
    const z = -10 - i*16;
    venicePalazzo(THREE, root, -15, z, Math.PI/2, collidables);
    venicePalazzo(THREE, root,  15, z, -Math.PI/2, collidables);
  }
  for (let i=0;i<3;i++){
    const z = 20 + i*16;
    venicePalazzo(THREE, root, -15, z, Math.PI/2, collidables);
    venicePalazzo(THREE, root,  15, z, -Math.PI/2, collidables);
  }

  // Campanile (bell tower)
  const camp = new THREE.Group();
  camp.add(meshBox(THREE, 5, 22, 5, 0, 11, 0, new THREE.MeshStandardMaterial({ color: 0xc08060, roughness: 0.85 })));
  // Pyramid top
  const top = new THREE.Mesh(new THREE.ConeGeometry(3, 4, 4), new THREE.MeshStandardMaterial({ color: 0x6a3028, roughness: 0.7 }));
  top.rotation.y = Math.PI/4; top.position.y = 24;
  camp.add(top);
  camp.position.set(-30, 0, -60);
  root.add(camp);
  collidables.push({ x: -30, z: -60, r: 4 });

  // Gondolas
  for (let i=0;i<4;i++){
    const g = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 0.35, 5),
      new THREE.MeshStandardMaterial({ color: 0x0a0a10, roughness: 0.4 })
    );
    body.position.y = -0.1; g.add(body);
    const tipF = new THREE.Mesh(new THREE.ConeGeometry(0.3, 1.2, 4), new THREE.MeshStandardMaterial({ color: 0x0a0a10 }));
    tipF.rotation.x = Math.PI/2; tipF.position.set(0, 0, 2.8);
    g.add(tipF);
    const tipB = tipF.clone(); tipB.position.z = -2.8; tipB.rotation.x = -Math.PI/2;
    g.add(tipB);
    g.position.set((i%2===0?-2:2), -0.3, -20 - i*30);
    g.userData.phase = Math.random()*Math.PI*2;
    root.add(g);
    dynamicTickers.push((t) => {
      g.position.y = -0.3 + Math.sin(t*1.5 + g.userData.phase)*0.06;
      g.rotation.z = Math.sin(t*1.3 + g.userData.phase)*0.04;
      g.position.z -= 0.02;
      if (g.position.z < -130) g.position.z = 80;
    });
  }

  // Gulls
  addFlock(THREE, root, dynamicTickers, 0xffffff, 6, 100);

  // Soft morning mist
  const mist = makeFogParticles(THREE, 0xe4dfe8, 1);
  root.add(mist);

  return { spawn: new THREE.Vector3(0, 0, 8), spawnYaw: Math.PI };
}
function venicePalazzo(THREE, root, x, z, rotY, collidables) {
  const g = new THREE.Group();
  const wallMat = new THREE.MeshStandardMaterial({ color: 0xe4b498, roughness: 0.85 });
  const trimMat = new THREE.MeshStandardMaterial({ color: 0xddd4b8, roughness: 0.7 });
  const roofMat = new THREE.MeshStandardMaterial({ color: 0xb84828, roughness: 0.7 });
  g.add(meshBox(THREE, 9, 10, 8, 0, 5, 0, wallMat));
  // windows (arched look)
  for (let lv=0;lv<3;lv++){
    for (let i=0;i<3;i++){
      const win = new THREE.Mesh(
        new THREE.PlaneGeometry(0.9, 1.5),
        new THREE.MeshStandardMaterial({ color: 0xffc070, emissive: 0xff9040, emissiveIntensity: 0.9 })
      );
      win.position.set(-2.8 + i*2.8, 2 + lv*3, 4.01);
      g.add(win);
      const frame = new THREE.Mesh(
        new THREE.PlaneGeometry(1.1, 1.8),
        trimMat
      );
      frame.position.copy(win.position); frame.position.z = 4.00;
      g.add(frame);
    }
  }
  // tile roof
  const roof = new THREE.Mesh(new THREE.ConeGeometry(6, 2, 4), roofMat);
  roof.rotation.y = Math.PI/4; roof.position.y = 11;
  g.add(roof);
  g.position.set(x, 0, z); g.rotation.y = rotY;
  root.add(g);
  collidables.push({ type:'box', cx:x, cz:z, hx: 4.5, hz: 4, angle: rotY });
}

// ============================================================
// BIOME: SPACE STATION — glass floor with Earth below
// ============================================================
function buildSpaceStation(api) {
  const { THREE, world, root, collidables, dynamicTickers } = api;
  // Starfield background
  const stars = makeStarSphere(THREE);
  root.add(stars);

  // Floor (large metal platform)
  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(60, 64),
    new THREE.MeshStandardMaterial({ color: 0x1a2030, metalness: 0.6, roughness: 0.3, side: THREE.DoubleSide })
  );
  floor.rotation.x = -Math.PI/2; floor.position.y = 0;
  floor.receiveShadow = true;
  root.add(floor);
  // Panels pattern on floor
  for (let i=0;i<16;i++){
    const a = (i/16)*Math.PI*2;
    const panel = new THREE.Mesh(
      new THREE.PlaneGeometry(3, 50),
      new THREE.MeshStandardMaterial({ color: 0x2a3448, roughness: 0.3, metalness: 0.8 })
    );
    panel.rotation.x = -Math.PI/2; panel.rotation.z = a;
    panel.position.y = 0.02;
    root.add(panel);
  }

  // Central column with glass window
  const column = new THREE.Group();
  for (let i=0;i<4;i++){
    const a = i*Math.PI/2;
    const w = meshBox(THREE, 2, 14, 0.4,
      Math.cos(a)*3, 7, Math.sin(a)*3,
      new THREE.MeshStandardMaterial({ color: 0xe8ecf0, metalness: 0.7, roughness: 0.2 }));
    w.rotation.y = a;
    column.add(w);
  }
  // dome top
  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(4.5, 24, 12, 0, Math.PI*2, 0, Math.PI/2),
    new THREE.MeshStandardMaterial({ color: 0x88a0c0, transparent: true, opacity: 0.25, metalness: 0.6, roughness: 0.1 })
  );
  dome.position.y = 14;
  column.add(dome);
  column.position.set(0, 0, -15);
  root.add(column);
  collidables.push({ x: 0, z: -15, r: 4.5 });

  // Outer ring structures
  for (let i=0;i<8;i++){
    const a = (i/8)*Math.PI*2;
    const x = Math.cos(a)*40, z = Math.sin(a)*40;
    const b = new THREE.Group();
    b.add(meshBox(THREE, 4, 6, 4, 0, 3, 0, new THREE.MeshStandardMaterial({ color: 0xdad4ca, metalness: 0.6, roughness: 0.3 })));
    const light = new THREE.Mesh(
      new THREE.PlaneGeometry(0.8, 2),
      new THREE.MeshBasicMaterial({ color: 0x80aaff })
    );
    light.position.set(2.01, 3, 0);
    light.rotation.y = Math.PI/2;
    b.add(light);
    b.position.set(x, 0, z);
    b.rotation.y = -a;
    root.add(b);
    collidables.push({ x, z, r: 2.8 });
  }

  // Earth below — big sphere
  const earth = new THREE.Mesh(
    new THREE.SphereGeometry(120, 48, 32),
    new THREE.MeshStandardMaterial({ color: 0x1a4a8a, metalness: 0.3, roughness: 0.7, emissive: 0x081830 })
  );
  earth.position.set(0, -160, 0);
  root.add(earth);
  // Continents (random bumps in green)
  for (let i=0;i<30;i++){
    const phi = Math.acos(Math.random()*2-1);
    const theta = Math.random()*Math.PI*2;
    const x = 120*Math.sin(phi)*Math.cos(theta);
    const y = 120*Math.cos(phi);
    const z = 120*Math.sin(phi)*Math.sin(theta);
    const patch = new THREE.Mesh(
      new THREE.SphereGeometry(15 + Math.random()*12, 8, 6),
      new THREE.MeshStandardMaterial({ color: 0x3a7a30, emissive: 0x0a2010 })
    );
    patch.position.set(x, y - 160, z);
    patch.scale.set(1, 0.15, 1);
    root.add(patch);
  }
  dynamicTickers.push((t) => { earth.rotation.y = t * 0.02; });

  // Sun very bright + distant
  const sunPos = new THREE.Vector3(200, 20, 0);
  const sun = makeSunSprite(THREE, 0xffffff, 30);
  sun.position.copy(sunPos);
  root.add(sun);

  return { spawn: new THREE.Vector3(0, 0, 20), spawnYaw: Math.PI };
}
function makeStarSphere(THREE) {
  const g = new THREE.BufferGeometry();
  const count = 3500;
  const pos = new Float32Array(count*3);
  const col = new Float32Array(count*3);
  for (let i=0;i<count;i++){
    const r = 600;
    const th = Math.random()*Math.PI*2;
    const ph = Math.acos(Math.random()*2-1);
    pos[i*3]   = r*Math.sin(ph)*Math.cos(th);
    pos[i*3+1] = r*Math.cos(ph);
    pos[i*3+2] = r*Math.sin(ph)*Math.sin(th);
    const br = 0.5 + Math.random()*0.5;
    col[i*3] = br; col[i*3+1] = br; col[i*3+2] = Math.min(1, br+0.15);
  }
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const m = new THREE.PointsMaterial({ size: 1.5, vertexColors: true, transparent: true, opacity: 1, sizeAttenuation: true, depthWrite: false, blending: THREE.AdditiveBlending });
  return new THREE.Points(g, m);
}
