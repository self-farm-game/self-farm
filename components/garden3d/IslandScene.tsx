"use client";
/**
 * Self-Farm · сад (three.js, low-poly)
 *
 * Увесь острів будується процедурно — жодних .glb/.fbx, тільки геометрія.
 * Дерево має 6 стадій, які збігаються зі стадіями з lib/utils/xp.ts.
 * Дупло зʼявляється з 5-ї стадії й клікається (пасхалка з руною).
 * Хатинка Бомбома теж клікається — Бомбом виходить оверлеєм збоку екрана.
 */
import { useEffect, useRef } from "react";
import * as THREE from "three";

export type IslandSceneProps = {
  stage: number; // 1..6
  runeColor?: string | null; // якщо в дуплі лежить руна
  onTreeClick?: () => void;
  onHollowClick?: () => void;
  onHutClick?: () => void;
  quality?: "high" | "low";
};

/* ── детермінований рандом, щоб острів був той самий при кожному рендері ── */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const C = {
  grass: 0x7ec24f,
  grassDark: 0x5ea23c,
  grassLight: 0x96d463,
  dirt: 0x9a6b3f,
  dirtDark: 0x6f4a2a,
  rock: 0x8d8478,
  rockDark: 0x6d655b,
  bark: 0x8a5a33,
  barkDark: 0x5f3b1f,
  leafA: 0x62b04a,
  leafB: 0x4f9a3d,
  leafC: 0x83c85c,
  wood: 0x9a6c3d,
  water: 0x63b7df,
  cloud: 0xffffff,
};

/* Орієнтири, які мають знати і вода, і хатинка, і декор:
   інакше кущі виростають просто в руслі струмка й на даху хати. */
const SPRING_A = 1.02;
const SPRING_R = 3.15;
const HUT_A = -1.35;
const HUT_R = 4.15;

/** Точка русла (0 — джерело, 1 — злам над прірвою), лише XZ. */
function streamXZ(t: number, R: number): [number, number] {
  const r = SPRING_R + t * (R + 0.1 - SPRING_R);
  const a = SPRING_A + Math.sin(t * Math.PI) * 0.17;
  return [Math.cos(a) * r, Math.sin(a) * r];
}

/** true — сюди декор ставити не можна (русло, джерело, подвірʼя хати). */
function makeBlocker(R: number) {
  const pts: [number, number][] = [];
  for (let i = 0; i <= 22; i++) pts.push(streamXZ(i / 22, R));
  const hx = Math.cos(HUT_A) * HUT_R;
  const hz = Math.sin(HUT_A) * HUT_R;
  return (x: number, z: number) => {
    if (Math.hypot(x - hx, z - hz) < 1.35) return true;
    for (const [px, pz] of pts) if (Math.hypot(x - px, z - pz) < 0.9) return true;
    return false;
  };
}

function flatMat(color: number, extra: THREE.MeshLambertMaterialParameters = {}) {
  return new THREE.MeshLambertMaterial({ color, flatShading: true, ...extra });
}

