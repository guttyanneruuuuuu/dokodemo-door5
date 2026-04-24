// ============================================================
// WARPDOOR v8 — Procedural World Builder (Realism Upgrade)
// ============================================================

export function buildWorld(world, THREE) {
  const root = new THREE.Group();
  root.name = `world-${world.id}`;
  const p = world.palette;

  // Sky dome
  const skyDome = makeSkyDome(THREE, p);

  // Ambient
  const ambient = new THREE.AmbientLight(p.ambient, p.ambientI);
  root.add(ambient);

  // Sun / main directional — upgraded shadow resolution
  const sun = new THREE.DirectionalLight(p.sun, p.sunI);
  sun.position.set(...p.sunPos);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left   = -80;
  sun.shadow.camera.right  =  80;
  sun.shadow.camera.top    =  80;
  sun.shadow.camera.bottom = -80;
  sun.shadow.camera.near   = 0.5;
  sun.shadow.camera.far    = 400;
  sun.shadow.bias = -0.0003;
  root.add(sun);

  // Hemisphere fill
  const hemi = new THREE.HemisphereLight(p.sky[0], p.ground, 0.55);
  root.add(hemi);

  // Shared state
  const collidables = [];
  const dynamicTickers = [];
  const api = { THREE, world, root, collidables, dynamicTickers };

  let spawn = new THREE.Vector3(0, 0, 0);
  let spawnYaw = 0;

  switch (world.biome) {
    case 'mediterranean': ({ spawn, spawnYaw } = buildRome(api)); break;
    case 'sakura':        ({ spawn, spawnYaw } = buildEdo(api));  break;
    case 'desert':        ({ spawn, spawnYaw } = buildEgypt(api)); break;
    case 'meadow':        ({ spawn, spawnYaw } = buildMedieval(api)); break;
    case 'city-old':      ({ spawn, spawnYaw } = buildNYC(api));  break;
    case 'cyberpunk':     ({ spawn, spawnYaw } = buildNeoTokyo(api)); break;
    case 'mars':          ({ spawn, spawnYaw } = buildMars(api)); break;
    case 'underwater':    ({ spawn, spawnYaw } = buildAtlantis(api)); break;
    case 'plaza':         ({ spawn, spawnYaw } = buildChangAn(api)); break;
    case 'venice':        ({ spawn, spawnYaw } = buildVenice(api)); break;
    case 'space':         ({ spawn, spawnYaw } = buildSpaceStation(api)); break;
    default:              ({ spawn, spawnYaw } = buildRome(api));
  }

  // Return door
  const returnDoor = makeReturnDoor(THREE);
  returnDoor.position.copy(spawn);
  returnDoor.position.y = 0;
  returnDoor.position.x += Math.sin(spawnYaw) * 3.5;
  returnDoor.position.z += Math.cos(spawnYaw) * 3.5;
  returnDoor.rotation.y = spawnYaw + Math.PI;
  root.add(returnDoor);

  const groundHeightAt = (x, z) => 0;

  const collide = (x, z, r) => {
    for (const c of collidables) {
      if (c.type === 'box') {
        const cos = Math.cos(-c.angle || 0), sin = Math.sin(-c.angle || 0);
        const dx = x - c.cx, dz = z - c.cz;
        const lx = dx*cos - dz*sin, lz = dx*sin + dz*cos;
        if (Math.abs(lx) < c.hx + r && Math.abs(lz) < c.hz + r) return c;
      } else {
        const dx = x - c.x, dz = z - c.z;
        if (dx*dx + dz*dz < (c.r + r)*(c.r + r)) return c;
      }
    }
    return null;
  };

  const tick = (t, dt) => {
    for (const fn of dynamicTickers) fn(t, dt);
    if (skyDome) skyDome.rotation.y = t * 0.003;
  };

  return { group: root, spawn, spawnYaw, returnDoor, groundHeightAt, collide, tick, skyDome, name: world.name };
}

