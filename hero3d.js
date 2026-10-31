// 3D delivery-map hero (home page only).
// Progressive: the SVG illustration stays in the HTML for search engines, phones and slow connections.
// Three.js is fetched only after the page has finished loading, on larger screens with a mouse,
// when the visitor hasn't asked for reduced motion or data saving, and when WebGL works.
(function () {
  var hero = document.querySelector(".hero");
  var media = hero && hero.querySelector(".hero-media");
  if (!media) return;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var big = window.matchMedia("(min-width: 981px) and (pointer: fine)").matches;
  var conn = navigator.connection || {};
  var slow = conn.saveData || /(^|-)2g$/.test(conn.effectiveType || "");
  var forced = /[?&]hero=3d\b/.test(location.search);
  if (/[?&]hero=2d\b/.test(location.search)) return;
  if (!forced && (!big || reduce || slow)) return;
  try {
    var c = document.createElement("canvas");
    if (!(c.getContext("webgl") || c.getContext("experimental-webgl"))) return;
  } catch (e) { return; }

  var stage3d, labelsEl, shown = false;

  function load() {
    stage3d = document.createElement("div");
    stage3d.className = "hero3d-stage";
    stage3d.setAttribute("aria-hidden", "true");
    labelsEl = document.createElement("div");
    labelsEl.className = "hero3d-labels";
    stage3d.appendChild(labelsEl);
    media.appendChild(stage3d);
    var s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js";
    s.async = true;
    s.onload = function () { try { build(window.THREE); } catch (e) { stage3d.remove(); } };
    s.onerror = function () { stage3d.remove(); };
    document.head.appendChild(s);
  }

  function build(THREE) {
    var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    stage3d.insertBefore(renderer.domElement, labelsEl);

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
    var world = new THREE.Group();
    scene.add(world);

    scene.add(new THREE.HemisphereLight(0xdfe8ff, 0x0b1a3f, 0.85));
    var sun = new THREE.DirectionalLight(0xffffff, 0.9);
    sun.position.set(-4, 10, 6);
    scene.add(sun);

    // lon/lat -> scene (x right, z down = south)
    var LON0 = -98.6, LAT0 = 31.6, K = 0.44, COSL = Math.cos(32 * Math.PI / 180);
    function px(lon) { return (lon - LON0) * K * COSL; }
    function pz(lat) { return -(lat - LAT0) * K; }

    var STATES = {
      TX: { color: 0x2b62c6, label: [-99.3, 31.0], pts: [[-106.62,32.0],[-103.06,32.0],[-103.0,36.5],[-100.0,36.5],[-100.0,34.56],[-99.2,34.21],[-98.0,34.0],[-97.1,33.73],[-96.6,33.84],[-95.6,33.94],[-94.48,33.64],[-94.04,33.55],[-94.04,31.0],[-93.7,30.4],[-93.84,29.7],[-94.7,29.4],[-95.4,28.9],[-96.6,28.3],[-97.2,27.6],[-97.4,26.1],[-98.2,26.1],[-99.1,26.5],[-99.5,27.5],[-100.3,28.3],[-100.9,29.4],[-101.4,29.8],[-102.4,29.8],[-103.1,29.0],[-103.8,29.3],[-104.5,29.7],[-104.9,30.6],[-106.0,31.4],[-106.5,31.8]] },
      OK: { color: 0x4a82dc, label: [-97.6, 35.6], pts: [[-103.0,37.0],[-94.62,37.0],[-94.43,35.4],[-94.48,33.64],[-95.6,33.94],[-96.6,33.84],[-97.1,33.73],[-98.0,34.0],[-99.2,34.21],[-100.0,34.56],[-100.0,36.5],[-103.0,36.5]] },
      NM: { color: 0x6a9be4, label: [-106.1, 34.2], pts: [[-109.05,37.0],[-103.0,37.0],[-103.06,32.0],[-106.62,32.0],[-106.53,31.78],[-108.21,31.78],[-108.21,31.33],[-109.05,31.33]] },
      AR: { color: 0x1f4a9d, label: [-92.5, 35.1], pts: [[-94.62,36.5],[-90.15,36.5],[-90.4,35.0],[-91.15,33.0],[-94.04,33.02],[-94.04,33.55],[-94.48,33.64],[-94.43,35.4]] },
      LA: { color: 0x3c74d4, label: [-92.4, 31.2], pts: [[-94.04,33.02],[-91.15,33.0],[-91.2,32.2],[-90.9,31.0],[-89.73,31.0],[-89.6,30.2],[-89.4,29.2],[-90.2,29.1],[-91.3,29.3],[-92.3,29.55],[-93.84,29.7],[-93.7,30.4],[-94.04,31.0]] }
    };
    var H = 0.28;
    var edgeMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 });
    var labels = [];
    Object.keys(STATES).forEach(function (k) {
      var st = STATES[k];
      var shape = new THREE.Shape();
      st.pts.forEach(function (p, i) {
        var x = px(p[0]), y = -pz(p[1]);
        if (i === 0) shape.moveTo(x, y); else shape.lineTo(x, y);
      });
      var geo = new THREE.ExtrudeGeometry(shape, { depth: H, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 1 });
      geo.rotateX(-Math.PI / 2);
      var mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: st.color, roughness: 0.62, metalness: 0.08 }));
      world.add(mesh);
      var edges = new THREE.LineSegments(new THREE.EdgesGeometry(geo, 30), edgeMat);
      world.add(edges);
      labels.push({ pos: new THREE.Vector3(px(st.label[0]), H + 0.05, pz(st.label[1])), text: k, cls: "state" });
    });

    var Y = H + 0.04;
    var dallas = new THREE.Vector3(px(-96.8), Y, pz(32.78));
    var CITIES = [
      ["Houston", -95.37, 29.76, "b", "samosa"], ["Austin", -97.74, 30.27, "l", "chai"], ["Oklahoma City", -97.52, 35.47, "l", "ladoo"], ["Tulsa", -95.99, 36.15, "r", "momo"],
      ["Albuquerque", -106.65, 35.08, "", "spices"], ["Little Rock", -92.29, 34.75, "r", "paneer"], ["New Orleans", -90.07, 29.95, "b", "jalebi"]
    ];

    var gold = new THREE.MeshStandardMaterial({ color: 0xf0c85d, emissive: 0xc69a2a, emissiveIntensity: 0.55, roughness: 0.35 });
    var pinMat = new THREE.MeshStandardMaterial({ color: 0xdcf58a, emissive: 0x93c31f, emissiveIntensity: 0.5, roughness: 0.4 });

    function std(color, opts) {
      var o = { color: color, roughness: 0.55, flatShading: true };
      for (var k in opts) o[k] = opts[k];
      return new THREE.MeshStandardMaterial(o);
    }
    var steam = [];
    function addSteam(parent, y, spread, count, size) {
      for (var n = 0; n < count; n++) {
        var puff = new THREE.Mesh(new THREE.SphereGeometry(size, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false }));
        puff.userData = { y0: y, x0: (Math.random() - 0.5) * spread, z0: (Math.random() - 0.5) * spread, phase: n / count, rise: 0.5 + Math.random() * 0.25 };
        parent.add(puff);
        steam.push(puff);
      }
    }

    // Dallas warehouse: a brass handi of curry on a rangoli
    var hq = new THREE.Group();
    hq.position.copy(dallas);
    hq.scale.setScalar(1.45);
    world.add(hq);
    var prof = [[0, 0], [0.13, 0.01], [0.21, 0.07], [0.25, 0.17], [0.23, 0.26], [0.17, 0.32], [0.15, 0.35], [0.19, 0.38], [0.19, 0.4], [0.16, 0.4]].map(function (p) { return new THREE.Vector2(p[0], p[1]); });
    var pot = new THREE.Mesh(new THREE.LatheGeometry(prof, 32), new THREE.MeshStandardMaterial({ color: 0xeab54d, metalness: 0.4, roughness: 0.32, emissive: 0x5a3a00, emissiveIntensity: 0.25, side: THREE.DoubleSide }));
    hq.add(pot);
    var curry = new THREE.Mesh(new THREE.CircleGeometry(0.155, 32), new THREE.MeshStandardMaterial({ color: 0xe0761b, roughness: 0.6, emissive: 0x7a2d00, emissiveIntensity: 0.25 }));
    curry.rotation.x = -Math.PI / 2;
    curry.position.y = 0.375;
    hq.add(curry);
    var band = new THREE.Mesh(new THREE.TorusGeometry(0.245, 0.012, 8, 40), new THREE.MeshStandardMaterial({ color: 0xa8741c, metalness: 0.8, roughness: 0.3 }));
    band.rotation.x = Math.PI / 2;
    band.position.y = 0.17;
    hq.add(band);
    addSteam(hq, 0.42, 0.18, 7, 0.05);
    // rangoli petals around the pot
    var rangoliCols = [0xe91e63, 0xffc107, 0xff7043, 0x43a047, 0x7e57c2, 0xffffff];
    for (var rp = 0; rp < 18; rp++) {
      var ang = rp / 18 * Math.PI * 2;
      var petal = new THREE.Mesh(new THREE.CircleGeometry(0.055, 3), new THREE.MeshBasicMaterial({ color: rangoliCols[rp % rangoliCols.length], side: THREE.DoubleSide }));
      petal.rotation.x = -Math.PI / 2;
      petal.rotation.z = -ang;
      petal.position.set(Math.cos(ang) * 0.36, 0.012, Math.sin(ang) * 0.36);
      hq.add(petal);
    }
    var rings = [];
    for (var r = 0; r < 2; r++) {
      var ring = new THREE.Mesh(new THREE.RingGeometry(0.6, 0.63, 64), new THREE.MeshBasicMaterial({ color: 0xffb02e, transparent: true, opacity: 0.6, side: THREE.DoubleSide }));
      ring.rotation.x = -Math.PI / 2;
      ring.position.copy(dallas);
      ring.userData.offset = r * 0.5;
      world.add(ring);
      rings.push(ring);
    }

    // signature foods, one per city
    function makeFood(kind) {
      var g = new THREE.Group();
      var plate = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.115, 0.025, 28), new THREE.MeshStandardMaterial({ color: 0xc9a24a, metalness: 0.7, roughness: 0.3 }));
      plate.position.y = 0.012;
      g.add(plate);
      var top = new THREE.Group();
      top.position.y = 0.03;
      g.add(top);
      var m;
      if (kind === "samosa") {
        [[-0.06, 0, 0.3], [0.06, 0.02, -0.4], [0, -0.06, 1.2]].forEach(function (q) {
          m = new THREE.Mesh(new THREE.ConeGeometry(0.075, 0.11, 3), std(0xd99a3e));
          m.rotation.z = Math.PI / 2; m.rotation.y = q[2];
          m.position.set(q[0], 0.04, q[1]);
          top.add(m);
        });
      } else if (kind === "chai") {
        var cup = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.055, 0.13, 18), std(0xb4532a, { flatShading: false, roughness: 0.85 }));
        cup.position.y = 0.065; top.add(cup);
        var tea = new THREE.Mesh(new THREE.CircleGeometry(0.066, 18), new THREE.MeshStandardMaterial({ color: 0xc98a52 }));
        tea.rotation.x = -Math.PI / 2; tea.position.y = 0.128; top.add(tea);
        addSteam(top, 0.15, 0.06, 5, 0.03);
      } else if (kind === "ladoo") {
        [[-0.055, 0.045, 0], [0.055, 0.045, 0], [0, 0.045, 0.06], [0, 0.045, -0.06], [0, 0.11, 0]].forEach(function (q) {
          m = new THREE.Mesh(new THREE.IcosahedronGeometry(0.048, 1), std(0xf29b2b));
          m.position.set(q[0], q[1], q[2]); top.add(m);
        });
      } else if (kind === "momo") {
        [[-0.06, 0], [0.06, 0.01], [0, -0.06], [0.01, 0.065]].forEach(function (q) {
          m = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), std(0xf7f1e3));
          m.scale.set(1, 0.75, 1); m.position.set(q[0], 0.035, q[1]); top.add(m);
          var knot = new THREE.Mesh(new THREE.ConeGeometry(0.018, 0.03, 6), std(0xf7f1e3));
          knot.position.set(q[0], 0.075, q[1]); top.add(knot);
        });
      } else if (kind === "spices") {
        [[0xc62828, -0.07, 0], [0xf2b705, 0.07, 0], [0x6d8f1f, 0, -0.07], [0x8d5524, 0, 0.07]].forEach(function (q) {
          m = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.07, 10), std(q[0]));
          m.position.set(q[1], 0.035, q[2]); top.add(m);
        });
      } else if (kind === "paneer") {
        [[-0.05, 0.03, -0.03], [0.05, 0.03, 0.02], [0, 0.03, 0.06], [0.0, 0.09, 0.0]].forEach(function (q) {
          m = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.06, 0.065), std(0xfff3d6));
          m.position.set(q[0], q[1], q[2]); m.rotation.y = q[0] * 6; top.add(m);
        });
      } else if (kind === "jalebi") {
        [[0.07, 0.05], [0.045, 0.085], [0.02, 0.115]].forEach(function (q, n) {
          m = new THREE.Mesh(new THREE.TorusGeometry(q[0], 0.016, 8, 24), std(0xf59e0b, { emissive: 0xb45309, emissiveIntensity: 0.2 }));
          m.rotation.x = Math.PI / 2; m.position.y = 0.03 + n * 0.012; top.add(m);
        });
      } else if (kind === "naan") {
        [0, 1].forEach(function (n) {
          m = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.015, 20), std(0xe3b26b));
          m.scale.set(1, 1, 0.7); m.position.y = 0.02 + n * 0.02; m.rotation.y = n * 0.8; top.add(m);
        });
        m = new THREE.Mesh(new THREE.SphereGeometry(0.02, 8, 6), std(0x8d5a2b)); m.position.set(0.03, 0.06, 0.01); top.add(m);
      }
      g.userData.top = top;
      g.scale.setScalar(1.9);
      return g;
    }
    var foods = [];
    var FOODNAMES = { samosa: "Samosas", chai: "Chai", ladoo: "Ladoos", momo: "Momos", spices: "Masalas", paneer: "Paneer", jalebi: "Jalebi", naan: "Naan" };

    // drifting spice specks and marigold petals
    var SPECKS = 150;
    var spGeo = new THREE.BufferGeometry();
    var spPos = new Float32Array(SPECKS * 3), spCol = new Float32Array(SPECKS * 3), spSeed = [];
    var palette = [[0.95, 0.72, 0.02], [0.78, 0.16, 0.16], [0.43, 0.56, 0.12], [1.0, 0.55, 0.1], [1.0, 0.65, 0.0]];
    for (var sp = 0; sp < SPECKS; sp++) {
      var cc = palette[sp % palette.length];
      spCol.set(cc, sp * 3);
      spSeed.push({ x: dallas.x + (Math.random() - 0.45) * 7, z: dallas.z + (Math.random() - 0.3) * 4, y: Math.random() * 1.4, v: 0.08 + Math.random() * 0.12, w: Math.random() * 6.28 });
    }
    spGeo.setAttribute("position", new THREE.BufferAttribute(spPos, 3));
    spGeo.setAttribute("color", new THREE.BufferAttribute(spCol, 3));
    var specks = new THREE.Points(spGeo, new THREE.PointsMaterial({ size: 0.07, vertexColors: true, transparent: true, opacity: 0.9, depthWrite: false }));
    world.add(specks);

    labels.push({ pos: dallas.clone().add(new THREE.Vector3(0.5, 0.42, 0)), text: "Dallas warehouse", cls: "hq" });

    // trucks
    function makeTruck() {
      var g = new THREE.Group();
      var box = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.13, 0.13), new THREE.MeshStandardMaterial({ color: 0xf6f8ff, roughness: 0.5 }));
      box.position.set(-0.03, 0.08, 0);
      var cab = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.11, 0.12), new THREE.MeshStandardMaterial({ color: 0x154297, roughness: 0.4 }));
      cab.position.set(0.15, 0.07, 0);
      var stripe = new THREE.Mesh(new THREE.BoxGeometry(0.262, 0.025, 0.132), new THREE.MeshStandardMaterial({ color: 0xf0c85d, emissive: 0xc69a2a, emissiveIntensity: 0.4 }));
      stripe.position.set(-0.03, 0.05, 0);
      g.add(box, cab, stripe);
      return g;
    }

    var routes = [];
    CITIES.forEach(function (c, i) {
      var end = new THREE.Vector3(px(c[1]), Y, pz(c[2]));
      var dir = end.clone().sub(dallas);
      var len = dir.length();
      var perp = new THREE.Vector3(-dir.z, 0, dir.x).normalize().multiplyScalar(len * 0.12 * (i % 2 ? 1 : -1));
      var mid = dallas.clone().add(end).multiplyScalar(0.5).add(perp);
      var curve = new THREE.CatmullRomCurve3([dallas.clone(), mid, end]);
      var tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 64, 0.022, 8, false), new THREE.MeshBasicMaterial({ color: 0xffa62b, transparent: true, opacity: 0.9 }));
      var glow = new THREE.Mesh(new THREE.TubeGeometry(curve, 64, 0.06, 8, false), new THREE.MeshBasicMaterial({ color: 0xffa62b, transparent: true, opacity: 0.16 }));
      world.add(tube, glow);
      var food = makeFood(c[4]);
      food.position.copy(end);
      food.userData.phase = i * 0.7;
      world.add(food);
      foods.push(food);
      var pulse = new THREE.Mesh(new THREE.RingGeometry(0.2, 0.23, 40), new THREE.MeshBasicMaterial({ color: 0xffc35a, transparent: true, opacity: 0, side: THREE.DoubleSide }));
      pulse.rotation.x = -Math.PI / 2;
      pulse.position.copy(end).add(new THREE.Vector3(0, 0.01, 0));
      world.add(pulse);
      var truck = makeTruck();
      world.add(truck);
      routes.push({ curve: curve, truck: truck, pulse: pulse, speed: 0.07 + (i % 3) * 0.015, offset: i / CITIES.length, len: len });
      labels.push({ pos: end.clone().add(new THREE.Vector3(0, c[3] === "b" ? 0.02 : 0.32, 0)), text: c[0], food: FOODNAMES[c[4]], cls: c[3] ? "side-" + c[3] : "" });
    });

    // HTML labels
    labels.forEach(function (l) {
      var el = document.createElement("span");
      el.className = "tag " + l.cls;
      el.textContent = l.text;
      if (l.food) { var sm = document.createElement("small"); sm.textContent = l.food; el.appendChild(sm); }
      labelsEl.appendChild(el);
      l.el = el;
    });

    // camera framing
    var target = new THREE.Vector3(px(-99.3), 0, pz(33.3));
    var baseCam = new THREE.Vector3(target.x, 8.9, target.z + 11.3);
    camera.position.copy(baseCam);
    camera.lookAt(target);

    var pointer = { x: 0, y: 0 }, eased = { x: 0, y: 0 };
    hero.addEventListener("pointermove", function (e) {
      var r = stage3d.getBoundingClientRect();
      pointer.x = (e.clientX - r.left) / r.width - 0.5;
      pointer.y = (e.clientY - r.top) / r.height - 0.5;
    });
    hero.addEventListener("pointerleave", function () { pointer.x = 0; pointer.y = 0; });

    function resize() {
      var w = stage3d.clientWidth, h = stage3d.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.fov = Math.min(62, 2 * Math.atan(Math.tan(17.5 * Math.PI / 180) / (w / h)) * 180 / Math.PI); // keeps the whole map in frame at any width
      camera.updateProjectionMatrix();
    }
    new ResizeObserver(resize).observe(stage3d);
    resize();

    var v = new THREE.Vector3();
    function placeLabels() {
      var w = stage3d.clientWidth, h = stage3d.clientHeight;
      labels.forEach(function (l) {
        v.copy(l.pos);
        world.localToWorld(v);
        v.project(camera);
        l.el.style.left = ((v.x + 1) / 2 * w).toFixed(1) + "px";
        l.el.style.top = ((1 - v.y) / 2 * h).toFixed(1) + "px";
      });
    }

    var clock = new THREE.Clock();
    var running = true, visible = true, manualPause = false;
    var frames = 0, fpsT = performance.now();
    function frame() {
      if (!running) return;
      var t = clock.getElapsedTime();
      eased.x += (pointer.x - eased.x) * 0.06;
      eased.y += (pointer.y - eased.y) * 0.06;
      world.rotation.y = Math.sin(t * 0.18) * 0.05 + eased.x * 0.22;
      world.rotation.x = eased.y * 0.08;

      foods.forEach(function (f) {
        f.userData.top.position.y = 0.03 + Math.sin(t * 1.6 + f.userData.phase) * 0.02;
        f.userData.top.rotation.y = t * 0.35 + f.userData.phase;
      });
      steam.forEach(function (pf) {
        var u = pf.userData, k2 = (t * 0.45 + u.phase) % 1;
        pf.position.set(u.x0 + Math.sin((t + u.phase * 6) * 1.3) * 0.03, u.y0 + k2 * u.rise, u.z0);
        pf.scale.setScalar(0.6 + k2 * 1.4);
        pf.material.opacity = 0.45 * Math.sin(k2 * Math.PI);
      });
      for (var q = 0; q < SPECKS; q++) {
        var sd = spSeed[q];
        var yy = (sd.y + t * sd.v) % 1.4;
        spPos[q * 3] = sd.x + Math.sin(t * 0.5 + sd.w) * 0.25;
        spPos[q * 3 + 1] = 0.35 + yy;
        spPos[q * 3 + 2] = sd.z + Math.cos(t * 0.4 + sd.w) * 0.2;
      }
      spGeo.attributes.position.needsUpdate = true;
      rings.forEach(function (ring) {
        var p = ((t * 0.6) + ring.userData.offset) % 1;
        ring.scale.setScalar(1 + p * 1.6);
        ring.material.opacity = 0.6 * (1 - p);
      });
      routes.forEach(function (rt) {
        var p = (t * rt.speed * (3.2 / Math.max(rt.len, 1)) + rt.offset) % 1;
        var pos = rt.curve.getPointAt(p);
        var tan = rt.curve.getTangentAt(p);
        rt.truck.position.copy(pos);
        rt.truck.rotation.y = Math.atan2(-tan.z, tan.x);
        var arrive = p > 0.9 ? (p - 0.9) / 0.1 : 0;
        rt.pulse.scale.setScalar(1 + arrive * 3);
        rt.pulse.material.opacity = arrive ? 0.8 * (1 - arrive) : 0;
        rt.truck.visible = p < 0.985;
      });

      renderer.render(scene, camera);
      placeLabels();
      if (!shown) { shown = true; media.classList.add("is-3d"); }
      frames++;
      var now = performance.now();
      if (!reduce) requestAnimationFrame(frame);
    }
    function setRunning() {
      var should = visible && !manualPause && !document.hidden;
      if (should && !running) { running = true; clock.getDelta(); requestAnimationFrame(frame); }
      if (!should) running = false;
    }
    new IntersectionObserver(function (e) { visible = e[0].isIntersecting; setRunning(); }).observe(stage3d);
    document.addEventListener("visibilitychange", setRunning);
    frame();

    return { pause: function (p) { manualPause = p; setRunning(); } };
  }

  function later() {
    if ("requestIdleCallback" in window) requestIdleCallback(load, { timeout: 2500 }); else setTimeout(load, 600);
  }
  if (document.readyState === "complete") later(); else window.addEventListener("load", later);
})();