/* ───────────────────────── острів ───────────────────────── */
function buildIsland(rng: () => number) {
  const g = new THREE.Group();
  const SEG = 18;
  const R = 6.2;

  // край острова (спільний для верху й низу, щоб не було щілини)
  const rim: THREE.Vector3[] = [];
  for (let i = 0; i < SEG; i++) {
    const a = (i / SEG) * Math.PI * 2;
    const rr = R + (rng() - 0.5) * 0.55;
    rim.push(new THREE.Vector3(Math.cos(a) * rr, -0.15 + (rng() - 0.5) * 0.18, Math.sin(a) * rr));
  }

  // висота галявини: дуже пологий пагорб, центр рівний під дерево
  const hill = (r: number, a: number) =>
    0.42 * Math.max(0, 1 - (r / R) ** 2) + 0.1 * Math.sin(a * 3 + 0.6) * (r / R) + (rng() - 0.5) * 0.05;

  const RINGS = 5;
  const topPts: THREE.Vector3[][] = [];
  for (let ring = 0; ring <= RINGS; ring++) {
    const row: THREE.Vector3[] = [];
    for (let i = 0; i < SEG; i++) {
      if (ring === RINGS) {
        row.push(rim[i].clone());
        continue;
      }
      const t = ring / RINGS;
      const a = (i / SEG) * Math.PI * 2;
      const r = t * R;
      const p = rim[i].clone().multiplyScalar(t);
      p.y = hill(r, a);
      row.push(new THREE.Vector3(p.x, p.y, p.z));
    }
    topPts.push(row);
  }

  // ─ верх (трава) — кожен трикутник трохи іншого відтінку
  {
    const verts: number[] = [];
    const cols: number[] = [];
    const shades = [C.grass, C.grassLight, C.grassDark, 0x8ccc57, 0x6bb244];
    const tri = (p: THREE.Vector3, q: THREE.Vector3, r: THREE.Vector3) => {
      verts.push(p.x, p.y, p.z, q.x, q.y, q.z, r.x, r.y, r.z);
      const c = new THREE.Color(shades[Math.floor(rng() * shades.length)]);
      for (let k = 0; k < 3; k++) cols.push(c.r, c.g, c.b);
    };
    const center = new THREE.Vector3(0, hill(0, 0), 0);
    for (let i = 0; i < SEG; i++) {
      const j = (i + 1) % SEG;
      tri(center, topPts[1][j], topPts[1][i]);
    }
    for (let ring = 1; ring < RINGS; ring++) {
      for (let i = 0; i < SEG; i++) {
        const j = (i + 1) % SEG;
        const a = topPts[ring][i], b = topPts[ring][j];
        const c = topPts[ring + 1][j], d = topPts[ring + 1][i];
        tri(a, b, c);
        tri(a, c, d);
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
    geo.setAttribute("color", new THREE.Float32BufferAttribute(cols, 3));
    geo.computeVertexNormals();
    const m = new THREE.Mesh(geo, flatMat(0xffffff, { side: THREE.DoubleSide, vertexColors: true }));
    m.receiveShadow = true;
    m.castShadow = true;
    g.add(m);
  }

  // ─ низ (земля / скеля), що звужується до вістря
  {
    const verts: number[] = [];
    const cols: number[] = [];
    const shades = [0xb07c4a, 0x9a6b3f, 0xa8794a, 0xc08c55, 0x8d6a52];
    let pending: THREE.Vector3[] = [];
    const push = (p: THREE.Vector3) => {
      verts.push(p.x, p.y, p.z);
      pending.push(p);
      if (pending.length === 3) {
        const c = new THREE.Color(shades[Math.floor(rng() * shades.length)]);
        for (let k = 0; k < 3; k++) cols.push(c.r, c.g, c.b);
        pending = [];
      }
    };
    const shrink = [1, 0.82, 0.55, 0.28];
    const drop = [0, -1.5, -2.9, -3.9];
    const rows: THREE.Vector3[][] = shrink.map((s, k) =>
      rim.map((p) => {
        const q = p.clone().multiplyScalar(s);
        q.y = p.y + drop[k] + (k === 0 ? 0 : (rng() - 0.5) * 0.45);
        return q;
      }),
    );
    const tip = new THREE.Vector3((rng() - 0.5) * 0.4, -5.4, (rng() - 0.5) * 0.4);
    for (let k = 0; k < rows.length - 1; k++) {
      for (let i = 0; i < SEG; i++) {
        const j = (i + 1) % SEG;
        const a = rows[k][i], b = rows[k][j], c = rows[k + 1][j], d = rows[k + 1][i];
        push(a); push(b); push(c);
        push(a); push(c); push(d);
      }
    }
    const last = rows[rows.length - 1];
    for (let i = 0; i < SEG; i++) {
      const j = (i + 1) % SEG;
      push(last[i]); push(last[j]); push(tip);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
    geo.setAttribute("color", new THREE.Float32BufferAttribute(cols, 3));
    geo.computeVertexNormals();
    const m = new THREE.Mesh(geo, flatMat(0xffffff, { side: THREE.DoubleSide, vertexColors: true }));
    m.castShadow = true;
    g.add(m);
  }

  // ─ камʼяні виступи знизу (маленькі, щільно по конусу)
  for (let i = 0; i < 9; i++) {
    const a = rng() * Math.PI * 2;
    const depth = rng();
    const r = (R - 0.6) * (1 - depth * 0.78);
    const s = 0.22 + rng() * 0.36;
    const rock = new THREE.Mesh(new THREE.IcosahedronGeometry(s, 0), flatMat(rng() > 0.5 ? C.rockDark : C.dirtDark));
    rock.position.set(Math.cos(a) * r, -0.5 - depth * 3.4, Math.sin(a) * r);
    rock.rotation.set(rng() * 3, rng() * 3, rng() * 3);
    rock.scale.y = 0.7 + rng() * 0.5;
    rock.castShadow = true;
    g.add(rock);
  }

  // ─ трав'яна «бахрома», що звисає з краю
  for (let i = 0; i < SEG; i++) {
    const p = rim[i];
    const n = p.clone().normalize();
    const drip = new THREE.Mesh(new THREE.ConeGeometry(0.28 + rng() * 0.14, 0.45 + rng() * 0.4, 5), flatMat(C.grassDark));
    drip.position.set(p.x - n.x * 0.34, p.y - 0.2, p.z - n.z * 0.34);
    drip.rotation.x = Math.PI;
    drip.castShadow = true;
    g.add(drip);
  }

  return { group: g, hill, R, rim };
}

/* ───────────────────────── дерево ─────────────────────────
   Шість стадій — це шість РІЗНИХ силуетів, а не одне дерево в різних
   масштабах: паросток із сім'ядолями → стебло з листочками → тонке
   деревце з рідкою кроною → перша куляста крона з яблуками → щедре
   дерево з дуплом → розлогий віковий дуб.                              */

const LEAF_A = 0x62b04a;
const LEAF_B = 0x4f9a3d;
const LEAF_C = 0x8ed05f;
const STEM_GREEN = 0x84a852;

export type TreeParts = {
  group: THREE.Group;
  canopy: THREE.Group;
  hollow: THREE.Mesh | null;
  runeMesh: THREE.Mesh | null;
  topY: number;
};

function buildTree(stage: number, rng: () => number): TreeParts {
  const s = Math.max(1, Math.min(6, stage));
  const g = new THREE.Group();
  const canopy = new THREE.Group();
  g.add(canopy);
  let hollow: THREE.Mesh | null = null;
  let runeMesh: THREE.Mesh | null = null;
  let topY = 0.4;

  /* ── цеглинки ── */

  // листок: сплюснутий ікосаедр, довгою віссю по X.
  // yaw крутить його навколо стовбура, tilt піднімає зовнішній кінець.
  const leaf = (x: number, y: number, z: number, size: number, color: number, yaw: number, tilt: number) => {
    const m = new THREE.Mesh(new THREE.IcosahedronGeometry(size, 0), flatMat(color));
    m.scale.set(1.55, 0.26, 0.92);
    m.position.set(x, y, z);
    m.rotation.set(0, yaw, tilt);
    m.castShadow = true;
    canopy.add(m);
    return m;
  };

  // черешок — тонка гілочка від стовбура до листка
  const petiole = (y: number, ang: number, len: number, color = STEM_GREEN) => {
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.012, len, 4), flatMat(color));
    p.geometry.translate(0, len / 2, 0);
    p.position.set(0, y, 0);
    p.rotation.set(Math.sin(ang) * 1.05, 0, -Math.cos(ang) * 1.05);
    canopy.add(p);
  };

  const blob = (x: number, y: number, z: number, r: number, color: number, flat = 0.88) => {
    const m = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), flatMat(color));
    m.position.set(x, y, z);
    m.scale.set(1, flat, 1);
    m.rotation.set(rng() * 3, rng() * 3, rng() * 3);
    m.castShadow = true;
    m.receiveShadow = true;
    canopy.add(m);
    return m;
  };

  const trunk = (rTop: number, rBot: number, h: number, color = C.bark, seg = 8) => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBot, h, seg, 3), flatMat(color));
    m.position.y = h / 2;
    m.castShadow = true;
    m.receiveShadow = true;
    g.add(m);
    return m;
  };

  // гілка від стовбура; повертає координату кінчика
  const branch = (fromY: number, ang: number, len: number, r: number, tilt: number) => {
    const b = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.45, r, len, 5), flatMat(C.bark));
    b.geometry.translate(0, len / 2, 0);
    b.position.set(0, fromY, 0);
    b.rotation.set(Math.sin(ang) * tilt, 0, -Math.cos(ang) * tilt);
    b.castShadow = true;
    g.add(b);
    const dir = new THREE.Vector3(0, 1, 0).applyEuler(b.rotation).multiplyScalar(len);
    return new THREE.Vector3(dir.x, fromY + dir.y, dir.z);
  };

  const roots = (n: number, rad: number, scale = 1) => {
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + rng();
      const rt = new THREE.Mesh(new THREE.IcosahedronGeometry(rad * 0.55 * scale, 0), flatMat(C.barkDark));
      rt.position.set(Math.cos(a) * rad * 1.05, rad * 0.16, Math.sin(a) * rad * 1.05);
      rt.scale.set(1, 0.5, 1);
      rt.castShadow = true;
      g.add(rt);
    }
  };

  const appleMat = flatMat(0xe0513f, { emissive: 0x2a0a06 });
  const apples = (n: number, hosts: THREE.Mesh[], size: number) => {
    for (let i = 0; i < n; i++) {
      const host = hosts[Math.floor(rng() * hosts.length)];
      const a = rng() * Math.PI * 2;
      const p = rng() * Math.PI - Math.PI / 2;
      const hr = (host.geometry as THREE.IcosahedronGeometry).parameters.radius;
      const ap = new THREE.Mesh(new THREE.IcosahedronGeometry(size, 0), appleMat);
      ap.position.set(
        host.position.x + Math.cos(a) * Math.cos(p) * hr * 0.95,
        host.position.y + Math.sin(p) * hr * 0.78,
        host.position.z + Math.sin(a) * Math.cos(p) * hr * 0.95,
      );
      canopy.add(ap);
    }
  };

  const makeHollow = (hy: number, hr: number, tr: number) => {
    hollow = new THREE.Mesh(new THREE.SphereGeometry(hr, 10, 8), flatMat(0x2a1a10, { emissive: 0x120a06 }));
    hollow.position.set(0, hy, tr * 0.9);
    hollow.scale.set(1, 1.35, 0.55);
    g.add(hollow);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(hr * 1.08, hr * 0.22, 5, 10), flatMat(C.barkDark));
    ring.position.copy(hollow.position);
    ring.scale.set(1, 1.35, 0.7);
    g.add(ring);
    runeMesh = new THREE.Mesh(new THREE.OctahedronGeometry(hr * 0.6, 0), flatMat(0xffffff));
    runeMesh.position.set(0, hy, tr * 1.02);
    runeMesh.visible = false;
    g.add(runeMesh);
  };

  /* ── стадії ── */

  if (s === 1) {
    // ПАРОСТОК: вигнуте стебельце і дві сім'ядолі, кори ще немає
    const h = 0.2;
    const st = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.03, h, 5), flatMat(STEM_GREEN));
    st.position.y = h / 2;
    st.rotation.z = 0.14;
    st.castShadow = true;
    g.add(st);
    // грудочка землі, з якої він щойно виліз
    const mound = new THREE.Mesh(new THREE.IcosahedronGeometry(0.12, 0), flatMat(0x8a6038));
    mound.position.y = 0.015;
    mound.scale.set(1, 0.4, 1);
    g.add(mound);
    leaf(-0.085, h + 0.03, 0.015, 0.072, LEAF_C, 0.15, -0.42);
    leaf(0.085, h + 0.045, -0.02, 0.066, LEAF_A, Math.PI + 0.08, 0.42);
    leaf(0.005, h + 0.1, 0.03, 0.045, LEAF_C, 1.5, -0.1);
    topY = h + 0.16;
  } else if (s === 2) {
    // САДЖАНЕЦЬ: тонке стебло, окремі листочки по спіралі, крони ще немає
    const h = 0.95;
    const st = trunk(0.026, 0.055, h, 0x8d9f56, 6);
    st.rotation.z = 0.04;
    const n = 7;
    for (let i = 0; i < n; i++) {
      const f = 0.34 + (i / (n - 1)) * 0.6;
      const a = i * 2.25;
      const y = h * f;
      petiole(y, a, 0.1);
      const d = 0.13;
      leaf(Math.cos(a) * d, y + 0.05, Math.sin(a) * d, 0.095 + rng() * 0.025, i % 2 ? LEAF_A : LEAF_C, -a, 0.3);
    }
    leaf(0.0, h + 0.06, 0.01, 0.1, LEAF_C, 0.6, 0.12);
    leaf(0.05, h + 0.02, 0.06, 0.082, LEAF_A, 2.3, 0.26);
    topY = h + 0.2;
  } else if (s === 3) {
    // МОЛОДЕ ДЕРЕВЦЕ: перша кора, три гілочки, рідка «прозора» крона
    const h = 1.5;
    trunk(0.065, 0.115, h);
    roots(4, 0.115);
    const tips: THREE.Vector3[] = [];
    for (let i = 0; i < 3; i++) tips.push(branch(h * 0.6 + i * 0.2, i * 2.1 + 0.4, 0.44, 0.035, 0.9));
    blob(0, h + 0.26, 0, 0.4, LEAF_A, 0.92);
    tips.forEach((p, i) => blob(p.x * 1.12, p.y + 0.1, p.z * 1.12, 0.24 + rng() * 0.07, i % 2 ? LEAF_B : LEAF_C, 0.92));
    for (let i = 0; i < 7; i++) {
      const a = rng() * Math.PI * 2;
      const rr = 0.28 + rng() * 0.3;
      leaf(Math.cos(a) * rr, h + 0.1 + rng() * 0.5, Math.sin(a) * rr, 0.085, LEAF_C, -a, 0.22);
    }
    topY = h + 0.72;
  } else if (s === 4) {
    // ПЛІДНЕ ДЕРЕВО: справжній стовбур і перша куляста крона з яблуками
    const h = 2.05;
    trunk(0.135, 0.215, h);
    roots(5, 0.215);
    const tips: THREE.Vector3[] = [];
    for (let i = 0; i < 4; i++) tips.push(branch(h * 0.66 + (i % 2) * 0.16, i * 1.6 + 0.5, 0.58, 0.05, 0.82));
    const hosts = [blob(0, h + 0.46, 0, 0.8, LEAF_A, 0.9)];
    tips.forEach((p, i) => hosts.push(blob(p.x * 1.05, p.y + 0.16, p.z * 1.05, 0.44 + rng() * 0.12, i % 2 ? LEAF_B : LEAF_C, 0.9)));
    apples(6, hosts, 0.075);
    topY = h + 1.3;
  } else if (s === 5) {
    // ЩЕДРЕ ДЕРЕВО: широка крона, багато яблук, зʼявляється дупло
    const h = 2.5;
    trunk(0.2, 0.3, h);
    roots(6, 0.3);
    const tips: THREE.Vector3[] = [];
    for (let i = 0; i < 5; i++) tips.push(branch(h * 0.64 + (i % 3) * 0.17, i * 1.28 + 0.3, 0.74, 0.062, 0.8));
    const hosts = [blob(0, h + 0.56, 0, 1.0, LEAF_A, 0.88)];
    tips.forEach((p, i) => hosts.push(blob(p.x * 1.04, p.y + 0.2, p.z * 1.04, 0.56 + rng() * 0.16, i % 2 ? LEAF_B : LEAF_C, 0.88)));
    apples(11, hosts, 0.085);
    makeHollow(h * 0.54, 0.16, 0.27);
    topY = h + 1.62;
  } else {
    // ВІКОВИЙ ДУБ: товстий кряжистий стовбур, розлога плеската крона, мох
    const h = 2.95;
    trunk(0.29, 0.42, h, C.bark, 9);
    const flare = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.62, 0.5, 9, 1), flatMat(C.barkDark));
    flare.position.y = 0.25;
    flare.castShadow = true;
    flare.receiveShadow = true;
    g.add(flare);
    roots(7, 0.5, 1.15);
    const tips: THREE.Vector3[] = [];
    for (let i = 0; i < 6; i++) {
      const a = i * 1.06 + 0.2;
      const base = branch(h * 0.58 + (i % 3) * 0.22, a, 0.78, 0.085, 0.95);
      // друге коліно — звідси «кряжистість»
      const b2 = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.055, 0.5, 5), flatMat(C.bark));
      b2.geometry.translate(0, 0.25, 0);
      b2.position.copy(base);
      b2.rotation.set(Math.sin(a) * 0.5, 0, -Math.cos(a) * 0.5);
      b2.castShadow = true;
      g.add(b2);
      const d = new THREE.Vector3(0, 1, 0).applyEuler(b2.rotation).multiplyScalar(0.5);
      tips.push(base.clone().add(d));
    }
    const hosts = [blob(0, h + 0.62, 0, 1.26, LEAF_A, 0.78)];
    tips.forEach((p, i) => hosts.push(blob(p.x * 1.02, p.y + 0.22, p.z * 1.02, 0.62 + rng() * 0.26, i % 2 ? LEAF_B : LEAF_C, 0.8)));
    apples(15, hosts, 0.09);
    makeHollow(h * 0.5, 0.21, 0.37);
    // мох на стовбурі
    for (let i = 0; i < 5; i++) {
      const a = rng() * Math.PI * 2;
      const y = 0.4 + rng() * (h * 0.7);
      const r = 0.29 + (0.42 - 0.29) * (1 - y / h);
      const moss = new THREE.Mesh(new THREE.IcosahedronGeometry(0.1 + rng() * 0.06, 0), flatMat(0x5e8a3e));
      moss.position.set(Math.cos(a) * r, y, Math.sin(a) * r);
      moss.scale.set(0.9, 0.7, 0.35);
      moss.rotation.y = -a;
      g.add(moss);
    }
    topY = h + 2.0;
  }

  return { group: g, canopy, hollow, runeMesh, topY };
}

