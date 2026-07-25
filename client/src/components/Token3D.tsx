import { useRef, useEffect, useMemo } from 'react';
import * as THREE from 'three';

// ─── Token Model Builders ────────────────────────────

type TokenBuilder = () => THREE.Group;

const tokenBuilders: Record<string, TokenBuilder> = {

  elephant: () => {
    const g = new THREE.Group();
    // Body
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 10), new THREE.MeshStandardMaterial({ color: 0x888899, roughness: 0.7 }));
    body.scale.set(1.4, 0.9, 0.8);
    body.position.y = 0.04;
    g.add(body);
    // Head
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), new THREE.MeshStandardMaterial({ color: 0x888899, roughness: 0.7 }));
    head.position.set(0.13, 0.04, 0);
    g.add(head);
    // Trunk
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.025, 0.08, 6), new THREE.MeshStandardMaterial({ color: 0x888899, roughness: 0.7 }));
    trunk.position.set(0.18, -0.02, 0);
    trunk.rotation.z = 0.3;
    g.add(trunk);
    // Legs
    for (const dx of [-0.08, 0.08]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.02, 0.07, 6), new THREE.MeshStandardMaterial({ color: 0x888899, roughness: 0.7 }));
      leg.position.set(dx, -0.045, 0);
      g.add(leg);
    }
    // Decorative blanket
    const blanket = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.02, 0.1), new THREE.MeshStandardMaterial({ color: 0xD4446A, roughness: 0.5 }));
    blanket.position.set(-0.02, 0.09, 0);
    g.add(blanket);
    // Gold trim
    const trim = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.01, 0.11), new THREE.MeshStandardMaterial({ color: 0xFFD700, roughness: 0.3, metalness: 0.6 }));
    trim.position.set(-0.02, 0.1, 0);
    g.add(trim);
    return g;
  },

  belan: () => {
    const g = new THREE.Group();
    // Main roller
    const roller = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.04, 0.2, 10), new THREE.MeshStandardMaterial({ color: 0xC49A5C, roughness: 0.4 }));
    roller.rotation.x = Math.PI / 2;
    g.add(roller);
    // Left handle
    const lh = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.02, 0.06, 8), new THREE.MeshStandardMaterial({ color: 0x8B6914, roughness: 0.5 }));
    lh.position.x = -0.13;
    lh.rotation.x = Math.PI / 2;
    g.add(lh);
    // Right handle
    const rh = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.02, 0.06, 8), new THREE.MeshStandardMaterial({ color: 0x8B6914, roughness: 0.5 }));
    rh.position.x = 0.13;
    rh.rotation.x = Math.PI / 2;
    g.add(rh);
    return g;
  },

  chappal: () => {
    const g = new THREE.Group();
    // Sole
    const sole = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.02, 0.14), new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.9 }));
    sole.position.y = -0.005;
    g.add(sole);
    // Strap (Y-shaped)
    const strap1 = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.008, 6, 8, Math.PI), new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.8 }));
    strap1.position.set(0, 0.02, 0.03);
    strap1.rotation.x = 0.2;
    g.add(strap1);
    const strap2 = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.008, 6, 8, Math.PI), new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.8 }));
    strap2.position.set(0, 0.02, -0.03);
    strap2.rotation.x = -0.2;
    g.add(strap2);
    return g;
  },

  dhol: () => {
    const g = new THREE.Group();
    // Drum body
    const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.1, 14), new THREE.MeshStandardMaterial({ color: 0xD2691E, roughness: 0.6 }));
    drum.position.y = 0.02;
    g.add(drum);
    // Top head
    const top = new THREE.Mesh(new THREE.CircleGeometry(0.07, 14), new THREE.MeshStandardMaterial({ color: 0xF5DEB3, roughness: 0.3 }));
    top.position.y = 0.07;
    top.rotation.x = -Math.PI / 2;
    g.add(top);
    // Bottom head
    const bot = new THREE.Mesh(new THREE.CircleGeometry(0.07, 14), new THREE.MeshStandardMaterial({ color: 0xF5DEB3, roughness: 0.3 }));
    bot.position.y = -0.03;
    bot.rotation.x = Math.PI / 2;
    g.add(bot);
    // Rope details
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.1, 4), new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.8 }));
      rope.position.set(Math.sin(a) * 0.07, 0.02, Math.cos(a) * 0.07);
      g.add(rope);
    }
    return g;
  },

  cutting_chai: () => {
    const g = new THREE.Group();
    // Glass
    const glass = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 0.1, 10), new THREE.MeshStandardMaterial({ color: 0xDDDDDD, roughness: 0.1, metalness: 0.2, transparent: true, opacity: 0.7 }));
    glass.position.y = 0.03;
    g.add(glass);
    // Tea
    const tea = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.042, 0.03, 10), new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.8 }));
    tea.position.y = 0.015;
    g.add(tea);
    // Handle
    const handle = new THREE.Mesh(new THREE.TorusGeometry(0.025, 0.006, 6, 8, Math.PI), new THREE.MeshStandardMaterial({ color: 0xDDDDDD, roughness: 0.1, metalness: 0.2 }));
    handle.position.set(0.04, 0.04, 0);
    handle.rotation.z = 0.2;
    g.add(handle);
    // Steam
    for (let i = 0; i < 3; i++) {
      const steam = new THREE.Mesh(new THREE.SphereGeometry(0.008, 6, 6), new THREE.MeshStandardMaterial({ color: 0xFFFFFF, transparent: true, opacity: 0.3 }));
      steam.position.set((i - 1) * 0.02, 0.09 + i * 0.015, 0);
      g.add(steam);
    }
    return g;
  },

  rickshaw: () => {
    const g = new THREE.Group();
    // Body
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.05, 0.12), new THREE.MeshStandardMaterial({ color: 0xFF6B35, roughness: 0.5 }));
    body.position.y = 0.04;
    g.add(body);
    // Canopy
    const canopy = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2.5), new THREE.MeshStandardMaterial({ color: 0xFFD700, roughness: 0.4 }));
    canopy.position.y = 0.09;
    canopy.scale.set(1.2, 0.6, 1);
    g.add(canopy);
    // Wheels
    for (const dx of [-0.05, 0.05]) {
      const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.025, 0.008, 8, 10), new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.8 }));
      wheel.position.set(dx, 0.01, 0.06);
      wheel.rotation.y = Math.PI / 2;
      g.add(wheel);
      const wheel2 = new THREE.Mesh(new THREE.TorusGeometry(0.025, 0.008, 8, 10), new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.8 }));
      wheel2.position.set(dx, 0.01, -0.06);
      wheel2.rotation.y = Math.PI / 2;
      g.add(wheel2);
    }
    // Handle
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.08, 6), new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.6 }));
    handle.position.set(0, 0.04, -0.1);
    handle.rotation.x = 0.5;
    g.add(handle);
    return g;
  },

  chetak: () => {
    const g = new THREE.Group();
    // Body
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.04, 0.12), new THREE.MeshStandardMaterial({ color: 0x3366CC, roughness: 0.4 }));
    body.position.y = 0.04;
    g.add(body);
    // Seat
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.02, 0.04), new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.7 }));
    seat.position.set(0, 0.07, -0.02);
    g.add(seat);
    // Handlebar
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.06, 6), new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.5 }));
    bar.position.set(0, 0.08, 0.06);
    bar.rotation.x = 0.3;
    g.add(bar);
    // Wheels
    for (const dx of [-0.04, 0.04]) {
      const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.025, 0.007, 8, 10), new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.8 }));
      wheel.position.set(dx, 0.01, 0.05);
      wheel.rotation.y = Math.PI / 2;
      g.add(wheel);
      const wheel2 = new THREE.Mesh(new THREE.TorusGeometry(0.025, 0.007, 8, 10), new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.8 }));
      wheel2.position.set(dx, 0.01, -0.05);
      wheel2.rotation.y = Math.PI / 2;
      g.add(wheel2);
    }
    // Headlight
    const light = new THREE.Mesh(new THREE.SphereGeometry(0.015, 8, 8), new THREE.MeshStandardMaterial({ color: 0xFFFFAA, roughness: 0.2, emissive: 0xFFFFAA, emissiveIntensity: 0.2 }));
    light.position.set(0, 0.04, 0.07);
    g.add(light);
    return g;
  },

  mango: () => {
    const g = new THREE.Group();
    // Mango body
    const mango = new THREE.Mesh(new THREE.SphereGeometry(0.065, 12, 10), new THREE.MeshStandardMaterial({ color: 0xFFB347, roughness: 0.4 }));
    mango.scale.set(1.1, 0.9, 0.8);
    mango.position.y = 0.02;
    g.add(mango);
    // Slight green top
    const top = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 6), new THREE.MeshStandardMaterial({ color: 0x7CCD7C, roughness: 0.5 }));
    top.position.set(0, 0.07, 0);
    top.scale.set(0.8, 0.3, 0.7);
    g.add(top);
    // Stem
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.006, 0.025, 6), new THREE.MeshStandardMaterial({ color: 0x5D4037, roughness: 0.8 }));
    stem.position.set(0, 0.09, 0);
    g.add(stem);
    return g;
  },

  lotus: () => {
    const g = new THREE.Group();
    // Petals - outer ring
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const petal = new THREE.Mesh(new THREE.ConeGeometry(0.025, 0.07, 6), new THREE.MeshStandardMaterial({ color: 0xFFB6C1, roughness: 0.3 }));
      petal.position.set(Math.sin(a) * 0.045, 0.02, Math.cos(a) * 0.045);
      petal.rotation.x = 0.4;
      petal.rotation.z = -a;
      g.add(petal);
    }
    // Petals - inner ring
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + 0.3;
      const petal = new THREE.Mesh(new THREE.ConeGeometry(0.018, 0.05, 6), new THREE.MeshStandardMaterial({ color: 0xFF69B4, roughness: 0.3 }));
      petal.position.set(Math.sin(a) * 0.025, 0.03, Math.cos(a) * 0.025);
      petal.rotation.x = 0.3;
      petal.rotation.z = -a;
      g.add(petal);
    }
    // Center
    const center = new THREE.Mesh(new THREE.SphereGeometry(0.02, 8, 6), new THREE.MeshStandardMaterial({ color: 0xFFD700, roughness: 0.5 }));
    center.position.y = 0.03;
    g.add(center);
    return g;
  },

  lassi: () => {
    const g = new THREE.Group();
    // Clay cup body
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.04, 0.09, 10), new THREE.MeshStandardMaterial({ color: 0xC4956A, roughness: 0.7 }));
    cup.position.y = 0.025;
    g.add(cup);
    // Lassi top
    const top = new THREE.Mesh(new THREE.CircleGeometry(0.05, 10), new THREE.MeshStandardMaterial({ color: 0xFFF8DC, roughness: 0.1 }));
    top.position.y = 0.07;
    top.rotation.x = -Math.PI / 2;
    g.add(top);
    // Handle
    const handle = new THREE.Mesh(new THREE.TorusGeometry(0.025, 0.006, 6, 8, Math.PI), new THREE.MeshStandardMaterial({ color: 0xC4956A, roughness: 0.7 }));
    handle.position.set(0.055, 0.04, 0);
    handle.rotation.z = 0.3;
    g.add(handle);
    return g;
  },

  vada_pav: () => {
    const g = new THREE.Group();
    // Bun top
    const top = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2.5), new THREE.MeshStandardMaterial({ color: 0xD4A056, roughness: 0.5 }));
    top.position.y = 0.025;
    g.add(top);
    // Vada (filling)
    const vada = new THREE.Mesh(new THREE.SphereGeometry(0.04, 10, 8), new THREE.MeshStandardMaterial({ color: 0xB8860B, roughness: 0.7 }));
    vada.position.y = -0.005;
    vada.scale.set(0.9, 0.7, 0.9);
    g.add(vada);
    // Bun bottom
    const bot = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8, 0, Math.PI * 2, Math.PI / 2.2, Math.PI / 2.5), new THREE.MeshStandardMaterial({ color: 0xC49A3C, roughness: 0.5 }));
    bot.position.y = -0.035;
    g.add(bot);
    // Green chilli
    const chilli = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.006, 0.03, 6), new THREE.MeshStandardMaterial({ color: 0x228B22, roughness: 0.6 }));
    chilli.position.set(0.04, 0.02, 0.01);
    chilli.rotation.z = 0.4;
    g.add(chilli);
    return g;
  },

  temple_bell: () => {
    const g = new THREE.Group();
    // Bell body
    const bell = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.025, 0.08, 12), new THREE.MeshStandardMaterial({ color: 0xDAA520, roughness: 0.3, metalness: 0.7 }));
    bell.position.y = 0.03;
    g.add(bell);
    // Top knob
    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 6), new THREE.MeshStandardMaterial({ color: 0xDAA520, roughness: 0.3, metalness: 0.7 }));
    knob.position.y = 0.08;
    g.add(knob);
    // Clapper
    const clap = new THREE.Mesh(new THREE.SphereGeometry(0.015, 8, 6), new THREE.MeshStandardMaterial({ color: 0xB8860B, roughness: 0.5, metalness: 0.5 }));
    clap.position.y = -0.01;
    g.add(clap);
    // Ring at bottom
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.006, 8, 10), new THREE.MeshStandardMaterial({ color: 0xDAA520, roughness: 0.3, metalness: 0.7 }));
    ring.position.y = -0.01;
    g.add(ring);
    return g;
  },
};

