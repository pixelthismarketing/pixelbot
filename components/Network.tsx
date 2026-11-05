"use client";
import { useEffect, useRef } from "react";
import * as THREE from "three";

// The rotating 3D node network behind the app, in Pixel This green.
export default function Network() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    } catch {
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x040705, 1);
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x040705, 0.034);
    const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 200);
    camera.position.set(0, 0, 26);
    const group = new THREE.Group();
    scene.add(group);

    const N = window.innerWidth < 700 ? 120 : 200;
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i < N; i++) {
      const r = 9 + Math.random() * 8, th = Math.random() * Math.PI * 2, ph = Math.acos(2 * Math.random() - 1);
      pts.push(new THREE.Vector3(r * Math.sin(ph) * Math.cos(th), r * Math.sin(ph) * Math.sin(th) * 0.8, r * Math.cos(ph)));
    }
    const pos = new Float32Array(N * 3), col = new Float32Array(N * 3);
    const cG = new THREE.Color(0x61ce70), cD = new THREE.Color(0x397541), cP = new THREE.Color(0xcc3366);
    pts.forEach((p, i) => {
      pos.set([p.x, p.y, p.z], i * 3);
      const c = Math.random() < 0.1 ? cP.clone() : cG.clone().lerp(cD, Math.random() * 0.6);
      col.set([c.r, c.g, c.b], i * 3);
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));

    const sc = document.createElement("canvas");
    sc.width = sc.height = 64;
    const sx = sc.getContext("2d")!;
    const grd = sx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grd.addColorStop(0, "rgba(255,255,255,1)");
    grd.addColorStop(0.25, "rgba(255,255,255,.8)");
    grd.addColorStop(1, "rgba(255,255,255,0)");
    sx.fillStyle = grd;
    sx.fillRect(0, 0, 64, 64);
    const tex = new THREE.CanvasTexture(sc);
    group.add(new THREE.Points(g, new THREE.PointsMaterial({ size: 0.6, map: tex, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })));

    const edges: [number, number][] = [];
    for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) if (pts[i].distanceTo(pts[j]) < 4.6) edges.push([i, j]);
    const lp = new Float32Array(edges.length * 6), lc = new Float32Array(edges.length * 6);
    edges.forEach(([a, b], k) => {
      lp.set([pts[a].x, pts[a].y, pts[a].z, pts[b].x, pts[b].y, pts[b].z], k * 6);
      lc.set([col[a * 3], col[a * 3 + 1], col[a * 3 + 2], col[b * 3], col[b * 3 + 1], col[b * 3 + 2]], k * 6);
    });
    const lg = new THREE.BufferGeometry();
    lg.setAttribute("position", new THREE.BufferAttribute(lp, 3));
    lg.setAttribute("color", new THREE.BufferAttribute(lc, 3));
    group.add(new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.24, blending: THREE.AdditiveBlending, depthWrite: false })));

    const P = Math.min(70, edges.length), pp = new Float32Array(P * 3);
    const pg = new THREE.BufferGeometry();
    pg.setAttribute("position", new THREE.BufferAttribute(pp, 3));
    group.add(new THREE.Points(pg, new THREE.PointsMaterial({ size: 0.45, map: tex, color: 0xd8ffdc, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })));
    const tr = Array.from({ length: P }, () => ({ e: edges[(Math.random() * edges.length) | 0], t: Math.random(), s: 0.004 + Math.random() * 0.01 }));

    const cube = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(5, 5, 5)), new THREE.LineBasicMaterial({ color: 0x57bf4e, transparent: true, opacity: 0.55 }));
    cube.rotation.set(0.62, 0.79, 0);
    group.add(cube);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(17.5, 0.02, 8, 240), new THREE.MeshBasicMaterial({ color: 0x61ce70, transparent: true, opacity: 0.25 }));
    ring.rotation.x = Math.PI * 0.42;
    scene.add(ring);
    const ring2 = new THREE.Mesh(new THREE.TorusGeometry(20.5, 0.016, 8, 240), new THREE.MeshBasicMaterial({ color: 0x397541, transparent: true, opacity: 0.3 }));
    ring2.rotation.x = Math.PI * 0.56;
    ring2.rotation.y = 0.4;
    scene.add(ring2);

    let mx = 0, my = 0, raf = 0;
    const onMove = (e: PointerEvent) => { mx = e.clientX / window.innerWidth - 0.5; my = e.clientY / window.innerHeight - 0.5; };
    const size = () => { renderer.setSize(window.innerWidth, window.innerHeight, false); camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix(); };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("resize", size);
    size();
    const w = window as unknown as { __netBoost: number };
    w.__netBoost = 0;
    const frame = () => {
      const boost = w.__netBoost;
      w.__netBoost *= 0.96;
      group.rotation.y += 0.0012 + boost * 0.01;
      group.rotation.x += (my * 0.3 - group.rotation.x) * 0.03;
      cube.rotation.y -= 0.003 + boost * 0.02;
      camera.position.x += (mx * 3 - camera.position.x) * 0.03;
      camera.lookAt(0, 0, 0);
      ring.rotation.z += 0.0008;
      ring2.rotation.z -= 0.0006;
      tr.forEach((q, i) => {
        q.t += q.s * (1 + boost * 4);
        if (q.t > 1) { q.t = 0; q.e = edges[(Math.random() * edges.length) | 0]; }
        const a = pts[q.e[0]], b = pts[q.e[1]];
        pp[i * 3] = a.x + (b.x - a.x) * q.t;
        pp[i * 3 + 1] = a.y + (b.y - a.y) * q.t;
        pp[i * 3 + 2] = a.z + (b.z - a.z) * q.t;
      });
      pg.attributes.position.needsUpdate = true;
      renderer.render(scene, camera);
      if (!reduce) raf = requestAnimationFrame(frame);
    };
    frame();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("resize", size);
      renderer.dispose();
    };
  }, []);

  return (
    <>
      <canvas id="net" ref={ref} aria-hidden="true" />
      <div className="vignette" />
    </>
  );
}