/* ───────────────────────── декор ───────────────────────── */
function buildDecor(
  rng: () => number,
  hill: (r: number, a: number) => number,
  R: number,
  blocked: (x: number, z: number) => boolean,
) {
  const g = new THREE.Group();
  const sways: THREE.Object3D[] = [];
  const place = (r: number, a: number) => new THREE.Vector3(Math.cos(a) * r, hill(r, a), Math.sin(a) * r);
  /** Вільна точка в кільці [rMin, rMax] — повертає null, якщо все зайнято. */
  const freeSpot = (rMin: number, rMax: number, tries = 14) => {
    for (let k = 0; k < tries; k++) {
      const a = rng() * Math.PI * 2;
      const r = rMin + rng() * (rMax - rMin);
      const p = place(r, a);
      if (!blocked(p.x, p.z)) return p;
    }
    return null;
  };

  // камʼяне коло навколо дерева (як у 2D-сцені)
  const ringR = 1.55;
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    const s = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.26, 0.24), flatMat(i % 3 === 0 ? 0x9d9488 : 0xb5ac9e));
    const p = place(ringR, a);
    s.position.set(p.x, p.y + 0.1, p.z);
    s.rotation.y = -a + (rng() - 0.5) * 0.3;
    s.rotation.z = (rng() - 0.5) * 0.18;
    s.castShadow = true;
    s.receiveShadow = true;
    g.add(s);
  }
  // земля всередині кола
  const soil = new THREE.Mesh(new THREE.CircleGeometry(ringR - 0.08, 16), flatMat(0xa9784a));
  soil.rotation.x = -Math.PI / 2;
  soil.position.y = hill(0, 0) + 0.035;
  soil.receiveShadow = true;
  g.add(soil);

  // стежка до краю
  for (let i = 0; i < 9; i++) {
    const t = i / 8;
    const a = Math.PI / 2 + Math.sin(t * 2.4) * 0.22;
    const r = ringR + 0.55 + t * (R - ringR - 1.3);
    const p = place(r, a);
    const st = new THREE.Mesh(new THREE.CylinderGeometry(0.3 - t * 0.06, 0.3 - t * 0.06, 0.1, 7), flatMat(0xb9a488));
    st.position.set(p.x + (rng() - 0.5) * 0.12, p.y + 0.05, p.z + (rng() - 0.5) * 0.12);
    st.rotation.y = rng() * 3;
    st.receiveShadow = true;
    g.add(st);
  }

  // кущі (гойдаються від вітру)
  for (let i = 0; i < 16; i++) {
    const p = freeSpot(2.4, R - 0.6);
    if (!p) continue;
    const bush = new THREE.Group();
    const n = 2 + Math.floor(rng() * 2);
    for (let k = 0; k < n; k++) {
      const s = 0.22 + rng() * 0.24;
      const b = new THREE.Mesh(new THREE.IcosahedronGeometry(s, 0), flatMat(rng() > 0.5 ? C.leafB : 0x3f8a34));
      b.position.set((rng() - 0.5) * 0.4, s * 0.78, (rng() - 0.5) * 0.4);
      b.rotation.set(rng() * 3, rng() * 3, rng() * 3);
      b.castShadow = true;
      bush.add(b);
    }
    bush.position.copy(p);
    bush.userData.phase = rng() * Math.PI * 2;
    sways.push(bush);
    g.add(bush);
  }

  // каміння на галявині
  for (let i = 0; i < 5; i++) {
    const p = freeSpot(2.6, R - 0.8);
    if (!p) continue;
    const s = 0.16 + rng() * 0.26;
    const rock = new THREE.Mesh(new THREE.IcosahedronGeometry(s, 0), flatMat(rng() > 0.5 ? C.rock : C.rockDark));
    rock.position.set(p.x, p.y + s * 0.45, p.z);
    rock.rotation.set(rng() * 3, rng() * 3, rng() * 3);
    rock.scale.y = 0.65;
    rock.castShadow = true;
    rock.receiveShadow = true;
    g.add(rock);
  }

  // квіти
  const petalCols = [0xf2d14b, 0xffffff, 0xe2607a, 0x9a7ae0];
  for (let i = 0; i < 46; i++) {
    const p = freeSpot(1.9, R - 0.5);
    if (!p) continue;
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.2, 4), flatMat(0x4f9a3d));
    stem.position.set(p.x, p.y + 0.1, p.z);
    const head = new THREE.Mesh(new THREE.IcosahedronGeometry(0.055, 0), flatMat(petalCols[Math.floor(rng() * petalCols.length)], { emissive: 0x161616 }));
    head.position.set(p.x, p.y + 0.21, p.z);
    g.add(stem, head);
  }

  // трав'яні пучки
  for (let i = 0; i < 26; i++) {
    const p = freeSpot(1.8, R - 0.5);
    if (!p) continue;
    const tuft = new THREE.Group();
    for (let k = 0; k < 3; k++) {
      const bl = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.28 + rng() * 0.16, 4), flatMat(rng() > 0.5 ? C.grassLight : C.grassDark));
      bl.position.set((rng() - 0.5) * 0.14, 0.14, (rng() - 0.5) * 0.14);
      bl.rotation.z = (rng() - 0.5) * 0.5;
      tuft.add(bl);
    }
    tuft.position.copy(p);
    tuft.userData.phase = rng() * Math.PI * 2;
    sways.push(tuft);
    g.add(tuft);
  }

  // паркан (дуга біля краю)
  {
    const fence = new THREE.Group();
    for (let i = 0; i < 5; i++) {
      const a = -0.55 + i * 0.16;
      const p = place(R - 0.9, a);
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.78, 0.11), flatMat(C.wood));
      post.position.set(p.x, p.y + 0.39, p.z);
      post.rotation.y = -a;
      post.castShadow = true;
      fence.add(post);
      if (i < 4) {
        const q = place(R - 0.9, a + 0.16);
        for (const h of [0.3, 0.58]) {
          const rail = new THREE.Mesh(new THREE.BoxGeometry(p.distanceTo(q), 0.07, 0.07), flatMat(C.wood));
          rail.position.set((p.x + q.x) / 2, (p.y + q.y) / 2 + h, (p.z + q.z) / 2);
          rail.lookAt(q.x, q.y + h, q.z);
          rail.rotateY(Math.PI / 2);
          rail.castShadow = true;
          fence.add(rail);
        }
      }
    }
    g.add(fence);
  }

  // ліхтар
  const lanternLight = new THREE.PointLight(0xffc36b, 1.5, 6, 2);
  {
    const p = place(R - 1.5, 2.55);
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 1.5, 6), flatMat(C.wood));
    post.position.set(p.x, p.y + 0.75, p.z);
    post.castShadow = true;
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.07, 0.07), flatMat(C.wood));
    arm.position.set(p.x + 0.17, p.y + 1.43, p.z);
    const cap = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.1, 4), flatMat(0x4c3a27));
    cap.position.set(p.x + 0.34, p.y + 1.33, p.z);
    cap.rotation.y = Math.PI / 4;
    const glass = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.15, 0.11), flatMat(0xffe1a8, { emissive: 0xffb445 }));
    glass.position.set(p.x + 0.34, p.y + 1.2, p.z);
    const base = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.08, 4), flatMat(0x4c3a27));
    base.position.set(p.x + 0.34, p.y + 1.09, p.z);
    base.rotation.set(Math.PI, Math.PI / 4, 0);
    lanternLight.position.set(p.x + 0.34, p.y + 1.2, p.z);
    g.add(post, arm, cap, glass, base, lanternLight);
  }

  // табличка
  {
    const p = place(R - 1.4, -0.9);
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.8, 0.09), flatMat(C.wood));
    post.position.set(p.x, p.y + 0.4, p.z);
    const board = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.36, 0.07), flatMat(0xb9854f));
    board.position.set(p.x, p.y + 0.78, p.z);
    board.rotation.y = 0.35;
    const leaf = new THREE.Mesh(new THREE.IcosahedronGeometry(0.1, 0), flatMat(C.leafC));
    leaf.position.set(p.x, p.y + 0.78, p.z + 0.06);
    post.castShadow = board.castShadow = true;
    g.add(post, board, leaf);
  }

  return { group: g, sways };
}