// Map old token IDs to the new 12 — now IDs match builder names directly
const TOKEN_ID_MAP: Record<string, string> = {};

function getBuilderId(tokenId: string): string {
  return TOKEN_ID_MAP[tokenId] || tokenId;
}

export function buildToken3D(tokenId: string): THREE.Group {
  const builder = tokenBuilders[getBuilderId(tokenId)];
  if (!builder) return new THREE.Group();
  return builder();
}

// ─── Token 3D Preview (for lobby) ─────────────────────

interface TokenPreviewProps {
  tokenId: string;
  size?: number;
}

export function TokenPreview({ tokenId, size = 80 }: TokenPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 10);
    camera.position.set(0.3, 0.2, 0.4);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setSize(size, size);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);

    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambient);
    const dir = new THREE.DirectionalLight(0xffffff, 0.8);
    dir.position.set(3, 5, 3);
    scene.add(dir);

    const group = buildToken3D(tokenId);
    group.position.y = 0;
    scene.add(group);

    let animId: number;
    const clock = new THREE.Clock();
    function animate() {
      animId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();
      group.rotation.y = t * 0.8;
      group.position.y = Math.sin(t * 1.2) * 0.015;
      renderer.render(scene, camera);
    }
    animate();

    return () => {
      cancelAnimationFrame(animId);
      renderer.dispose();
    };
  }, [tokenId, size]);

  return (
    <canvas ref={canvasRef}
      style={{
        width: size, height: size, borderRadius: 12,
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid #333',
      }} />
  );
}

