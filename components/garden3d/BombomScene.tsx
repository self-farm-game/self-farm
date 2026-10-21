"use client";
/**
 * Бомбом у 3D.
 *
 * Той самий матеріал і те саме світло, що й на острові: MeshLambertMaterial
 * із flatShading, півсферичне світло плюс «сонце» згори-зліва. Тому він
 * виглядає зліпленим із того ж матеріалу, що й сад, а не приклеєним зверху.
 *
 * Полотно крихітне (десь 90×110) і живе лише поки відкрита панель репліки,
 * тож друге WebGL-полотно поруч з островом нікого не обтяжує. Коли панель
 * закривається, сцена розбирається повністю — геометрія й матеріали теж,
 * інакше кожне відкриття підтікало б памʼяттю.
 *
 * Якщо WebGL недоступний (старий телефон, вимкнене прискорення), показуємо
 * плаский SVG — той самий гном, просто без обертання.
 */
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import BombomFlat from "@/components/garden3d/Bombom";

const C = {
  hat: 0xcf4a3c,
  hatDark: 0x8e2b24,
  skin: 0xf0c9a8,
  skinDark: 0xd79d74,
  beard: 0xeef3ee,
  beardDark: 0xc3cfc6,
  coat: 0x4b8a4e,
  coatDark: 0x31602f,
  belt: 0x3a2a1b,
  gold: 0xe9c178,
  pack: 0x8a6339,
  packDark: 0x5f4328,
  boot: 0x4a3627,
  eye: 0x2a221b,
};

const mat = (color: number, extra: THREE.MeshLambertMaterialParameters = {}) =>
  new THREE.MeshLambertMaterial({ color, flatShading: true, ...extra });

/** Низькополігональний гном: усе з примітивів з малим числом сегментів. */
function buildGnome() {
  const g = new THREE.Group();
  const add = (m: THREE.Mesh, x: number, y: number, z: number) => {
    m.position.set(x, y, z);
    g.add(m);
    return m;
  };

  // скатки за спиною
  for (const side of [-1, 1]) {
    const roll = add(
      new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.34, 7), mat(C.pack)),
      side * 0.72,
      0.42,
      -0.26,
    );
    roll.rotation.z = Math.PI / 2;
    const roll2 = add(
      new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.3, 7), mat(C.packDark)),
      side * 0.7,
      0.82,
      -0.3,
    );
    roll2.rotation.z = Math.PI / 2;
  }

  // чоботи
  for (const side of [-1, 1]) {
    add(new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.2, 0.46), mat(C.boot)), side * 0.26, 0.1, 0.24);
  }

  // тулуб — конус донизу широкий, він же «сидить»
  add(new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.78, 0.86, 8), mat(C.coat)), 0, 0.52, 0);
  // комір
  add(new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.5, 0.16, 8), mat(C.coatDark)), 0, 0.95, 0);
  // пояс
  add(new THREE.Mesh(new THREE.CylinderGeometry(0.66, 0.68, 0.14, 8), mat(C.belt)), 0, 0.36, 0);
  add(new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.14, 0.06), mat(C.gold)), 0, 0.36, 0.67);

  // руки й рукавиці
  for (const side of [-1, 1]) {
    const arm = add(
      new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.13, 0.6, 6), mat(C.coatDark)),
      side * 0.6,
      0.6,
      0.12,
    );
    arm.rotation.z = side * 0.34;
    add(new THREE.Mesh(new THREE.IcosahedronGeometry(0.17, 0), mat(C.skin)), side * 0.76, 0.32, 0.2);
  }

  // голова
  add(new THREE.Mesh(new THREE.IcosahedronGeometry(0.46, 1), mat(C.skin)), 0, 1.28, 0);

  // борода — конус донизу, трохи вперед
  const beard = add(new THREE.Mesh(new THREE.ConeGeometry(0.48, 1.0, 7), mat(C.beard)), 0, 0.82, 0.12);
  beard.rotation.x = Math.PI;
  // вуса
  for (const side of [-1, 1]) {
    const m = add(
      new THREE.Mesh(new THREE.IcosahedronGeometry(0.16, 0), mat(C.beard)),
      side * 0.17,
      1.17,
      0.36,
    );
    m.scale.set(1, 0.6, 0.7);
  }

  // ніс
  const nose = add(new THREE.Mesh(new THREE.ConeGeometry(0.17, 0.4, 6), mat(C.skinDark)), 0, 1.29, 0.46);
  nose.rotation.x = Math.PI / 2;

  // заплющені очі — він спокійний
  for (const side of [-1, 1]) {
    add(new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.035, 0.04), mat(C.eye)), side * 0.21, 1.4, 0.4);
    const brow = add(
      new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.07, 0.07), mat(C.beardDark)),
      side * 0.21,
      1.5,
      0.38,
    );
    brow.rotation.z = side * -0.12;
  }

  // ковпак: криси + високий конус із нахилом
  add(new THREE.Mesh(new THREE.CylinderGeometry(0.56, 0.62, 0.14, 8), mat(C.hatDark)), 0, 1.58, 0.02);
  const cone = add(new THREE.Mesh(new THREE.ConeGeometry(0.54, 1.34, 7), mat(C.hat)), 0.06, 2.22, -0.04);
  cone.rotation.z = -0.1;
  const pom = add(new THREE.Mesh(new THREE.IcosahedronGeometry(0.11, 0), mat(C.beard)), 0.19, 2.87, -0.08);

  // тінь: без неї він висить у порожнечі
  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.95, 14),
    new THREE.MeshBasicMaterial({ color: 0x0a1f1a, transparent: true, opacity: 0.38 }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.012;
  g.add(shadow);

  return { group: g, pom };
}