/* ───────────────────── рельєф острова ─────────────────────
   Галявина сама по собі надто рівна. Додаємо три речі й зупиняємось,
   щоб не перетворити сад на звалище каміння:
     · пологі горбки — просто зміна висоти під травою;
     · маленькі скельні виступи зі сходинок (найпомітніше);
     · поодинокі великі валуни, щоб був силует.
   Усе обходить русло струмка й подвірʼя хати через blocked().        */

function buildTerrain(
  rng: () => number,
  hill: (r: number, a: number) => number,
  R: number,
  blocked: (x: number, z: number) => boolean,
) {
  const g = new THREE.Group();
  const place = (r: number, a: number) => new THREE.Vector3(Math.cos(a) * r, hill(r, a), Math.sin(a) * r);
  const freeSpot = (rMin: number, rMax: number, tries = 18) => {
    for (let k = 0; k < tries; k++) {
      const a = rng() * Math.PI * 2;
      const r = rMin + rng() * (rMax - rMin);
      const p = place(r, a);
      if (!blocked(p.x, p.z)) return p;
    }
    return null;
  };

  const GRASS = [0x7ec24f, 0x6bb244, 0x8ccc57, 0x5ea23c];
  const STONE = [0x9d9488, 0x8a8176, 0x7a7166, 0xa8a094];

  // ── пологі горбки: трава тим самим кольором, лише інша висота
  for (let i = 0; i < 7; i++) {
    const p = freeSpot(2.6, R - 1.0);
    if (!p) continue;
    const w = 0.9 + rng() * 1.5;
    const h = 0.16 + rng() * 0.26;
    const mound = new THREE.Mesh(
      new THREE.SphereGeometry(w, 7 + Math.floor(rng() * 3), 4, 0, Math.PI * 2, 0, Math.PI / 2),
      flatMat(GRASS[Math.floor(rng() * GRASS.length)]),
    );
    mound.position.copy(p);
    mound.position.y -= 0.03;
    mound.scale.set(1, h / w, 0.75 + rng() * 0.5);
    mound.rotation.y = rng() * Math.PI * 2;
    mound.castShadow = true;
    mound.receiveShadow = true;
    g.add(mound);
  }

  // ── скельні виступи: 2–4 плити одна на одній, трохи зміщені
  for (let i = 0; i < 5; i++) {
    const p = freeSpot(2.9, R - 0.9);
    if (!p) continue;
    const crag = new THREE.Group();
    crag.position.copy(p);
    crag.rotation.y = rng() * Math.PI * 2;
    const layers = 2 + Math.floor(rng() * 3);
    let y = 0;
    let w = 0.42 + rng() * 0.4;
    for (let k = 0; k < layers; k++) {
      const h = 0.16 + rng() * 0.2;
      const slab = new THREE.Mesh(
        new THREE.CylinderGeometry(w * 0.82, w, h, 5 + Math.floor(rng() * 2)),
        flatMat(STONE[Math.floor(rng() * STONE.length)]),
      );
      slab.position.set((rng() - 0.5) * w * 0.3, y + h / 2, (rng() - 0.5) * w * 0.3);
      slab.rotation.y = rng() * Math.PI;
      slab.rotation.z = (rng() - 0.5) * 0.14;
      slab.castShadow = true;
      slab.receiveShadow = true;
      crag.add(slab);
      y += h * 0.92;
      w *= 0.74;
    }
    // мох на верхівці
    if (rng() > 0.4) {
      const moss = new THREE.Mesh(new THREE.IcosahedronGeometry(w * 0.9, 0), flatMat(0x5e8a3e));
      moss.position.y = y;
      moss.scale.set(1, 0.4, 1);
      crag.add(moss);
    }
    g.add(crag);
  }

  // ── поодинокі великі валуни
  for (let i = 0; i < 4; i++) {
    const p = freeSpot(3.1, R - 0.8);
    if (!p) continue;
    const s = 0.34 + rng() * 0.26;
    const b = new THREE.Mesh(new THREE.IcosahedronGeometry(s, 0), flatMat(STONE[Math.floor(rng() * STONE.length)]));
    b.position.copy(p);
    b.position.y += s * 0.42;
    b.rotation.set(rng() * 3, rng() * 3, rng() * 3);
    b.scale.set(1, 0.68 + rng() * 0.3, 1);
    b.castShadow = true;
    b.receiveShadow = true;
    g.add(b);
    // дрібніший супутник поруч
    if (rng() > 0.45) {
      const s2 = s * (0.4 + rng() * 0.3);
      const b2 = new THREE.Mesh(new THREE.IcosahedronGeometry(s2, 0), flatMat(STONE[Math.floor(rng() * STONE.length)]));
      b2.position.set(p.x + (rng() - 0.5) * 0.9, p.y + s2 * 0.4, p.z + (rng() - 0.5) * 0.9);
      b2.rotation.set(rng() * 3, rng() * 3, rng() * 3);
      b2.castShadow = true;
      g.add(b2);
    }
  }

  // ── пара високих кущів для силуету
  for (let i = 0; i < 3; i++) {
    const p = freeSpot(3.4, R - 0.9);
    if (!p) continue;
    const t = new THREE.Group();
    t.position.copy(p);
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.07, 0.4, 5), flatMat(C.bark));
    trunk.position.y = 0.2;
    trunk.castShadow = true;
    t.add(trunk);
    for (let k = 0; k < 3; k++) {
      const s = 0.22 + rng() * 0.16;
      const b = new THREE.Mesh(new THREE.IcosahedronGeometry(s, 0), flatMat(k % 2 ? 0x4f9a3d : 0x62b04a));
      b.position.set((rng() - 0.5) * 0.24, 0.42 + k * 0.17, (rng() - 0.5) * 0.24);
      b.rotation.set(rng() * 3, rng() * 3, rng() * 3);
      b.castShadow = true;
      t.add(b);
    }
    t.userData.phase = rng() * Math.PI * 2;
    g.add(t);
  }

  return { group: g };
}

/* ───────────────────── джерело · струмок · водоспад ─────────────────────
   Вода намальована трьома шматками однієї стрічки: чаша джерела нагорі,
   струмок, що тече по схилу до краю, і полотно водоспаду, яке зривається
   з острова вниз і розчиняється в тумані. Рух дає текстура, що безкінечно
   повзе по V — жодної анімації геометрії.                                */

