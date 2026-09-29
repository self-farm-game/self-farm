"use client";
/**
 * Self-Farm · 3D-прототип саду (three.js, low-poly)
 *
 * Увесь острів будується процедурно — жодних .glb/.fbx, тільки геометрія.
 * Дерево має 6 стадій, які збігаються зі стадіями з lib/utils/xp.ts.
 * Дупло зʼявляється з 5-ї стадії й клікається (пасхалка з руною).
 */
import { useEffect, useRef } from "react";
import * as THREE from "three";

export type IslandSceneProps = {
  stage: number; // 1..6
  runeColor?: string | null; // якщо в дуплі лежить руна
  onTreeClick?: () => void;
  onHollowClick?: () => void;
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

/* ───────────────────────── дерево ───────────────────────── */
type TreeSpec = { trunkH: number; trunkR: number; blobs: { x: number; y: number; z: number; r: number; c: number }[]; apples: number; hollow: boolean };

function treeSpec(stage: number): TreeSpec {
  const s = Math.max(1, Math.min(6, stage));
  const table: TreeSpec[] = [
    { trunkH: 0.32, trunkR: 0.055, apples: 0, hollow: false, blobs: [ { x: -0.1, y: 0.34, z: 0.02, r: 0.17, c: C.leafC }, { x: 0.12, y: 0.4, z: -0.04, r: 0.14, c: C.leafA } ] },
    { trunkH: 0.8, trunkR: 0.1, apples: 0, hollow: false, blobs: [ { x: 0, y: 0.92, z: 0, r: 0.38, c: C.leafA }, { x: -0.22, y: 0.78, z: 0.14, r: 0.24, c: C.leafC } ] },
    { trunkH: 1.45, trunkR: 0.16, apples: 0, hollow: false, blobs: [ { x: 0, y: 1.65, z: 0, r: 0.6, c: C.leafA }, { x: -0.42, y: 1.42, z: 0.2, r: 0.4, c: C.leafB }, { x: 0.4, y: 1.5, z: -0.16, r: 0.37, c: C.leafC } ] },
    { trunkH: 2.0, trunkR: 0.22, apples: 5, hollow: false, blobs: [ { x: 0, y: 2.35, z: 0, r: 0.82, c: C.leafA }, { x: -0.68, y: 2.0, z: 0.26, r: 0.56, c: C.leafB }, { x: 0.66, y: 2.1, z: -0.22, r: 0.54, c: C.leafC }, { x: 0.1, y: 1.85, z: 0.6, r: 0.45, c: C.leafB } ] },
    { trunkH: 2.5, trunkR: 0.3, apples: 9, hollow: true, blobs: [ { x: 0, y: 3.0, z: 0, r: 1.02, c: C.leafA }, { x: -0.92, y: 2.55, z: 0.3, r: 0.72, c: C.leafB }, { x: 0.9, y: 2.68, z: -0.28, r: 0.7, c: C.leafC }, { x: 0.15, y: 2.4, z: 0.8, r: 0.6, c: C.leafB }, { x: -0.2, y: 2.45, z: -0.85, r: 0.55, c: C.leafA } ] },
    { trunkH: 3.1, trunkR: 0.42, apples: 13, hollow: true, blobs: [ { x: 0, y: 3.75, z: 0, r: 1.3, c: C.leafA }, { x: -1.24, y: 3.15, z: 0.36, r: 0.92, c: C.leafB }, { x: 1.2, y: 3.3, z: -0.34, r: 0.9, c: C.leafC }, { x: 0.2, y: 2.95, z: 1.05, r: 0.78, c: C.leafB }, { x: -0.28, y: 3.0, z: -1.1, r: 0.72, c: C.leafA }, { x: 0.6, y: 3.9, z: 0.5, r: 0.6, c: C.leafC } ] },
  ];
  return table[s - 1];
}

function buildTree(stage: number, rng: () => number) {
  const spec = treeSpec(stage);
  const g = new THREE.Group();
  const canopy = new THREE.Group();

  // стовбур — трохи звужений і ледь нахилений
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(spec.trunkR * 0.72, spec.trunkR * 1.15, spec.trunkH, 7, 2),
    flatMat(C.bark),
  );
  trunk.position.y = spec.trunkH / 2;
  trunk.rotation.z = 0.035;
  trunk.castShadow = true;
  trunk.receiveShadow = true;
  g.add(trunk);

  // коренева основа
  if (stage >= 3) {
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 + rng();
      const root = new THREE.Mesh(new THREE.IcosahedronGeometry(spec.trunkR * 0.75, 0), flatMat(C.barkDark));
      root.position.set(Math.cos(a) * spec.trunkR * 1.25, spec.trunkR * 0.25, Math.sin(a) * spec.trunkR * 1.25);
      root.scale.set(1, 0.55, 1);
      root.castShadow = true;
      g.add(root);
    }
  }

  // гілки
  if (stage >= 4) {
    const n = stage === 4 ? 2 : stage === 5 ? 3 : 4;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + 0.7;
      const len = spec.trunkH * 0.42;
      const br = new THREE.Mesh(new THREE.CylinderGeometry(spec.trunkR * 0.2, spec.trunkR * 0.42, len, 5), flatMat(C.bark));
      br.position.set(Math.cos(a) * len * 0.35, spec.trunkH * 0.78, Math.sin(a) * len * 0.35);
      br.rotation.set(Math.sin(a) * 0.75, 0, -Math.cos(a) * 0.75);
      br.castShadow = true;
      g.add(br);
    }
  }

  // крона
  for (const b of spec.blobs) {
    const m = new THREE.Mesh(new THREE.IcosahedronGeometry(b.r, 1), flatMat(b.c));
    m.position.set(b.x, b.y, b.z);
    m.rotation.set(rng() * 3, rng() * 3, rng() * 3);
    m.scale.set(1, 0.86 + rng() * 0.2, 1);
    m.castShadow = true;
    m.receiveShadow = true;
    canopy.add(m);
  }

  // яблука
  const appleMat = flatMat(0xe0513f, { emissive: 0x2a0a06 });
  for (let i = 0; i < spec.apples; i++) {
    const host = spec.blobs[Math.floor(rng() * spec.blobs.length)];
    const a = rng() * Math.PI * 2;
    const p = rng() * Math.PI - Math.PI / 2;
    const ap = new THREE.Mesh(new THREE.IcosahedronGeometry(Math.max(0.06, host.r * 0.12), 0), appleMat);
    ap.position.set(
      host.x + Math.cos(a) * Math.cos(p) * host.r * 0.95,
      host.y + Math.sin(p) * host.r * 0.8,
      host.z + Math.sin(a) * Math.cos(p) * host.r * 0.95,
    );
    canopy.add(ap);
  }
  g.add(canopy);

  // дупло
  let hollow: THREE.Mesh | null = null;
  let runeMesh: THREE.Mesh | null = null;
  if (spec.hollow) {
    const hy = spec.trunkH * 0.58;
    const hr = spec.trunkR * 0.55;
    hollow = new THREE.Mesh(new THREE.SphereGeometry(hr, 10, 8), flatMat(0x2a1a10, { emissive: 0x120a06 }));
    hollow.position.set(0, hy, spec.trunkR * 0.92);
    hollow.scale.set(1, 1.35, 0.55);
    g.add(hollow);

    const ring = new THREE.Mesh(new THREE.TorusGeometry(hr * 1.05, hr * 0.2, 5, 10), flatMat(C.barkDark));
    ring.position.copy(hollow.position);
    ring.scale.set(1, 1.35, 0.7);
    g.add(ring);

    runeMesh = new THREE.Mesh(new THREE.OctahedronGeometry(hr * 0.62, 0), flatMat(0xffffff, { emissive: 0x000000 }));
    runeMesh.position.set(0, hy, spec.trunkR * 1.02);
    runeMesh.visible = false;
    g.add(runeMesh);
  }

  return { group: g, canopy, hollow, runeMesh, spec };
}

