// MultitaskCoder
// Module: 3D Loading Screen

/**
 * Creates and mounts the 3D Mind-Blowing Loading Screen.
 */
export function createLoader() {
  const loaderEl = document.createElement("div");
  loaderEl.id = "loaderScreen";
  loaderEl.className = "fixed inset-0 z-[100] bg-[#07080c] flex flex-col items-center justify-center transition-opacity duration-700";
  loaderEl.innerHTML = `
    <div id="canvas-container" class="absolute inset-0 z-0"></div>
    <div class="relative z-10 text-center space-y-6 pointer-events-none p-6">
      <div class="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white text-3xl shadow-2xl glow-purple animate-bounce">
        <i class="fa-solid fa-code"></i>
      </div>
      <div class="space-y-2">
        <h1 class="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">MultitaskCoder</h1>
        <p id="loaderStatusText" class="text-xs text-purple-300 font-mono tracking-widest uppercase">Initializing 3D Matrix...</p>
      </div>
      <!-- Progress Bar -->
      <div class="w-48 sm:w-64 h-2 bg-white/10 rounded-full mx-auto overflow-hidden p-0.5 border border-white/10">
        <div id="loaderProgressBar" class="h-full bg-gradient-to-r from-purple-500 via-indigo-500 to-cyan-400 rounded-full transition-all duration-300" style="width: 0%"></div>
      </div>
    </div>
  `;
  return loaderEl;
}

/**
 * Starts the Three.js 3D simulation and progress simulation.
 */
export function startLoaderSimulation(onComplete) {
  const container = document.getElementById("canvas-container");
  const progressBar = document.getElementById("loaderProgressBar");
  const statusText = document.getElementById("loaderStatusText");
  const loader = document.getElementById("loaderScreen");

  if (!loader) {
    if (typeof onComplete === "function") onComplete();
    return;
  }

  let animationFrameId;
  let renderer;

  // Initialize Three.js if available
  if (typeof THREE !== "undefined" && container) {
    try {
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
      camera.position.z = 7;

      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      container.appendChild(renderer.domElement);

      // Glowing 3D torus knot
      const geometry = new THREE.TorusKnotGeometry(1.5, 0.4, 128, 32);
      const material = new THREE.MeshStandardMaterial({
        color: 0x8b5cf6,
        roughness: 0.2,
        metalness: 0.8,
        emissive: 0x4c1d95,
        wireframe: false
      });
      const torusKnot = new THREE.Mesh(geometry, material);
      scene.add(torusKnot);

      // Floating particle field
      const particlesGeometry = new THREE.BufferGeometry();
      const particlesCount = 300;
      const posArray = new Float32Array(particlesCount * 3);
      for (let i = 0; i < particlesCount * 3; i++) {
        posArray[i] = (Math.random() - 0.5) * 12;
      }
      particlesGeometry.setAttribute("position", new THREE.BufferAttribute(posArray, 3));
      const particlesMaterial = new THREE.PointsMaterial({
        size: 0.04,
        color: 0x06b6d4,
        transparent: true,
        opacity: 0.8
      });
      const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
      scene.add(particlesMesh);

      // Lights
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
      scene.add(ambientLight);
      const pointLight = new THREE.PointLight(0x7c3aed, 3, 50);
      pointLight.position.set(5, 5, 5);
      scene.add(pointLight);

      // Animation loop
      function animate() {
        animationFrameId = requestAnimationFrame(animate);
        torusKnot.rotation.x += 0.01;
        torusKnot.rotation.y += 0.015;
        particlesMesh.rotation.y -= 0.005;
        renderer.render(scene, camera);
      }
      animate();

      const handleResize = () => {
        if (!renderer) return;
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      };
      window.addEventListener("resize", handleResize);
    } catch (err) {
      console.warn("[Loader] Three.js canvas error:", err);
    }
  }

  // Simulate loading progress
  let progress = 0;
  const statuses = [
    "Initializing 3D Matrix...",
    "Loading Curriculum Modules...",
    "Syncing User Profiles...",
    "Preparing Coding Arena...",
    "Ready!"
  ];

  const interval = setInterval(() => {
    progress += Math.floor(Math.random() * 20) + 15;
    if (progress >= 100) {
      progress = 100;
      clearInterval(interval);
      if (statusText) statusText.innerText = "Ready!";
      if (progressBar) progressBar.style.width = "100%";

      setTimeout(() => {
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        if (renderer && renderer.domElement) {
          renderer.dispose();
        }
        loader.style.opacity = "0";
        setTimeout(() => {
          loader.remove();
          if (typeof onComplete === "function") onComplete();
        }, 700);
      }, 350);
    } else {
      if (progressBar) progressBar.style.width = `${progress}%`;
      const statusIdx = Math.min(Math.floor((progress / 100) * statuses.length), statuses.length - 1);
      if (statusText) statusText.innerText = statuses[statusIdx];
    }
  }, 140);
}