// ============================================================
// SKY DOME — gradient shader
// ============================================================
function makeSkyDome(THREE, p) {
  const geo = new THREE.SphereGeometry(1200, 32, 16);
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    uniforms: {
      topColor:    { value: new THREE.Color(p.sky[2]) },
      midColor:    { value: new THREE.Color(p.sky[0]) },
      bottomColor: { value: new THREE.Color(p.sky[1]) },
      offset:      { value: 33 },
      exponent:    { value: 0.55 },
    },
    vertexShader: `
      varying vec3 vWorldPos;
      void main(){
        vec4 wp = modelMatrix * vec4(position,1.0);
        vWorldPos = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: `
      varying vec3 vWorldPos;
      uniform vec3 topColor, midColor, bottomColor;
      uniform float offset, exponent;
      void main(){
        float h = normalize(vWorldPos + vec3(0.,offset,0.)).y;
        vec3 col;
        if (h > 0.) col = mix(midColor, topColor, pow(max(h,0.), exponent));
        else        col = mix(midColor, bottomColor, pow(max(-h,0.), exponent));
        gl_FragColor = vec4(col, 1.);
      }
    `,
    depthWrite: false,
  });
  return new THREE.Mesh(geo, mat);
}

// ============================================================
// RETURN DOOR — premium realism
// ============================================================
function makeReturnDoor(THREE) {
  const g = new THREE.Group();
  g.name = 'return-door';

  const gold = new THREE.MeshStandardMaterial({
    color: 0xd4b174, roughness: 0.18, metalness: 0.98,
    emissive: 0x3a2a10, emissiveIntensity: 0.85,
  });
  const dark = new THREE.MeshStandardMaterial({
    color: 0x0e0a1a, roughness: 0.35, metalness: 0.85,
    emissive: 0x080414, emissiveIntensity: 0.4,
  });

  const doorW = 2.2, doorH = 4.0, frameTh = 0.22;

  // Frame
  g.add(meshBox(THREE, doorW+frameTh*2+0.2, frameTh*1.3, 0.4, 0, doorH+frameTh*0.6, 0, gold));
  g.add(meshBox(THREE, frameTh, doorH+frameTh, 0.4, -doorW/2-frameTh/2, doorH/2, 0, gold));
  g.add(meshBox(THREE, frameTh, doorH+frameTh, 0.4,  doorW/2+frameTh/2, doorH/2, 0, gold));
  g.add(meshBox(THREE, doorW+frameTh*2+0.3, 0.1, 0.5, 0, 0.05, 0, gold));

  // Arch ornament
  const arch = new THREE.Mesh(
    new THREE.TorusGeometry(0.38, 0.10, 16, 36, Math.PI),
    gold
  );
  arch.position.set(0, doorH + 0.48, 0);
  arch.rotation.z = Math.PI;
  g.add(arch);

  // Portal shader
  const portalMat = new THREE.ShaderMaterial({
    transparent: true,
    uniforms: {
      uTime:   { value: 0 },
      uOpacity:{ value: 0.15 },
      uColorA: { value: new THREE.Color(0xc9a96a) },
      uColorB: { value: new THREE.Color(0xa86bff) },
      uColorC: { value: new THREE.Color(0xffffff) },
    },
    vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
    fragmentShader: `
      varying vec2 vUv;
      uniform float uTime, uOpacity;
      uniform vec3 uColorA, uColorB, uColorC;
      float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
      float noise(vec2 p){
        vec2 i=floor(p), f=fract(p);
        float a=hash(i), b=hash(i+vec2(1,0)), c=hash(i+vec2(0,1)), d=hash(i+vec2(1,1));
        vec2 u=f*f*(3.-2.*f);
        return mix(mix(a,b,u.x), mix(c,d,u.x), u.y);
      }
      void main(){
        vec2 p = vUv - 0.5;
        float r = length(p);
        float a = atan(p.y, p.x);
        float swirl = sin(a*5. + uTime*1.6 + r*9.) * 0.5 + 0.5;
        float n = noise(p*9. + uTime*0.45);
        float n2 = noise(p*4. - uTime*0.28);
        vec3 col = mix(uColorA, uColorB, swirl);
        col = mix(col, uColorC, n*0.35 + n2*0.1);
        float glow = smoothstep(0.5, 0., r);
        col += uColorC * pow(glow, 3.5) * 0.65;
        float spark = pow(noise(p*28. + uTime*2.2), 9.) * 2.5;
        col += uColorC * spark * smoothstep(0.5, 0.1, r);
        gl_FragColor = vec4(col, smoothstep(0.5, 0.32, r) * uOpacity);
      }
    `,
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
    vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
    fragmentShader: `
      varying vec2 vUv;
      uniform float uTime;
      void main(){
        vec2 p = vUv - 0.5;
        float r = length(p * vec2(2.8, 1.0));
        float glow = smoothstep(0.65, 0., r) * (0.65 + 0.35*sin(uTime*1.4));
        float inner = smoothstep(0.3, 0., r) * (0.5 + 0.5*sin(uTime*2.2));
        vec3 col = mix(vec3(0.82,0.66,0.43), vec3(0.66,0.42,1.0), sin(uTime*0.7)*0.5+0.5);
        col = mix(col, vec3(0.31,0.82,1.0), inner * 0.4);
        gl_FragColor = vec4(col, (glow + inner*0.4) * 0.9);
      }
    `,
  });
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(doorW*3.2, doorH*2.0), glowMat);
  glow.position.set(0, doorH/2, -0.3);
  g.add(glow);
  g.userData.glowMat = glowMat;

  // Sign
  const signCanvas = document.createElement('canvas');
  signCanvas.width = 512; signCanvas.height = 128;
  const sctx = signCanvas.getContext('2d');
  sctx.fillStyle = 'rgba(10,6,24,0.88)';
  sctx.fillRect(0, 0, 512, 128);
  sctx.fillStyle = '#d4b174';
  sctx.font = 'bold 36px "Shippori Mincho", serif';
  sctx.textAlign = 'center';
  sctx.shadowColor = '#d4b174'; sctx.shadowBlur = 18;
  sctx.fillText('RETURN · 戻る扉', 256, 80);
  const sign = new THREE.Mesh(
    new THREE.PlaneGeometry(2.6, 0.65),
    new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(signCanvas), transparent: true })
  );
  sign.position.set(0, doorH + 0.9, 0);
  g.add(sign);

  return g;
}

// ============================================================
// SHARED HELPERS
// ============================================================
function meshBox(THREE, w, h, d, x, y, z, mat) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  m.castShadow = true; m.receiveShadow = true;
  return m;
}

function addGround(THREE, root, color, size=500, receiveShadow=true) {
  const g = new THREE.Mesh(
    new THREE.PlaneGeometry(size, size, 60, 60),
    new THREE.MeshStandardMaterial({ color, roughness: 0.92, metalness: 0.0 })
  );
  g.rotation.x = -Math.PI/2;
  g.receiveShadow = receiveShadow;
  root.add(g);
  return g;
}

function addGroundLayered(THREE, root, baseColor, detailColor, size=500) {
  addGround(THREE, root, baseColor, size);
  // detail overlay
  const detail = new THREE.Mesh(
    new THREE.PlaneGeometry(size*0.6, size*0.6, 1, 1),
    new THREE.MeshStandardMaterial({ color: detailColor, roughness: 0.85, metalness: 0.0, transparent: true, opacity: 0.45 })
  );
  detail.rotation.x = -Math.PI/2;
  detail.position.y = 0.01;
  root.add(detail);
}

function randRange(min, max) { return min + Math.random()*(max-min); }
function seededRand(seed) {
  let s = seed | 0;
  return () => {
    s = Math.imul(48271, s) | 0;
    return ((s >>> 0) % 100000) / 100000;
  };
}

function addDistantMountains(THREE, root, color, dist=200, count=18) {
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 1 });
  for (let i=0;i<count;i++){
    const a = (i/count)*Math.PI*2;
    const h = 22 + Math.random()*35;
    const m = new THREE.Mesh(new THREE.ConeGeometry(22 + Math.random()*18, h, 7), mat);
    m.position.set(Math.cos(a)*dist, h/2 - 2, Math.sin(a)*dist);
    m.rotation.y = Math.random()*Math.PI;
    root.add(m);
  }
}

function addFlock(THREE, root, tickers, color, count=8, radius=90) {
  const birds = [];
  for (let i=0;i<count;i++){
    const b = new THREE.Mesh(
      new THREE.ConeGeometry(0.28, 0.9, 4),
      new THREE.MeshBasicMaterial({ color })
    );
    b.rotation.x = Math.PI/2;
    b.position.set(Math.random()*radius-radius/2, 32 + Math.random()*22, Math.random()*radius-radius/2);
    b.userData.speed = 0.55 + Math.random()*0.55;
    b.userData.phase = Math.random()*Math.PI*2;
    root.add(b);
    birds.push(b);
  }
  tickers.push((t) => {
    birds.forEach(b => {
      b.position.x += b.userData.speed * 0.1;
      b.position.y = 32 + Math.sin(t + b.userData.phase)*5;
      if (b.position.x > radius) b.position.x = -radius;
      b.rotation.y = Math.PI/2;
    });
  });
}

function makeFallingParticles(THREE, color, count=600, spread=45) {
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(count*3);
  for (let i=0;i<count;i++){
    pos[i*3]   = (Math.random()-0.5)*spread;
    pos[i*3+1] = Math.random()*30;
    pos[i*3+2] = (Math.random()-0.5)*spread;
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({
    color, size: 0.06, transparent: true, opacity: 0.75,
    depthWrite: false, blending: THREE.AdditiveBlending,
  });
  return new THREE.Points(geo, mat);
}

function updateFallingParticles(pts, dt, spread=45) {
  const pos = pts.geometry.attributes.position;
  for (let i=0;i<pos.count;i++){
    pos.array[i*3+1] -= dt * 2.8;
    if (pos.array[i*3+1] < 0) {
      pos.array[i*3+1] = 28 + Math.random()*5;
      pos.array[i*3]   = (Math.random()-0.5)*spread;
      pos.array[i*3+2] = (Math.random()-0.5)*spread;
    }
  }
  pos.needsUpdate = true;
}

function makeSunSprite(THREE, color, size) {
  const c = document.createElement('canvas'); c.width = c.height = 128;
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

function addBuildingWindows(THREE, group, w, d, baseY, h, mat) {
  const cols = Math.max(2, Math.floor(w/1.4));
  const rows = Math.max(2, Math.floor(h/2.2));
  for (let r=0;r<rows;r++){
    for (let c=0;c<cols;c++){
      if (Math.random() > 0.55) continue;
      const win = new THREE.Mesh(
        new THREE.PlaneGeometry(0.55, 0.8),
        mat
      );
      win.position.set(-w/2 + 0.7 + c*(w/cols), baseY + 1.2 + r*2.2, d/2 + 0.01);
      group.add(win);
    }
  }
}

// ============================================================
// BIOME: ROME — Forum, Colosseum, temple, fountain, birds
// ============================================================
function buildRome(api) {
  const { THREE, world, root, collidables, dynamicTickers } = api;
  const rand = seededRand(12345);

  // Ground — marble plaza with detail (white-grey marble)
  addGroundLayered(THREE, root, 0xd8cdb4, 0xf0ece0, 500);

  // Large plaza
  const plaza = new THREE.Mesh(
    new THREE.PlaneGeometry(100, 100, 1, 1),
    new THREE.MeshStandardMaterial({ color: 0xdccaa8, roughness: 0.65 })
  );
  plaza.rotation.x = -Math.PI/2; plaza.position.y = 0.01;
  plaza.receiveShadow = true;
  root.add(plaza);

  // Colosseum — enhanced
  const colo = new THREE.Group();
  const ringMat = new THREE.MeshStandardMaterial({ color: 0xb69a6e, roughness: 0.82 });
  const archDark = new THREE.MeshStandardMaterial({ color: 0x1a1208, roughness: 1 });
  const colR = 24, colH = 16;
  for (let tier=0; tier<3; tier++) {
    const tierY = tier * 5.0 + 0.5;
    for (let i=0; i<28; i++) {
      const a = (i/28)*Math.PI*2;
      const w = (colR*2*Math.PI)/28 * 0.88;
      const wall = meshBox(THREE, w, 4.5, 1.4, Math.cos(a)*colR, tierY+2.25, Math.sin(a)*colR, ringMat);
      wall.rotation.y = -a + Math.PI/2;
      colo.add(wall);
      if (tier < 2) {
        const arch = meshBox(THREE, w*0.52, 2.8, 0.12, Math.cos(a)*(colR-0.6), tierY+1.8, Math.sin(a)*(colR-0.6), archDark);
        arch.rotation.y = -a + Math.PI/2;
        colo.add(arch);
      }
    }
  }
  // Colosseum floor ring
  const coloFloor = new THREE.Mesh(
    new THREE.CylinderGeometry(colR-1.2, colR-1.2, 0.4, 32),
    new THREE.MeshStandardMaterial({ color: 0xa08060, roughness: 0.9 })
  );
  coloFloor.position.y = 0.2;
  colo.add(coloFloor);
  colo.position.set(0, 0, -60);
  root.add(colo);
  for (let i=0;i<28;i++){
    const a = (i/28)*Math.PI*2;
    collidables.push({ x: Math.cos(a)*colR, z: Math.sin(a)*colR - 60, r: 2.4 });
  }

  // Columns — more detailed
  const colMat = new THREE.MeshStandardMaterial({ color: 0xf0e6d0, roughness: 0.45, metalness: 0.12 });
  const capMat = new THREE.MeshStandardMaterial({ color: 0xd4b174, roughness: 0.25, metalness: 0.65 });
  function column(x, z, h=7.5) {
    const col = new THREE.Group();
    col.add(meshBox(THREE, 1.7, 0.45, 1.7, 0, 0.22, 0, capMat));
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.65, h, 20, 1, false), colMat);
    shaft.position.y = 0.45 + h/2; shaft.castShadow = true; shaft.receiveShadow = true;
    col.add(shaft);
    // fluting lines
    for (let f=0;f<8;f++){
      const fa = (f/8)*Math.PI*2;
      const flute = new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.04, h*0.9, 6),
        new THREE.MeshStandardMaterial({ color: 0xd8cdb4, roughness: 0.5 })
      );
      flute.position.set(Math.cos(fa)*0.48, 0.45 + h/2, Math.sin(fa)*0.48);
      col.add(flute);
    }
    col.add(meshBox(THREE, 1.8, 0.55, 1.8, 0, 0.45 + h + 0.28, 0, capMat));
    col.position.set(x, 0, z);
    root.add(col);
    collidables.push({ x, z, r: 0.9 });
  }
  for (let i=0;i<10;i++){
    const z = -10 - i*5.5;
    column(-7.5, z); column(7.5, z);
  }

  // Temple — Pantheon-like, more detailed
  const temple = new THREE.Group();
  const templeMat = new THREE.MeshStandardMaterial({ color: 0xe8dcc0, roughness: 0.68 });
  const roofMat = new THREE.MeshStandardMaterial({ color: 0x7a5a38, roughness: 0.82 });
  temple.add(meshBox(THREE, 20, 0.9, 16, 0, 0.45, 0, capMat));
  for (let i=0;i<8;i++){
    const x = -8.5 + i*2.4;
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.58, 9, 20), colMat);
    shaft.position.set(x, 5.4, 6); shaft.castShadow = true;
    temple.add(shaft);
    collidables.push({ x, z: 6 + 25, r: 0.75 });
  }
  const pediment = meshBox(THREE, 20, 2.2, 2.2, 0, 10.5, 6, roofMat);
  temple.add(pediment);
  const body = meshBox(THREE, 15, 8, 11, 0, 5, -1, templeMat);
  temple.add(body);
  // Dome
  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(5.5, 24, 12, 0, Math.PI*2, 0, Math.PI/2),
    new THREE.MeshStandardMaterial({ color: 0xd0c4a8, roughness: 0.7 })
  );
  dome.position.set(0, 9, -1);
  temple.add(dome);
  temple.position.set(0, 0, 25);
  root.add(temple);
  collidables.push({ type:'box', cx:0, cz:25, hx:8, hz:6, angle:0 });

  // Fountain — more detailed
  const fountain = new THREE.Group();
  const basinMat = new THREE.MeshStandardMaterial({ color: 0xd4b174, roughness: 0.3, metalness: 0.6 });
  const waterMat = new THREE.MeshStandardMaterial({ color: 0x4ab0d0, roughness: 0.05, metalness: 0.6, transparent: true, opacity: 0.88 });
  const basin = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.5, 0.9, 36), basinMat);
  basin.position.y = 0.45; basin.castShadow = true; basin.receiveShadow = true;
  fountain.add(basin);
  const water = new THREE.Mesh(new THREE.CylinderGeometry(3.0, 3.0, 0.22, 36), waterMat);
  water.position.y = 0.85;
  fountain.add(water);
  const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.38, 2.4, 18), basinMat);
  pillar.position.y = 2.1;
  fountain.add(pillar);
  const topBowl = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.4, 0.5, 24), basinMat);
  topBowl.position.y = 3.4;
  fountain.add(topBowl);
  // Water spray particles
  const spray = makeFallingParticles(THREE, 0x88d4f0, 80, 3);
  spray.position.set(0, 3.5, 0);
  spray.material.size = 0.04; spray.material.opacity = 0.6;
  fountain.add(spray);
  fountain.position.set(0, 0, -22);
  root.add(fountain);
  collidables.push({ x: 0, z: -22, r: 3.6 });
  dynamicTickers.push((t, dt) => {
    water.position.y = 0.85 + Math.sin(t*2.2)*0.04;
    updateFallingParticles(spray, dt, 3);
  });

  // Cypress trees — more varied
  for (let i=0;i<55;i++){
    const angle = rand()*Math.PI*2;
    const dist = 35 + rand()*110;
    const x = Math.cos(angle)*dist;
    const z = Math.sin(angle)*dist;
    if (Math.abs(x) < 12 && z > -95 && z < 45) continue;
    cypress(THREE, root, x, z, capMat, collidables, rand);
  }

  // Distant mountains — olive hills of Italy
  addDistantMountains(THREE, root, 0x6a8a5a, 220, 20);

  // Birds
  addFlock(THREE, root, dynamicTickers, 0x2a1810, 10, 140);

  // Warm point lights near temple
  const warmLight = new THREE.PointLight(0xffd090, 1.8, 40);
  warmLight.position.set(0, 6, 25);
  root.add(warmLight);
  const warmLight2 = new THREE.PointLight(0xffb060, 1.2, 30);
  warmLight2.position.set(0, 3, -22);
  root.add(warmLight2);

  // Spawn further in front of the temple so the whole facade is visible (temple at Z=25, yaw=0 faces -Z)
  return { spawn: new THREE.Vector3(0, 0, 65), spawnYaw: 0 };
}

function cypress(THREE, root, x, z, trunkMat, collidables, rand) {
  const g = new THREE.Group();
  const h = 5.5 + (rand ? rand() : Math.random()) * 3.5;
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.32, 1.2, 8),
    new THREE.MeshStandardMaterial({ color: 0x4a2a18, roughness: 1 })
  );
  trunk.position.y = 0.6; g.add(trunk);
  const top = new THREE.Mesh(
    new THREE.ConeGeometry(1.05, h, 10),
    new THREE.MeshStandardMaterial({ color: 0x1e3a1e, roughness: 1 })
  );
  top.position.y = h/2 + 1.0; top.castShadow = true;
  g.add(top);
  g.position.set(x, 0, z);
  root.add(g);
  collidables.push({ x, z, r: 0.5 });
}

// ============================================================
// BIOME: EDO — Japanese town, torii, pagoda, cherry blossoms
// ============================================================
function buildEdo(api) {
  const { THREE, world, root, collidables, dynamicTickers } = api;

  // Ground — stone paved
  addGroundLayered(THREE, root, 0x4a3a2a, 0x5a4a38, 500);

  // Street
  const street = new THREE.Mesh(
    new THREE.PlaneGeometry(14, 220),
    new THREE.MeshStandardMaterial({ color: 0x6a5040, roughness: 0.88 })
  );
  street.rotation.x = -Math.PI/2; street.position.y = 0.01;
  street.receiveShadow = true;
  root.add(street);

  // Street edge stones
  for (let i=0;i<30;i++){
    const z = -100 + i*7;
    for (let side of [-7.5, 7.5]) {
      const stone = meshBox(THREE, 0.6, 0.15, 0.6, side, 0.08, z,
        new THREE.MeshStandardMaterial({ color: 0x5a4a3a, roughness: 0.95 }));
      root.add(stone);
    }
  }

  // Torii gate — more detailed
  const torii = new THREE.Group();
  const toriiMat = new THREE.MeshStandardMaterial({ color: 0x9c2020, roughness: 0.55, emissive: 0x3a0808, emissiveIntensity: 0.3 });
  const toriiDark = new THREE.MeshStandardMaterial({ color: 0x2a0808, roughness: 0.75 });
  const pillarL = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.38, 7.5, 14), toriiMat);
  pillarL.position.set(-4.2, 3.75, 0); torii.add(pillarL);
  const pillarR = pillarL.clone(); pillarR.position.x = 4.2; torii.add(pillarR);
  const topBar = meshBox(THREE, 11.2, 0.52, 0.72, 0, 7.4, 0, toriiDark);
  torii.add(topBar);
  const capBar = meshBox(THREE, 12.8, 0.72, 0.95, 0, 8.05, 0, toriiMat);
  torii.add(capBar);
  const midBar = meshBox(THREE, 9.5, 0.32, 0.52, 0, 6.2, 0, toriiMat);
  torii.add(midBar);
  // Rope (shimenawa)
  const rope = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06, 0.06, 8.5, 8),
    new THREE.MeshStandardMaterial({ color: 0xf0e8c0, roughness: 0.9 })
  );
  rope.rotation.z = Math.PI/2;
  rope.position.set(0, 5.5, 0);
  torii.add(rope);
  // Hanging shide (zigzag paper)
  for (let i=0;i<4;i++){
    const shide = meshBox(THREE, 0.12, 0.5, 0.02, -1.5+i*1, 5.2, 0,
      new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide }));
    torii.add(shide);
  }
  torii.position.set(0, 0, -8);
  root.add(torii);
  collidables.push({ x: -4.2, z: -8, r: 0.45 });
  collidables.push({ x:  4.2, z: -8, r: 0.45 });

  // Houses lining the street
  for (let i=0;i<10;i++){
    const z = -25 - i*12;
    edoHouse(THREE, root, -11, z, Math.PI/2, collidables, dynamicTickers);
    edoHouse(THREE, root,  11, z, -Math.PI/2, collidables, dynamicTickers);
  }
  for (let i=0;i<4;i++){
    const z = 20 + i*12;
    edoHouse(THREE, root, -11, z, Math.PI/2, collidables, dynamicTickers);
    edoHouse(THREE, root,  11, z, -Math.PI/2, collidables, dynamicTickers);
  }

  // Pagoda at far end
  pagoda(THREE, root, 0, -100, collidables);

  // Cherry trees
  for (let i=0;i<22;i++){
    const z = -15 - i*8 + Math.random()*3;
    const x = (Math.random()>0.5 ? -16 : 16) + (Math.random()-0.5)*2;
    sakuraTree(THREE, root, x, z, collidables, dynamicTickers);
  }

  // Falling petals — more
  const petals = makeFallingParticles(THREE, 0xffd0e0, 900, 50);
  root.add(petals);
  dynamicTickers.push((t, dt) => updateFallingParticles(petals, dt * 0.55, 50));

  // Stone lanterns
  for (let i=0;i<8;i++){
    const z = -10 - i*14;
    stoneLantern(THREE, root, -8, z, collidables, dynamicTickers);
    stoneLantern(THREE, root,  8, z, collidables, dynamicTickers);
  }

  // Distant mountains — purple haze
  addDistantMountains(THREE, root, 0x3a2a4a, 200, 20);

  // Night fog
  const fog = new THREE.Mesh(
    new THREE.SphereGeometry(80, 16, 8),
    new THREE.MeshBasicMaterial({ color: 0x3a2a1a, transparent: true, opacity: 0.04, side: THREE.BackSide, depthWrite: false })
  );
  root.add(fog);

  // Moon
  const moon = makeSunSprite(THREE, 0xfff0e0, 16);
  moon.position.set(-80, 100, -80);
  root.add(moon);

  return { spawn: new THREE.Vector3(0, 0, 15), spawnYaw: Math.PI };
}

function edoHouse(THREE, root, x, z, rotY, collidables, dynamicTickers) {
  const g = new THREE.Group();
  const wallMat = new THREE.MeshStandardMaterial({ color: 0xdcc9a8, roughness: 0.82 });
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x3a2010, roughness: 0.78 });
  const roofMat = new THREE.MeshStandardMaterial({ color: 0x1e1208, roughness: 0.68 });
  // body
  g.add(meshBox(THREE, 7.5, 3.4, 6.5, 0, 1.7, 0, wallMat));
  // wood beams
  g.add(meshBox(THREE, 7.7, 0.28, 6.7, 0, 3.2, 0, woodMat));
  g.add(meshBox(THREE, 7.7, 0.28, 6.7, 0, 0.22, 0, woodMat));
  // pillars
  for (let i=0;i<2;i++) for (let j=0;j<2;j++){
    g.add(meshBox(THREE, 0.32, 3.4, 0.32, -3.55+i*7.1, 1.7, -3.1+j*6.2, woodMat));
  }
  // diagonal beams
  for (let s of [-1,1]) {
    const diag = meshBox(THREE, 0.18, 4.2, 0.18, s*2.0, 1.7, 3.2, woodMat);
    diag.rotation.z = s * Math.PI/5; g.add(diag);
  }
  // sliding door
  g.add(meshBox(THREE, 2.2, 2.6, 0.1, 0, 1.3, 3.26, woodMat));
  // door grid
  for (let i=0;i<3;i++) {
    g.add(meshBox(THREE, 0.06, 2.6, 0.06, -0.7+i*0.7, 1.3, 3.28, woodMat));
  }
  // Roof — tiered
  g.add(meshBox(THREE, 9.5, 0.32, 8.5, 0, 3.6, 0, roofMat));
  const roof2 = new THREE.Mesh(
    new THREE.ConeGeometry(5.8, 2.0, 4),
    roofMat
  );
  roof2.rotation.y = Math.PI/4; roof2.position.y = 4.8;
  g.add(roof2);
  // Second floor hint
  g.add(meshBox(THREE, 5.5, 2.0, 4.5, 0, 4.8, 0, wallMat));
  const roof3 = new THREE.Mesh(new THREE.ConeGeometry(3.8, 1.5, 4), roofMat);
  roof3.rotation.y = Math.PI/4; roof3.position.y = 6.5;
  g.add(roof3);

  // Paper lantern — glowing
  const lanternMat = new THREE.MeshStandardMaterial({
    color: 0xff8040, emissive: 0xff6020, emissiveIntensity: 1.0, roughness: 0.55,
    transparent: true, opacity: 0.92,
  });
  const lantern = new THREE.Mesh(new THREE.SphereGeometry(0.32, 14, 10), lanternMat);
  lantern.position.set(2.2, 2.8, 3.3);
  g.add(lantern);
  // Lantern light
  const lanternLight = new THREE.PointLight(0xff8040, 1.4, 9);
  lanternLight.position.set(x + (rotY > 0 ? -2.2 : 2.2), 2.8, z);
  root.add(lanternLight);
  dynamicTickers.push((t) => {
    lanternLight.intensity = 1.4 + Math.sin(t*3.5 + x)*0.35;
  });

  // Window glow
  const winMat = new THREE.MeshStandardMaterial({ color: 0xffb050, emissive: 0xff7020, emissiveIntensity: 1.4 });
  g.add(new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.9), winMat));
  g.children[g.children.length-1].position.set(0, 1.9, 3.28);

  g.position.set(x, 0, z);
  g.rotation.y = rotY;
  root.add(g);
  collidables.push({ type:'box', cx:x, cz:z, hx:3.75, hz:3.25, angle:rotY });
}

function pagoda(THREE, root, x, z, collidables) {
  const g = new THREE.Group();
  const wallMat = new THREE.MeshStandardMaterial({ color: 0xe8d8b0, roughness: 0.78 });
  const roofMat = new THREE.MeshStandardMaterial({ color: 0x1e1208, roughness: 0.78 });
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xd4b174, roughness: 0.22, metalness: 0.95, emissive: 0x3a2a10, emissiveIntensity: 0.8 });
  const tiers = 5;
  let y = 0;
  for (let i=0; i<tiers; i++){
    const scale = 1 - i*0.14;
    g.add(meshBox(THREE, 8.5*scale, 2.5, 8.5*scale, 0, y+1.25, 0, wallMat));
    const roofW = 10.2*scale;
    const roof = new THREE.Mesh(new THREE.ConeGeometry(roofW*0.72, 1.6, 4), roofMat);
    roof.rotation.y = Math.PI/4; roof.position.y = y + 2.5 + 0.8;
    g.add(roof);
    // Roof upturned tips
    for (let c=0;c<4;c++){
      const ca = (c/4)*Math.PI*2 + Math.PI/4;
      const tip = meshBox(THREE, 0.25, 0.25, 0.8, Math.cos(ca)*roofW*0.65, y+2.5+0.4, Math.sin(ca)*roofW*0.65, goldMat);
      tip.rotation.y = -ca; tip.rotation.x = 0.35;
      g.add(tip);
    }
    y += 3.5;
  }
  const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.18, 3.5, 10), goldMat);
  spire.position.y = y + 1.75;
  g.add(spire);
  // Gold rings on spire
  for (let r=0;r<5;r++){
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.05, 8, 20), goldMat);
    ring.position.y = y + 0.5 + r*0.55;
    ring.rotation.x = Math.PI/2;
    g.add(ring);
  }
  g.position.set(x, 0, z);
  root.add(g);
  collidables.push({ x, z, r: 5.5 });
}

function sakuraTree(THREE, root, x, z, collidables, dynamicTickers) {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.32, 3.5, 10),
    new THREE.MeshStandardMaterial({ color: 0x3a2010, roughness: 1 })
  );
  trunk.position.y = 1.75; trunk.castShadow = true;
  g.add(trunk);
  // Multiple blossom clusters
  const blossomColors = [0xffb8c8, 0xffc8d8, 0xff9ab0, 0xffd0e0];
  for (let i=0;i<4;i++){
    const blossom = new THREE.Mesh(
      new THREE.SphereGeometry(1.4 + Math.random()*0.6, 12, 8),
      new THREE.MeshStandardMaterial({ color: blossomColors[i%blossomColors.length], roughness: 0.88, emissive: 0x3a1020, emissiveIntensity: 0.12 })
    );
    blossom.position.set(
      (Math.random()-0.5)*2.2, 3.5 + Math.random()*1.8, (Math.random()-0.5)*2.2
    );
    blossom.castShadow = true;
    g.add(blossom);
  }
  g.position.set(x, 0, z);
  root.add(g);
  collidables.push({ x, z, r: 0.55 });
  // Gentle sway
  dynamicTickers.push((t) => {
    g.rotation.z = Math.sin(t*0.8 + x)*0.022;
  });
}

function stoneLantern(THREE, root, x, z, collidables, dynamicTickers) {
  const g = new THREE.Group();
  const stoneMat = new THREE.MeshStandardMaterial({ color: 0x7a6a5a, roughness: 0.92 });
  const lightMat = new THREE.MeshStandardMaterial({ color: 0xffcc80, emissive: 0xff8820, emissiveIntensity: 1.5, transparent: true, opacity: 0.9 });
  g.add(meshBox(THREE, 0.7, 0.22, 0.7, 0, 0.11, 0, stoneMat));
  g.add(meshBox(THREE, 0.22, 1.0, 0.22, 0, 0.72, 0, stoneMat));
  g.add(meshBox(THREE, 0.58, 0.55, 0.58, 0, 1.5, 0, stoneMat));
  const light = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.38, 0.38), lightMat);
  light.position.y = 1.5;
  g.add(light);
  const cap = new THREE.Mesh(new THREE.ConeGeometry(0.42, 0.32, 4), stoneMat);
  cap.rotation.y = Math.PI/4; cap.position.y = 1.96;
  g.add(cap);
  g.position.set(x, 0, z);
  root.add(g);
  collidables.push({ x, z, r: 0.45 });
  // Flickering point light
  const ptLight = new THREE.PointLight(0xff8820, 1.6, 8);
  ptLight.position.set(x, 1.5, z);
  root.add(ptLight);
  dynamicTickers.push((t) => {
    ptLight.intensity = 1.6 + Math.sin(t*4.5 + z)*0.4;
    light.material.emissiveIntensity = 1.5 + Math.sin(t*4.5 + z)*0.5;
  });
}

// ============================================================
// BIOME: EGYPT — Pyramids, obelisks, temple, sandstorm
// ============================================================
function buildEgypt(api) {
  const { THREE, world, root, collidables, dynamicTickers } = api;

  // Ground — sand with detail
  addGroundLayered(THREE, root, 0xe0b875, 0xd4a860, 600);

  // Sand dunes
  for (let i=0;i<18;i++){
    const dune = new THREE.Mesh(
      new THREE.SphereGeometry(12 + Math.random()*18, 16, 8),
      new THREE.MeshStandardMaterial({ color: 0xd4a060, roughness: 0.98 })
    );
    const a = Math.random()*Math.PI*2;
    const d = 80 + Math.random()*120;
    dune.position.set(Math.cos(a)*d, -10, Math.sin(a)*d);
    dune.scale.y = 0.22;
    root.add(dune);
  }

  // Main pyramid — Great Pyramid
  const pyramidMat = new THREE.MeshStandardMaterial({ color: 0xd4a870, roughness: 0.88 });
  const p1 = new THREE.Mesh(new THREE.ConeGeometry(28, 26, 4), pyramidMat);
  p1.rotation.y = Math.PI/4; p1.position.set(0, 13, -70); p1.castShadow = true;
  root.add(p1);
  collidables.push({ x: 0, z: -70, r: 26 });
  // Capstone
  const capstone = new THREE.Mesh(
    new THREE.ConeGeometry(2.5, 3, 4),
    new THREE.MeshStandardMaterial({ color: 0xffd88a, metalness: 0.9, roughness: 0.2, emissive: 0x553a1a, emissiveIntensity: 0.5 })
  );
  capstone.rotation.y = Math.PI/4; capstone.position.set(0, 27.5, -70);
  root.add(capstone);

  // Second pyramid
  const p2 = new THREE.Mesh(new THREE.ConeGeometry(22, 20, 4), pyramidMat);
  p2.rotation.y = Math.PI/4; p2.position.set(-55, 10, -95); p2.castShadow = true;
  root.add(p2);
  collidables.push({ x: -55, z: -95, r: 22 });

  // Third pyramid
  const p3 = new THREE.Mesh(new THREE.ConeGeometry(16, 14, 4), pyramidMat);
  p3.rotation.y = Math.PI/4; p3.position.set(55, 7, -105); p3.castShadow = true;
  root.add(p3);
  collidables.push({ x: 55, z: -105, r: 14 });

  // Sphinx
  const sphinx = new THREE.Group();
  const sphinxMat = new THREE.MeshStandardMaterial({ color: 0xc49864, roughness: 0.88 });
  const body = meshBox(THREE, 12, 4, 6, 0, 2, 0, sphinxMat);
  sphinx.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(2.2, 16, 12), sphinxMat);
  head.position.set(0, 5.5, 3.5); sphinx.add(head);
  const headdress = meshBox(THREE, 3.5, 3.5, 0.4, 0, 5.5, 2.2, sphinxMat);
  sphinx.add(headdress);
  const paws = meshBox(THREE, 3, 1.5, 5, 0, 0.75, 5, sphinxMat);
  sphinx.add(paws);
  sphinx.position.set(30, 0, -35);
  sphinx.rotation.y = -Math.PI/5;
  root.add(sphinx);
  collidables.push({ x: 30, z: -35, r: 8 });

  // Obelisks
  const obeliskMat = new THREE.MeshStandardMaterial({ color: 0xc0966a, roughness: 0.68 });
  function obelisk(x, z) {
    const g = new THREE.Group();
    g.add(meshBox(THREE, 2.2, 1.2, 2.2, 0, 0.6, 0, obeliskMat));
    const shaft = new THREE.Mesh(new THREE.BoxGeometry(1.3, 11, 1.3), obeliskMat);
    shaft.position.y = 6.7; shaft.castShadow = true; g.add(shaft);
    const pyr = new THREE.Mesh(
      new THREE.ConeGeometry(1.1, 2.0, 4),
      new THREE.MeshStandardMaterial({ color: 0xffdfa0, metalness: 0.92, roughness: 0.18, emissive: 0x553a1a, emissiveIntensity: 0.6 })
    );
    pyr.rotation.y = Math.PI/4; pyr.position.y = 13.0; g.add(pyr);
    g.position.set(x, 0, z);
    root.add(g);
    collidables.push({ x, z, r: 1.1 });
  }
  obelisk(-11, 0); obelisk(11, 0);
  obelisk(-15, -24); obelisk(15, -24);

  // Temple columns
  const colMat = new THREE.MeshStandardMaterial({ color: 0xc49864, roughness: 0.82 });
  for (let i=0;i<8;i++){
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 1.05, 10, 14), colMat);
    shaft.position.set(-8.4+i*2.4, 5, 22); shaft.castShadow = true;
    root.add(shaft);
    collidables.push({ x: -8.4+i*2.4, z: 22, r: 1.05 });
  }
  const lintel = meshBox(THREE, 22, 1.8, 3.5, 0, 11.2, 22, obeliskMat);
  root.add(lintel);
  const templeBody = meshBox(THREE, 18, 8, 14, 0, 4, 15, new THREE.MeshStandardMaterial({ color: 0xd4b080, roughness: 0.85 }));
  root.add(templeBody);
  collidables.push({ type:'box', cx:0, cz:15, hx:9, hz:7, angle:0 });

  // Palm trees
  for (let i=0;i<12;i++){
    const a = Math.random()*Math.PI*2;
    const d = 20 + Math.random()*40;
    if (d < 12) continue;
    palmTree(THREE, root, Math.cos(a)*d, Math.sin(a)*d, collidables);
  }

  // Sun sprite
  const sunSprite = makeSunSprite(THREE, 0xffd88a, 28);
  sunSprite.position.set(120, 130, -60);
  root.add(sunSprite);

  // Sandstorm dust
  const dust = makeFallingParticles(THREE, 0xffd8a0, 250, 70);
  dust.material.size = 0.09; dust.material.opacity = 0.38;
  root.add(dust);
  dynamicTickers.push((t, dt) => updateFallingParticles(dust, dt*0.35, 70));

  // Distant mountains
  addDistantMountains(THREE, root, 0x9a7848, 280, 16);

  return { spawn: new THREE.Vector3(0, 0, 8), spawnYaw: Math.PI };
}

function palmTree(THREE, root, x, z, collidables) {
  const g = new THREE.Group();
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x8a5a2a, roughness: 0.92 });
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x3a7a1a, roughness: 0.85, side: THREE.DoubleSide });
  const h = 5 + Math.random()*3;
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.28, h, 8), trunkMat);
  trunk.position.y = h/2; trunk.castShadow = true; g.add(trunk);
  for (let i=0;i<7;i++){
    const a = (i/7)*Math.PI*2;
    const leaf = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 2.8), leafMat);
    leaf.position.set(Math.cos(a)*0.8, h + 0.5, Math.sin(a)*0.8);
    leaf.rotation.y = -a; leaf.rotation.x = -0.45;
    leaf.castShadow = true; g.add(leaf);
  }
  g.position.set(x, 0, z);
  root.add(g);
  collidables.push({ x, z, r: 0.5 });
}

// ============================================================
// BIOME: MEDIEVAL — stone village, castle, mist, torches
// ============================================================
function buildMedieval(api) {
  const { THREE, world, root, collidables, dynamicTickers } = api;

  addGroundLayered(THREE, root, 0x5a6b4a, 0x4a5a3a, 600);

  // Cobblestone road
  const road = new THREE.Mesh(
    new THREE.PlaneGeometry(9, 240),
    new THREE.MeshStandardMaterial({ color: 0x4a4238, roughness: 0.95 })
  );
  road.rotation.x = -Math.PI/2; road.position.y = 0.02; road.receiveShadow = true;
  root.add(road);
  // Cobble detail
  for (let i=0;i<60;i++){
    const stone = new THREE.Mesh(
      new THREE.BoxGeometry(0.8 + Math.random()*0.4, 0.08, 0.6 + Math.random()*0.3),
      new THREE.MeshStandardMaterial({ color: 0x3a3530, roughness: 0.98 })
    );
    stone.position.set((Math.random()-0.5)*8, 0.04, -10 + i*4 + Math.random()*2);
    stone.rotation.y = Math.random()*0.3;
    root.add(stone);
  }

  // Timbered houses — more
  for (let i=0;i<8;i++){
    const z = -8 - i*13;
    medievalHouse(THREE, root, -8, z, Math.PI/2, collidables, dynamicTickers);
    medievalHouse(THREE, root,  8, z, -Math.PI/2, collidables, dynamicTickers);
  }

  // Well
  const well = new THREE.Group();
  const wellMat = new THREE.MeshStandardMaterial({ color: 0x6a5a48, roughness: 0.92 });
  const wellBase = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.5, 0.9, 16), wellMat);
  wellBase.position.y = 0.45; well.add(wellBase);
  const wellRim = new THREE.Mesh(new THREE.TorusGeometry(1.4, 0.12, 8, 24), wellMat);
  wellRim.position.y = 0.9; wellRim.rotation.x = Math.PI/2; well.add(wellRim);
  const wellPost1 = meshBox(THREE, 0.18, 1.8, 0.18, -1.4, 1.8, 0, wellMat);
  const wellPost2 = meshBox(THREE, 0.18, 1.8, 0.18,  1.4, 1.8, 0, wellMat);
  well.add(wellPost1); well.add(wellPost2);
  const wellRoof = new THREE.Mesh(new THREE.ConeGeometry(1.8, 1.2, 4), new THREE.MeshStandardMaterial({ color: 0x4a2a18, roughness: 0.85 }));
  wellRoof.rotation.y = Math.PI/4; wellRoof.position.y = 3.0; well.add(wellRoof);
  well.position.set(4, 0, 8);
  root.add(well);
  collidables.push({ x: 4, z: 8, r: 1.8 });

  // Castle on hill
  const hill = new THREE.Mesh(
    new THREE.ConeGeometry(36, 9, 32),
    new THREE.MeshStandardMaterial({ color: 0x4a5a3a, roughness: 1 })
  );
  hill.position.set(0, 4.5, -130); hill.receiveShadow = true;
  root.add(hill);
  const castle = buildCastle(THREE);
  castle.position.set(0, 9, -130);
  castle.scale.set(1.5, 1.5, 1.5);
  root.add(castle);
  collidables.push({ x: 0, z: -130, r: 14 });

  // Pine forest
  for (let i=0;i<130;i++){
    const x = (Math.random()-0.5)*280;
    const z = (Math.random()-0.5)*280;
    if (Math.abs(x) < 12 && z > -100 && z < 15) continue;
    if (Math.hypot(x, z+130) < 32) continue;
    pineTree(THREE, root, x, z, collidables);
  }

  // Mist
  const mist = new THREE.Mesh(
    new THREE.SphereGeometry(70, 16, 8),
    new THREE.MeshBasicMaterial({ color: 0xc0c8d8, transparent: true, opacity: 0.035, side: THREE.BackSide, depthWrite: false })
  );
  root.add(mist);
  dynamicTickers.push((t) => { mist.rotation.y = t*0.018; });

  // Torches — more
  for (let i=0;i<6;i++){
    const z = -12 - i*20;
    const side = i%2===0 ? -5.5 : 5.5;
    torchPost(THREE, root, side, z, collidables, dynamicTickers, i);
  }

  // Fog particles
  const fogPts = makeFallingParticles(THREE, 0xc0c8d8, 120, 60);
  fogPts.material.size = 0.18; fogPts.material.opacity = 0.08;
  root.add(fogPts);
  dynamicTickers.push((t, dt) => updateFallingParticles(fogPts, dt*0.12, 60));

  return { spawn: new THREE.Vector3(0, 0, 10), spawnYaw: Math.PI };
}

function medievalHouse(THREE, root, x, z, rotY, collidables, dynamicTickers) {
  const g = new THREE.Group();
  const wallMat = new THREE.MeshStandardMaterial({ color: 0xeadcc2, roughness: 0.88 });
  const beamMat = new THREE.MeshStandardMaterial({ color: 0x3a2818, roughness: 0.92 });
  const roofMat = new THREE.MeshStandardMaterial({ color: 0x8a3a28, roughness: 0.82 });
  const stoneMat = new THREE.MeshStandardMaterial({ color: 0x7a6a58, roughness: 0.95 });
  g.add(meshBox(THREE, 6.5, 3.2, 5.5, 0, 1.6, 0, wallMat));
  // Stone foundation
  g.add(meshBox(THREE, 6.8, 0.5, 5.8, 0, 0.25, 0, stoneMat));
  // Timber frame
  g.add(meshBox(THREE, 6.7, 0.28, 5.7, 0, 0.12, 0, beamMat));
  g.add(meshBox(THREE, 6.7, 0.28, 5.7, 0, 3.1, 0, beamMat));
  g.add(meshBox(THREE, 0.28, 3.2, 5.7, -3.2, 1.6, 0, beamMat));
  g.add(meshBox(THREE, 0.28, 3.2, 5.7,  3.2, 1.6, 0, beamMat));
  // Diagonal beams
  for (let s of [-1,1]) {
    const d = meshBox(THREE, 0.22, 4.4, 0.22, s*1.5, 1.6, 2.75, beamMat);
    d.rotation.z = s * Math.PI/4; g.add(d);
  }
  // Roof
  const roof = new THREE.Mesh(
    new THREE.CylinderGeometry(0.01, 4.2, 2.8, 3, 1),
    roofMat
  );
  roof.rotation.z = Math.PI/2; roof.rotation.y = Math.PI/2;
  roof.position.y = 4.4; roof.scale.z = 1.45;
  g.add(roof);
  // Chimney
  g.add(meshBox(THREE, 0.65, 1.8, 0.65, 1.6, 5.4, 0, stoneMat));
  // Smoke particles
  const smoke = makeFallingParticles(THREE, 0x888888, 20, 1);
  smoke.position.set(x + (rotY > 0 ? -1.6 : 1.6), 6.5, z);
  smoke.material.size = 0.12; smoke.material.opacity = 0.18;
  root.add(smoke);
  dynamicTickers.push((t, dt) => updateFallingParticles(smoke, -dt*0.8, 1));
  // Window
  const winMat = new THREE.MeshStandardMaterial({ color: 0xffb050, emissive: 0xff7020, emissiveIntensity: 1.2 });
  const win = new THREE.Mesh(new THREE.PlaneGeometry(0.85, 0.85), winMat);
  win.position.set(0, 1.9, 2.76);
  g.add(win);
  // Door
  g.add(meshBox(THREE, 1.2, 2.2, 0.1, 0, 1.1, 2.76, beamMat));
  g.position.set(x, 0, z);
  g.rotation.y = rotY;
  root.add(g);
  collidables.push({ type:'box', cx:x, cz:z, hx:3.25, hz:2.75, angle:rotY });
}

function buildCastle(THREE) {
  const g = new THREE.Group();
  const stoneMat = new THREE.MeshStandardMaterial({ color: 0x6a6458, roughness: 0.92 });
  const roofMat = new THREE.MeshStandardMaterial({ color: 0x2a2018, roughness: 0.82 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x2a2418, roughness: 0.98 });
  // Outer walls
  for (let i=0;i<4;i++){
    const a = i*Math.PI/2;
    const wall = meshBox(THREE, 15, 7, 1.6, Math.sin(a)*7.5, 3.5, Math.cos(a)*7.5, stoneMat);
    wall.rotation.y = a;
    g.add(wall);
    // Battlements
    for (let b=0;b<6;b++){
      const bx = -5.5 + b*2.2;
      const batt = meshBox(THREE, 0.9, 1.2, 0.9, bx*Math.cos(a), 7.6, bx*Math.sin(a), stoneMat);
      g.add(batt);
    }
  }
  // Corner towers
  for (let ix=-1;ix<=1;ix+=2) for (let iz=-1;iz<=1;iz+=2) {
    const t = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.7, 11, 14), stoneMat);
    t.position.set(ix*7.5, 5.5, iz*7.5); g.add(t);
    const cone = new THREE.Mesh(new THREE.ConeGeometry(2.0, 3.5, 14), roofMat);
    cone.position.set(ix*7.5, 12.75, iz*7.5); g.add(cone);
    // Tower battlements
    for (let b=0;b<6;b++){
      const ba = (b/6)*Math.PI*2;
      const batt = meshBox(THREE, 0.55, 0.9, 0.55, ix*7.5 + Math.cos(ba)*1.6, 11.5, iz*7.5 + Math.sin(ba)*1.6, stoneMat);
      g.add(batt);
    }
  }
  // Keep
  const keep = new THREE.Mesh(new THREE.CylinderGeometry(2.8, 3.2, 16, 14), stoneMat);
  keep.position.y = 8; g.add(keep);
  const keepRoof = new THREE.Mesh(new THREE.ConeGeometry(3.8, 6, 14), roofMat);
  keepRoof.position.y = 19; g.add(keepRoof);
  // Flag
  const flag = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.9), new THREE.MeshBasicMaterial({ color: 0xc92028, side: THREE.DoubleSide }));
  flag.position.set(0.75, 22.5, 0); g.add(flag);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 3.5), stoneMat);
  pole.position.set(0, 21.3, 0); g.add(pole);
  // Gate
  g.add(meshBox(THREE, 3.5, 4.5, 0.4, 0, 2.25, 7.5, darkMat));
  return g;
}

function torchPost(THREE, root, x, z, collidables, dynamicTickers, idx) {
  const g = new THREE.Group();
  const postMat = new THREE.MeshStandardMaterial({ color: 0x3a2818, roughness: 0.92 });
  const fireMat = new THREE.MeshStandardMaterial({ color: 0xff8020, emissive: 0xff6010, emissiveIntensity: 2.0, transparent: true, opacity: 0.9 });
  g.add(meshBox(THREE, 0.18, 2.8, 0.18, 0, 1.4, 0, postMat));
  g.add(meshBox(THREE, 0.32, 0.32, 0.32, 0, 2.9, 0, postMat));
  const flame = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.55, 8), fireMat);
  flame.position.y = 3.3; g.add(flame);
  g.position.set(x, 0, z);
  root.add(g);
  const ptLight = new THREE.PointLight(0xffa050, 2.4, 16);
  ptLight.position.set(x, 3.2, z);
  root.add(ptLight);
  dynamicTickers.push((t) => {
    ptLight.intensity = 2.4 * (0.85 + Math.sin(t*7.2 + idx)*0.12);
    flame.scale.y = 0.9 + Math.sin(t*9 + idx)*0.18;
    flame.position.y = 3.3 + Math.sin(t*11 + idx)*0.04;
  });
}

function pineTree(THREE, root, x, z, collidables) {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.28, 2.8, 7),
    new THREE.MeshStandardMaterial({ color: 0x3a2a18, roughness: 1 })
  );
  trunk.position.y = 1.4; g.add(trunk);
  const h = 5 + Math.random()*3;
  const top = new THREE.Mesh(new THREE.ConeGeometry(1.7, h, 9), new THREE.MeshStandardMaterial({ color: 0x2a4a1e, roughness: 1 }));
  top.position.y = h/2 + 2.2; top.castShadow = true; g.add(top);
  const top2 = new THREE.Mesh(new THREE.ConeGeometry(1.25, h*0.7, 9), new THREE.MeshStandardMaterial({ color: 0x1e3a18, roughness: 1 }));
  top2.position.y = h*0.7/2 + 2.2 + h*0.4; g.add(top2);
  g.position.set(x, 0, z);
  root.add(g);
  collidables.push({ x, z, r: 0.65 });
}

// ============================================================
// BIOME: NYC 1920s — Art Deco skyscrapers, streets, cars
// ============================================================
function buildNYC(api) {
  const { THREE, world, root, collidables, dynamicTickers } = api;

  addGroundLayered(THREE, root, 0x4a4638, 0x3a3830, 500);

  // Main street
  const street = new THREE.Mesh(
    new THREE.PlaneGeometry(12, 320),
    new THREE.MeshStandardMaterial({ color: 0x282828, roughness: 0.92 })
  );
  street.rotation.x = -Math.PI/2; street.position.y = 0.01;
  street.receiveShadow = true;
  root.add(street);

  // Sidewalks
  for (let side of [-7, 7]) {
    const sidewalk = new THREE.Mesh(
      new THREE.PlaneGeometry(4, 320),
      new THREE.MeshStandardMaterial({ color: 0x5a5448, roughness: 0.88 })
    );
    sidewalk.rotation.x = -Math.PI/2; sidewalk.position.set(side, 0.015, 0);
    sidewalk.receiveShadow = true;
    root.add(sidewalk);
  }

  // Road markings
  for (let i=0;i<80;i++){
    const mark = new THREE.Mesh(
      new THREE.PlaneGeometry(0.4, 2.8),
      new THREE.MeshStandardMaterial({ color: 0xeee0a8, roughness: 1 })
    );
    mark.rotation.x = -Math.PI/2;
    mark.position.set(0, 0.02, -5 + i*4.5);
    root.add(mark);
  }

  // Art Deco skyscrapers
  const windowMat = new THREE.MeshStandardMaterial({ color: 0xffd470, emissive: 0xffc060, emissiveIntensity: 0.95 });
  const buildingMat = (shade) => new THREE.MeshStandardMaterial({ color: shade, roughness: 0.52, metalness: 0.32 });

  function skyscraper(x, z, w, d, levels, shade) {
    const g = new THREE.Group();
    let y = 0, cw = w, cd = d;
    for (let i=0;i<levels;i++){
      const lh = 7 + Math.random()*4;
      const body = meshBox(THREE, cw, lh, cd, 0, y + lh/2, 0, buildingMat(shade));
      g.add(body);
      addBuildingWindows(THREE, g, cw, cd, y, lh, windowMat);
      // Decorative band
      if (i < levels-1) {
        const band = meshBox(THREE, cw+0.3, 0.35, cd+0.3, 0, y+lh+0.18, 0, buildingMat(shade + 0x101010));
        g.add(band);
      }
      y += lh;
      cw *= 0.82; cd *= 0.82;
    }
    // Spire
    const spire = new THREE.Mesh(
      new THREE.ConeGeometry(cw*0.65, 4, 10),
      new THREE.MeshStandardMaterial({ color: 0x8a7048, metalness: 0.92, roughness: 0.28 })
    );
    spire.position.y = y + 2;
    g.add(spire);
    g.position.set(x, 0, z);
    root.add(g);
    collidables.push({ type:'box', cx:x, cz:z, hx:w/2+0.3, hz:d/2+0.3, angle:0 });
  }

  for (let i=0;i<12;i++){
    const z = -5 - i*22;
    const shade = 0x282018 + Math.floor(Math.random()*0x202020);
    skyscraper(-9, z, 8+Math.random()*3, 10+Math.random()*3, 3+Math.floor(Math.random()*3), shade);
    skyscraper( 9, z, 8+Math.random()*3, 10+Math.random()*3, 3+Math.floor(Math.random()*3), shade);
  }

  // Streetlights
  for (let i=0;i<18;i++){
    const z = -8 - i*15;
    streetlight(THREE, root, -12, z, dynamicTickers);
    streetlight(THREE, root,  12, z, dynamicTickers);
  }

  // Vintage cars
  for (let i=0;i<5;i++){
    const car = vintageCar(THREE, i%3===0 ? 0x1a1a28 : 0x2a1a10);
    car.position.set((Math.random()-0.5)*10, 0, -20 - i*35);
    car.rotation.y = Math.random() < 0.5 ? 0 : Math.PI;
    root.add(car);
  }

  // Morning haze
  const haze = makeFallingParticles(THREE, 0xd0c8b0, 80, 50);
  haze.material.size = 0.2; haze.material.opacity = 0.06;
  root.add(haze);
  dynamicTickers.push((t, dt) => updateFallingParticles(haze, dt*0.05, 50));

  // Sun
  const sunSprite = makeSunSprite(THREE, 0xffc080, 22);
  sunSprite.position.set(60, 100, 30);
  root.add(sunSprite);

  return { spawn: new THREE.Vector3(0, 0, 5), spawnYaw: Math.PI };
}

function streetlight(THREE, root, x, z, dynamicTickers) {
  const g = new THREE.Group();
  const postMat = new THREE.MeshStandardMaterial({ color: 0x2a2820, roughness: 0.7, metalness: 0.5 });
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 6, 8), postMat);
  post.position.y = 3; g.add(post);
  const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2, 8), postMat);
  arm.rotation.z = -Math.PI/2.5; arm.position.set(0.7, 5.8, 0); g.add(arm);
  const bulb = new THREE.Mesh(
    new THREE.SphereGeometry(0.22, 12, 8),
    new THREE.MeshStandardMaterial({ color: 0xffd080, emissive: 0xffc040, emissiveIntensity: 2.0 })
  );
  bulb.position.set(1.4, 5.2, 0); g.add(bulb);
  g.position.set(x, 0, z);
  root.add(g);
  const ptLight = new THREE.PointLight(0xffd080, 1.2, 14);
  ptLight.position.set(x + 1.4, 5.2, z);
  root.add(ptLight);
}

function vintageCar(THREE, color) {
  const g = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color, roughness: 0.35, metalness: 0.65 });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x88aacc, roughness: 0.05, metalness: 0.5, transparent: true, opacity: 0.6 });
  const chromeMat = new THREE.MeshStandardMaterial({ color: 0xd0d0d0, roughness: 0.15, metalness: 0.98 });
  const body = meshBox(THREE, 4.5, 0.9, 2.2, 0, 0.45, 0, bodyMat);
  g.add(body);
  const cabin = meshBox(THREE, 2.8, 0.85, 2.0, -0.3, 1.4, 0, bodyMat);
  g.add(cabin);
  const windshield = meshBox(THREE, 0.08, 0.75, 1.8, 1.0, 1.2, 0, glassMat);
  g.add(windshield);
  const bumperF = meshBox(THREE, 0.12, 0.35, 2.4, 2.3, 0.18, 0, chromeMat);
  g.add(bumperF);
  const bumperR = meshBox(THREE, 0.12, 0.35, 2.4, -2.3, 0.18, 0, chromeMat);
  g.add(bumperR);
  // Wheels
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.9 });
  const rimMat = new THREE.MeshStandardMaterial({ color: 0xd0d0d0, roughness: 0.2, metalness: 0.9 });
  for (let ix of [-1.6, 1.6]) for (let iz of [-1.0, 1.0]) {
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.28, 16), wheelMat);
    wheel.rotation.z = Math.PI/2; wheel.position.set(ix, 0.42, iz*1.15);
    g.add(wheel);
    const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.3, 12), rimMat);
    rim.rotation.z = Math.PI/2; rim.position.copy(wheel.position);
    g.add(rim);
  }
  // Headlights
  const headlightMat = new THREE.MeshStandardMaterial({ color: 0xfff0c0, emissive: 0xffd080, emissiveIntensity: 1.5 });
  for (let iz of [-0.7, 0.7]) {
    const hl = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 6), headlightMat);
    hl.position.set(2.28, 0.65, iz); g.add(hl);
  }
  return g;
}

// ============================================================
// BIOME: NEO TOKYO — Cyberpunk, neon, rain, flying cars
// ============================================================
function buildNeoTokyo(api) {
  const { THREE, world, root, collidables, dynamicTickers } = api;

  // Ground — wet reflective
  const groundMat = new THREE.MeshStandardMaterial({
    color: 0x0b0b16, roughness: 0.15, metalness: 0.6,
    emissive: 0x050510, emissiveIntensity: 0.3,
  });
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(500, 500, 60, 60), groundMat);
  ground.rotation.x = -Math.PI/2; ground.receiveShadow = true;
  root.add(ground);

  // Neon road markings
  const neonColors = [0xff2e8a, 0x2ee8ff, 0xa86bff, 0x2eff8a, 0xff8a2e];
  for (let i=0;i<80;i++){
    const mark = new THREE.Mesh(
      new THREE.PlaneGeometry(0.35, 3.5),
      new THREE.MeshBasicMaterial({ color: neonColors[i%neonColors.length], transparent: true, opacity: 0.7 })
    );
    mark.rotation.x = -Math.PI/2;
    mark.position.set((i%2===0 ? -3 : 3), 0.02, -5 + i*4.5);
    root.add(mark);
  }

  // Cyber towers — close to spawn so they are immediately visible
  for (let i=0;i<14;i++){
    const z = -4 - i*20;
    const h = 22 + Math.random()*28;
    const w = 8 + Math.random()*6;
    const d = 8 + Math.random()*6;
    cyberTower(THREE, root, -8 - Math.random()*3, z, w, d, h, neonColors, collidables, dynamicTickers);
    cyberTower(THREE, root,  8 + Math.random()*3, z, w, d, h, neonColors, collidables, dynamicTickers);
  }

  // Flying cars — more
  for (let i=0;i<8;i++){
    const fc = buildFlyingCar(THREE, neonColors[i%neonColors.length]);
    fc.position.set((Math.random()-0.5)*50, 14+Math.random()*14, -60 - i*28);
    root.add(fc);
    const speed = 9 + Math.random()*7;
    const lane = (Math.random()-0.5)*30;
    const alt = 14 + Math.random()*14;
    dynamicTickers.push((t) => {
      fc.position.z = ((fc.position.z + speed*0.06) % 350) - 175;
      fc.position.y = alt + Math.sin(t*0.9 + i)*3.5;
      fc.rotation.y = Math.PI;
    });
  }

  // Rain — enhanced
  const rainGeo = new THREE.BufferGeometry();
  const rainCount = 2500;
  const rainPos = new Float32Array(rainCount*3);
  for (let i=0;i<rainCount;i++){
    rainPos[i*3]   = (Math.random()-0.5)*120;
    rainPos[i*3+1] = Math.random()*60;
    rainPos[i*3+2] = (Math.random()-0.5)*120;
  }
  rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPos, 3));
  const rain = new THREE.Points(rainGeo, new THREE.PointsMaterial({
    color: 0x88aacc, size: 0.045, transparent: true, opacity: 0.55,
    depthWrite: false, blending: THREE.AdditiveBlending,
  }));
  root.add(rain);
  dynamicTickers.push((t, dt) => {
    const rp = rain.geometry.attributes.position;
    for (let i=0;i<rainCount;i++){
      rp.array[i*3+1] -= dt * 28;
      rp.array[i*3]   -= dt * 1.5;
      if (rp.array[i*3+1] < 0) {
        rp.array[i*3+1] = 60;
        rp.array[i*3]   = (Math.random()-0.5)*120;
        rp.array[i*3+2] = (Math.random()-0.5)*120;
      }
    }
    rp.needsUpdate = true;
  });

  // Ground neon glow
  const neonGlow = new THREE.Mesh(
    new THREE.RingGeometry(1, 70, 64),
    new THREE.MeshBasicMaterial({ color: 0xa86bff, transparent: true, opacity: 0.07, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending })
  );
  neonGlow.rotation.x = -Math.PI/2; neonGlow.position.y = 0.05;
  root.add(neonGlow);

  // Hologram billboards
  for (let i=0;i<8;i++){
    const z = -25 - i*28;
    const side = i%2===0 ? -14 : 14;
    const board = new THREE.Mesh(
      new THREE.PlaneGeometry(7, 3.5),
      new THREE.MeshBasicMaterial({ color: neonColors[i%neonColors.length], transparent: true, opacity: 0.82 })
    );
    board.position.set(side, 7, z);
    board.rotation.y = side<0 ? Math.PI/2 : -Math.PI/2;
    root.add(board);
    // Animated glow
    const boardLight = new THREE.PointLight(neonColors[i%neonColors.length], 0.8, 12);
    boardLight.position.copy(board.position);
    root.add(boardLight);
    dynamicTickers.push((t) => {
      boardLight.intensity = 0.8 + Math.sin(t*2.2 + i)*0.4;
    });
  }

  // Moon
  const moon = makeSunSprite(THREE, 0xffc5ff, 20);
  moon.position.set(80, 100, -100);
  root.add(moon);

  // Distant city glow
  const cityGlow = new THREE.Mesh(
    new THREE.PlaneGeometry(300, 30),
    new THREE.MeshBasicMaterial({ color: 0xa86bff, transparent: true, opacity: 0.06, blending: THREE.AdditiveBlending })
  );
  cityGlow.position.set(0, 15, -200);
  root.add(cityGlow);

  return { spawn: new THREE.Vector3(0, 0, 5), spawnYaw: Math.PI };
}

function cyberTower(THREE, root, x, z, w, d, h, neonColors, collidables, dynamicTickers) {
  const g = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x080818, roughness: 0.48, metalness: 0.42, emissive: 0x020208 });
  g.add(meshBox(THREE, w, h, d, 0, h/2, 0, bodyMat));

  const stripColor = neonColors[Math.floor(Math.random()*neonColors.length)];
  const stripMat = new THREE.MeshBasicMaterial({ color: stripColor });
  const strip = new THREE.Mesh(new THREE.BoxGeometry(0.14, h*0.9, 0.06), stripMat);
  strip.position.set(-w/2 - 0.06, h/2, d/2 - 0.5);
  g.add(strip);
  const strip2 = strip.clone(); strip2.position.x = w/2 + 0.06;
  g.add(strip2);
  const stripLight = new THREE.PointLight(stripColor, 0.9, 14);
  stripLight.position.set(0, h*0.6, d/2);
  g.add(stripLight);

  // Windows
  const winRows = Math.floor(h/1.9);
  const winCols = Math.floor(w/1.3);
  for (let r=0;r<winRows;r++){
    for (let c=0;c<winCols;c++){
      if (Math.random() > 0.42) continue;
      const col = Math.random()<0.28 ? neonColors[Math.floor(Math.random()*neonColors.length)] : 0xffb048;
      const win = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 0.75), new THREE.MeshBasicMaterial({ color: col }));
      win.position.set(-w/2 + 0.65 + c*1.3, 1.1 + r*1.9, d/2 + 0.01);
      g.add(win);
    }
  }

  // Kanji sign
  if (Math.random() < 0.82) {
    const signs = ['電','夢','禁','開','愛','極','超','星','閃','影','炎','灯','速','風','雷','龍'];
    const signC = document.createElement('canvas'); signC.width = signC.height = 256;
    const ctx = signC.getContext('2d');
    ctx.fillStyle = 'rgba(0,0,0,0.88)'; ctx.fillRect(0,0,256,256);
    const col = '#' + stripColor.toString(16).padStart(6,'0');
    ctx.fillStyle = col;
    ctx.font = 'bold 190px serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.shadowColor = col; ctx.shadowBlur = 35;
    ctx.fillText(signs[Math.floor(Math.random()*signs.length)], 128, 140);
    const sign = new THREE.Mesh(
      new THREE.PlaneGeometry(2.8, 2.8),
      new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(signC), transparent: true })
    );
    sign.position.set(0, h*0.65, d/2 + 0.1);
    g.add(sign);
  }

  // Animated neon flicker
  dynamicTickers.push((t) => {
    const flicker = Math.random() > 0.98 ? 0 : 1;
    stripLight.intensity = 0.9 * flicker * (0.8 + Math.sin(t*3.5)*0.2);
  });

  g.position.set(x, 0, z);
  root.add(g);
  collidables.push({ type:'box', cx:x, cz:z, hx:w/2+0.3, hz:d/2+0.3, angle:0 });
}

function buildFlyingCar(THREE, color) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(2.8, 0.65, 5.5),
    new THREE.MeshStandardMaterial({ color: 0x101018, metalness: 0.82, roughness: 0.22 })
  );
  g.add(body);
  const cabin = new THREE.Mesh(
    new THREE.BoxGeometry(2.2, 0.55, 2.8),
    new THREE.MeshStandardMaterial({ color: 0x0a0a18, metalness: 0.5, roughness: 0.18, emissive: 0x3040a0, emissiveIntensity: 0.45 })
  );
  cabin.position.set(0, 0.55, -0.5); g.add(cabin);
  const under = new THREE.Mesh(
    new THREE.PlaneGeometry(2.6, 5.2),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.85 })
  );
  under.rotation.x = Math.PI/2; under.position.y = -0.35; g.add(under);
  const trail = new THREE.Mesh(
    new THREE.PlaneGeometry(0.7, 7),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.38 })
  );
  trail.rotation.x = Math.PI/2; trail.position.set(0, 0, 5); g.add(trail);
  // Engine glow
  const engLight = new THREE.PointLight(color, 1.2, 10);
  engLight.position.set(0, -0.5, 0); g.add(engLight);
  return g;
}

// ============================================================
// BIOME: MARS — Red planet colony with domes
// ============================================================
function buildMars(api) {
  const { THREE, world, root, collidables, dynamicTickers } = api;

  addGroundLayered(THREE, root, 0x9c4628, 0x8a3a20, 600);

  // Rocky terrain
  for (let i=0;i<120;i++){
    const x = (Math.random()-0.5)*320;
    const z = (Math.random()-0.5)*320;
    if (Math.abs(x)<10 && Math.abs(z)<10) continue;
    const rock = new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.5 + Math.random()*2.5),
      new THREE.MeshStandardMaterial({ color: 0x7a3a20 + Math.floor(Math.random()*0x101010), roughness: 1 })
    );
    rock.position.set(x, -0.2, z);
    rock.rotation.set(Math.random()*Math.PI, Math.random()*Math.PI, Math.random()*Math.PI);
    rock.castShadow = true; root.add(rock);
    if (Math.hypot(x,z) > 8) collidables.push({ x, z, r: 1.1 });
  }

  // Mars mountains
  addDistantMountains(THREE, root, 0x5a2818, 260, 16);

  // Domes
  const ringMat = new THREE.MeshStandardMaterial({ color: 0xdad6cc, metalness: 0.65, roughness: 0.28 });
  function dome(x, z, radius) {
    const g = new THREE.Group();
    const glass = new THREE.Mesh(
      new THREE.SphereGeometry(radius, 36, 18, 0, Math.PI*2, 0, Math.PI/2),
      new THREE.MeshStandardMaterial({
        color: 0xc0e4ff, metalness: 0.32, roughness: 0.04,
        transparent: true, opacity: 0.30, side: THREE.DoubleSide,
        emissive: 0x203040, emissiveIntensity: 0.2,
      })
    );
    g.add(glass);
    const ring = new THREE.Mesh(new THREE.CylinderGeometry(radius*1.02, radius*1.02, 0.7, 36), ringMat);
    ring.position.y = 0.35; g.add(ring);
    // Internal buildings
    for (let i=0;i<8;i++){
      const bh = 2 + Math.random()*4;
      const b = meshBox(THREE, 1.5+Math.random(), bh, 1.5+Math.random(),
        (Math.random()-0.5)*radius*1.2, bh/2, (Math.random()-0.5)*radius*1.2,
        new THREE.MeshStandardMaterial({ color: 0xeeecea, roughness: 0.8 }));
      g.add(b);
    }
    // Life support greenery
    const tree = new THREE.Mesh(
      new THREE.SphereGeometry(0.9, 12, 8),
      new THREE.MeshStandardMaterial({ color: 0x4a8030, roughness: 0.8, emissive: 0x0a3010, emissiveIntensity: 0.2 })
    );
    tree.position.set(1, 1.3, 0); g.add(tree);
    // Dome glow
    const domeLight = new THREE.PointLight(0x80c0ff, 0.6, radius*2);
    domeLight.position.set(0, radius*0.5, 0); g.add(domeLight);
    g.position.set(x, 0, z);
    root.add(g);
    collidables.push({ x, z, r: radius+0.3 });
  }
  dome(-32, -42, 10);
  dome(0, -72, 15);
  dome(32, -42, 10);
  dome(-52, 12, 8);
  dome(58, 8, 8);

  // Connecting tubes
  function tube(x1,z1,x2,z2) {
    const dx = x2-x1, dz = z2-z1;
    const len = Math.hypot(dx, dz);
    const t = new THREE.Mesh(
      new THREE.CylinderGeometry(1.6, 1.6, len, 14, 1, true),
      new THREE.MeshStandardMaterial({ color: 0xc0e4ff, transparent: true, opacity: 0.28, side: THREE.DoubleSide, metalness: 0.55 })
    );
    t.rotation.z = Math.PI/2;
    t.rotation.y = -Math.atan2(dz, dx);
    t.position.set((x1+x2)/2, 1.6, (z1+z2)/2);
    root.add(t);
  }
  tube(-32,-42, 0,-72); tube(32,-42, 0,-72);
  tube(-52,12, -32,-42); tube(58,8, 32,-42);

  // Two moons
  const moonA = makeSunSprite(THREE, 0xf0e8e0, 8);
  moonA.position.set(100, 150, -80); root.add(moonA);
  const moonB = makeSunSprite(THREE, 0xffe0c0, 5);
  moonB.position.set(-70, 120, 30); root.add(moonB);

  // Dust storm
  const dust = makeFallingParticles(THREE, 0xcc8040, 300, 90);
  dust.material.size = 0.08; dust.material.opacity = 0.42;
  root.add(dust);
  dynamicTickers.push((t, dt) => updateFallingParticles(dust, dt*0.18, 90));

  // Lander
  const lander = new THREE.Group();
  const lb = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.9, 2.2, 14), new THREE.MeshStandardMaterial({ color: 0xd8d4cc, metalness: 0.72, roughness: 0.28 }));
  lb.position.y = 1.1; lander.add(lb);
  const ltop = new THREE.Mesh(new THREE.ConeGeometry(1.3, 1.6, 14), new THREE.MeshStandardMaterial({ color: 0xd8d4cc, metalness: 0.72, roughness: 0.28 }));
  ltop.position.y = 3.0; lander.add(ltop);
  for (let i=0;i<4;i++){
    const a = i*Math.PI/2;
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.09,0.11,2.0,7), new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.82, roughness: 0.28 }));
    leg.position.set(Math.cos(a)*1.4, 0.55, Math.sin(a)*1.4);
    leg.rotation.z = Math.cos(a)*0.32; leg.rotation.x = Math.sin(a)*0.32;
    lander.add(leg);
  }
  lander.position.set(16, 0, 16); root.add(lander);
  collidables.push({ x:16, z:16, r:2.4 });

  return { spawn: new THREE.Vector3(0, 0, 15), spawnYaw: Math.PI };
}

// ============================================================
// BIOME: ATLANTIS — underwater city
// ============================================================
function buildAtlantis(api) {
  const { THREE, world, root, collidables, dynamicTickers } = api;

  addGroundLayered(THREE, root, 0x0a3848, 0x0d4458, 500);

  // Sea floor
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(400, 400, 40, 40),
    new THREE.MeshStandardMaterial({ color: 0x1a6070, roughness: 0.98 })
  );
  floor.rotation.x = -Math.PI/2; floor.position.y = 0.01;
  floor.receiveShadow = true; root.add(floor);

  // Underwater caustics (animated light)
  const causticLight = new THREE.PointLight(0x80e8ff, 1.5, 60);
  causticLight.position.set(0, 25, 0);
  root.add(causticLight);
  dynamicTickers.push((t) => {
    causticLight.intensity = 1.5 + Math.sin(t*1.8)*0.5;
    causticLight.position.x = Math.sin(t*0.6)*8;
    causticLight.position.z = Math.cos(t*0.5)*8;
  });

  // Temple — Atlantean
  const marbleMat = new THREE.MeshStandardMaterial({ color: 0xe8e4d8, roughness: 0.48, metalness: 0.32, emissive: 0x104050, emissiveIntensity: 0.28 });
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xffd080, metalness: 0.96, roughness: 0.18, emissive: 0x5a3010, emissiveIntensity: 0.55 });
  const temple = new THREE.Group();
  temple.add(meshBox(THREE, 22, 1.1, 20, 0, 0.55, 0, marbleMat));
  for (let i=0;i<8;i++){
    const sh = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.85, 10, 14), marbleMat);
    sh.position.set(-10.5+i*3, 6, 9); temple.add(sh);
    collidables.push({ x: -10.5+i*3, z: 9-40, r: 1 });
  }
  const roof = meshBox(THREE, 24, 2.2, 3.5, 0, 12.2, 9, goldMat);
  temple.add(roof);
  temple.add(meshBox(THREE, 18, 8, 16, 0, 5.5, -1, marbleMat));
  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(7.5, 28, 14, 0, Math.PI*2, 0, Math.PI/2),
    goldMat
  );
  dome.position.set(0, 9.5, -1); temple.add(dome);
  // Dome glow
  const domeGlow = new THREE.PointLight(0xffd080, 1.2, 30);
  domeGlow.position.set(0, 16, -1); temple.add(domeGlow);
  dynamicTickers.push((t) => { domeGlow.intensity = 1.2 + Math.sin(t*1.2)*0.3; });
  temple.position.set(0, 0, -40); root.add(temple);
  collidables.push({ type:'box', cx:0, cz:-40, hx:11, hz:10, angle:0 });

  // Smaller buildings around
  for (let i=0;i<10;i++){
    const a = (i/10)*Math.PI*2;
    const dist = 58;
    const bx = Math.cos(a)*dist, bz = Math.sin(a)*dist - 40;
    const bh = 4 + Math.random()*6;
    const b = new THREE.Group();
    b.add(meshBox(THREE, 4, bh, 4, 0, bh/2, 0, marbleMat));
    const btop = new THREE.Mesh(new THREE.ConeGeometry(3, 3, 4), goldMat);
    btop.rotation.y = Math.PI/4; btop.position.y = bh + 1.5; b.add(btop);
    b.position.set(bx, 0, bz); root.add(b);
    collidables.push({ x:bx, z:bz, r:3 });
  }

  // Glowing coral
  for (let i=0;i<30;i++){
    const a = Math.random()*Math.PI*2;
    const d = 15 + Math.random()*45;
    const cx = Math.cos(a)*d, cz = Math.sin(a)*d - 15;
    const coralMat = new THREE.MeshStandardMaterial({
      color: [0xff6080, 0xff8040, 0x40ffb0, 0x8040ff][Math.floor(Math.random()*4)],
      emissive: [0xff4060, 0xff6020, 0x20ff90, 0x6020ff][Math.floor(Math.random()*4)],
      emissiveIntensity: 0.6, roughness: 0.7,
    });
    const coral = new THREE.Mesh(new THREE.ConeGeometry(0.3+Math.random()*0.4, 1.5+Math.random()*2, 6), coralMat);
    coral.position.set(cx, 0.5, cz);
    coral.rotation.y = Math.random()*Math.PI;
    root.add(coral);
  }

  // Bubble particles
  const bubbles = makeFallingParticles(THREE, 0x80e8ff, 300, 60);
  bubbles.material.size = 0.06; bubbles.material.opacity = 0.55;
  root.add(bubbles);
  dynamicTickers.push((t, dt) => {
    const bp = bubbles.geometry.attributes.position;
    for (let i=0;i<bp.count;i++){
      bp.array[i*3+1] += dt * 1.8;
      bp.array[i*3]   += Math.sin(t + i)*dt*0.3;
      if (bp.array[i*3+1] > 30) {
        bp.array[i*3+1] = 0;
        bp.array[i*3]   = (Math.random()-0.5)*60;
        bp.array[i*3+2] = (Math.random()-0.5)*60;
      }
    }
    bp.needsUpdate = true;
  });

  // Glowing fish
  for (let i=0;i<12;i++){
    const fishMat = new THREE.MeshStandardMaterial({
      color: [0xff8040, 0x40ffb0, 0x8080ff, 0xffff40][i%4],
      emissive: [0xff4020, 0x20ff80, 0x4040ff, 0xffff20][i%4],
      emissiveIntensity: 0.8, roughness: 0.6,
    });
    const fish = new THREE.Group();
    const fishBody = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), fishMat);
    fish.add(fishBody);
    const fishTail = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.35, 6), fishMat);
    fishTail.rotation.z = Math.PI/2; fishTail.position.x = -0.3; fish.add(fishTail);
    fish.position.set((Math.random()-0.5)*30, 3+Math.random()*8, (Math.random()-0.5)*30 - 20);
    root.add(fish);
    const speed = 0.8 + Math.random()*0.8;
    const phase = Math.random()*Math.PI*2;
    const radius = 5 + Math.random()*10;
    const baseY = 3 + Math.random()*8;
    dynamicTickers.push((t) => {
      fish.position.x = Math.cos(t*speed + phase)*radius;
      fish.position.z = Math.sin(t*speed + phase)*radius - 20;
      fish.position.y = baseY + Math.sin(t*1.5 + phase)*1.5;
      fish.rotation.y = -t*speed - phase + Math.PI/2;
    });
  }

  return { spawn: new THREE.Vector3(0, 0, 20), spawnYaw: Math.PI };
}

// ============================================================
// BIOME: CHANG'AN — Tang Dynasty, silk road
// ============================================================
function buildChangAn(api) {
  const { THREE, world, root, collidables, dynamicTickers } = api;

  addGroundLayered(THREE, root, 0x7a5234, 0x6a4428, 500);

  // Main avenue
  const avenue = new THREE.Mesh(
    new THREE.PlaneGeometry(20, 280),
    new THREE.MeshStandardMaterial({ color: 0x5a3a22, roughness: 0.88 })
  );
  avenue.rotation.x = -Math.PI/2; avenue.position.y = 0.01;
  avenue.receiveShadow = true; root.add(avenue);

  // Gate tower
  const gateMat = new THREE.MeshStandardMaterial({ color: 0x8a2a18, roughness: 0.65, emissive: 0x2a0808, emissiveIntensity: 0.2 });
  const roofMat = new THREE.MeshStandardMaterial({ color: 0x1a1208, roughness: 0.72 });
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xd4b174, roughness: 0.22, metalness: 0.95, emissive: 0x3a2a10, emissiveIntensity: 0.8 });

  function gateTower(x, z) {
    const g = new THREE.Group();
    g.add(meshBox(THREE, 18, 5, 8, 0, 2.5, 0, new THREE.MeshStandardMaterial({ color: 0x7a5234, roughness: 0.88 })));
    g.add(meshBox(THREE, 14, 4, 6, 0, 7, 0, gateMat));
    const roof = new THREE.Mesh(new THREE.ConeGeometry(9, 2.5, 4), roofMat);
    roof.rotation.y = Math.PI/4; roof.position.y = 10; g.add(roof);
    // Upturned corners
    for (let c=0;c<4;c++){
      const ca = (c/4)*Math.PI*2 + Math.PI/4;
      const tip = meshBox(THREE, 0.3, 0.3, 1.2, Math.cos(ca)*8.5, 9.2, Math.sin(ca)*8.5, goldMat);
      tip.rotation.y = -ca; tip.rotation.x = 0.4; g.add(tip);
    }
    // Red columns
    for (let i=0;i<4;i++){
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.48, 5, 12), gateMat);
      col.position.set(-5+i*3.3, 2.5, 2.8); g.add(col);
    }
    g.position.set(x, 0, z);
    root.add(g);
    collidables.push({ type:'box', cx:x, cz:z, hx:9, hz:4, angle:0 });
  }
  gateTower(0, -80);

  // Buildings lining the avenue
  for (let i=0;i<8;i++){
    const z = -5 - i*14;
    tangBuilding(THREE, root, -16, z, Math.PI/2, collidables, dynamicTickers);
    tangBuilding(THREE, root,  16, z, -Math.PI/2, collidables, dynamicTickers);
  }

  // Lanterns on poles
  for (let i=0;i<10;i++){
    const z = -10 - i*14;
    for (let side of [-11, 11]) {
      const pole = new THREE.Group();
      pole.add(meshBox(THREE, 0.18, 5, 0.18, 0, 2.5, 0, new THREE.MeshStandardMaterial({ color: 0x3a2010, roughness: 0.88 })));
      const lanternMat = new THREE.MeshStandardMaterial({ color: 0xff4020, emissive: 0xff2010, emissiveIntensity: 1.2, transparent: true, opacity: 0.9 });
      const lantern = new THREE.Mesh(new THREE.SphereGeometry(0.38, 14, 10), lanternMat);
      lantern.position.y = 5.5; pole.add(lantern);
      pole.position.set(side, 0, z); root.add(pole);
      const ptLight = new THREE.PointLight(0xff4020, 1.4, 10);
      ptLight.position.set(side, 5.5, z); root.add(ptLight);
      dynamicTickers.push((t) => { ptLight.intensity = 1.4 + Math.sin(t*
3.8 + i)*0.35; });
    }
  }

  // Silk road goods — crates and barrels
  for (let i=0;i<16;i++){
    const x = (Math.random()-0.5)*24;
    const z = -15 - Math.random()*80;
    if (Math.abs(x) < 10) continue;
    const crate = meshBox(THREE, 1.2, 1.0, 1.2, x, 0.5, z,
      new THREE.MeshStandardMaterial({ color: 0x8a6040, roughness: 0.92 }));
    root.add(crate);
  }

  // Sunset glow
  const sunSprite = makeSunSprite(THREE, 0xff8040, 24);
  sunSprite.position.set(-60, 80, 20);
  root.add(sunSprite);

  // Distant mountains
  addDistantMountains(THREE, root, 0x5a3a28, 240, 18);

  return { spawn: new THREE.Vector3(0, 0, 15), spawnYaw: Math.PI };
}

function tangBuilding(THREE, root, x, z, rotY, collidables, dynamicTickers) {
  const g = new THREE.Group();
  const wallMat = new THREE.MeshStandardMaterial({ color: 0xf0e0c0, roughness: 0.82 });
  const redMat = new THREE.MeshStandardMaterial({ color: 0x8a2a18, roughness: 0.65, emissive: 0x2a0808, emissiveIntensity: 0.2 });
  const roofMat = new THREE.MeshStandardMaterial({ color: 0x1a1208, roughness: 0.72 });
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xd4b174, roughness: 0.22, metalness: 0.95, emissive: 0x3a2a10, emissiveIntensity: 0.8 });

  g.add(meshBox(THREE, 8, 4, 7, 0, 2, 0, wallMat));
  // Red columns
  for (let i=0;i<2;i++) for (let j=0;j<2;j++){
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.42, 4, 12), redMat);
    col.position.set(-3.5+i*7, 2, -3.3+j*6.6); g.add(col);
  }
  // Roof
  g.add(meshBox(THREE, 10, 0.35, 9, 0, 4.18, 0, roofMat));
  const roof = new THREE.Mesh(new THREE.ConeGeometry(5.8, 2.2, 4), roofMat);
  roof.rotation.y = Math.PI/4; roof.position.y = 5.5; g.add(roof);
  // Gold tips
  for (let c=0;c<4;c++){
    const ca = (c/4)*Math.PI*2 + Math.PI/4;
    const tip = meshBox(THREE, 0.25, 0.25, 1.0, Math.cos(ca)*5.5, 4.8, Math.sin(ca)*5.5, goldMat);
    tip.rotation.y = -ca; tip.rotation.x = 0.38; g.add(tip);
  }
  // Second floor
  g.add(meshBox(THREE, 6, 3, 5.5, 0, 6.5, 0, wallMat));
  const roof2 = new THREE.Mesh(new THREE.ConeGeometry(4.2, 1.8, 4), roofMat);
  roof2.rotation.y = Math.PI/4; roof2.position.y = 8.5; g.add(roof2);
  // Lantern
  const lanternMat = new THREE.MeshStandardMaterial({ color: 0xff4020, emissive: 0xff2010, emissiveIntensity: 1.2, transparent: true, opacity: 0.9 });
  const lantern = new THREE.Mesh(new THREE.SphereGeometry(0.32, 12, 8), lanternMat);
  lantern.position.set(0, 3.5, 3.6); g.add(lantern);
  const ptLight = new THREE.PointLight(0xff4020, 1.2, 9);
  ptLight.position.set(x, 3.5, z);
  root.add(ptLight);
  dynamicTickers.push((t) => { ptLight.intensity = 1.2 + Math.sin(t*3.5 + x)*0.3; });

  g.position.set(x, 0, z);
  g.rotation.y = rotY;
  root.add(g);
  collidables.push({ type:'box', cx:x, cz:z, hx:4, hz:3.5, angle:rotY });
}

// ============================================================
// BIOME: VENICE — canals, gondolas, bridges
// ============================================================
function buildVenice(api) {
  const { THREE, world, root, collidables, dynamicTickers } = api;

  addGroundLayered(THREE, root, 0x7a6a5a, 0x6a5a4a, 500);

  // Canal
  const canal = new THREE.Mesh(
    new THREE.PlaneGeometry(12, 280),
    new THREE.MeshStandardMaterial({ color: 0x3a6a8a, roughness: 0.05, metalness: 0.4, transparent: true, opacity: 0.88 })
  );
  canal.rotation.x = -Math.PI/2; canal.position.y = -0.05;
  canal.receiveShadow = true; root.add(canal);

  // Canal banks
  for (let side of [-7, 7]) {
    const bank = new THREE.Mesh(
      new THREE.PlaneGeometry(4, 280),
      new THREE.MeshStandardMaterial({ color: 0x8a7a6a, roughness: 0.88 })
    );
    bank.rotation.x = -Math.PI/2; bank.position.set(side, 0.01, 0);
    root.add(bank);
  }

  // Venetian buildings
  for (let i=0;i<10;i++){
    const z = -5 - i*16;
    venetianBuilding(THREE, root, -14, z, Math.PI/2, collidables);
    venetianBuilding(THREE, root,  14, z, -Math.PI/2, collidables);
  }

  // Bridges over canal
  for (let i=0;i<4;i++){
    const z = -20 - i*55;
    bridge(THREE, root, z, collidables);
  }

  // Gondolas
  for (let i=0;i<4;i++){
    const gondola = makeGondola(THREE);
    const startZ = -20 - i*60;
    gondola.position.set((Math.random()-0.5)*4, -0.05, startZ);
    root.add(gondola);
    const speed = 1.5 + Math.random()*1.0;
    const lane = (Math.random()-0.5)*4;
    dynamicTickers.push((t) => {
      gondola.position.z = startZ + ((t * speed) % 120) - 60;
      gondola.position.x = lane + Math.sin(t*0.4 + i)*0.3;
      gondola.rotation.y = Math.PI + Math.sin(t*0.3 + i)*0.08;
    });
  }

  // Morning mist
  const mist = makeFallingParticles(THREE, 0xd0d8e8, 150, 60);
  mist.material.size = 0.22; mist.material.opacity = 0.07;
  root.add(mist);
  dynamicTickers.push((t, dt) => updateFallingParticles(mist, dt*0.06, 60));

  // Seagulls
  addFlock(THREE, root, dynamicTickers, 0xd0d0d0, 8, 80);

  // Morning sun
  const sunSprite = makeSunSprite(THREE, 0xffe0b0, 20);
  sunSprite.position.set(70, 90, 40);
  root.add(sunSprite);

  // Distant mountains
  addDistantMountains(THREE, root, 0x8a8a9a, 220, 16);

  return { spawn: new THREE.Vector3(0, 0, 15), spawnYaw: Math.PI };
}

function venetianBuilding(THREE, root, x, z, rotY, collidables) {
  const g = new THREE.Group();
  const wallMat = new THREE.MeshStandardMaterial({ color: 0xf0e0d0, roughness: 0.82 });
  const stoneMat = new THREE.MeshStandardMaterial({ color: 0xd0c0a8, roughness: 0.88 });
  const roofMat = new THREE.MeshStandardMaterial({ color: 0x8a4a28, roughness: 0.82 });
  const accentMat = new THREE.MeshStandardMaterial({ color: 0xd4b174, roughness: 0.25, metalness: 0.9 });

  const floors = 2 + Math.floor(Math.random()*2);
  const w = 7 + Math.random()*3, d = 6 + Math.random()*2;
  for (let f=0;f<floors;f++){
    g.add(meshBox(THREE, w, 3.5, d, 0, 1.75 + f*3.5, 0, wallMat));
    // Window arches
    for (let wi=0;wi<3;wi++){
      const winMat = new THREE.MeshStandardMaterial({ color: 0xffcc80, emissive: 0xff9040, emissiveIntensity: 0.8 });
      const win = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 1.2), winMat);
      win.position.set(-2.5+wi*2.5, 2.0 + f*3.5, d/2+0.01); g.add(win);
    }
    // Floor band
    if (f < floors-1) {
      g.add(meshBox(THREE, w+0.3, 0.3, d+0.3, 0, 3.5 + f*3.5 + 0.15, 0, stoneMat));
    }
  }
  // Roof
  const roof = new THREE.Mesh(new THREE.CylinderGeometry(0.01, w*0.58, 2.2, 3, 1), roofMat);
  roof.rotation.z = Math.PI/2; roof.rotation.y = Math.PI/2;
  roof.position.y = floors*3.5 + 1.1; roof.scale.z = 1.3; g.add(roof);
  // Chimney
  g.add(meshBox(THREE, 0.6, 1.8, 0.6, w*0.3, floors*3.5 + 1.5, 0, stoneMat));

  g.position.set(x, 0, z);
  g.rotation.y = rotY;
  root.add(g);
  collidables.push({ type:'box', cx:x, cz:z, hx:w/2, hz:d/2, angle:rotY });
}

function bridge(THREE, root, z, collidables) {
  const stoneMat = new THREE.MeshStandardMaterial({ color: 0xd0c0a8, roughness: 0.88 });
  const g = new THREE.Group();
  // Arch
  const arch = new THREE.Mesh(new THREE.TorusGeometry(4.5, 0.8, 12, 32, Math.PI), stoneMat);
  arch.rotation.z = Math.PI; arch.position.set(0, 4.5, 0); g.add(arch);
  // Deck
  g.add(meshBox(THREE, 10, 0.5, 3.5, 0, 5.5, 0, stoneMat));
  // Railings
  for (let i=0;i<8;i++){
    g.add(meshBox(THREE, 0.18, 1.2, 0.18, -4.2+i*1.2, 6.3, 1.7, stoneMat));
    g.add(meshBox(THREE, 0.18, 1.2, 0.18, -4.2+i*1.2, 6.3, -1.7, stoneMat));
  }
  g.add(meshBox(THREE, 10, 0.12, 0.12, 0, 7.0, 1.7, stoneMat));
  g.add(meshBox(THREE, 10, 0.12, 0.12, 0, 7.0, -1.7, stoneMat));
  g.position.set(0, -0.5, z);
  root.add(g);
  collidables.push({ type:'box', cx:0, cz:z, hx:5, hz:1.75, angle:0 });
}

function makeGondola(THREE) {
  const g = new THREE.Group();
  const hullMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.4, metalness: 0.5 });
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xd4b174, roughness: 0.2, metalness: 0.95 });
  const cushionMat = new THREE.MeshStandardMaterial({ color: 0x8a1a18, roughness: 0.8 });
  // Hull
  const hull = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.45, 6), hullMat);
  hull.position.y = 0.22; g.add(hull);
  // Bow
  const bow = new THREE.Mesh(new THREE.ConeGeometry(0.22, 1.2, 8), goldMat);
  bow.rotation.x = Math.PI/2; bow.position.set(0, 0.45, 3.6); g.add(bow);
  // Cushion
  const cushion = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.28, 1.8), cushionMat);
  cushion.position.set(0, 0.6, -0.5); g.add(cushion);
  // Gondolier
  const gondolier = new THREE.Group();
  const body = meshBox(THREE, 0.4, 1.0, 0.4, 0, 0.5, 0, new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.9 }));
  gondolier.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), new THREE.MeshStandardMaterial({ color: 0xd4a878, roughness: 0.8 }));
  head.position.y = 1.2; gondolier.add(head);
  gondolier.position.set(0, 0.45, 1.8);
  g.add(gondolier);
  // Pole
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 4, 8), new THREE.MeshStandardMaterial({ color: 0x4a3020, roughness: 0.9 }));
  pole.position.set(0.5, 2.4, 1.8); pole.rotation.z = 0.15; g.add(pole);
  return g;
}

// ============================================================
// BIOME: SPACE STATION — orbital, stars, Earth below
// ============================================================
function buildSpaceStation(api) {
  const { THREE, world, root, collidables, dynamicTickers } = api;

  // Dark space floor (glass)
  const floorMat = new THREE.MeshStandardMaterial({
    color: 0x1a2030, roughness: 0.12, metalness: 0.7,
    emissive: 0x0a1020, emissiveIntensity: 0.3,
  });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(500, 500), floorMat);
  floor.rotation.x = -Math.PI/2; floor.receiveShadow = true;
  root.add(floor);

  // Earth below (visible through glass floor)
  const earthMat = new THREE.MeshStandardMaterial({
    color: 0x1a4a8a, roughness: 0.4, metalness: 0.1,
    emissive: 0x0a2a4a, emissiveIntensity: 0.5,
  });
  const earth = new THREE.Mesh(new THREE.SphereGeometry(80, 32, 24), earthMat);
  earth.position.set(0, -120, 0);
  root.add(earth);
  // Cloud layer
  const cloudMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8, transparent: true, opacity: 0.35 });
  const clouds = new THREE.Mesh(new THREE.SphereGeometry(81.5, 28, 20), cloudMat);
  clouds.position.copy(earth.position);
  root.add(clouds);
  dynamicTickers.push((t) => { clouds.rotation.y = t*0.008; });

  // Station modules
  const metalMat = new THREE.MeshStandardMaterial({ color: 0xd8d4cc, metalness: 0.75, roughness: 0.28 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x1a2030, metalness: 0.6, roughness: 0.4 });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x88aacc, metalness: 0.4, roughness: 0.05, transparent: true, opacity: 0.55 });

  // Central hub
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(5, 5, 8, 20), metalMat);
  hub.position.set(0, 4, -30); hub.castShadow = true;
  root.add(hub);
  collidables.push({ x:0, z:-30, r:5.5 });

  // Docking arms
  for (let i=0;i<4;i++){
    const a = (i/4)*Math.PI*2;
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 20, 10), metalMat);
    arm.rotation.z = Math.PI/2;
    arm.rotation.y = a;
    arm.position.set(Math.cos(a)*14, 4, -30 + Math.sin(a)*14);
    root.add(arm);
    // Module at end
    const mod = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 2.5, 6, 14), metalMat);
    mod.position.set(Math.cos(a)*24, 4, -30 + Math.sin(a)*24);
    root.add(mod);
    collidables.push({ x: Math.cos(a)*24, z: -30 + Math.sin(a)*24, r: 3 });
  }

  // Solar panels
  for (let i=0;i<2;i++){
    const side = i===0 ? -1 : 1;
    const panelMat = new THREE.MeshStandardMaterial({ color: 0x1a2a4a, roughness: 0.4, metalness: 0.5, emissive: 0x0a1a2a, emissiveIntensity: 0.3 });
    for (let j=0;j<3;j++){
      const panel = meshBox(THREE, 14, 0.15, 4, side*22, 4 + j*5, -30, panelMat);
      root.add(panel);
      // Panel frame
      const frame = meshBox(THREE, 14.4, 0.2, 4.4, side*22, 4 + j*5, -30, metalMat);
      root.add(frame);
    }
    const solarArm = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 18, 8), metalMat);
    solarArm.rotation.z = Math.PI/2;
    solarArm.position.set(side*14, 4, -30);
    root.add(solarArm);
  }

  // Corridor
  const corridor = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.2, 40, 14, 1, true), glassMat);
  corridor.rotation.z = Math.PI/2;
  corridor.position.set(0, 1.5, -30);
  root.add(corridor);

  // Observation dome
  const obsDome = new THREE.Mesh(
    new THREE.SphereGeometry(4, 24, 14, 0, Math.PI*2, 0, Math.PI/2),
    glassMat
  );
  obsDome.position.set(0, 8, -30);
  root.add(obsDome);
  collidables.push({ x:0, z:-30, r:4.5 });

  // Stars
  const starGeo = new THREE.BufferGeometry();
  const starPos = new Float32Array(3000*3);
  for (let i=0;i<3000;i++){
    const r = 800 + Math.random()*200;
    const theta = Math.random()*Math.PI*2;
    const phi = Math.acos(2*Math.random()-1);
    starPos[i*3]   = r*Math.sin(phi)*Math.cos(theta);
    starPos[i*3+1] = r*Math.sin(phi)*Math.sin(theta);
    starPos[i*3+2] = r*Math.cos(phi);
  }
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
  const starField = new THREE.Points(starGeo, new THREE.PointsMaterial({
    color: 0xffffff, size: 1.5, transparent: true, opacity: 0.9,
    depthWrite: false, blending: THREE.AdditiveBlending,
  }));
  root.add(starField);
  dynamicTickers.push((t) => { starField.rotation.y = t*0.004; });

  // Sun (far)
  const sunSprite = makeSunSprite(THREE, 0xfff0d8, 35);
  sunSprite.position.set(200, 20, 0);
  root.add(sunSprite);

  // Floating debris
  for (let i=0;i<12;i++){
    const debris = new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.15 + Math.random()*0.3),
      new THREE.MeshStandardMaterial({ color: 0x8a8a8a, metalness: 0.7, roughness: 0.4 })
    );
    debris.position.set((Math.random()-0.5)*80, 5 + Math.random()*15, (Math.random()-0.5)*80);
    root.add(debris);
    const speed = 0.2 + Math.random()*0.4;
    const phase = Math.random()*Math.PI*2;
    const radius = 20 + Math.random()*40;
    dynamicTickers.push((t) => {
      debris.position.x = Math.cos(t*speed + phase)*radius;
      debris.position.z = Math.sin(t*speed + phase)*radius - 30;
      debris.rotation.x += 0.01;
      debris.rotation.y += 0.008;
    });
  }

  // Ambient blue light from Earth
  const earthLight = new THREE.PointLight(0x4488ff, 0.8, 200);
  earthLight.position.set(0, -80, 0);
  root.add(earthLight);

  return { spawn: new THREE.Vector3(0, 0, 15), spawnYaw: Math.PI };
}