function makeFlowTexture() {
  const c = document.createElement("canvas");
  c.width = 32;
  c.height = 256;
  const x = c.getContext("2d");
  if (!x) return new THREE.Texture();
  x.fillStyle = "#86cdec";
  x.fillRect(0, 0, 32, 256);
  // світлі прожилки — саме вони «течуть»
  for (let i = 0; i < 16; i++) {
    const y = Math.random() * 256;
    const h = 6 + Math.random() * 30;
    const g = x.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, "rgba(255,255,255,0)");
    g.addColorStop(0.5, `rgba(255,255,255,${0.3 + Math.random() * 0.45})`);
    g.addColorStop(1, "rgba(255,255,255,0)");
    x.fillStyle = g;
    x.fillRect(0, y, 32, h);
  }
  // темніші краї, щоб стрічка читалась обʼємною
  const e = x.createLinearGradient(0, 0, 32, 0);
  e.addColorStop(0, "rgba(44,96,136,.5)");
  e.addColorStop(0.5, "rgba(255,255,255,0)");
  e.addColorStop(1, "rgba(44,96,136,.5)");
  x.fillStyle = e;
  x.fillRect(0, 0, 32, 256);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = THREE.RepeatWrapping;
  t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export type WaterParts = {
  group: THREE.Group;
  streamTex: THREE.Texture;
  fallTex: THREE.Texture;
  fallTexBack: THREE.Texture;
  bubbles: THREE.Object3D[];
  spray: THREE.Points;
  mist: THREE.Points;
  springY: number;
};

function buildWater(
  rng: () => number,
  hill: (r: number, a: number) => number,
  R: number,
  tex: THREE.Texture,
): WaterParts {
  const g = new THREE.Group();
  const A0 = SPRING_A; // напрямок, у який тече струмок
  const RIM_R = R + 0.1;

  const at = (r: number, a: number) => new THREE.Vector3(Math.cos(a) * r, hill(r, a), Math.sin(a) * r);
  // шлях струмка: від чаші до краю, з легким вигином
  const path = (t: number) => {
    const r = SPRING_R + t * (RIM_R - SPRING_R);
    const a = A0 + Math.sin(t * Math.PI) * 0.17;
    const p = at(r, a);
    p.y += 0.055 - t * 0.12; // ближче до краю русло трохи врізається
    return p;
  };

  const springPos = path(0);

  /* ── чаша джерела ── */
  {
    // невисокий пагорб, з якого джерело й б'є
    const knoll = new THREE.Mesh(new THREE.SphereGeometry(1.4, 9, 4, 0, Math.PI * 2, 0, Math.PI / 2), flatMat(0x6bb244));
    // верхівка пагорба має лишитись НИЖЧЕ дзеркала води, інакше він її ховає
    knoll.position.set(springPos.x, springPos.y - 0.36, springPos.z);
    knoll.scale.set(1, 0.21, 0.9);
    knoll.receiveShadow = true;
    knoll.castShadow = true;
    g.add(knoll);

    const n = 9;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      // з боку струмка каміння нижче — там вода переливається
      const towards = Math.cos(a - A0);
      if (towards > 0.6) continue; // лишаємо відкритий жолоб на витік
      const s = 0.16 + rng() * 0.1;
      const rock = new THREE.Mesh(new THREE.IcosahedronGeometry(s, 0), flatMat(rng() > 0.5 ? 0x9d9488 : 0x7f776c));
      rock.position.set(
        springPos.x + Math.cos(a) * 0.74,
        springPos.y + (towards > 0.75 ? -0.04 : 0.08) + s * 0.2,
        springPos.z + Math.sin(a) * 0.74,
      );
      rock.rotation.set(rng() * 3, rng() * 3, rng() * 3);
      rock.scale.y = 0.75;
      rock.castShadow = true;
      rock.receiveShadow = true;
      g.add(rock);
    }
    const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.58, 0.22, 12), flatMat(0x6f6659));
    bowl.position.set(springPos.x, springPos.y - 0.02, springPos.z);
    bowl.receiveShadow = true;
    const disc = new THREE.Mesh(
      new THREE.CircleGeometry(0.66, 16),
      new THREE.MeshLambertMaterial({
        color: 0x8fd4ef,
        emissive: 0x1b5876,
        transparent: true,
        opacity: 0.88,
      }),
    );
    disc.rotation.x = -Math.PI / 2;
    disc.position.set(springPos.x, springPos.y + 0.105, springPos.z);
    g.add(bowl, disc);
  }

  /* ── бульбашки, якими джерело «б'є» ── */
  const bubbles: THREE.Object3D[] = [];
  {
    const bm = new THREE.MeshLambertMaterial({ color: 0xffffff, emissive: 0x9fd8ef, transparent: true, opacity: 0.85 });
    for (let i = 0; i < 5; i++) {
      const b = new THREE.Mesh(new THREE.IcosahedronGeometry(0.045 + rng() * 0.035, 0), bm);
      b.position.set(springPos.x + (rng() - 0.5) * 0.3, springPos.y + 0.09, springPos.z + (rng() - 0.5) * 0.3);
      b.userData.base = b.position.y;
      b.userData.phase = rng() * Math.PI * 2;
      bubbles.push(b);
      g.add(b);
    }
  }

  /* ── русло: кам'яні береги, темне дно, а зверху — прозора вода ──
     Острів не можна «прорізати» (сітка галявини надто велика), тому
     канал піднятий: по боках лежать валуни-береги, між ними темне мокре
     дно, і вже над ним — напівпрозоре полотно води. Крізь нього видно
     дно, і струмок читається об'ємним, а не наліпленою стрічкою.      */
  const streamTex = tex.clone();
  streamTex.needsUpdate = true;
  streamTex.repeat.set(1, 4);

  const BED_UP = 0.03; // дно трохи над землею
  const WATER_UP = 0.19; // поверхня води — ось ця різниця і є «глибина»
  {
    const SEG = 26;
    const up = new THREE.Vector3(0, 1, 0);
    const frame = (t: number) => {
      const p = path(t);
      const q = path(Math.min(1, t + 0.01));
      const side = new THREE.Vector3().crossVectors(up, q.clone().sub(p).normalize()).normalize();
      return { p, side };
    };

    // ── дно
    {
      const pos: number[] = [];
      const col: number[] = [];
      const idx: number[] = [];
      const dark = new THREE.Color(0x4e4336);
      const mid = new THREE.Color(0x6b5c47);
      for (let i = 0; i <= SEG; i++) {
        const t = i / SEG;
        const { p, side } = frame(t);
        const w = 0.34 + t * 0.26;
        const l = p.clone().addScaledVector(side, w);
        const c = p.clone();
        const r2 = p.clone().addScaledVector(side, -w);
        l.y += BED_UP;
        c.y += BED_UP - 0.04;
        r2.y += BED_UP;
        pos.push(l.x, l.y, l.z, c.x, c.y, c.z, r2.x, r2.y, r2.z);
        col.push(mid.r, mid.g, mid.b, dark.r, dark.g, dark.b, mid.r, mid.g, mid.b);
        if (i < SEG) {
          const a = i * 3;
          idx.push(a, a + 3, a + 1, a + 1, a + 3, a + 4, a + 1, a + 4, a + 2, a + 2, a + 4, a + 5);
        }
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
      geo.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
      geo.setIndex(idx);
      geo.computeVertexNormals();
      const bed = new THREE.Mesh(geo, flatMat(0xffffff, { vertexColors: true, side: THREE.DoubleSide }));
      bed.receiveShadow = true;
      g.add(bed);
    }

    // ── вода: центр темніший і щільніший, краї світліші й прозоріші
    {
      const pos: number[] = [];
      const uv: number[] = [];
      const col: number[] = [];
      const idx: number[] = [];
      const deep = new THREE.Color(0x4ea6cf);
      const shallow = new THREE.Color(0xc2ecfb);
      for (let i = 0; i <= SEG; i++) {
        const t = i / SEG;
        const { p, side } = frame(t);
        const w = 0.3 + t * 0.24;
        const pts = [-w, -w * 0.45, 0, w * 0.45, w];
        for (let k = 0; k < pts.length; k++) {
          const edge = Math.abs(pts[k]) / w;
          const v = p.clone().addScaledVector(side, pts[k]);
          // краї опускаємо майже до дна — так вода змикається з берегом,
          // а не висить над травою прозорими клаптями
          v.y += BED_UP + (WATER_UP - BED_UP) * (1 - edge) ** 0.7;
          pos.push(v.x, v.y, v.z);
          uv.push((pts[k] / w) * 0.5 + 0.5, t);
          const c = shallow.clone().lerp(deep, 1 - edge);
          col.push(c.r, c.g, c.b, 0.42 + (1 - edge) * 0.42);
        }
        if (i < SEG) {
          const a = i * 5;
          for (let k = 0; k < 4; k++) {
            idx.push(a + k, a + k + 5, a + k + 1, a + k + 1, a + k + 5, a + k + 6);
          }
        }
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
      geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
      geo.setAttribute("color", new THREE.Float32BufferAttribute(col, 4));
      geo.setIndex(idx);
      geo.computeVertexNormals();
      const mat = new THREE.MeshBasicMaterial({
        map: streamTex,
        transparent: true,
        vertexColors: true,
        depthWrite: false,
        side: THREE.DoubleSide,
      });
      const stream = new THREE.Mesh(geo, mat);
      stream.renderOrder = 3;
      g.add(stream);
    }

    // ── береги: валуни обабіч, густіше ближче до зламу
    for (let i = 3; i <= 30; i += 2) {
      const t = i / 30;
      const { p, side } = frame(t);
      const w = 0.34 + t * 0.26;
      for (const dir of [1, -1]) {
        if (rng() > 0.52) continue; // берег навмисно нерівний і місцями відкритий
        const s = 0.13 + rng() * 0.14;
        const rock = new THREE.Mesh(
          new THREE.IcosahedronGeometry(s, 0),
          flatMat(rng() > 0.55 ? 0x9d9488 : 0x7a7166),
        );
        rock.position
          .copy(p)
          .addScaledVector(side, dir * (w + s * 0.55 + rng() * 0.08));
        rock.position.y += s * 0.42;
        rock.rotation.set(rng() * 3, rng() * 3, rng() * 3);
        rock.scale.y = 0.72 + rng() * 0.3;
        rock.castShadow = true;
        rock.receiveShadow = true;
        g.add(rock);
      }
      // трава, що звисає над водою
      if (rng() > 0.45) {
        const dir = rng() > 0.5 ? 1 : -1;
        const tuft = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.26, 4), flatMat(0x5ea23c));
        tuft.position.copy(p).addScaledVector(side, dir * (w + 0.14));
        tuft.position.y += 0.13;
        tuft.rotation.z = -dir * 0.3;
        g.add(tuft);
      }
    }

    // ── камінці, що стирчать із самої води (видно, що вона має глибину)
    for (let i = 0; i < 7; i++) {
      const t = 0.12 + rng() * 0.76;
      const { p, side } = frame(t);
      const s = 0.07 + rng() * 0.06;
      const rock = new THREE.Mesh(new THREE.IcosahedronGeometry(s, 0), flatMat(0x8a8176));
      rock.position.copy(p).addScaledVector(side, (rng() - 0.5) * 0.3);
      rock.position.y += WATER_UP * 0.65;
      rock.rotation.set(rng() * 3, rng() * 3, rng() * 3);
      g.add(rock);
    }
  }

  /* ── водоспад: товстий струмінь аж у самий низ ──
     Два полотна один за одним (щільне ядро + ширший серпанок), щоб потік
     мав товщину, а не був плоскою стрічкою. Донизу він не обривається —
     лише трохи світлішає і виходить за кадр.                           */
  const fallTex = tex.clone();
  fallTex.needsUpdate = true;
  fallTex.repeat.set(1, 3);
  const fallTexBack = tex.clone();
  fallTexBack.needsUpdate = true;
  fallTexBack.repeat.set(1, 2);
  const edge = path(1);
  const outward = new THREE.Vector3(Math.cos(A0), 0, Math.sin(A0)).normalize();
  const fside = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), outward).normalize();
  {
    const ROWS = 18;
    const H = 11.0; // падає далеко за нижню межу кадру
    const sheet = (
      halfW0: number,
      grow: number,
      depth: number,
      map: THREE.Texture,
      tint: THREE.Color,
      a0: number,
      a1: number,
      order: number,
    ) => {
      const pos: number[] = [];
      const uv: number[] = [];
      const col: number[] = [];
      const idx: number[] = [];
      for (let k = 0; k <= ROWS; k++) {
        const t = k / ROWS;
        const y = edge.y - t * H;
        // спершу вилітає вперед, далі майже прямовисно
        const out = Math.sin(Math.min(1, t * 2.4) * Math.PI * 0.5) * 0.62 + depth;
        const w = halfW0 + t * grow;
        const c = edge.clone().addScaledVector(outward, out);
        c.y = y;
        const l = c.clone().addScaledVector(fside, w);
        const r2 = c.clone().addScaledVector(fside, -w);
        const alpha = a0 + (a1 - a0) * Math.min(1, t * 1.15) ** 1.3;
        pos.push(l.x, l.y, l.z, r2.x, r2.y, r2.z);
        uv.push(0, t * 2.2, 1, t * 2.2);
        col.push(tint.r, tint.g, tint.b, alpha, tint.r, tint.g, tint.b, alpha);
        if (k < ROWS) {
          const a = k * 2;
          idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
        }
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
      geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
      geo.setAttribute("color", new THREE.Float32BufferAttribute(col, 4));
      geo.setIndex(idx);
      geo.computeVertexNormals();
      const m = new THREE.Mesh(
        geo,
        new THREE.MeshBasicMaterial({
          map,
          transparent: true,
          vertexColors: true,
          depthWrite: false,
          side: THREE.DoubleSide,
        }),
      );
      m.renderOrder = order;
      g.add(m);
    };
    // ширший серпанок позаду
    sheet(0.52, 0.5, -0.1, fallTexBack, new THREE.Color(0xd3eefb), 0.5, 0.26, 3);
    // щільне ядро попереду
    sheet(0.36, 0.26, 0.06, fallTex, new THREE.Color(0xffffff), 1.0, 0.6, 4);

    // піна на зламі
    const foamMat = new THREE.MeshLambertMaterial({ color: 0xffffff, emissive: 0xcfe9f6, transparent: true, opacity: 0.75 });
    for (let i = 0; i < 7; i++) {
      const f = new THREE.Mesh(new THREE.IcosahedronGeometry(0.07 + rng() * 0.06, 0), foamMat);
      f.position
        .copy(edge)
        .addScaledVector(fside, (rng() - 0.5) * 0.7)
        .addScaledVector(outward, 0.02 + rng() * 0.16);
      f.position.y += (rng() - 0.5) * 0.08 + 0.04;
      f.scale.set(1.4, 0.65, 1);
      g.add(f);
    }
  }

  /* ── бризки біля зламу і туман знизу ── */
  const mkPoints = (n: number, make: (i: number) => [number, number, number], size: number, color: number, opacity: number) => {
    const arr = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const [x, y, z] = make(i);
      arr[i * 3] = x;
      arr[i * 3 + 1] = y;
      arr[i * 3 + 2] = z;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(arr, 3));
    const p = new THREE.Points(
      geo,
      new THREE.PointsMaterial({ color, size, transparent: true, opacity, depthWrite: false, sizeAttenuation: true }),
    );
    p.userData.base = arr.slice();
    p.userData.seed = Array.from({ length: n }, () => rng() * Math.PI * 2);
    g.add(p);
    return p;
  };

  const spray = mkPoints(
    42,
    () => [
      edge.x + (rng() - 0.5) * 0.6 + outward.x * rng() * 0.4,
      edge.y - rng() * 2.2,
      edge.z + (rng() - 0.5) * 0.6 + outward.z * rng() * 0.4,
    ],
    0.07,
    0xffffff,
    0.75,
  );
  const mist = mkPoints(
    34,
    () => [
      edge.x + (rng() - 0.5) * 1.5 + outward.x * (0.3 + rng() * 0.7),
      edge.y - 1.6 - rng() * 2.6,
      edge.z + (rng() - 0.5) * 1.5 + outward.z * (0.3 + rng() * 0.7),
    ],
    0.16,
    0xdff1fb,
    0.4,
  );

  return { group: g, streamTex, fallTex, fallTexBack, bubbles, spray, mist, springY: springPos.y };
}

