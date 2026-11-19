import * as THREE from 'three';
import {
  CHARACTERS,
  GAME_STATE,
  SIDE,
  SKY_PALETTES,
  STORAGE_KEYS,
  TIMING,
  WORLD,
} from './constants.js';
import {
  createBranchTexture,
  createCharacterAssets,
  createCloudTexture,
  createForestBandTexture,
  createGroundTexture,
  createParticleTexture,
  createStumpTexture,
  createSunTexture,
  createTombstoneTexture,
  createTrunkTextures,
} from './textures.js';

export class TimberGame {
  constructor(canvas, sound, callbacks) {
    this.canvas = canvas;
    this.sound = sound;
    this.callbacks = callbacks;

    this.state = GAME_STATE.MENU;
    this.score = 0;
    this.bestScore = Number(localStorage.getItem(STORAGE_KEYS.BEST_SCORE) || 0);
    this.level = 1;
    this.timeLeft = TIMING.INITIAL_TIME;
    this.playerSide = SIDE.LEFT;
    this.chopPoseTimer = 0;
    this.combo = 0;
    this.lastChopTime = 0;
    this.runStartTime = 0;
    this.totalChopsInRun = 0;

    this.selectedCharId =
      localStorage.getItem(STORAGE_KEYS.CHARACTER) || CHARACTERS[0].id;
    if (!CHARACTERS.some((c) => c.id === this.selectedCharId)) {
      this.selectedCharId = CHARACTERS[0].id;
    }

    this.segments = [];
    this.flyingLogs = [];
    this.particles = [];
    this.clouds = [];
    this.stars = [];

    this.treeDropOffset = 0;
    this.shakeTime = 0;
    this.shakeIntensity = 0;
    this.clockTime = 0;
    this.lastFrameTs = 0;
    this.consecutiveSameSide = 0;

    // Smooth color transitions
    this.currentSkyTop = new THREE.Color(SKY_PALETTES[0].top);
    this.currentSkyBottom = new THREE.Color(SKY_PALETTES[0].bottom);
    this.currentSunColor = new THREE.Color(SKY_PALETTES[0].sun);
    this.currentHillFar = new THREE.Color(SKY_PALETTES[0].hillFar);
    this.currentHillMid = new THREE.Color(SKY_PALETTES[0].hillMid);
    this.currentHillNear = new THREE.Color(SKY_PALETTES[0].hillNear);

    this.initRenderer();
    this.initTextures();
    this.initSceneObjects();
    this.resetTree();
    this.handleResize();

    window.addEventListener('resize', () => this.handleResize());
    this.rafId = requestAnimationFrame((ts) => this.loop(ts));
  }

  initRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-400, 400, 500, -500, -500, 500);
    this.camera.position.set(0, 0, 100);
  }

  initTextures() {
    this.trunkTextures = createTrunkTextures();
    this.stumpTexture = createStumpTexture();
    this.branchTexture = createBranchTexture();
    this.tombstoneTexture = createTombstoneTexture();
    this.cloudTexture = createCloudTexture();
    this.sunTexture = createSunTexture();
    this.groundTexture = createGroundTexture();
    this.chipTexture = createParticleTexture('chip');
    this.leafTexture = createParticleTexture('leaf');

    this.characterAssets = {};
    for (const def of CHARACTERS) {
      this.characterAssets[def.id] = createCharacterAssets(def);
    }

    // Shared geometries
    this.trunkGeo = new THREE.PlaneGeometry(WORLD.TRUNK_WIDTH, WORLD.SEGMENT_HEIGHT + 2);
    this.branchGeo = new THREE.PlaneGeometry(WORLD.BRANCH_WIDTH, WORLD.BRANCH_HEIGHT);
    this.particleGeo = new THREE.PlaneGeometry(24, 24);
  }

  getCharacterPreviews() {
    return CHARACTERS.map((c) => ({
      id: c.id,
      name: c.name,
      preview: this.characterAssets[c.id].previewDataUrl,
    }));
  }

  setCharacter(charId) {
    if (!this.characterAssets[charId]) return;
    this.selectedCharId = charId;
    localStorage.setItem(STORAGE_KEYS.CHARACTER, charId);
    if (this.state !== GAME_STATE.GAMEOVER) {
      this.updatePlayerTexture(false);
    }
  }

  initSceneObjects() {
    // 1. Dynamic sky gradient shader background
    this.skyUniforms = {
      uTopColor: { value: this.currentSkyTop.clone() },
      uBottomColor: { value: this.currentSkyBottom.clone() },
    };
    const skyMat = new THREE.ShaderMaterial({
      uniforms: this.skyUniforms,
      depthWrite: false,
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uTopColor;
        uniform vec3 uBottomColor;
        varying vec2 vUv;
        void main() {
          vec3 col = mix(uBottomColor, uTopColor, smoothstep(0.12, 0.95, vUv.y));
          gl_FragColor = vec4(col, 1.0);
        }
      `,
    });
    this.skyMesh = new THREE.Mesh(new THREE.PlaneGeometry(3600, 2200), skyMat);
    this.skyMesh.position.set(0, 0, -100);
    this.scene.add(this.skyMesh);

    // 2. Stars (visible at twilight / night levels)
    const starGeo = new THREE.CircleGeometry(3.2, 6);
    for (let i = 0; i < 42; i++) {
      const mat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0,
      });
      const star = new THREE.Mesh(starGeo, mat);
      star.position.set(
        (Math.random() - 0.5) * 1800,
        40 + Math.random() * 480,
        -92
      );
      const s = 0.6 + Math.random() * 1.1;
      star.scale.set(s, s, 1);
      star.userData.phase = Math.random() * Math.PI * 2;
      this.scene.add(star);
      this.stars.push(star);
    }

    // 3. Sun / Moon glow
    this.sunMat = new THREE.MeshBasicMaterial({
      map: this.sunTexture,
      transparent: true,
      color: this.currentSunColor.clone(),
    });
    this.sunMesh = new THREE.Mesh(new THREE.PlaneGeometry(250, 250), this.sunMat);
    this.sunMesh.position.set(-240, 290, -85);
    this.scene.add(this.sunMesh);

    // 4. Drifting clouds
    for (let i = 0; i < 6; i++) {
      const mat = new THREE.MeshBasicMaterial({
        map: this.cloudTexture,
        transparent: true,
        opacity: 0.78,
      });
      const w = 180 + (i % 3) * 65;
      const cloud = new THREE.Mesh(new THREE.PlaneGeometry(w, w * 0.5), mat);
      cloud.position.set(-900 + i * 360, 180 + (i % 3) * 95, -75);
      cloud.userData.speed = 12 + (i % 3) * 7;
      this.scene.add(cloud);
      this.clouds.push(cloud);
    }

    // 5. Three parallax forest silhouette bands
    const farTex = createForestBandTexture(14);
    farTex.repeat.set(3, 1);
    this.hillFarMat = new THREE.MeshBasicMaterial({
      map: farTex,
      transparent: true,
      color: this.currentHillFar.clone(),
    });
    this.hillFarMesh = new THREE.Mesh(new THREE.PlaneGeometry(3400, 420), this.hillFarMat);
    this.hillFarMesh.position.set(0, WORLD.GROUND_Y + 210, -60);
    this.scene.add(this.hillFarMesh);

    const midTex = createForestBandTexture(11);
    midTex.repeat.set(3, 1);
    this.hillMidMat = new THREE.MeshBasicMaterial({
      map: midTex,
      transparent: true,
      color: this.currentHillMid.clone(),
    });
    this.hillMidMesh = new THREE.Mesh(new THREE.PlaneGeometry(3400, 380), this.hillMidMat);
    this.hillMidMesh.position.set(140, WORLD.GROUND_Y + 150, -50);
    this.scene.add(this.hillMidMesh);

    const nearTex = createForestBandTexture(9);
    nearTex.repeat.set(3, 1);
    this.hillNearMat = new THREE.MeshBasicMaterial({
      map: nearTex,
      transparent: true,
      color: this.currentHillNear.clone(),
    });
    this.hillNearMesh = new THREE.Mesh(new THREE.PlaneGeometry(3400, 340), this.hillNearMat);
    this.hillNearMesh.position.set(-120, WORLD.GROUND_Y + 95, -40);
    this.scene.add(this.hillNearMesh);

    // 6. Ground meadow strip + deep subsoil fill (prevents gaps on tall portrait screens)
    const subsoilMat = new THREE.MeshBasicMaterial({ color: 0x2b190d });
    this.subsoilMesh = new THREE.Mesh(new THREE.PlaneGeometry(3600, 1600), subsoilMat);
    this.subsoilMesh.position.set(0, WORLD.GROUND_Y - 820, -12);
    this.scene.add(this.subsoilMesh);

    this.groundTexture.repeat.set(6, 1);
    const groundMat = new THREE.MeshBasicMaterial({
      map: this.groundTexture,
      transparent: true,
    });
    this.groundMesh = new THREE.Mesh(new THREE.PlaneGeometry(3400, 340), groundMat);
    this.groundMesh.position.set(0, WORLD.GROUND_Y - 148, -10);
    this.scene.add(this.groundMesh);

    // 7. Tree Stump
    const stumpMat = new THREE.MeshBasicMaterial({
      map: this.stumpTexture,
      transparent: true,
    });
    this.stumpMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(WORLD.TRUNK_WIDTH * 1.48, WORLD.STUMP_HEIGHT * 1.32),
      stumpMat
    );
    this.stumpMesh.position.set(0, WORLD.GROUND_Y + WORLD.STUMP_HEIGHT * 0.42, 4);
    this.scene.add(this.stumpMesh);

    // 8. Tree Stack Group
    this.treeGroup = new THREE.Group();
    this.treeGroup.position.set(0, 0, 6);
    this.scene.add(this.treeGroup);

    // 9. Player Sprite Mesh
    this.playerMat = new THREE.MeshBasicMaterial({
      map: this.characterAssets[this.selectedCharId].idleTex,
      transparent: true,
    });
    this.playerMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(WORLD.PLAYER_WIDTH, WORLD.PLAYER_HEIGHT),
      this.playerMat
    );
    this.playerBaseY = WORLD.GROUND_Y + WORLD.PLAYER_HEIGHT * 0.48;
    this.playerMesh.position.set(
      this.playerSide * WORLD.PLAYER_OFFSET_X,
      this.playerBaseY,
      15
    );
    this.scene.add(this.playerMesh);
  }

  getSegmentY(index) {
    const base = WORLD.GROUND_Y + WORLD.STUMP_HEIGHT + WORLD.SEGMENT_HEIGHT * 0.46;
    return base + index * WORLD.SEGMENT_HEIGHT;
  }

  createSegmentMesh(branchSide, variantIndex) {
    const group = new THREE.Group();

    const trunkMat = new THREE.MeshBasicMaterial({
      map: this.trunkTextures[variantIndex % this.trunkTextures.length],
      transparent: true,
    });
    const trunkMesh = new THREE.Mesh(this.trunkGeo, trunkMat);
    group.add(trunkMesh);

    if (branchSide !== SIDE.NONE) {
      const branchMat = new THREE.MeshBasicMaterial({
        map: this.branchTexture,
        transparent: true,
      });
      const branchMesh = new THREE.Mesh(this.branchGeo, branchMat);
      branchMesh.position.set(
        branchSide * (WORLD.TRUNK_WIDTH * 0.42 + WORLD.BRANCH_WIDTH * 0.47),
        4,
        -0.5
      );
      branchMesh.scale.x = branchSide === SIDE.RIGHT ? 1 : -1;
      group.add(branchMesh);
    }

    return {
      group,
      branch: branchSide,
      variant: variantIndex,
    };
  }

  pickNextBranch(prevBranch) {
    // Classic Timberman fairness rule:
    // Opposite branches MUST be separated by at least one SIDE.NONE segment.
    const branchChance = Math.min(0.52 + (this.level - 1) * 0.04, 0.74);

    if (prevBranch === SIDE.NONE) {
      this.consecutiveSameSide = 0;
      if (Math.random() < branchChance) {
        this.consecutiveSameSide = 1;
        return Math.random() < 0.5 ? SIDE.LEFT : SIDE.RIGHT;
      }
      return SIDE.NONE;
    }

    // Previous had a branch: can only continue same side (up to 2-3 max) or clear to NONE
    if (this.consecutiveSameSide < 2 && Math.random() < 0.44) {
      this.consecutiveSameSide += 1;
      return prevBranch;
    }
    this.consecutiveSameSide = 0;
    return SIDE.NONE;
  }

  disposeSegment(seg) {
    seg.group.traverse((obj) => {
      if (obj.isMesh && obj.material) {
        obj.material.dispose();
      }
    });
  }

  resetTree() {
    for (const seg of this.segments) {
      this.treeGroup.remove(seg.group);
      this.disposeSegment(seg);
    }
    this.segments = [];
    this.consecutiveSameSide = 0;

    for (let i = 0; i < WORLD.VISIBLE_SEGMENTS; i++) {
      const branch =
        i < 3 ? SIDE.NONE : this.pickNextBranch(this.segments[i - 1].branch);
      const seg = this.createSegmentMesh(branch, i % this.trunkTextures.length);
      seg.group.position.set(0, this.getSegmentY(i), 0);
      this.treeGroup.add(seg.group);
      this.segments.push(seg);
    }
    this.treeDropOffset = 0;
  }

  startNewGame() {
    this.score = 0;
    this.level = 1;
    this.timeLeft = TIMING.INITIAL_TIME;
    this.playerSide = SIDE.LEFT;
    this.chopPoseTimer = 0;
    this.combo = 0;
    this.lastChopTime = 0;
    this.runStartTime = 0;
    this.totalChopsInRun = 0;
    this.state = GAME_STATE.READY;

    this.resetTree();
    this.updatePlayerTexture(false);
    this.playerMesh.rotation.z = 0;
    this.playerMesh.scale.set(-this.playerSide, 1, 1);
    this.playerMesh.position.set(
      this.playerSide * WORLD.PLAYER_OFFSET_X,
      this.playerBaseY,
      15
    );

    this.emitHud();
  }

  openMenu() {
    this.state = GAME_STATE.MENU;
    this.resetTree();
    this.playerSide = SIDE.LEFT;
    this.updatePlayerTexture(false);
    this.playerMesh.rotation.z = 0;
    this.playerMesh.scale.set(1, 1, 1);
    this.playerMesh.position.set(
      this.playerSide * WORLD.PLAYER_OFFSET_X,
      this.playerBaseY,
      15
    );
  }

  updatePlayerTexture(isChopping) {
    const assets = this.characterAssets[this.selectedCharId];
    this.playerMat.map = isChopping ? assets.chopTex : assets.idleTex;
    this.playerMat.needsUpdate = true;
  }

  chop(side) {
    if (this.state !== GAME_STATE.READY && this.state !== GAME_STATE.PLAYING) {
      return;
    }

    const now = performance.now();
    if (this.state === GAME_STATE.READY) {
      this.state = GAME_STATE.PLAYING;
      this.runStartTime = now;
      this.callbacks.onFirstChop?.();
    }

    this.playerSide = side;
    this.playerMesh.position.x = this.playerSide * WORLD.PLAYER_OFFSET_X;
    this.playerMesh.scale.set(-this.playerSide * 1.06, 0.94, 1);

    // Check 1: Did the player step directly into the current bottom segment's branch?
    if (this.segments[0].branch === this.playerSide) {
      this.triggerGameOver('УДАР ВЕТКОЙ!', false);
      return;
    }

    // Valid chop! Remove bottom segment and launch it flying away
    const chopped = this.segments.shift();
    this.treeGroup.remove(chopped.group);
    this.spawnFlyingLog(chopped, -this.playerSide);
    this.spawnChopParticles(this.playerSide, chopped.branch !== SIDE.NONE);

    // Push a new segment on top
    const topPrev = this.segments[this.segments.length - 1];
    const nextBranch = this.pickNextBranch(topPrev.branch);
    const nextVariant = (topPrev.variant + 1 + Math.floor(Math.random() * 2)) % this.trunkTextures.length;
    const newSeg = this.createSegmentMesh(nextBranch, nextVariant);
    this.treeGroup.add(newSeg.group);
    this.segments.push(newSeg);

    // Animate smooth drop of remaining tree segments
    this.treeDropOffset = Math.min(this.treeDropOffset + WORLD.SEGMENT_HEIGHT, WORLD.SEGMENT_HEIGHT * 1.45);
    this.repositionTreeSegments();

    // Score, combo & timer refill
    this.score += 1;
    this.totalChopsInRun += 1;
    if (now - this.lastChopTime < 460) {
      this.combo += 1;
    } else {
      this.combo = 1;
    }
    this.lastChopTime = now;

    this.timeLeft = Math.min(TIMING.MAX_TIME, this.timeLeft + TIMING.CHOP_REFILL);
    this.chopPoseTimer = TIMING.CHOP_POSE_DURATION;
    this.updatePlayerTexture(true);

    // Screen punch shake
    this.shakeTime = 0.08;
    this.shakeIntensity = 6.5;

    // Level check
    const newLevel = Math.floor(this.score / TIMING.CHOPS_PER_LEVEL) + 1;
    if (newLevel > this.level) {
      this.level = newLevel;
      this.sound.playLevelUp();
      this.spawnLevelUpBurst();
      this.callbacks.onLevelUp?.(this.level);
    } else {
      this.sound.playChop(this.combo);
    }

    if (this.score > this.bestScore) {
      this.bestScore = this.score;
      localStorage.setItem(STORAGE_KEYS.BEST_SCORE, String(this.bestScore));
    }

    // Check 2: Did the newly dropped segment's branch slam down onto the player?
    if (this.segments[0].branch === this.playerSide) {
      this.emitHud(true);
      this.triggerGameOver('УДАР ВЕТКОЙ!', false);
      return;
    }

    this.emitHud(true);
  }

  triggerGameOver(reason, byTimeout) {
    if (this.state === GAME_STATE.GAMEOVER) return;
    const previousBest = Number(localStorage.getItem(STORAGE_KEYS.BEST_SCORE) || 0);
    const isNewRecord = this.score > 0 && this.score >= previousBest && this.score === this.bestScore;

    this.state = GAME_STATE.GAMEOVER;
    this.sound.playDeath(byTimeout);
    this.shakeTime = 0.24;
    this.shakeIntensity = 15;

    // Swap hero sprite to classic Timberman gravestone
    this.playerMat.map = this.tombstoneTexture;
    this.playerMat.needsUpdate = true;
    this.playerMesh.scale.set(0.92, 0.92, 1);
    this.playerMesh.position.y = this.playerBaseY - 8;
    this.playerMesh.rotation.z = this.playerSide * -0.06;

    const elapsedSec = Math.max(
      0.2,
      this.runStartTime ? (performance.now() - this.runStartTime) / 1000 : 1
    );
    const cps = this.totalChopsInRun / elapsedSec;

    this.callbacks.onGameOver?.({
      reason,
      score: this.score,
      bestScore: this.bestScore,
      level: this.level,
      cps,
      isNewRecord,
    });
  }

  spawnFlyingLog(seg, launchDir) {
    seg.group.position.set(0, this.getSegmentY(0), 18);
    this.scene.add(seg.group);
    this.flyingLogs.push({
      seg,
      vx: launchDir * (680 + Math.random() * 240),
      vy: 300 + Math.random() * 170,
      rotSpeed: -launchDir * (5.2 + Math.random() * 3.2),
      life: 0.52,
      maxLife: 0.52,
    });
  }

  spawnChopParticles(playerSide, includeLeaves) {
    const originX = playerSide * (WORLD.TRUNK_WIDTH * 0.42);
    const originY = this.getSegmentY(0) - 10;
    const count = includeLeaves ? 10 : 6;

    for (let i = 0; i < count; i++) {
      const isLeaf = includeLeaves && i >= 6;
      const mat = new THREE.MeshBasicMaterial({
        map: isLeaf ? this.leafTexture : this.chipTexture,
        transparent: true,
        opacity: 1,
      });
      const mesh = new THREE.Mesh(this.particleGeo, mat);
      const scale = isLeaf ? 0.95 + Math.random() * 0.65 : 0.65 + Math.random() * 0.55;
      mesh.scale.set(scale, scale, 1);
      mesh.position.set(
        originX + (Math.random() - 0.5) * 32,
        originY + (Math.random() - 0.5) * 32,
        22
      );
      this.scene.add(mesh);

      const dir = -playerSide;
      this.particles.push({
        mesh,
        vx: dir * (160 + Math.random() * 380) + (Math.random() - 0.5) * 180,
        vy: 140 + Math.random() * 340,
        gravity: isLeaf ? -520 : -1550,
        rotSpeed: (Math.random() - 0.5) * 14,
        life: isLeaf ? 0.85 : 0.48,
        maxLife: isLeaf ? 0.85 : 0.48,
      });
    }
  }

  spawnLevelUpBurst() {
    for (let i = 0; i < 16; i++) {
      const mat = new THREE.MeshBasicMaterial({
        map: this.leafTexture,
        transparent: true,
        color: i % 2 === 0 ? 0xffd147 : 0x7ce565,
      });
      const mesh = new THREE.Mesh(this.particleGeo, mat);
      const scale = 0.85 + Math.random() * 0.7;
      mesh.scale.set(scale, scale, 1);
      mesh.position.set((Math.random() - 0.5) * 260, 80 + Math.random() * 140, 24);
      this.scene.add(mesh);

      this.particles.push({
        mesh,
        vx: (Math.random() - 0.5) * 460,
        vy: 180 + Math.random() * 280,
        gravity: -640,
        rotSpeed: (Math.random() - 0.5) * 10,
        life: 0.95,
        maxLife: 0.95,
      });
    }
  }

  repositionTreeSegments() {
    for (let i = 0; i < this.segments.length; i++) {
      this.segments[i].group.position.y = this.getSegmentY(i) + this.treeDropOffset;
    }
  }

  emitHud(popScore = false) {
    this.callbacks.onHudUpdate?.({
      score: this.score,
      bestScore: this.bestScore,
      level: this.level,
      timeLeft: this.timeLeft,
      combo: this.combo,
      popScore,
    });
  }

  handleResize() {
    const width = this.canvas.clientWidth || window.innerWidth;
    const height = this.canvas.clientHeight || window.innerHeight;
    const aspect = width / Math.max(height, 1);

    this.renderer.setSize(width, height, false);

    // Ensure full horizontal playfield (-330..+330) fits even on portrait mobile screens
    const minHalfWidth = 330;
    let halfH = WORLD.HEIGHT / 2;
    let halfW = halfH * aspect;
    if (halfW < minHalfWidth) {
      halfW = minHalfWidth;
      halfH = halfW / aspect;
    }

    this.camera.left = -halfW;
    this.camera.right = halfW;
    this.camera.top = halfH;
    this.camera.bottom = -halfH;
    this.camera.updateProjectionMatrix();
  }

  updateAtmosphere(dt) {
    const paletteIndex = (this.level - 1) % SKY_PALETTES.length;
    const target = SKY_PALETTES[paletteIndex];
    const blend = Math.min(1, dt * 2.2);

    this.currentSkyTop.lerp(new THREE.Color(target.top), blend);
    this.currentSkyBottom.lerp(new THREE.Color(target.bottom), blend);
    this.currentSunColor.lerp(new THREE.Color(target.sun), blend);
    this.currentHillFar.lerp(new THREE.Color(target.hillFar), blend);
    this.currentHillMid.lerp(new THREE.Color(target.hillMid), blend);
    this.currentHillNear.lerp(new THREE.Color(target.hillNear), blend);

    this.skyUniforms.uTopColor.value.copy(this.currentSkyTop);
    this.skyUniforms.uBottomColor.value.copy(this.currentSkyBottom);
    this.sunMat.color.copy(this.currentSunColor);
    this.hillFarMat.color.copy(this.currentHillFar);
    this.hillMidMat.color.copy(this.currentHillMid);
    this.hillNearMat.color.copy(this.currentHillNear);

    // Smooth sun arc across sky based on level palette
    const targetSunX = [-240, 210, 260, -210][paletteIndex];
    const targetSunY = [300, 320, 145, 310][paletteIndex];
    this.sunMesh.position.x += (targetSunX - this.sunMesh.position.x) * blend;
    this.sunMesh.position.y += (targetSunY - this.sunMesh.position.y) * blend;

    // Night stars twinkle when on palette 3 (night) or 2 (sunset)
    const starTarget = paletteIndex === 3 ? 0.9 : paletteIndex === 2 ? 0.28 : 0;
    for (const star of this.stars) {
      const twinkle = 0.65 + 0.35 * Math.sin(this.clockTime * 3.5 + star.userData.phase);
      star.material.opacity += (starTarget * twinkle - star.material.opacity) * Math.min(1, dt * 3);
    }

    // Drift clouds gently
    for (const cloud of this.clouds) {
      cloud.position.x += cloud.userData.speed * dt;
      if (cloud.position.x > 1100) {
        cloud.position.x = -1100;
      }
    }
  }

  loop(ts) {
    this.rafId = requestAnimationFrame((nextTs) => this.loop(nextTs));

    const dt = this.lastFrameTs ? Math.min((ts - this.lastFrameTs) / 1000, 0.05) : 0.016;
    this.lastFrameTs = ts;
    this.clockTime += dt;

    this.updateAtmosphere(dt);

    // Smooth spring drop for tree stack
    if (this.treeDropOffset > 0.1) {
      this.treeDropOffset *= Math.pow(0.00025, dt);
      if (this.treeDropOffset < 0.5) this.treeDropOffset = 0;
      this.repositionTreeSegments();
    }

    // Player chop pose & idle breathing animation
    if (this.state !== GAME_STATE.GAMEOVER) {
      if (this.chopPoseTimer > 0) {
        this.chopPoseTimer -= dt;
        if (this.chopPoseTimer <= 0) {
          this.updatePlayerTexture(false);
        }
      }
      const targetScaleX = -this.playerSide;
      this.playerMesh.scale.x += (targetScaleX - this.playerMesh.scale.x) * Math.min(1, dt * 22);
      const breath = 1 + Math.sin(this.clockTime * 5.2) * 0.018;
      this.playerMesh.scale.y += (breath - this.playerMesh.scale.y) * Math.min(1, dt * 18);
      this.playerMesh.position.y = this.playerBaseY + (breath - 1) * 40;
    }

    // Timer drain while playing
    if (this.state === GAME_STATE.PLAYING) {
      const drainRate = Math.min(
        TIMING.MAX_DRAIN_PER_SEC,
        TIMING.BASE_DRAIN_PER_SEC + (this.level - 1) * TIMING.LEVEL_DRAIN_STEP
      );
      this.timeLeft = Math.max(0, this.timeLeft - drainRate * dt);
      this.emitHud(false);

      if (this.timeLeft <= 0) {
        this.triggerGameOver('ВРЕМЯ ВЫШЛО!', true);
      }
    }

    // Update flying chopped logs
    for (let i = this.flyingLogs.length - 1; i >= 0; i--) {
      const item = this.flyingLogs[i];
      item.life -= dt;
      item.vy -= 2250 * dt;
      item.seg.group.position.x += item.vx * dt;
      item.seg.group.position.y += item.vy * dt;
      item.seg.group.rotation.z += item.rotSpeed * dt;

      const alpha = Math.max(0, item.life / item.maxLife);
      item.seg.group.traverse((obj) => {
        if (obj.isMesh && obj.material) {
          obj.material.opacity = Math.min(1, alpha * 1.4);
        }
      });

      if (item.life <= 0) {
        this.scene.remove(item.seg.group);
        this.disposeSegment(item.seg);
        this.flyingLogs.splice(i, 1);
      }
    }

    // Update wood chips & leaves
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      p.vy += p.gravity * dt;
      p.mesh.position.x += p.vx * dt;
      p.mesh.position.y += p.vy * dt;
      p.mesh.rotation.z += p.rotSpeed * dt;
      p.mesh.material.opacity = Math.max(0, p.life / p.maxLife);

      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        p.mesh.material.dispose();
        this.particles.splice(i, 1);
      }
    }

    // Subtle camera screen-shake
    if (this.shakeTime > 0) {
      this.shakeTime -= dt;
      const mag = this.shakeIntensity * (this.shakeTime > 0 ? 1 : 0);
      this.camera.position.x = (Math.random() - 0.5) * mag * 2;
      this.camera.position.y = (Math.random() - 0.5) * mag * 2;
    } else {
      this.camera.position.x = 0;
      this.camera.position.y = 0;
    }

    this.renderer.render(this.scene, this.camera);
  }
}
