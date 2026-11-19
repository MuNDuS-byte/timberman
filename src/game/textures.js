import * as THREE from 'three';

function makeCanvas(w, h) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  return canvas;
}

function toTexture(canvas, { repeatX = false } = {}) {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.generateMipmaps = true;
  if (repeatX) {
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
  }
  tex.needsUpdate = true;
  return tex;
}

export function createTrunkTextures() {
  const variants = [];
  for (let v = 0; v < 3; v++) {
    const c = makeCanvas(256, 192);
    const ctx = c.getContext('2d');

    // Base bark gradient
    const grad = ctx.createLinearGradient(16, 0, 240, 0);
    grad.addColorStop(0, '#9c6234');
    grad.addColorStop(0.28, '#834e27');
    grad.addColorStop(0.75, '#683a1b');
    grad.addColorStop(1, '#4c2811');
    ctx.fillStyle = grad;
    ctx.fillRect(14, 0, 228, 192);

    // Subtle sunlit bark edge on left
    ctx.fillStyle = 'rgba(255, 225, 175, 0.18)';
    ctx.fillRect(18, 0, 20, 192);

    // Vertical bark ridges
    const ridges = [
      [42, 10, 18, 150],
      [82, 0, 14, 192],
      [126, 22, 16, 170],
      [168, 0, 15, 160],
      [204, 14, 16, 178],
    ];
    for (let i = 0; i < ridges.length; i++) {
      const [rx, ry, rw, rh] = ridges[i];
      const offset = ((v * 19 + i * 29) % 36) - 18;
      ctx.fillStyle = i % 2 === 0 ? 'rgba(46, 22, 8, 0.42)' : 'rgba(182, 123, 74, 0.25)';
      ctx.fillRect(rx, Math.max(0, ry + offset), rw, rh);
    }

    // Wood knot / bark crack per variant
    if (v === 1) {
      ctx.fillStyle = '#4a2610';
      ctx.beginPath();
      ctx.ellipse(98, 96, 20, 30, 0.08, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#2d1507';
      ctx.beginPath();
      ctx.ellipse(98, 96, 10, 18, 0.08, 0, Math.PI * 2);
      ctx.fill();
    } else if (v === 2) {
      // Moss patches
      ctx.fillStyle = '#4f9d3a';
      ctx.beginPath();
      ctx.ellipse(42, 48, 22, 14, 0.2, 0, Math.PI * 2);
      ctx.ellipse(54, 58, 14, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#73c754';
      ctx.beginPath();
      ctx.ellipse(40, 44, 12, 7, 0.1, 0, Math.PI * 2);
      ctx.fill();
    }

    // Horizontal subtle segment seam
    ctx.fillStyle = 'rgba(32, 14, 5, 0.26)';
    ctx.fillRect(14, 184, 228, 8);

    // Crisp dark cartoon side outlines
    ctx.fillStyle = '#2a1408';
    ctx.fillRect(8, 0, 10, 192);
    ctx.fillRect(238, 0, 10, 192);

    variants.push(toTexture(c));
  }
  return variants;
}

export function createStumpTexture() {
  const c = makeCanvas(360, 160);
  const ctx = c.getContext('2d');

  // Flared root silhouette
  ctx.beginPath();
  ctx.moveTo(86, 14);
  ctx.lineTo(274, 14);
  ctx.quadraticCurveTo(286, 98, 344, 142);
  ctx.lineTo(16, 142);
  ctx.quadraticCurveTo(74, 98, 86, 14);
  ctx.closePath();

  const grad = ctx.createLinearGradient(50, 0, 310, 0);
  grad.addColorStop(0, '#965d30');
  grad.addColorStop(0.45, '#7c4823');
  grad.addColorStop(1, '#4c2811');
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.lineWidth = 10;
  ctx.strokeStyle = '#2a1408';
  ctx.stroke();

  // Root grooves
  ctx.strokeStyle = 'rgba(42, 20, 8, 0.55)';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(132, 24);
  ctx.quadraticCurveTo(118, 92, 86, 138);
  ctx.moveTo(222, 24);
  ctx.quadraticCurveTo(240, 96, 272, 138);
  ctx.moveTo(176, 30);
  ctx.lineTo(174, 138);
  ctx.stroke();

  // Grass tufts hugging the roots
  const drawTuft = (x, y, s) => {
    ctx.fillStyle = '#2e8b3c';
    ctx.beginPath();
    ctx.moveTo(x - 18 * s, y);
    ctx.lineTo(x - 10 * s, y - 24 * s);
    ctx.lineTo(x, y - 8 * s);
    ctx.lineTo(x + 8 * s, y - 28 * s);
    ctx.lineTo(x + 20 * s, y);
    ctx.closePath();
    ctx.fill();
  };
  drawTuft(42, 146, 1.0);
  drawTuft(122, 148, 0.85);
  drawTuft(244, 148, 0.9);
  drawTuft(318, 146, 1.05);

  return toTexture(c);
}

export function createBranchTexture() {
  // Right-pointing branch; mirrored on X when placed on the left side
  const c = makeCanvas(320, 128);
  const ctx = c.getContext('2d');

  // Woody bough
  ctx.beginPath();
  ctx.moveTo(0, 50);
  ctx.quadraticCurveTo(120, 44, 248, 62);
  ctx.lineTo(248, 82);
  ctx.quadraticCurveTo(110, 84, 0, 92);
  ctx.closePath();

  const boughGrad = ctx.createLinearGradient(0, 44, 0, 92);
  boughGrad.addColorStop(0, '#9a6032');
  boughGrad.addColorStop(1, '#583015');
  ctx.fillStyle = boughGrad;
  ctx.fill();
  ctx.lineWidth = 7;
  ctx.strokeStyle = '#2a1408';
  ctx.stroke();

  // Small twig shooting upward
  ctx.beginPath();
  ctx.moveTo(96, 56);
  ctx.lineTo(132, 32);
  ctx.lineWidth = 10;
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#6c3c1b';
  ctx.stroke();

  // Lush foliage clusters
  const puffs = [
    [138, 48, 36, '#1f6f36'],
    [186, 46, 42, '#227a3b'],
    [244, 58, 46, '#23823d'],
    [282, 72, 28, '#1e6e35'],
    [206, 78, 34, '#1b6030'],
    [156, 36, 26, '#39a84a'],
    [214, 38, 30, '#44b852'],
    [256, 48, 26, '#58cb61'],
  ];

  // Outline pass
  ctx.fillStyle = '#153b1f';
  for (const [x, y, r] of puffs.slice(0, 5)) {
    ctx.beginPath();
    ctx.arc(x, y, r + 6, 0, Math.PI * 2);
    ctx.fill();
  }

  // Fill pass
  for (const [x, y, r, color] of puffs) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Sunlit leaf sparkles
  ctx.fillStyle = '#8be87c';
  ctx.beginPath();
  ctx.ellipse(216, 28, 12, 6, -0.3, 0, Math.PI * 2);
  ctx.ellipse(260, 42, 10, 5, 0.2, 0, Math.PI * 2);
  ctx.fill();

  return toTexture(c);
}

function drawCharacterCanvas(charDef, isChopping) {
  const c = makeCanvas(256, 256);
  const ctx = c.getContext('2d');

  // Hero faces RIGHT (towards the tree trunk at x=0 when standing on the left side)
  ctx.save();
  if (isChopping) {
    ctx.translate(10, 4);
  }

  const outline = '#1e120d';
  const drawRoundedRect = (x, y, w, h, r, fill, lw = 6) => {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.lineWidth = lw;
    ctx.strokeStyle = outline;
    ctx.stroke();
  };

  // Ground contact shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
  ctx.beginPath();
  ctx.ellipse(112, 238, 52, 12, 0, 0, Math.PI * 2);
  ctx.fill();

  // Legs / boots
  drawRoundedRect(82, 186, 26, 44, 8, charDef.pantsColor);
  drawRoundedRect(118, 186, 26, 44, 8, charDef.pantsColor);
  drawRoundedRect(80, 214, 34, 20, 7, '#3a2214');
  drawRoundedRect(118, 214, 36, 20, 7, '#3a2214');

  // Torso (plaid / tunic)
  drawRoundedRect(74, 118, 76, 76, 16, charDef.shirtColor);
  // Plaid / stripe accents
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(77, 121, 70, 70, 14);
  ctx.clip();
  ctx.fillStyle = charDef.shirtStripe;
  ctx.globalAlpha = 0.45;
  ctx.fillRect(74, 144, 78, 12);
  ctx.fillRect(74, 168, 78, 10);
  ctx.fillRect(98, 118, 10, 76);
  ctx.fillRect(126, 118, 10, 76);
  ctx.restore();

  // Belt
  drawRoundedRect(74, 174, 76, 16, 4, '#362012', 4);
  drawRoundedRect(114, 173, 18, 18, 4, '#ffd147', 4);

  // Head
  drawRoundedRect(78, 54, 68, 66, 20, charDef.skinColor);

  // Bear ears if bear
  if (charDef.isBear) {
    ctx.fillStyle = charDef.hatColor;
    ctx.strokeStyle = outline;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(84, 54, 16, 0, Math.PI * 2);
    ctx.arc(138, 54, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  // Beard / Ninja mask / Bear snout
  if (charDef.isNinja) {
    drawRoundedRect(78, 84, 68, 36, 10, '#1e272e', 5);
  } else if (charDef.isBear) {
    ctx.fillStyle = '#c49a6c';
    ctx.beginPath();
    ctx.ellipse(124, 96, 20, 14, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#221510';
    ctx.beginPath();
    ctx.ellipse(134, 90, 7, 5, 0, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Full bushy beard
    ctx.beginPath();
    ctx.moveTo(84, 92);
    ctx.quadraticCurveTo(116, 86, 146, 94);
    ctx.quadraticCurveTo(148, 128, 118, 130);
    ctx.quadraticCurveTo(86, 128, 84, 92);
    ctx.closePath();
    ctx.fillStyle = charDef.beardColor;
    ctx.fill();
    ctx.lineWidth = 5;
    ctx.strokeStyle = outline;
    ctx.stroke();
  }

  // Eyes (determined arcade eyebrows!)
  ctx.fillStyle = '#1a110d';
  ctx.beginPath();
  ctx.arc(114, 78, 5, 0, Math.PI * 2);
  ctx.arc(134, 78, 5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(116, 76, 2, 0, Math.PI * 2);
  ctx.arc(136, 76, 2, 0, Math.PI * 2);
  ctx.fill();

  // Hat / Helmet / Headband
  if (charDef.isNinja) {
    drawRoundedRect(74, 42, 76, 24, 10, charDef.hatColor);
    ctx.fillStyle = charDef.hatAccent;
    ctx.fillRect(76, 54, 72, 10);
    // Flowing headband tail
    ctx.beginPath();
    ctx.moveTo(74, 58);
    ctx.lineTo(44, 48);
    ctx.lineTo(52, 66);
    ctx.closePath();
    ctx.fill();
  } else if (charDef.hasHorns) {
    // Viking horned helmet
    ctx.beginPath();
    ctx.arc(112, 62, 38, Math.PI, 0);
    ctx.closePath();
    ctx.fillStyle = charDef.hatColor;
    ctx.fill();
    ctx.lineWidth = 6;
    ctx.strokeStyle = outline;
    ctx.stroke();
    // Horns
    ctx.fillStyle = charDef.hatAccent;
    ctx.beginPath();
    ctx.moveTo(82, 50);
    ctx.quadraticCurveTo(54, 36, 62, 14);
    ctx.quadraticCurveTo(72, 34, 92, 42);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(140, 50);
    ctx.quadraticCurveTo(168, 36, 160, 14);
    ctx.quadraticCurveTo(150, 34, 130, 42);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (!charDef.isBear) {
    // Beanie / Lumberjack cap
    ctx.beginPath();
    ctx.arc(112, 58, 36, Math.PI, 0);
    ctx.closePath();
    ctx.fillStyle = charDef.hatColor;
    ctx.fill();
    ctx.lineWidth = 6;
    ctx.strokeStyle = outline;
    ctx.stroke();
    drawRoundedRect(72, 48, 80, 16, 8, charDef.hatAccent, 5);
  }

  // Arm & Axe
  ctx.save();
  if (isChopping) {
    // Chopping forward swing
    ctx.translate(132, 144);
    ctx.rotate(0.28);

    // Motion swoosh arc
    ctx.strokeStyle = 'rgba(255, 245, 195, 0.85)';
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(18, -14, 72, -1.1, 0.35);
    ctx.stroke();

    // Handle
    drawRoundedRect(-4, -8, 88, 14, 6, '#8b5a2b', 5);
    // Blade
    ctx.beginPath();
    ctx.moveTo(64, -22);
    ctx.lineTo(100, -14);
    ctx.quadraticCurveTo(106, 12, 92, 30);
    ctx.lineTo(62, 14);
    ctx.closePath();
    ctx.fillStyle = charDef.axeColor;
    ctx.fill();
    ctx.lineWidth = 5;
    ctx.strokeStyle = outline;
    ctx.stroke();

    // Blade glint
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(82, -10, 8, 22);

    // Hand + sleeve
    drawRoundedRect(-18, -12, 34, 24, 10, charDef.shirtColor, 5);
    ctx.fillStyle = charDef.skinColor;
    ctx.beginPath();
    ctx.arc(18, 0, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = outline;
    ctx.stroke();
  } else {
    // Idle ready stance (axe resting up over shoulder / in front)
    ctx.translate(120, 148);
    ctx.rotate(-0.85);

    // Handle
    drawRoundedRect(-6, -7, 86, 13, 6, '#8b5a2b', 5);
    // Blade
    ctx.beginPath();
    ctx.moveTo(58, -10);
    ctx.lineTo(90, -24);
    ctx.quadraticCurveTo(102, 0, 86, 24);
    ctx.lineTo(56, 8);
    ctx.closePath();
    ctx.fillStyle = charDef.axeColor;
    ctx.fill();
    ctx.lineWidth = 5;
    ctx.strokeStyle = outline;
    ctx.stroke();

    // Hand + sleeve
    drawRoundedRect(-20, -12, 34, 24, 10, charDef.shirtColor, 5);
    ctx.fillStyle = charDef.skinColor;
    ctx.beginPath();
    ctx.arc(16, 0, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = outline;
    ctx.stroke();
  }
  ctx.restore();

  ctx.restore();
  return c;
}

export function createCharacterAssets(charDef) {
  const idleCanvas = drawCharacterCanvas(charDef, false);
  const chopCanvas = drawCharacterCanvas(charDef, true);
  return {
    idleTex: toTexture(idleCanvas),
    chopTex: toTexture(chopCanvas),
    previewDataUrl: idleCanvas.toDataURL('image/png'),
  };
}

export function createTombstoneTexture() {
  const c = makeCanvas(220, 220);
  const ctx = c.getContext('2d');

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.32)';
  ctx.beginPath();
  ctx.ellipse(110, 198, 62, 14, 0, 0, Math.PI * 2);
  ctx.fill();

  // Stone base
  ctx.beginPath();
  ctx.moveTo(46, 192);
  ctx.lineTo(46, 98);
  ctx.arc(110, 98, 64, Math.PI, 0);
  ctx.lineTo(174, 192);
  ctx.closePath();
  const grad = ctx.createLinearGradient(46, 36, 174, 192);
  grad.addColorStop(0, '#b9c4cc');
  grad.addColorStop(0.55, '#8c99a4');
  grad.addColorStop(1, '#5d6973');
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.lineWidth = 8;
  ctx.strokeStyle = '#1f262b';
  ctx.stroke();

  // Plinth
  ctx.fillStyle = '#6c7883';
  ctx.beginPath();
  ctx.roundRect(32, 176, 156, 24, 6);
  ctx.fill();
  ctx.stroke();

  // Crack
  ctx.strokeStyle = '#3c464e';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(148, 56);
  ctx.lineTo(132, 82);
  ctx.lineTo(142, 96);
  ctx.stroke();

  // R.I.P text
  ctx.fillStyle = '#2b333a';
  ctx.font = '900 42px "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('R.I.P', 110, 128);

  return toTexture(c);
}

export function createCloudTexture() {
  const c = makeCanvas(256, 128);
  const ctx = c.getContext('2d');

  ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
  ctx.beginPath();
  ctx.arc(72, 74, 34, 0, Math.PI * 2);
  ctx.arc(118, 54, 44, 0, Math.PI * 2);
  ctx.arc(168, 64, 36, 0, Math.PI * 2);
  ctx.arc(204, 80, 24, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.roundRect(46, 70, 174, 34, 17);
  ctx.fill();

  // Soft bottom tint clipped strictly inside the cloud silhouette
  ctx.globalCompositeOperation = 'source-atop';
  ctx.fillStyle = 'rgba(175, 208, 235, 0.4)';
  ctx.fillRect(0, 88, 256, 40);
  ctx.globalCompositeOperation = 'source-over';

  return toTexture(c);
}

export function createSunTexture() {
  const c = makeCanvas(256, 256);
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(128, 128, 28, 128, 128, 124);
  g.addColorStop(0, 'rgba(255, 255, 240, 1)');
  g.addColorStop(0.4, 'rgba(255, 244, 170, 0.85)');
  g.addColorStop(0.7, 'rgba(255, 232, 130, 0.25)');
  g.addColorStop(1, 'rgba(255, 232, 130, 0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  return toTexture(c);
}

export function createForestBandTexture(density = 12) {
  // White silhouette so we can tint dynamically with material.color during day/night cycle!
  const c = makeCanvas(1024, 320);
  const ctx = c.getContext('2d');

  // Rolling hill base
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(0, 320);
  ctx.lineTo(0, 210);
  for (let x = 0; x <= 1024; x += 64) {
    const y = 195 + Math.sin((x / 1024) * Math.PI * 4) * 26;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(1024, 320);
  ctx.closePath();
  ctx.fill();

  // Stylized pine silhouettes
  for (let i = 0; i < density; i++) {
    const tx = (i / density) * 1024 + ((i * 53) % 42);
    const scale = 0.72 + ((i * 37) % 10) * 0.055;
    const baseY = 225;
    const h = 155 * scale;
    const w = 58 * scale;

    for (let tier = 0; tier < 3; tier++) {
      const ty = baseY - h * (0.28 + tier * 0.26);
      const tw = w * (1 - tier * 0.22);
      const th = h * 0.42;
      ctx.beginPath();
      ctx.moveTo(tx, ty - th);
      ctx.lineTo(tx - tw, ty);
      ctx.lineTo(tx + tw, ty);
      ctx.closePath();
      ctx.fill();
    }
  }

  return toTexture(c, { repeatX: true });
}

export function createGroundTexture() {
  const c = makeCanvas(512, 256);
  const ctx = c.getContext('2d');

  // Deep soil
  const dirt = ctx.createLinearGradient(0, 56, 0, 256);
  dirt.addColorStop(0, '#5a3922');
  dirt.addColorStop(1, '#2b190d');
  ctx.fillStyle = dirt;
  ctx.fillRect(0, 56, 512, 200);

  // Subtle pebbles in soil
  ctx.fillStyle = 'rgba(255, 224, 185, 0.1)';
  for (let i = 0; i < 24; i++) {
    const px = (i * 73) % 500;
    const py = 86 + ((i * 41) % 140);
    ctx.beginPath();
    ctx.ellipse(px, py, 10 + (i % 8), 5 + (i % 4), 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Lush top grass strip
  const grass = ctx.createLinearGradient(0, 0, 0, 68);
  grass.addColorStop(0, '#52c44b');
  grass.addColorStop(0.55, '#309638');
  grass.addColorStop(1, '#1e6b29');
  ctx.fillStyle = grass;
  ctx.fillRect(0, 12, 512, 52);

  // Scalloped hanging grass fringe
  ctx.fillStyle = '#1e6b29';
  for (let x = 0; x < 512; x += 32) {
    ctx.beginPath();
    ctx.arc(x + 16, 62, 16, 0, Math.PI);
    ctx.fill();
  }

  // Bright grass highlight blades
  ctx.fillStyle = '#7ce565';
  for (let x = 8; x < 512; x += 28) {
    ctx.beginPath();
    ctx.moveTo(x, 22);
    ctx.lineTo(x + 5, 4);
    ctx.lineTo(x + 11, 22);
    ctx.closePath();
    ctx.fill();
  }

  return toTexture(c, { repeatX: true });
}

export function createParticleTexture(type = 'chip') {
  const c = makeCanvas(64, 64);
  const ctx = c.getContext('2d');
  if (type === 'chip') {
    ctx.fillStyle = '#e8b97c';
    ctx.strokeStyle = '#4c2811';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(10, 22);
    ctx.lineTo(54, 14);
    ctx.lineTo(48, 48);
    ctx.lineTo(14, 42);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else {
    ctx.fillStyle = '#4cd964';
    ctx.strokeStyle = '#195e27';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(32, 32, 22, 12, -0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  return toTexture(c);
}