/* ───────────────────────── хатинка Бомбома ─────────────────────────
   Кругла хатка з конічним дахом — клікабельна: тиснеш, і Бомбом
   виходить поговорити (вже як оверлей збоку екрана, не в 3D).        */

export type HutParts = { group: THREE.Group; window: THREE.Mesh; smoke: THREE.Mesh[]; light: THREE.PointLight };

function buildHut(rng: () => number, hill: (r: number, a: number) => number, R: number): HutParts {
  const g = new THREE.Group();
  const a = HUT_A;
  const r = HUT_R;
  const base = new THREE.Vector3(Math.cos(a) * r, hill(r, a), Math.sin(a) * r);
  g.position.copy(base);
  g.rotation.y = -a + Math.PI / 2; // дверима до стежки

  // втоптана земля навколо
  const yard = new THREE.Mesh(new THREE.CircleGeometry(0.95, 14), flatMat(0xa98a63));
  yard.rotation.x = -Math.PI / 2;
  yard.position.y = 0.025;
  yard.receiveShadow = true;
  g.add(yard);

  // стіни
  const walls = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.56, 0.62, 9), flatMat(0xe3d2ae));
  walls.position.y = 0.31;
  walls.castShadow = true;
  walls.receiveShadow = true;
  g.add(walls);

  // фундамент із каменю
  const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.62, 0.14, 9), flatMat(0x8d8478));
  foot.position.y = 0.07;
  foot.castShadow = true;
  g.add(foot);

  // дах
  const roof = new THREE.Mesh(new THREE.ConeGeometry(0.86, 0.72, 9), flatMat(0xb0523f));
  roof.position.y = 0.98;
  roof.castShadow = true;
  g.add(roof);
  const ridge = new THREE.Mesh(new THREE.IcosahedronGeometry(0.1, 0), flatMat(0x7e3a2c));
  ridge.position.y = 1.36;
  g.add(ridge);

  // двері
  const door = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.4, 0.06), flatMat(0x7d4f28));
  door.position.set(0, 0.22, 0.5);
  g.add(door);
  const knob = new THREE.Mesh(new THREE.IcosahedronGeometry(0.032, 0), flatMat(0xf0c75a, { emissive: 0x3a2c08 }));
  knob.position.set(0.08, 0.24, 0.53);
  g.add(knob);

  // вікно — воно ж «індикатор», що тут хтось є
  const win = new THREE.Mesh(
    new THREE.BoxGeometry(0.22, 0.2, 0.06),
    flatMat(0xffe2a6, { emissive: 0xffb445 }),
  );
  win.position.set(-0.4, 0.4, 0.28);
  win.rotation.y = -0.9;
  g.add(win);
  const frame = new THREE.Mesh(new THREE.BoxGeometry(0.27, 0.25, 0.04), flatMat(0x7d4f28));
  frame.position.set(-0.41, 0.4, 0.26);
  frame.rotation.y = -0.9;
  g.add(frame);

  // комин і димок
  const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.09, 0.3, 6), flatMat(0x8d8478));
  pipe.position.set(0.3, 1.1, -0.18);
  pipe.castShadow = true;
  g.add(pipe);

  const smoke: THREE.Mesh[] = [];
  for (let i = 0; i < 5; i++) {
    const m = new THREE.MeshLambertMaterial({ color: 0xffffff, emissive: 0xdfe6ea, transparent: true, opacity: 0.5 });
    const puff = new THREE.Mesh(new THREE.IcosahedronGeometry(0.085, 0), m);
    puff.position.set(0.3, 1.26, -0.18);
    puff.userData.t = i / 5;
    smoke.push(puff);
    g.add(puff);
  }

  // тепле світло з вікна
  const light = new THREE.PointLight(0xffc36b, 0.9, 3.4, 2);
  light.position.set(-0.6, 0.5, 0.4);
  g.add(light);

  // дрібниці біля хати
  for (let i = 0; i < 3; i++) {
    const s = 0.1 + rng() * 0.08;
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(s * 0.8, s, s * 1.3, 6), flatMat(0xb5713f));
    const ang = 1.6 + i * 0.5;
    pot.position.set(Math.cos(ang) * 0.75, s * 0.65, Math.sin(ang) * 0.75);
    pot.castShadow = true;
    const bud = new THREE.Mesh(new THREE.IcosahedronGeometry(s * 0.75, 0), flatMat(i % 2 ? 0x62b04a : 0x8ed05f));
    bud.position.set(pot.position.x, s * 1.5, pot.position.z);
    g.add(pot, bud);
  }

  return { group: g, window: win, smoke, light };
}