/* ───────────────────────── декор ───────────────────────── */
function buildDecor(rng: () => number, hill: (r: number, a: number) => number, R: number) {
  const g = new THREE.Group();
  const sways: THREE.Object3D[] = [];
  const place = (r: number, a: number) => new THREE.Vector3(Math.cos(a) * r, hill(r, a), Math.sin(a) * r);

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
    const a = rng() * Math.PI * 2;
    const r = 2.4 + rng() * (R - 3.0);
    const p = place(r, a);
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
  for (let i = 0; i < 9; i++) {
    const a = rng() * Math.PI * 2;
    const r = 2.6 + rng() * (R - 3.2);
    const p = place(r, a);
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
    const a = rng() * Math.PI * 2;
    const r = 1.9 + rng() * (R - 2.4);
    const p = place(r, a);
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.2, 4), flatMat(0x4f9a3d));
    stem.position.set(p.x, p.y + 0.1, p.z);
    const head = new THREE.Mesh(new THREE.IcosahedronGeometry(0.055, 0), flatMat(petalCols[Math.floor(rng() * petalCols.length)], { emissive: 0x161616 }));
    head.position.set(p.x, p.y + 0.21, p.z);
    g.add(stem, head);
  }

  // трав'яні пучки
  for (let i = 0; i < 26; i++) {
    const a = rng() * Math.PI * 2;
    const r = 1.8 + rng() * (R - 2.2);
    const p = place(r, a);
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

  // ставок
  {
    const a = 1.05;
    const p = place(4.1, a);
    const basin = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.8, 0.22, 12), flatMat(0x7a6a52));
    basin.position.set(p.x, p.y - 0.02, p.z);
    basin.receiveShadow = true;
    const water = new THREE.Mesh(
      new THREE.CircleGeometry(0.84, 14),
      new THREE.MeshLambertMaterial({ color: C.water, transparent: true, opacity: 0.8, flatShading: true, emissive: 0x0f3346 }),
    );
    water.rotation.x = -Math.PI / 2;
    water.position.set(p.x, p.y + 0.1, p.z);
    water.userData.water = true;
    g.add(basin, water);
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
export default function IslandScene({ stage, runeColor, onTreeClick, onHollowClick, quality = "high" }: IslandSceneProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<{ setStage: (s: number) => void; setRune: (c: string | null) => void } | null>(null);
  const cbRef = useRef({ onTreeClick, onHollowClick });
  cbRef.current = { onTreeClick, onHollowClick };

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

    const decor = buildDecor(rng, island.hill, island.R);
    world.add(decor.group);

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

    /* Бомбом — спрайт прямо на острові (не в рамці інтерфейсу) */
    const bombom = (() => {
      const mat = new THREE.SpriteMaterial({ transparent: true, depthWrite: false });
      const sp = new THREE.Sprite(mat);
      sp.center.set(0.5, 0);
      sp.scale.set(1.25, 1.55, 1);
      const a = 2.16, r = 5.15;
      sp.position.set(Math.cos(a) * r, island.hill(r, a) + 0.02, Math.sin(a) * r);
      new THREE.TextureLoader().load("/assets/sprites/garden/BomBom.png", (t) => {
        t.colorSpace = THREE.SRGBColorSpace;
        t.magFilter = THREE.NearestFilter;
        t.minFilter = THREE.LinearMipmapLinearFilter;
        mat.map = t;
        mat.needsUpdate = true;
        const ar = (t.image?.width || 1) / (t.image?.height || 1);
        sp.scale.set(1.55 * ar, 1.55, 1);
      });
      world.add(sp);
      return sp;
    })();
    const root = host.parentElement as HTMLElement | null;
    const projV = new THREE.Vector3();

    /* дерево — перебудовується при зміні стадії */
    let tree = buildTree(stage, mulberry32(4242));
    tree.group.position.y = island.hill(0, 0) + 0.04;
    tree.group.scale.setScalar(1.18);
    world.add(tree.group);

    const rebuildTree = (s: number) => {
      world.remove(tree.group);
      tree.group.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.geometry) m.geometry.dispose();
      });
      tree = buildTree(s, mulberry32(4242));
      tree.group.position.y = island.hill(0, 0) + 0.04;
      tree.group.scale.setScalar(1.18);
      world.add(tree.group);
      applyRune(currentRune);
      frameCamera(s);
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

    /* камера підлаштовується під розмір дерева */
    let camDist = 15;
    let camHeight = 6.2;
    const frameCamera = (s: number) => {
      const t = (Math.max(1, Math.min(6, s)) - 1) / 5;
      camDist = 17.0 + t * 3.2;
      camHeight = 6.8 + t * 2.4;
      camTarget.set(0, -0.15 + t * 1.15, 0);
    };
    frameCamera(stage);

    /* керування: обмежене обертання перетягуванням */
    let yaw = 0.35;
    let pitch = 0;
    let targetYaw = 0.35;
    let targetPitch = 0;
    let dragging = false;
    let px = 0, py = 0, moved = 0;
    const onDown = (e: PointerEvent) => { dragging = true; moved = 0; px = e.clientX; py = e.clientY; (e.target as Element).setPointerCapture?.(e.pointerId); };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      const dx = e.clientX - px, dy = e.clientY - py;
      px = e.clientX; py = e.clientY;
      moved += Math.abs(dx) + Math.abs(dy);
      targetYaw = THREE.MathUtils.clamp(targetYaw - dx * 0.006, -0.85, 1.55);
      targetPitch = THREE.MathUtils.clamp(targetPitch + dy * 0.004, -0.22, 0.42);
    };
    const onUp = () => { dragging = false; };
    renderer.domElement.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);

    /* клік по дереву / дуплу */
    const ray = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    const onClick = (e: MouseEvent) => {
      if (moved > 8) return;
      const r = renderer.domElement.getBoundingClientRect();
      ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(ndc, camera);
      if (tree.hollow) {
        const h = ray.intersectObject(tree.hollow, true);
        if (h.length) { cbRef.current.onHollowClick?.(); return; }
      }
      const t = ray.intersectObject(tree.group, true);
      if (t.length) cbRef.current.onTreeClick?.();
    };
    renderer.domElement.addEventListener("click", onClick);

    /* розмір — камера відсувається так, щоб острів завжди влазив цілком */
    let fitMul = 1;
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
      const needH = (narrow ? 6.1 : 7.3) / (tanV * camera.aspect);
      const needV = 5.8 / tanV; // піввисота: від крони до вістря знизу
      fitMul = Math.max(needH, needV);
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

      // ледь помітний ідл-дрейф камери
      yaw += (targetYaw + Math.sin(t * 0.13) * 0.045 - yaw) * 0.06;
      pitch += (targetPitch - pitch) * 0.06;
      const cd = Math.max(camDist, fitMul);
      const ch = camHeight * (cd / camDist) * (narrow ? 0.66 : 1);
      camera.position.set(
        Math.sin(yaw) * cd,
        ch + pitch * 6 + Math.sin(t * 0.5) * 0.09,
        Math.cos(yaw) * cd,
      );
      // на телефоні дивимось трохи вище — острів опускається в нижню половину,
      // а зверху лишається небо під HUD
      lookAt.copy(camTarget);
      if (narrow) lookAt.y += 2.6;
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

      // Бомбом: легке погойдування + позиція бульбашки в екранних координатах
      bombom.position.y += Math.sin(t * 1.7) * 0.0006;
      if (root) {
        bombom.getWorldPosition(projV);
        projV.y += bombom.scale.y * 0.92;
        projV.project(camera);
        const w = host.clientWidth || 1;
        const h = host.clientHeight || 1;
        root.style.setProperty("--l3-bx", ((projV.x * 0.5 + 0.5) * w).toFixed(1) + "px");
        root.style.setProperty("--l3-by", ((-projV.y * 0.5 + 0.5) * h).toFixed(1) + "px");
      }

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