interface Token3DOverlayProps {
  tokenPositions: { playerIndex: number; cx: number; cy: number }[];
  playerTokens?: Record<number, string>;
  boardSize: number;
}

export function Token3DOverlay({ tokenPositions, playerTokens = {}, boardSize }: Token3DOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<{ scene: THREE.Scene; camera: THREE.OrthographicCamera; renderer: THREE.WebGLRenderer; tokens: Map<number, THREE.Group>; clock: THREE.Clock } | null>(null);

  const sceneKey = useMemo(() => JSON.stringify(tokenPositions.map(t => `${t.playerIndex}-${t.cx.toFixed(2)}-${t.cy.toFixed(2)}`)), [tokenPositions]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const scene = new THREE.Scene();

    const camera = new THREE.OrthographicCamera(0, boardSize, boardSize, 0, -10, 10);
    camera.position.set(0, 0, 5);
    camera.lookAt(boardSize / 2, boardSize / 2, 0);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
    });
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);

    // Lighting
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambient);
    const dir = new THREE.DirectionalLight(0xffffff, 0.8);
    dir.position.set(5, 10, 5);
    dir.castShadow = false;
    scene.add(dir);
    const back = new THREE.DirectionalLight(0xffffff, 0.3);
    back.position.set(-3, 5, -3);
    scene.add(back);

    const tokens = new Map<number, THREE.Group>();
    const clock = new THREE.Clock();

    let animId: number;
    function animate() {
      animId = requestAnimationFrame(animate);
      const dt = clock.getElapsedTime();
      tokens.forEach((group) => {
        group.rotation.y = dt * 0.8;
        group.position.y = 0.03 + Math.sin(dt * 1.2 + group.userData.phase) * 0.008;
      });
      renderer.render(scene, camera);
    }
    animate();

    sceneRef.current = { scene, camera, renderer, tokens, clock };

    return () => {
      cancelAnimationFrame(animId);
      renderer.dispose();
      sceneRef.current = null;
    };
  }, [boardSize]);

  // Update token positions
  useEffect(() => {
    const ctx = sceneRef.current;
    if (!ctx) return;

    // Remove old tokens
    ctx.tokens.forEach((group) => ctx.scene.remove(group));
    ctx.tokens.clear();

    // Add new tokens
    for (const tp of tokenPositions) {
      const tokenId = playerTokens[tp.playerIndex] || 'rickshaw';
      const group = buildToken3D(tokenId);
      group.position.set(tp.cx, 0.03, tp.cy);
      group.userData.phase = Math.random() * Math.PI * 2;
      ctx.scene.add(group);
      ctx.tokens.set(tp.playerIndex, group);
    }
  }, [sceneKey, playerTokens, tokenPositions]);

  // Resize handler
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ro = new ResizeObserver(() => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (w > 0 && h > 0) {
        canvas.width = w;
        canvas.height = h;
        const ctx = sceneRef.current;
        if (ctx) ctx.renderer.setSize(w, h);
      }
    });
    ro.observe(canvas.parentElement!);
    return () => ro.disconnect();
  }, []);

  return (
    <canvas ref={canvasRef}
      style={{
        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
        pointerEvents: 'none', zIndex: 10,
      }} />
  );
}