/* ───────────────────────── хмари ───────────────────────── */
function buildClouds(rng: () => number) {
  const g = new THREE.Group();
  const clouds: THREE.Object3D[] = [];
  const mat = new THREE.MeshLambertMaterial({ color: C.cloud, flatShading: true, emissive: 0xc9dcee, transparent: true, opacity: 0.95 });
  for (let i = 0; i < 6; i++) {
    const c = new THREE.Group();
    const n = 3 + Math.floor(rng() * 3);
    for (let k = 0; k < n; k++) {
      const s = 0.5 + rng() * 0.65;
      const b = new THREE.Mesh(new THREE.IcosahedronGeometry(s, 0), mat);
      b.position.set((k - n / 2) * 0.72 + (rng() - 0.5) * 0.3, (rng() - 0.5) * 0.28, (rng() - 0.5) * 0.4);
      b.scale.set(1.25, 0.72, 1);
      b.rotation.set(rng() * 3, rng() * 3, rng() * 3);
      c.add(b);
    }
    const scale = 0.8 + rng() * 0.9;
    c.scale.setScalar(scale);
    c.position.set(-18 + rng() * 36, 2.0 + rng() * 5.0, -5 - rng() * 12);
    c.userData.speed = 0.3 + rng() * 0.35;
    clouds.push(c);
    g.add(c);
  }
  return { group: g, clouds };
}