export default function BombomScene({ size }: { size?: number }) {
  const host = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const el = host.current;
    if (!el) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      setFailed(true);
      return;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.domElement.style.display = "block";
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);

    // Розмір диктує CSS (у панелі це clamp від ширини екрана), тому
    // полотно міряє власний контейнер, а не отримує піксель ззовні.
    const resize = () => {
      const W = Math.max(1, Math.round(el.clientWidth));
      const H = Math.max(1, Math.round(el.clientHeight));
      renderer.setSize(W, H, false);
      camera.aspect = W / H;
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(el);
    // Кадр рахований, а не на око: фігура заввишки ~2.9 одиниці, при fov 30°
    // у кадр влазить 2·d·tan(15°), тож d ≈ 5.4 — і він уміщається цілком,
    // від помпона до чобіт, без зайвого повітря навколо.
    camera.position.set(0.8, 1.72, 6.0);
    camera.lookAt(0, 1.24, 0);

    // те саме світло, що на острові, тільки без тіней — на 100px вони
    // коштують більше, ніж дають
    scene.add(new THREE.HemisphereLight(0xcfe9ff, 0x5f8a44, 0.62));
    scene.add(new THREE.AmbientLight(0xffffff, 0.18));
    const sun = new THREE.DirectionalLight(0xfff3d6, 2.0);
    sun.position.set(3.4, 5.2, 4.2);
    scene.add(sun);
    const rim = new THREE.DirectionalLight(0x9fd0ff, 0.5);
    rim.position.set(-3, 1.6, -2.4);
    scene.add(rim);

    const { group, pom } = buildGnome();
    scene.add(group);

    const calm = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    const t0 = performance.now();
    const tick = () => {
      const t = (performance.now() - t0) / 1000;
      if (!calm) {
        // ледь помітне дихання й поворот — він сидить, а не позує
        group.position.y = Math.sin(t * 1.1) * 0.035;
        group.rotation.y = Math.sin(t * 0.42) * 0.22;
        pom.position.x = 0.2 + Math.sin(t * 1.1 + 0.6) * 0.045;
      }
      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.geometry) m.geometry.dispose();
        const mt = m.material as THREE.Material | THREE.Material[] | undefined;
        if (Array.isArray(mt)) mt.forEach((x) => x.dispose());
        else mt?.dispose();
      });
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  if (failed) return <BombomFlat size={size || 100} />;
  // Базовий розмір живе у класі .sf-bombom3d, а не в inline-стилі: inline
  // перебиває таблицю стилів, і тоді панель не змогла б зменшити гнома
  // своїм правилом. Inline лишається тільки для явно заданого size.
  return (
    <div ref={host} className="sf-bombom3d" style={size ? { width: size } : undefined} />
  );
}