/* ───────────────────────── компонент ───────────────────────── */
export default function IslandScene({ stage, runeColor, onTreeClick, onHollowClick, onHutClick, quality = "high" }: IslandSceneProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<{ setStage: (s: number) => void; setRune: (c: string | null) => void } | null>(null);
  const cbRef = useRef({ onTreeClick, onHollowClick, onHutClick });
  cbRef.current = { onTreeClick, onHollowClick, onHutClick };

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: quality === "high", alpha: true, powerPreference: "high-performance" });
    } catch {
      host.setAttribute("data-webgl", "failed");
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, quality === "high" ? 2 : 1));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.style.display = "block";
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.touchAction = "none";
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0xbfe0f2, 18, 44);

    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 400);
    const camTarget = new THREE.Vector3(0, 1.5, 0);
    const lookAt = new THREE.Vector3();

    /* світло */
    scene.add(new THREE.HemisphereLight(0xcfe9ff, 0x5f8a44, 0.52));
    scene.add(new THREE.AmbientLight(0xffffff, 0.12));
    const sun = new THREE.DirectionalLight(0xfff3d6, 2.15);
    sun.position.set(6.5, 11, 7.5);
    sun.castShadow = true;
    const sm = quality === "high" ? 2048 : 1024;
    sun.shadow.mapSize.set(sm, sm);
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 40;
    sun.shadow.camera.left = -10;
    sun.shadow.camera.right = 10;
    sun.shadow.camera.top = 10;
    sun.shadow.camera.bottom = -10;
    sun.shadow.bias = -0.0004;
    sun.shadow.normalBias = 0.018;
    scene.add(sun);
    scene.add(sun.target);

    /* світ */
    const rng = mulberry32(20260929);
    const world = new THREE.Group();
    scene.add(world);

    const island = buildIsland(rng);
    world.add(island.group);

    const blocked = makeBlocker(island.R);
    // рельєф ставимо ДО декору, щоб кущі лягали поверх горбків
    const terrain = buildTerrain(rng, island.hill, island.R, blocked);
    world.add(terrain.group);

    const decor = buildDecor(rng, island.hill, island.R, blocked);
    world.add(decor.group);

    const flowTex = makeFlowTexture();
    const water = buildWater(rng, island.hill, island.R, flowTex);
    world.add(water.group);

    const hut = buildHut(rng, island.hill, island.R);
    world.add(hut.group);

    const clouds = buildClouds(mulberry32(777));
    scene.add(clouds.group);

    // світлячки
    const motes = (() => {
      const n = 60;
      const pos = new Float32Array(n * 3);
      const seed = new Float32Array(n);
      for (let i = 0; i < n; i++) {
        const a = rng() * Math.PI * 2;
        const r = rng() * island.R;
        pos[i * 3] = Math.cos(a) * r;
        pos[i * 3 + 1] = 0.4 + rng() * 2.6;
        pos[i * 3 + 2] = Math.sin(a) * r;
        seed[i] = rng() * Math.PI * 2;
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
      const mat = new THREE.PointsMaterial({ color: 0xfff2b0, size: 0.085, transparent: true, opacity: 0.75, depthWrite: false, sizeAttenuation: true });
      const p = new THREE.Points(geo, mat);
      p.userData.seed = seed;
      p.userData.base = pos.slice();
      scene.add(p);
      return p;
    })();

    /* дерево — перебудовується при зміні стадії */
    // ранні стадії ледь-ледь збільшені, щоб паросток читався на екрані
    const TREE_SCALE = [2.35, 1.9, 1.42, 1.26, 1.2, 1.18];
    const treeScale = (s: number) => TREE_SCALE[Math.max(1, Math.min(6, s)) - 1];
    let tree = buildTree(stage, mulberry32(4242));
    tree.group.position.y = island.hill(0, 0) + 0.04;
    tree.group.scale.setScalar(treeScale(stage));
    world.add(tree.group);

    const rebuildTree = (s: number) => {
      world.remove(tree.group);
      tree.group.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.geometry) m.geometry.dispose();
      });
      tree = buildTree(s, mulberry32(4242));
      tree.group.position.y = island.hill(0, 0) + 0.04;
      tree.group.scale.setScalar(treeScale(s));
      world.add(tree.group);
      applyRune(currentRune);
      frameCamera(s);
      resize(); // дистанція залежить від висоти дерева — перерахувати
    };

    let currentRune: string | null = runeColor ?? null;
    const applyRune = (c: string | null) => {
      currentRune = c;
      if (!tree.runeMesh) return;
      tree.runeMesh.visible = !!c;
      if (c) {
        const col = new THREE.Color(c);
        const m = tree.runeMesh.material as THREE.MeshLambertMaterial;
        m.color.copy(col);
        m.emissive.copy(col).multiplyScalar(0.55);
      }
    };
    applyRune(currentRune);

    /* Камера кадрує «коробку»: радіус viewR по горизонталі й від верхівки
       дерева до viewBot знизу. На паростку коробка менша — камера ближче,
       на дубі показуємо весь летючий острів разом із вістрям. */
    let viewR = 7.3;
    let viewBot = -5.6;
    let treeTop = 4;
    const frameCamera = (s: number) => {
      const t = (Math.max(1, Math.min(6, s)) - 1) / 5;
      treeTop = tree.topY * tree.group.scale.y + island.hill(0, 0);
      viewR = 6.3 + t * 1.0;
      viewBot = -(4.4 + t * 1.2);
      camTarget.set(0, (treeTop + viewBot) / 2, 0);
    };
    frameCamera(stage);

    /* керування: вільний оберт на 360° по горизонталі + інерція.
       Вертикаль лишається обмеженою, щоб не залізти під острів. */
    let yaw = 0.35;
    let pitch = 0;
    let targetYaw = 0.35;
    let targetPitch = 0;
    let spin = 0; // залишкова кутова швидкість після відпускання
    let dragging = false;
    let px = 0, py = 0, moved = 0, lastDx = 0;
    const onDown = (e: PointerEvent) => {
      dragging = true;
      moved = 0;
      lastDx = 0;
      spin = 0;
      px = e.clientX;
      py = e.clientY;
      (e.target as Element).setPointerCapture?.(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      const dx = e.clientX - px, dy = e.clientY - py;
      px = e.clientX; py = e.clientY;
      moved += Math.abs(dx) + Math.abs(dy);
      lastDx = dx;
      targetYaw -= dx * 0.007; // без обмежень — повний оберт
      targetPitch = THREE.MathUtils.clamp(targetPitch + dy * 0.004, -0.3, 0.5);
    };
    const onUp = () => {
      if (dragging) spin = THREE.MathUtils.clamp(-lastDx * 0.007, -0.09, 0.09);
      dragging = false;
    };
    renderer.domElement.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);

    /* клік по хатинці / дуплу / дереву + курсор-рука над ними */
    const ray = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    const setNdc = (cx: number, cy: number) => {
      const r = renderer.domElement.getBoundingClientRect();
      ndc.set(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(ndc, camera);
    };
    const hitHut = () => ray.intersectObject(hut.group, true).length > 0;
    const hitHollow = () => !!tree.hollow && ray.intersectObject(tree.hollow, true).length > 0;

    const onClick = (e: MouseEvent) => {
      if (moved > 8) return;
      setNdc(e.clientX, e.clientY);
      if (hitHut()) { cbRef.current.onHutClick?.(); return; }
      if (hitHollow()) { cbRef.current.onHollowClick?.(); return; }
      if (ray.intersectObject(tree.group, true).length) cbRef.current.onTreeClick?.();
    };
    renderer.domElement.addEventListener("click", onClick);

    const onHover = (e: PointerEvent) => {
      if (dragging) return;
      setNdc(e.clientX, e.clientY);
      renderer.domElement.style.cursor = hitHut() || hitHollow() ? "pointer" : "grab";
    };
    renderer.domElement.addEventListener("pointermove", onHover);
    renderer.domElement.style.cursor = "grab";

    /* розмір — дистанція підбирається так, щоб коробка кадру влізла */
    let fitDist = 18;
    let narrow = false;
    const resize = () => {
      const w = host.clientWidth || 1;
      const h = host.clientHeight || 1;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.fov = 34;
      camera.updateProjectionMatrix();
      const tanV = Math.tan((camera.fov * Math.PI) / 360);
      narrow = camera.aspect < 0.9;
      // на вузькому екрані даємо острову ледь-ледь вийти за краї — інакше він
      // висить крихітною цяткою посеред неба
      const needH = (narrow ? viewR * 0.84 : viewR) / (tanV * camera.aspect);
      const needV = ((treeTop - viewBot) * 0.5) / tanV;
      fitDist = Math.max(needH, needV);
    };
    const ro = new ResizeObserver(resize);
    ro.observe(host);
    resize();

    /* цикл */
    const clock = new THREE.Clock();
    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const t = clock.getElapsedTime();
      const dt = Math.min(clock.getDelta(), 0.05);

      // інерція після відпускання + ледь помітний ідл-дрейф
      if (!dragging && Math.abs(spin) > 0.0002) {
        targetYaw += spin;
        spin *= 0.94;
      }
      yaw += (targetYaw + Math.sin(t * 0.13) * 0.045 - yaw) * 0.08;
      pitch += (targetPitch - pitch) * 0.06;
      const cd = fitDist;
      const ch = cd * (narrow ? 0.3 : 0.42);
      camera.position.set(
        Math.sin(yaw) * cd,
        camTarget.y + ch + pitch * cd * 0.35 + Math.sin(t * 0.5) * 0.09,
        Math.cos(yaw) * cd,
      );
      // на телефоні дивимось трохи вище — острів опускається в нижню половину,
      // а зверху лишається небо під HUD
      lookAt.copy(camTarget);
      // зсув рахуємо від видимої висоти кадру, а не від дистанції —
      // інакше на телефоні (де камера далеко) острів з'їжджає геть униз
      if (narrow) lookAt.y += cd * Math.tan((camera.fov * Math.PI) / 360) * 0.18;
      camera.lookAt(lookAt);
      // туман тримаємо відносно відстані камери, інакше на вузькому екрані
      // (де камера відʼїжджає далі) острів вицвітає
      if (scene.fog instanceof THREE.Fog) {
        scene.fog.near = cd - 2;
        scene.fog.far = cd + 30;
      }

      // острів дихає
      world.position.y = Math.sin(t * 0.55) * 0.07;
      world.rotation.z = Math.sin(t * 0.33) * 0.005;

      // крона й кущі колихаються
      tree.canopy.rotation.z = Math.sin(t * 0.9) * 0.022;
      tree.canopy.rotation.x = Math.cos(t * 0.72) * 0.016;
      for (const s of decor.sways) {
        const ph = s.userData.phase || 0;
        s.rotation.z = Math.sin(t * 1.5 + ph) * 0.06;
      }

      // хмари
      for (const c of clouds.clouds) {
        c.position.x += c.userData.speed * dt;
        if (c.position.x > 20) c.position.x = -20;
      }

      // світлячки
      {
        const pos = motes.geometry.attributes.position as THREE.BufferAttribute;
        const base = motes.userData.base as Float32Array;
        const seed = motes.userData.seed as Float32Array;
        for (let i = 0; i < seed.length; i++) {
          pos.setY(i, base[i * 3 + 1] + Math.sin(t * 0.7 + seed[i]) * 0.22);
          pos.setX(i, base[i * 3] + Math.sin(t * 0.34 + seed[i] * 1.7) * 0.2);
        }
        pos.needsUpdate = true;
      }

      // ── вода: текстури повзуть, бульбашки підстрибують ──
      water.streamTex.offset.y -= dt * 0.5;
      water.fallTex.offset.y -= dt * 1.6;
      water.fallTexBack.offset.y -= dt * 1.05;
      for (const b of water.bubbles) {
        const ph = (b.userData.phase as number) || 0;
        const k = (Math.sin(t * 2.2 + ph) + 1) / 2;
        b.position.y = (b.userData.base as number) + k * 0.13;
        b.scale.setScalar(0.6 + k * 0.6);
      }
      for (const pts of [water.spray, water.mist]) {
        const pa = pts.geometry.attributes.position as THREE.BufferAttribute;
        const base = pts.userData.base as Float32Array;
        const seed = pts.userData.seed as number[];
        const fast = pts === water.spray;
        for (let i = 0; i < seed.length; i++) {
          const sp = fast ? 1.9 : 0.5;
          const amp = fast ? 0.5 : 0.35;
          const cycle = ((t * sp + seed[i]) % (Math.PI * 2)) / (Math.PI * 2);
          pa.setY(i, base[i * 3 + 1] - cycle * amp * 2 + amp);
          pa.setX(i, base[i * 3] + Math.sin(t * 0.8 + seed[i]) * 0.12);
        }
        pa.needsUpdate = true;
      }

      // ── хатинка: димок із комина, тепле вікно ──
      for (const puff of hut.smoke) {
        const u = ((puff.userData.t as number) + t * 0.14) % 1;
        puff.position.y = 1.26 + u * 1.5;
        puff.position.x = 0.3 + Math.sin(u * 4 + (puff.userData.t as number) * 7) * 0.18;
        puff.scale.setScalar(0.5 + u * 1.5);
        (puff.material as THREE.MeshLambertMaterial).opacity = 0.45 * (1 - u);
      }
      const warm = 0.82 + Math.sin(t * 1.6) * 0.14;
      (hut.window.material as THREE.MeshLambertMaterial).emissive.setRGB(warm, warm * 0.68, warm * 0.28);
      hut.light.intensity = 0.75 + Math.sin(t * 1.6) * 0.18;

      if (tree.runeMesh && tree.runeMesh.visible) {
        tree.runeMesh.rotation.y = t * 0.9;
        tree.runeMesh.position.y += Math.sin(t * 2) * 0.0007;
      }

      renderer.render(scene, camera);
    };
    tick();

    apiRef.current = { setStage: rebuildTree, setRune: applyRune };
    host.setAttribute("data-webgl", "ok");

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      renderer.domElement.removeEventListener("pointerdown", onDown);
      renderer.domElement.removeEventListener("click", onClick);
      renderer.domElement.removeEventListener("pointermove", onHover);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.geometry) m.geometry.dispose();
        const mat = m.material as THREE.Material | THREE.Material[] | undefined;
        if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
        else mat?.dispose();
      });
      renderer.dispose();
      if (renderer.domElement.parentNode === host) host.removeChild(renderer.domElement);
      apiRef.current = null;
    };
    // сцена будується один раз; стадія/руна передаються через api нижче
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quality]);

  useEffect(() => { apiRef.current?.setStage(stage); }, [stage]);
  useEffect(() => { apiRef.current?.setRune(runeColor ?? null); }, [runeColor]);

  return <div ref={hostRef} className="l3-canvas" />;
}
