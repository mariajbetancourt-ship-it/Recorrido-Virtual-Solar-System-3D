import * as THREE from 'three';
import * as dat from 'dat.gui';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OutlinePass } from 'three/addons/postprocessing/OutlinePass.js';

import bgTexture1 from '/images/1.jpg';
import bgTexture2 from '/images/2.jpg';
import bgTexture3 from '/images/3.jpg';
import bgTexture4 from '/images/4.jpg';
import sunTexture from '/images/sun.jpg';
import mercuryTexture from '/images/mercurymap.jpg';
import mercuryBump from '/images/mercurybump.jpg';
import venusTexture from '/images/venusmap.jpg';
import venusBump from '/images/venusmap.jpg';
import venusAtmosphere from '/images/venus_atmosphere.jpg';
import earthTexture from '/images/earth_daymap.jpg';
import earthNightTexture from '/images/earth_nightmap.jpg';
import earthAtmosphere from '/images/earth_atmosphere.jpg';
import earthMoonTexture from '/images/moonmap.jpg';
import earthMoonBump from '/images/moonbump.jpg';
import marsTexture from '/images/marsmap.jpg';
import marsBump from '/images/marsbump.jpg';
import jupiterTexture from '/images/jupiter.jpg';
import ioTexture from '/images/jupiterIo.jpg';
import europaTexture from '/images/jupiterEuropa.jpg';
import ganymedeTexture from '/images/jupiterGanymede.jpg';
import callistoTexture from '/images/jupiterCallisto.jpg';
import saturnTexture from '/images/saturnmap.jpg';
import satRingTexture from '/images/saturn_ring.png';
import uranusTexture from '/images/uranus.jpg';
import uraRingTexture from '/images/uranus_ring.png';
import neptuneTexture from '/images/neptune.jpg';
import plutoTexture from '/images/plutomap.jpg';

// ******  SETUP  ******
console.log("Create the scene");
const scene = new THREE.Scene();

console.log("Create a perspective projection camera");
var camera = new THREE.PerspectiveCamera( 45, window.innerWidth/window.innerHeight, 0.1, 1000 );
camera.position.set(-240, 150, 8);

console.log("Create the renderer");
const renderer = new THREE.WebGL1Renderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
renderer.toneMapping = THREE.ACESFilmicToneMapping;

console.log("Create an orbit control");
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.75;
controls.screenSpacePanning = false;

console.log("Set up texture loader");
const cubeTextureLoader = new THREE.CubeTextureLoader();
const loadTexture = new THREE.TextureLoader();

// ******  POSTPROCESSING setup ******
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));

// ******  OUTLINE PASS  ******
const outlinePass = new OutlinePass(new THREE.Vector2(window.innerWidth, window.innerHeight), scene, camera);
outlinePass.edgeStrength = 3;
outlinePass.edgeGlow = 1;
outlinePass.visibleEdgeColor.set(0xffffff);
outlinePass.hiddenEdgeColor.set(0x190a05);
composer.addPass(outlinePass);

// ******  BLOOM PASS  ******
const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1, 0.4, 0.85);
bloomPass.threshold = 1;
bloomPass.radius = 0.9;
composer.addPass(bloomPass);

// ****** AMBIENT LIGHT ******
console.log("Add the ambient light");
var lightAmbient = new THREE.AmbientLight(0x222222, 6); 
scene.add(lightAmbient);

// ******  Star background  ******
scene.background = cubeTextureLoader.load([

  bgTexture3,
  bgTexture1,
  bgTexture2,
  bgTexture2,
  bgTexture4,
  bgTexture2
]);

// ******  CONTROLS  ******
const gui = new dat.GUI({ autoPlace: false });
const customContainer = document.getElementById('gui-container');
customContainer.appendChild(gui.domElement);

// ****** SETTINGS FOR INTERACTIVE CONTROLS  ******
const settings = {
  accelerationOrbit: 1,
  acceleration: 1,
  sunIntensity: 1.9
};

gui.add(settings, 'accelerationOrbit', 0, 10).onChange(value => {
});
gui.add(settings, 'acceleration', 0, 10).onChange(value => {
});
gui.add(settings, 'sunIntensity', 1, 10).onChange(value => {
  sunMat.emissiveIntensity = value;
});

// mouse movement
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function onMouseMove(event) {
  event.preventDefault();
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;

  const tooltip = document.getElementById('planet-tooltip');
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(scene.children, true);

  let found = null;
  for (let i = 0; i < intersects.length; i++) {
    const planetObj = identifyPlanet(intersects[i].object);
if (planetObj) {
  const nombresES = {
    'Mercury': 'Mercurio', 'Venus': 'Venus', 'Earth': 'Tierra', 'Mars': 'Marte',
    'Jupiter': 'Júpiter', 'Saturn': 'Saturno', 'Uranus': 'Urano', 'Neptune': 'Neptuno', 'Pluto': 'Plutón'
  };
  found = nombresES[planetObj.name] || planetObj.name;
  break;
}
  }

  if (found) {
    tooltip.innerText = found;
    tooltip.style.display = 'block';
    tooltip.style.left = (event.clientX + 15) + 'px';
    tooltip.style.top = (event.clientY + 15) + 'px';
    document.body.style.cursor = 'pointer';
  } else {
    tooltip.style.display = 'none';
    document.body.style.cursor = 'default';
  }
}

// ******  SELECT PLANET  ******
let selectedPlanet = null;
let isMovingTowardsPlanet = false;
let targetCameraPosition = new THREE.Vector3();
let offset;

function onDocumentMouseDown(event) {
  event.preventDefault();

  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  var intersects = raycaster.intersectObjects(raycastTargets);

  if (intersects.length > 0) {
    const clickedObject = intersects[0].object;
    selectedPlanet = identifyPlanet(clickedObject);
    if (selectedPlanet) {
      closeInfoNoZoomOut();
      
      settings.accelerationOrbit = 0; // Stop orbital movement

      // Update camera to look at the selected planet
      const planetPosition = new THREE.Vector3();
      selectedPlanet.planet.getWorldPosition(planetPosition);
      controls.target.copy(planetPosition);
      camera.lookAt(planetPosition); // Orient the camera towards the planet

      targetCameraPosition.copy(planetPosition).add(camera.position.clone().sub(planetPosition).normalize().multiplyScalar(offset));
      isMovingTowardsPlanet = true;
    }
  }
}

function identifyPlanet(clickedObject) {
  // Logic to identify which planet was clicked based on the clicked object, different offset for camera distance
        if (clickedObject.material === mercury.planet.material) {
          offset = 10;
          return mercury;
        } else if (clickedObject.material === venus.Atmosphere.material) {
          offset = 25;
          return venus;
        } else if (clickedObject.material === earth.Atmosphere.material) {
          offset = 25;
          return earth;
        } else if (clickedObject.material === mars.planet.material) {
          offset = 15;
          return mars;
        } else if (clickedObject.material === jupiter.planet.material) {
          offset = 50;
          return jupiter;
        } else if (clickedObject.material === saturn.planet.material) {
          offset = 50;
          return saturn;
        } else if (clickedObject.material === uranus.planet.material) {
          offset = 25;
          return uranus;
        } else if (clickedObject.material === neptune.planet.material) {
          offset = 20;
          return neptune;
        } else if (clickedObject.material === pluto.planet.material) {
          offset = 10;
          return pluto;
        } 

  return null;
}
const mitologicoAudios = {
  'Mars': 'https://res.cloudinary.com/dm2wz7juo/video/upload/v1781393933/The_Planets_-_Nr.1_-_Mars_the_Bringer_of_War_-_Gustav_Holst_-_Berlin_Philharmonic_Orchestra_zvqq2t.mp3',
  'Venus': 'https://res.cloudinary.com/dm2wz7juo/video/upload/v1781398588/The_Planets_-_Nr.2_-_Venus_the_Bringer_of_Peace_-_Gustav_Holst_-_Berlin_Philharmonic_Orchestra_zpw9qi.mp3',
  'Mercury': 'https://res.cloudinary.com/dm2wz7juo/video/upload/v1781400238/The_Planets_-_Nr.3_-_Mercury_the_Winged_Messenger_-_Gustav_Holst_-_Berlin_Philharmonic_Orchestra_jwhsfk.mp3',
  'Jupiter': 'https://res.cloudinary.com/dm2wz7juo/video/upload/v1781400389/The_Planets_-_Nr.4_-_Jupiter_the_Bringer_of_Jollity_-_Gustav_Holst_-_Berlin_Philharmonic_Orchestra_kdditk.mp3',
  'Saturn': 'https://res.cloudinary.com/dm2wz7juo/video/upload/v1781400480/The_Planets_-_Nr.5_-_Saturn_the_Bringer_of_Old_Age_-_Gustav_Holst_-_Berlin_Philharmonic_Orchestra_tvzosf.mp3',
  'Uranus': 'https://res.cloudinary.com/dm2wz7juo/video/upload/v1781400469/The_Planets_-_Nr.6_-_Uranus_the_Magician_-_Gustav_Holst_-_Berlin_Philharmonic_Orchestra_hnijtf.mp3',
  'Neptune': 'https://res.cloudinary.com/dm2wz7juo/video/upload/v1781400475/The_Planets_-_Nr.7_-_Neptune_the_Mystic_-_Gustav_Holst_-_Berlin_Philharmonic_Orchestra_hyg3cf.mp3'
};

let currentAudio = null;
let currentTimeouts = [];
// ******  SHOW PLANET INFO AFTER SELECTION  ******
function showPlanetInfo(planet) {
  if (window.rutaActual === 'mitologico') {
    const info = document.getElementById('planetInfo');
    const titleEN = document.getElementById('planetTitleEN');
    const titleES = document.getElementById('planetTitleES');
    const fixedText = document.getElementById('planetFixedText');
    const extraTexts = document.getElementById('planetExtraTexts');
    const planetTitle = document.getElementById('planetTitle');
    const planetContent = document.getElementById('planetContent');

    const titulo = holstTitles[planet] || { en: planet, es: '' };
    titleEN.innerText = titulo.en;
    titleES.innerText = titulo.es;

    const textos = mitologicoTextos[planet] || { fijo: '', extra: [] };
    fixedText.innerText = textos.fijo;
    extraTexts.innerHTML = '';

    // Detener audio anterior y limpiar timeouts
    if (currentAudio) {
      currentAudio.pause();
      currentAudio = null;
    }
    currentTimeouts.forEach(t => clearTimeout(t));
    currentTimeouts = [];

    // Reset visual
    planetTitle.style.top = '50%';
    planetTitle.style.fontSize = '2.8rem';
    planetContent.style.opacity = '0';
    info.style.display = 'block';
    info.style.pointerEvents = 'auto';

    setTimeout(() => {
      planetTitle.style.top = '15%';
      planetTitle.style.fontSize = '1.8rem';
      setTimeout(() => {
        planetContent.style.opacity = '1';
      }, 1000);
    }, 2000);

    // Reproducir audio si existe
    if (mitologicoAudios[planet]) {
      currentAudio = new Audio(mitologicoAudios[planet]);
      currentAudio.play();

      // Programar tarjetas extra
      textos.extra.forEach(({ tiempo, texto }) => {
        const t = setTimeout(() => {
          const div = document.createElement('div');
          div.innerText = texto;
          div.style.cssText = `
            margin-top: 25px;
            padding-top: 25px;
            border-top: 1px solid rgba(255,255,255,0.2);
            animation: fadeInOut 30s ease forwards;
            pointer-events: none;
          `;
          extraTexts.appendChild(div);
          setTimeout(() => div.remove(), 30000);
        }, tiempo);
        currentTimeouts.push(t);
      });
    }

  } else if (window.rutaActual === 'cientifico') {
    const info = document.getElementById('planetInfo');
    const titleEN = document.getElementById('planetTitleEN');
    const titleES = document.getElementById('planetTitleES');
    const fixedText = document.getElementById('planetFixedText');
    const extraTexts = document.getElementById('planetExtraTexts');
    const planetTitle = document.getElementById('planetTitle');
    const planetContent = document.getElementById('planetContent');

    const titulo = cienciaTitles[planet] || { en: planet, es: '' };
    titleEN.innerText = titulo.en;
    titleES.innerText = titulo.es;

    const textos = cienciaTextos[planet] || { fijo: '', extra: [] };
    fixedText.innerText = textos.fijo;
    extraTexts.innerHTML = '';

    if (currentAudio) {
      currentAudio.pause();
      currentAudio = null;
    }
    currentTimeouts.forEach(t => clearTimeout(t));
    currentTimeouts = [];

    planetTitle.style.top = '50%';
    planetTitle.style.fontSize = '2.8rem';
    planetContent.style.opacity = '0';
    info.style.display = 'block';
    info.style.pointerEvents = 'auto';

    setTimeout(() => {
      planetTitle.style.top = '15%';
      planetTitle.style.fontSize = '1.8rem';
      setTimeout(() => {
        planetContent.style.opacity = '1';
      }, 1000);
    }, 2000);

    if (cienciaAudios[planet]) {
      currentAudio = new Audio(cienciaAudios[planet]);
      currentAudio.play();
    }

  } else if (window.rutaActual === 'emocional') {
    const info = document.getElementById('planetInfo');
    const titleEN = document.getElementById('planetTitleEN');
    const titleES = document.getElementById('planetTitleES');
    const fixedText = document.getElementById('planetFixedText');
    const extraTexts = document.getElementById('planetExtraTexts');
    const planetTitle = document.getElementById('planetTitle');
    const planetContent = document.getElementById('planetContent');

    const titulo = emocionalTitles[planet] || { en: planet, es: '' };
    titleEN.innerText = titulo.en;
    titleES.innerText = titulo.es;

    const textos = emocionalTextos[planet] || { fijo: '', extra: [] };
    fixedText.innerText = textos.fijo;
    extraTexts.innerHTML = '';

    if (currentAudio) {
      currentAudio.pause();
      currentAudio = null;
    }
    currentTimeouts.forEach(t => clearTimeout(t));
    currentTimeouts = [];

    planetTitle.style.top = '50%';
    planetTitle.style.fontSize = '2.8rem';
    planetContent.style.opacity = '0';
    info.style.display = 'block';
    info.style.pointerEvents = 'auto';

    setTimeout(() => {
      planetTitle.style.top = '15%';
      planetTitle.style.fontSize = '1.8rem';
      setTimeout(() => {
        planetContent.style.opacity = '1';
      }, 1000);
    }, 2000);

    if (emocionalAudios[planet]) {
      currentAudio = new Audio(emocionalAudios[planet]);
      currentAudio.play();

      textos.extra.forEach(({ tiempo, texto }) => {
        const t = setTimeout(() => {
          const div = document.createElement('div');
          div.innerText = texto;
          div.style.cssText = `
            margin-top: 25px;
            padding-top: 25px;
            border-top: 1px solid rgba(255,255,255,0.2);
            animation: fadeInOut 30s ease forwards;
            pointer-events: none;
          `;
          extraTexts.appendChild(div);
          setTimeout(() => div.remove(), 30000);
        }, tiempo);
        currentTimeouts.push(t);
      });
    }

  } else {
    var info = document.getElementById('planetInfo');
    var name = document.getElementById('planetName');
    var details = document.getElementById('planetDetails');
    if (name && details) {
      name.innerText = planet;
      details.innerText = `Radius: ${planetData[planet].radius}\nTilt: ${planetData[planet].tilt}\nRotation: ${planetData[planet].rotation}\nOrbit: ${planetData[planet].orbit}\nDistance: ${planetData[planet].distance}\nMoons: ${planetData[planet].moons}\nInfo: ${planetData[planet].info}`;
    }
  }
}
let isZoomingOut = false;
let zoomOutTargetPosition = new THREE.Vector3(-175, 115, 5);
// close 'x' button function
function closeInfo() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
  currentTimeouts.forEach(t => clearTimeout(t));
  currentTimeouts = [];
  var info = document.getElementById('planetInfo');
  info.style.display = 'none';
  info.style.pointerEvents = 'none';
  settings.accelerationOrbit = 1;
  isZoomingOut = true;
  controls.target.set(0, 0, 0);
}
window.closeInfo = closeInfo;
window.closeInfo = closeInfo;
// close info when clicking another planet
function closeInfoNoZoomOut() {
  var info = document.getElementById('planetInfo');
  info.style.display = 'none';
  settings.accelerationOrbit = 1;
}
// ******  SUN  ******
let sunMat;

const sunSize = 697/40; // 40 times smaller scale than earth
const sunGeom = new THREE.SphereGeometry(sunSize, 32, 20);
sunMat = new THREE.MeshStandardMaterial({
  emissive: 0xFFF88F,
  emissiveMap: loadTexture.load(sunTexture),
  emissiveIntensity: settings.sunIntensity
});
const sun = new THREE.Mesh(sunGeom, sunMat);
scene.add(sun);

//point light in the sun
const pointLight = new THREE.PointLight(0xFDFFD3 , 1200, 400, 1.4);
scene.add(pointLight);


// ******  PLANET CREATION FUNCTION  ******
function createPlanet(planetName, size, position, tilt, texture, bump, ring, atmosphere, moons){

  let material;
  if (texture instanceof THREE.Material){
    material = texture;
  } 
  else if(bump){
    material = new THREE.MeshPhongMaterial({
    map: loadTexture.load(texture),
    bumpMap: loadTexture.load(bump),
    bumpScale: 0.7
    });
  }
  else {
    material = new THREE.MeshPhongMaterial({
    map: loadTexture.load(texture)
    });
  } 

  const name = planetName;
  const geometry = new THREE.SphereGeometry(size, 32, 20);
  const planet = new THREE.Mesh(geometry, material);
  const planet3d = new THREE.Object3D;
  const planetSystem = new THREE.Group();
  planetSystem.add(planet);
  let Atmosphere;
  let Ring;
  planet.position.x = position;
  planet.rotation.z = tilt * Math.PI / 180;

  // add orbit path
  const orbitPath = new THREE.EllipseCurve(
    0, 0,            // ax, aY
    position, position, // xRadius, yRadius
    0, 2 * Math.PI,   // aStartAngle, aEndAngle
    false,            // aClockwise
    0                 // aRotation
);

  const pathPoints = orbitPath.getPoints(100);
  const orbitGeometry = new THREE.BufferGeometry().setFromPoints(pathPoints);
  const orbitMaterial = new THREE.LineBasicMaterial({ color: 0xFFFFFF, transparent: true, opacity: 0.03 });
  const orbit = new THREE.LineLoop(orbitGeometry, orbitMaterial);
  orbit.rotation.x = Math.PI / 2;
  planetSystem.add(orbit);

  //add ring
  if(ring)
  {
    const RingGeo = new THREE.RingGeometry(ring.innerRadius, ring.outerRadius,30);
    const RingMat = new THREE.MeshStandardMaterial({
      map: loadTexture.load(ring.texture),
      side: THREE.DoubleSide
    });
    Ring = new THREE.Mesh(RingGeo, RingMat);
    planetSystem.add(Ring);
    Ring.position.x = position;
    Ring.rotation.x = -0.5 *Math.PI;
    Ring.rotation.y = -tilt * Math.PI / 180;
  }
  
  //add atmosphere
  if(atmosphere){
    const atmosphereGeom = new THREE.SphereGeometry(size+0.1, 32, 20);
    const atmosphereMaterial = new THREE.MeshPhongMaterial({
      map:loadTexture.load(atmosphere),
      transparent: true,
      opacity: 0.4,
      depthTest: true,
      depthWrite: false
    })
    Atmosphere = new THREE.Mesh(atmosphereGeom, atmosphereMaterial)
    
    Atmosphere.rotation.z = 0.41;
    planet.add(Atmosphere);
  }

  //add moons
  if(moons){
    moons.forEach(moon => {
      let moonMaterial;
      
      if(moon.bump){
        moonMaterial = new THREE.MeshStandardMaterial({
          map: loadTexture.load(moon.texture),
          bumpMap: loadTexture.load(moon.bump),
          bumpScale: 0.5
        });
      } else{
        moonMaterial = new THREE.MeshStandardMaterial({
          map: loadTexture.load(moon.texture)
        });
      }
      const moonGeometry = new THREE.SphereGeometry(moon.size, 32, 20);
      const moonMesh = new THREE.Mesh(moonGeometry, moonMaterial);
      const moonOrbitDistance = size * 1.5;
      moonMesh.position.set(moonOrbitDistance, 0, 0);
      planetSystem.add(moonMesh);
      moon.mesh = moonMesh;
    });
  }
  //add planet system to planet3d object and to the scene
  planet3d.add(planetSystem);
  scene.add(planet3d);
  return {name, planet, planet3d, Atmosphere, moons, planetSystem, Ring};
}


// ******  LOADING OBJECTS METHOD  ******
function loadObject(path, position, scale, callback) {
  const loader = new GLTFLoader();

  loader.load(path, function (gltf) {
      const obj = gltf.scene;
      obj.position.set(position, 0, 0);
      obj.scale.set(scale, scale, scale);
      scene.add(obj);
      if (callback) {
        callback(obj);
      }
  }, undefined, function (error) {
      console.error('An error happened', error);
  });
}

// ******  ASTEROIDS  ******
const asteroids = [];
function loadAsteroids(path, numberOfAsteroids, minOrbitRadius, maxOrbitRadius) {
  const loader = new GLTFLoader();
  loader.load(path, function (gltf) {
      gltf.scene.traverse(function (child) {
          if (child.isMesh) {
              for (let i = 0; i < numberOfAsteroids / 12; i++) { // Divide by 12 because there are 12 asteroids in the pack
                  const asteroid = child.clone();
                  const orbitRadius = THREE.MathUtils.randFloat(minOrbitRadius, maxOrbitRadius);
                  const angle = Math.random() * Math.PI * 2;
                  const x = orbitRadius * Math.cos(angle);
                  const y = 0;
                  const z = orbitRadius * Math.sin(angle);
                  child.receiveShadow = true;
                  asteroid.position.set(x, y, z);
                  asteroid.scale.setScalar(THREE.MathUtils.randFloat(0.8, 1.2));
                  scene.add(asteroid);
                  asteroids.push(asteroid);
              }
          }
      });
  }, undefined, function (error) {
      console.error('An error happened', error);
  });
}


// Earth day/night effect shader material
const earthMaterial = new THREE.ShaderMaterial({
  uniforms: {
    dayTexture: { type: "t", value: loadTexture.load(earthTexture) },
    nightTexture: { type: "t", value: loadTexture.load(earthNightTexture) },
    sunPosition: { type: "v3", value: sun.position }
  },
  vertexShader: `
    varying vec3 vNormal;
    varying vec2 vUv;
    varying vec3 vSunDirection;

    uniform vec3 sunPosition;

    void main() {
      vUv = uv;
      vec4 worldPosition = modelMatrix * vec4(position, 1.0);
      vNormal = normalize(modelMatrix * vec4(normal, 0.0)).xyz;
      vSunDirection = normalize(sunPosition - worldPosition.xyz);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D dayTexture;
    uniform sampler2D nightTexture;

    varying vec3 vNormal;
    varying vec2 vUv;
    varying vec3 vSunDirection;

    void main() {
      float intensity = max(dot(vNormal, vSunDirection), 0.0);
      vec4 dayColor = texture2D(dayTexture, vUv);
      vec4 nightColor = texture2D(nightTexture, vUv)* 0.2;
      gl_FragColor = mix(nightColor, dayColor, intensity);
    }
  `
});


// ******  MOONS  ******
// Earth
const earthMoon = [{
  size: 1.6,
  texture: earthMoonTexture,
  bump: earthMoonBump,
  orbitSpeed: 0.001 * settings.accelerationOrbit,
  orbitRadius: 10
}]

// Mars' moons with path to 3D models (phobos & deimos)
const marsMoons = [
  {
    modelPath: '/images/mars/phobos.glb',
    scale: 0.1,
    orbitRadius: 5,
    orbitSpeed: 0.002 * settings.accelerationOrbit,
    position: 100,
    mesh: null
  },
  {
    modelPath: '/images/mars/deimos.glb',
    scale: 0.1,
    orbitRadius: 9,
    orbitSpeed: 0.0005 * settings.accelerationOrbit,
    position: 120,
    mesh: null
  }
];

// Jupiter
const jupiterMoons = [
  {
    size: 1.6,
    texture: ioTexture,
    orbitRadius: 20,
    orbitSpeed: 0.0005 * settings.accelerationOrbit
  },
  {
    size: 1.4,
    texture: europaTexture,
    orbitRadius: 24,
    orbitSpeed: 0.00025 * settings.accelerationOrbit
  },
  {
    size: 2,
    texture: ganymedeTexture,
    orbitRadius: 28,
    orbitSpeed: 0.000125 * settings.accelerationOrbit
  },
  {
    size: 1.7,
    texture: callistoTexture,
    orbitRadius: 32,
    orbitSpeed: 0.00006 * settings.accelerationOrbit
  }
];

// ******  PLANET CREATIONS  ******
const mercury = new createPlanet('Mercury', 2.4, 40, 0, mercuryTexture, mercuryBump);
const venus = new createPlanet('Venus', 6.1, 65, 3, venusTexture, venusBump, null, venusAtmosphere);
const earth = new createPlanet('Earth', 6.4, 90, 23, earthMaterial, null, null, earthAtmosphere, earthMoon);
const mars = new createPlanet('Mars', 3.4, 115, 25, marsTexture, marsBump)
// Load Mars moons
marsMoons.forEach(moon => {
  loadObject(moon.modelPath, moon.position, moon.scale, function(loadedModel) {
    moon.mesh = loadedModel;
    mars.planetSystem.add(moon.mesh);
    moon.mesh.traverse(function (child) {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  });
});

const jupiter = new createPlanet('Jupiter', 69/4, 200, 3, jupiterTexture, null, null, null, jupiterMoons);
const saturn = new createPlanet('Saturn', 58/4, 270, 26, saturnTexture, null, {
  innerRadius: 18, 
  outerRadius: 29, 
  texture: satRingTexture
});
const uranus = new createPlanet('Uranus', 25/4, 320, 82, uranusTexture, null, {
  innerRadius: 6, 
  outerRadius: 8, 
  texture: uraRingTexture
});
const neptune = new createPlanet('Neptune', 24/4, 340, 28, neptuneTexture);
const pluto = new createPlanet('Pluto', 1, 350, 57, plutoTexture)
const holstTitles = {
  'Mercury': { en: 'Mercury, the Winged Messenger', es: 'Mercurio, el Mensajero Alado' },
  'Venus': { en: 'Venus, the Bringer of Peace', es: 'Venus, el Portador de la Paz' },
  'Earth': { en: 'Earth', es: 'Tierra' },
  'Mars': { en: 'Mars, the Bringer of War', es: 'Marte, el Portador de la Guerra' },
  'Jupiter': { en: 'Jupiter, the Bringer of Jollity', es: 'Júpiter, el Portador de la Alegría' },
  'Saturn': { en: 'Saturn, the Bringer of Old Age', es: 'Saturno, el Portador de la Vejez' },
  'Uranus': { en: 'Uranus, the Magician', es: 'Urano, el Mago' },
  'Neptune': { en: 'Neptune, the Mystic', es: 'Neptuno, el Místico' },
  'Pluto': { en: 'Pluto', es: 'Plutón' }
};

const mitologicoTextos = {
  'Mars': {
    fijo: 'Inspirada en el significado astrológico de Marte y en el dios romano de la guerra, esta pieza representa el conflicto, la fuerza y la agresividad. Holst utiliza ritmos repetitivos, sonidos intensos y una atmósfera de tensión para transmitir la energía de la batalla y el enfrentamiento.',
    extra: [
      { tiempo: 30000, texto: 'Los primeros compases de Marte pueden interpretarse como el avance de una fuerza que se aproxima lentamente. Para crear esta sensación, Holst utiliza el col legno, una técnica en la que las cuerdas son golpeadas con la madera del arco, produciendo un sonido seco y repetitivo que recuerda a una marcha. Poco a poco se incorporan sonidos más graves que aportan una atmósfera amenazante, mientras la música gana intensidad de forma gradual.' },
      { tiempo: 120000, texto: 'Tras el ritmo insistente del inicio, aparece una melodía más amplia que aporta un carácter más melódico a la obra. Sin embargo, esta no llega a sentirse tranquila o estable, ya que el patrón rítmico del fondo continúa presente. El contraste entre ambos elementos crea una sensación de tensión constante, incluso en los momentos más melódicos.' },
      { tiempo: 240000, texto: 'La tensión acumulada a lo largo de la obra vuelve a crecer. Los instrumentos comienzan a unirse en una misma idea musical, creando la sensación de que una fuerza inmensa se aproxima de forma inevitable. Con el regreso de los sonidos graves y la potencia de toda la orquesta, la amenaza que antes se intuía en la distancia parece revelarse por completo.' },
      { tiempo: 420000, texto: 'En los compases finales, la amenaza que se había ido construyendo a lo largo de la obra alcanza su máxima expresión. Más que representar una batalla o un ejército específico, la música puede evocar una fuerza inmensa, devastadora y difícil de comprender. Holst refuerza esta sensación mediante la bitonalidad, una técnica que superpone tonalidades distintas y genera una tensión constante. La obra culmina con acordes monumentales y un volumen extremo, cerrando el movimiento con una sensación de conflicto sin resolución.' }
    ]
  }
  ,
  'Venus': {
    fijo: 'Venus representa la armonía, el amor y la serenidad. Basada en la diosa romana de la belleza y en su simbolismo astrológico, la obra emplea melodías suaves y delicadas que crean una sensación de calma y equilibrio.',
    extra: [
      { tiempo: 30000, texto: 'El solo de corno francés inicial transmite una sensación inmediata de calma y suavidad. Presenta una línea melódica larga y sostenida, sin ataques bruscos, lo que establece una atmósfera tranquila desde el comienzo. Este inicio es respondido por un delicado entramado de flautas, que refuerza la sensación de ligereza y continuidad. Las notas ascienden de forma suave mediante intervalos como cuartas y quintas justas, evitando la tensión armónica y generando una sensación de suspensión, como si la música quedara flotando en el espacio, pintando un paisaje sonoro estático y etéreo.' },
      { tiempo: 120000, texto: 'La obra mantiene una sensación constante de equilibrio y reposo. Las armonías consonantes evitan fricción entre las notas, lo que refuerza una percepción de estabilidad. Las diferentes líneas de la orquesta avanzan de forma coordinada, creando una textura ordenada y sin conflicto interno. El tempo lento y flexible contribuye a una sensación de continuidad tranquila, sin sobresaltos.' },
      { tiempo: 240000, texto: 'La música adquiere un carácter más amplio y luminoso, sin perder la calma general. Las melodías se desarrollan de manera ascendente y progresiva, sin saltos abruptos, lo que genera una sensación de crecimiento suave y continuo. Las dinámicas aumentan gradualmente, mientras que el uso de arpa aporta un color brillante y ligero que refuerza una atmósfera etérea.' },
      { tiempo: 360000, texto: 'El cierre de Venus refuerza una sensación clara de paz y estabilidad emocional. La orquestación se conserva ligera, con predominio de registros medios y agudos, evitando cualquier sensación de peso excesivo. La ausencia de disonancias marcadas, ritmos irregulares o acentos fuertes contribuye a una idea de equilibrio total, donde la música no genera tensión ni conflicto. Todo se sostiene en una calma continua que transmite tranquilidad, seguridad y un estado de reposo prolongado.' }
    ]
  },
  'Mercury': {
    fijo: 'Inspirada en Mercurio, mensajero de los dioses romanos, esta pieza simboliza la comunicación, la inteligencia y el movimiento. Sus melodías ligeras y cambios constantes de ritmo evocan rapidez, agilidad y dinamismo.',
    extra: [
      { tiempo: 30000, texto: 'El inicio de Mercurio transmite una sensación de energía inmediata y movimiento constante. El tempo prestissimo genera una velocidad extrema que hace que la música se perciba siempre en acción, sin momentos de reposo. Esto se refuerza con notas en staccato, cortas y separadas, que funcionan como impulsos rápidos y ligeros. El uso de un registro agudo y sin peso en los graves contribuye a una sensación de agilidad, donde todo se siente rápido pero liviano, como un flujo continuo de movimiento.' },
      { tiempo: 120000, texto: 'La obra mantiene de principio a fin una sensación de movimiento ininterrumpido. Las cuerdas en staccato y el uso del pizzicato crean una sucesión constante de impulsos breves que se encadenan sin pausa, evitando cualquier sensación de reposo. La orquestación cambiante refuerza la vitalidad del movimiento, ya que el sonido pasa rápidamente entre distintos instrumentos sin mantenerse fijo en uno solo. Esto genera una sensación de agilidad continua, donde la música no se detiene ni pierde impulso hasta el final.' }
    ]
  },
  'Jupiter': {
    fijo: 'Júpiter está asociado con la prosperidad, el optimismo y la celebración. Inspirado en el rey de los dioses romanos y en su significado astrológico, este movimiento destaca por su carácter enérgico y festivo, lleno de melodías brillantes y expansivas.',
    extra: [
      { tiempo: 30000, texto: 'El inicio de Júpiter transmite una sensación de energía brillante y movimiento alegre. Los ritmos con síncopas generan un impulso constante, ya que los acentos aparecen en lugares inesperados, lo que hace que la música se sienta siempre en movimiento. La alternancia entre compases de dos y tres tiempos aporta variedad al ritmo, creando una sensación de danza continua y celebración.' },
      { tiempo: 180000,texto: 'La sección central cambia a un carácter más lento y melódico, donde las líneas ascendentes en los cellos se vuelven más amplias y expresivas. Este tipo de melodías crea una sensación de crecimiento emocional, ya que los movimientos hacia registros más altos se perciben como expansión. El uso de tonalidad mayor refuerza una sensación de alegría clara.' },
      { tiempo: 300000, texto: 'El regreso al ritmo rápido recupera la energía de la danza, pero con más fuerza después de la sección anterior. El uso de crescendos hace que el volumen aumente poco a poco, lo que genera una sensación de energía que crece constantemente. La combinación de ritmo rápido y aumento de intensidad refuerza la idea de una alegría que sigue expandiéndose sin detenerse.' },
      { tiempo: 420000, texto: 'El final reúne a toda la orquesta en una sonoridad grande y brillante. Todos los instrumentos participan en un ritmo de danza rápido, creando una textura llena y poderosa. El uso de fortissimo y el cierre final enérgico generan una sensación de celebración máxima, como una explosión de alegría colectiva donde toda la música converge en un mismo clímax festivo.' }
    ]
  },
  'Saturn': {
    fijo: 'Saturno representa el paso del tiempo, la experiencia y la madurez. La música comienza con un carácter solemne y pausado, reflejando el avance de los años, y evoluciona hacia una atmósfera más reflexiva y serena.',
    extra: [
      { tiempo: 30000, texto: 'El inicio de Saturno transmite una sensación de lentitud extrema y peso en cada sonido. El tempo muy lento hace que cada nota se sienta importante y con carga, como si el tiempo avanzara con dificultad. Las notas graves refuerzan esta sensación de peso, haciendo que el paso del tiempo se perciba lento y constante. Esto crea una atmósfera de vejez y experiencia acumulada, como un caminar pausado con toda una vida detrás.' },
      { tiempo: 180000, texto: 'La música introduce un patrón repetitivo en las cuerdas que se mantiene de forma constante, como un "tic-tac" que no se detiene. Esta repetición genera la sensación de un tiempo que avanza sin control y sin pausa. El tempo sigue siendo lento y pesado, lo que refuerza una sensación de inevitabilidad, como si el paso del tiempo fuera algo que no se puede detener.' },
      { tiempo: 300000, texto: 'La música empieza a volverse más tensa, con momentos donde las notas parecen chocar entre sí antes de resolverse lentamente. Esto crea una sensación de conflicto prolongado, ya que las tensiones no desaparecen de inmediato, sino que tardan en resolverse. La obra transmite aquí una sensación de lucha constante, como si el tiempo y la experiencia fueran una carga emocional continua.' },
      { tiempo: 360000, texto: 'El volumen crece de forma gradual hasta llegar a un punto muy intenso, donde toda la orquesta suena con fuerza. Este aumento progresivo da la sensación de acumulación, como si todo lo vivido se reuniera en un solo momento. Después del clímax, la música comienza a calmarse lentamente, dejando una sensación de aceptación y serenidad final. Esto transmite la idea de una transformación del sufrimiento en paz, como una llegada a la calma después de una larga experiencia.' }
    ]
  },
  'Uranus': {
    fijo: 'Inspirada en Urano como símbolo de cambio y sorpresa, esta pieza presenta contrastes marcados, giros inesperados y momentos de gran energía. Holst crea una atmósfera que recuerda a un mago realizando actos llenos de ingenio y misterio.',
    extra: [
      { tiempo: 30000, texto: 'El inicio de Urano transmite una sensación de magia más bien cómica y exagerada. El xilófono con figuras rápidas y brillantes aporta un timbre ligero y algo "juguetón", que se asocia más a una estética de circo o algo burlesco que a una magia seria. Los metales con ritmo pesado refuerzan esta idea, creando una sensación de fuerza que suena exagerada y poco refinada. Esto genera la impresión de algo mágico pero más teatral que misterioso.' },
      { tiempo: 120000, texto: 'La música crece hasta un clímax muy fuerte, donde toda la orquesta suena al mismo tiempo con gran volumen. Esta combinación de xilófono, metales y orquesta completa crea una sensación de poder muy intenso, pero también algo exagerado, como si todo estuviera llevado al límite. El efecto es el de una energía que se desborda completamente.' },
      { tiempo: 240000, texto: 'Después del clímax, la música cae de forma rápida y la energía parece disminuir por un momento. Sin embargo, al final la música vuelve a crecer con fuerza. El regreso de la melodía principal del xilófono, junto con el aumento del volumen, crea una sensación de ciclo en la energía: primero se libera con fuerza, luego baja brevemente y finalmente vuelve a intensificarse. El cierre en fortissimo genera una sensación de final explosivo, donde toda la energía se concentra en el último momento. Esto transmite una fuerza burlesca que funciona en ciclos de tensión y liberación hasta el final.' }
    ]
  },
  'Neptune': {
    fijo: 'Neptuno representa el mundo de los sueños, la espiritualidad y lo desconocido. Para expresar estas ideas, Holst utiliza armonías etéreas y un coro femenino distante que genera una sensación de misterio y profundidad.',
    extra: [
      { tiempo: 5000, texto: 'El inicio de Neptuno transmite una sensación de misterio y lejanía. El flautín y la flauta presentan una melodía en registro agudo, con movimientos cromáticos que no resuelven de forma clara, lo que genera una sensación de inestabilidad. El arpa aporta un brillo suave y continuo, mientras que instrumentos como la celesta y el glockenspiel añaden un sonido cristalino que refuerza la idea de algo distante. Los trinos y movimientos oscilantes en las cuerdas hacen que la música se sienta impredecible, como si no tuviera un camino fijo.' },
      { tiempo: 90000, texto: 'La música se vuelve cada vez más difusa, sin una melodía clara ni un ritmo definido. En lugar de una estructura tradicional, la orquesta trabaja con fragmentos suaves de sonido en volumen muy bajo, lo que crea una sensación de flotación. Las armonías no llegan a resolverse completamente, lo que refuerza la idea de algo que no se estabiliza ni "aterriza" en un lugar concreto. Esto transmite una sensación de espacio abierto y sin límites claros.' },
      { tiempo: 360000, texto: 'En esta sección entra un coro femenino casi imperceptible, cantando sin palabras en un registro alto. Su sonido es suave y etéreo, lo que hace que se perciba como algo que no pertenece del todo al mundo físico. El hecho de que el coro esté ubicado fuera de escena refuerza la sensación de distancia, como si el sonido viniera de un lugar lejano o desconocido. Esto crea una atmósfera de misterio más profunda y envolvente.' },
      { tiempo: 480000, texto: 'El final se construye con un descenso muy gradual del volumen, donde el coro y la orquesta se van apagando lentamente. Las repeticiones suaves hacen que la música se disuelva poco a poco, sin un cierre brusco. La sensación final es la de un sonido que desaparece en el espacio, como si se alejara cada vez más hasta no escucharse. Esto transmite la idea de un final abierto, donde la música no termina de forma clara, sino que se desvanece hacia lo infinito.' }
    ]
  },
  'Earth': {
    fijo: 'A diferencia de los demás planetas, la Tierra no aparece en Los Planetas de Gustav Holst. Desde la perspectiva de la obra, nuestro mundo es el lugar desde donde observamos el cielo, imaginamos historias y exploramos el universo. No es uno de los personajes de la suite, sino el escenario desde el cual se desarrolla el viaje.',
    extra: []
  }
};
const cienciaTitles = {
  'Jupiter': { en: 'Jupiter Sonification', es: 'Sonificación de Júpiter' },
  'Saturn': { en: 'Saturn Sonification', es: 'Sonificación de Saturno' },
  'Uranus': { en: 'Uranus Sonification', es: 'Sonificación de Urano' }
};

const cienciaTextos = {
  'Jupiter': {
    fijo: 'La sonificación de Júpiter se realizó a partir de datos de rayos X registrados por Chandra y una imagen infrarroja tomada por el Telescopio Espacial Hubble. Durante el proceso, una línea de activación recorrió la composición y convirtió distintos datos en sonido: los rayos X del entorno se tradujeron en instrumentos de viento, mientras que el paso por el planeta activó notas más graves y densas. La información de las auroras y de la Gran Mancha Roja se representó mediante variaciones en el tono y en la intensidad sonora.',
    extra: []
  },
  'Saturn': {
    fijo: 'La sonificación de Saturno combinó datos de rayos X de Chandra con una imagen óptica obtenida por la misión Cassini. El sonido se generó mediante un barrido que recorre la composición y asigna a cada elemento visual un parámetro auditivo específico. Los anillos se tradujeron en un efecto de sirena cuya frecuencia sigue su forma, mientras que el planeta activó sonidos más graves y sostenidos. Las zonas con mayor actividad energética se diferenciaron con tonos sintéticos más agudos.',
    extra: []
  },
  'Uranus': {
    fijo: 'La sonificación de Urano se construyó con datos de Chandra y del Observatorio WM Keck. En este caso, el sistema de sonificación asignó el brillo al volumen y la posición vertical al tono, de modo que los elementos más brillantes se escuchan más fuertes y agudos. La forma de los anillos se convirtió en una línea sonora ascendente, y los datos del planeta se tradujeron en un patrón auditivo que permite seguir su estructura sin necesidad de recurrir a una descripción visual.',
    extra: []
  }
};
const cienciaAudios = {
  'Jupiter': 'https://res.cloudinary.com/dm2wz7juo/video/upload/v1781478325/sonify11_jupiter_e8ifek.mp3',
  'Saturn': 'https://res.cloudinary.com/dm2wz7juo/video/upload/v1781478325/sonify11_saturn_hkcerk.mp3',
  'Uranus': 'https://res.cloudinary.com/dm2wz7juo/video/upload/v1781478325/sonify11_uranus_pk8crl.mp3'
};
const emocionalTitles = {
  'Jupiter': { en: 'Like a Dog Chasing Cars', es: 'JÚPITER — Escudo de caos y gravedad' },
  'Earth': { en: 'Can You Hear The Music', es: 'TIERRA — Caos Perfecto' },
  'Mars': { en: 'Married Life', es: 'MARTE — El Planeta de los Recuerdos' },
  'Uranus': { en: 'Define Dancing', es: 'URANO — Coreografía Invisible' },
  'Neptune': { en: 'Nemo Egg', es: 'NEPTUNO — El Silencio de la Distancia' },
  'Venus': { en: 'The End Game', es: 'VENUS — Peligro' },
  'Mercury': { en: 'Gravity Swallows Light', es: 'MERCURIO — El Pozo Gravitatorio' },
  'Saturn': { en: 'Cornfield Chase', es: 'SATURNO — La Geometría del Cosmos' }
};

const emocionalAudios = {
  'Jupiter': 'https://res.cloudinary.com/dm2wz7juo/video/upload/v1781547129/Hans_Zimmer_James_Newton_Howard_-_Like_A_Dog_Chasing_Cars_Official_Audio_ljz0ug.mp3',
  'Earth': 'https://res.cloudinary.com/dm2wz7juo/video/upload/v1781491922/Can_You_Hear_The_Music_ppkkhh.mp3',
  'Mars': 'https://res.cloudinary.com/dm2wz7juo/video/upload/v1781492638/Married_Life_xptcwv.mp3',
  'Uranus': 'https://res.cloudinary.com/dm2wz7juo/video/upload/v1781494124/Define_Dancing_p9umhv.mp3',
  'Neptune': 'https://res.cloudinary.com/dm2wz7juo/video/upload/v1781494858/Nemo_Egg_Main_Title_cmqen3.mp3',
  'Venus': 'https://res.cloudinary.com/dm2wz7juo/video/upload/v1781542504/The_End_Game_Avengers__Infinity_War_Soundtrack_dtbft3.mp3',
  'Mercury': 'https://res.cloudinary.com/dm2wz7juo/video/upload/v1781543685/Gravity_Swallows_Light_a7tmhd.mp3',
  'Saturn': 'https://res.cloudinary.com/dm2wz7juo/video/upload/v1781544306/Interstellar_Official_Soundtrack_Cornfield_Chase_Hans_Zimmer_WaterTower_bzpy3n.mp3'
};
const emocionalTextos = {
  'Jupiter': {
    fijo: '"Like a Dog Chasing Cars" hace parte de la banda sonora de The Dark Knight, compuesta por Hans Zimmer y James Newton Howard. La pieza transmite una tensión constante entre caos y control, con una sensación de amenaza creciente e inestabilidad que se intensifica hasta volverse muy tensa y emocional, como si todo estuviera siempre al borde del colapso.',
    extra: [
      { tiempo: 20000, texto: 'La pieza se basa en un ostinato, un ritmo repetitivo que avanza con una fuerza descomunal y no se detiene. Esta sensación de energía y movimiento constante recuerda a Júpiter, un gigante que gira sobre su propio eje a una velocidad extraordinaria y cuya enorme masa lo convierte en una de las fuerzas gravitacionales más poderosas del sistema solar, capaz de atraer, desviar y capturar cuerpos celestes a su paso.' },
      { tiempo: 180000, texto: 'La pieza transmite una sensación de peligro inminente, de un caos que te atrapa y del que no puedes escapar. Las texturas electrónicas y los metales agresivos refuerzan esta sensación de energía descontrolada. Una impresión similar puede encontrarse en Júpiter, un planeta que no tiene una superficie sólida, sino un océano de gases violentos. Su característica más famosa es la Gran Mancha Roja, una tormenta gigantesca más grande que la Tierra entera que lleva activa al menos 300 años, con vientos que superan los 400 km/h. Como la música, Júpiter parece un sistema en constante caos que se alimenta de su propia energía.' },
      { tiempo: 240000, texto: 'En la pieza, una melodía épica, pesada y melancólica aparece en el momento más crítico de la persecución, cuando el caos alcanza su punto máximo y una figura interviene para enfrentarlo directamente. La música transmite el peso del sacrificio, como si toda la violencia recayera en una sola decisión para proteger a los demás, incluso asumiendo ser visto como enemigo con tal de mantener la paz. En el interior de Júpiter, la presión extrema convierte el hidrógeno en un océano de hidrógeno metálico líquido y podría provocar "lluvias de diamantes". Su gravedad actúa como un escudo cósmico que desvía asteroides y protege a la Tierra, mostrando un entorno violento que, aun así, genera estabilidad a partir de la propia presión.' }
    ]
  },
  'Earth': {
    fijo: '"Can You Hear The Music" es la pieza central de Oppenheimer, compuesta por Ludwig Göransson. Inspirada en la metáfora del físico Niels Bohr sobre "escuchar la música" como el arte de entender la armonía oculta del universo, la obra utiliza 21 cambios de tempo para reflejar una paradoja entre el caos y la creación. En el cosmos, esta obra representa a la Tierra, un planeta que encarna esa misma dualidad, donde las fuerzas más caóticas y destructivas de la física se alinearon en una armonía perfecta para dar origen a la vida humana.',
    extra: [
      { tiempo: 60000, texto: 'La pieza arranca con un torbellino de violines que aceleran drásticamente entre los 180 y 350 BPM. Este inicio musical describe el "punto crítico" de la materia, el caos primitivo, los choques de partículas y las fuerzas físicas desbocadas en el espacio. Sin embargo, la precisión matemática con la que la orquesta ejecuta estos cambios refleja cómo la Tierra procesó ese desorden. La música ilustra que, en medio de un universo violento, el planeta logró que cada elemento encajara a la perfección, convirtiendo el peligro en una base estable que permitió el nacimiento de nuestra existencia.' }
    ]
  },
  'Mars': {
    fijo: '"Married Life" es la obra maestra de Michael Giacchino para la película Up. A través de un vals que evoluciona desde la alegría hasta una profunda melancolía, la pieza musicaliza el paso del tiempo y los ciclos de la vida. En el espacio, esta composición representa a Marte, un mundo que hoy es un desierto frío y silencioso, pero que esconde la nostalgia de un pasado donde alguna vez albergó agua, calor y la promesa de la vida.',
    extra: [
      { tiempo: 30000, texto: 'El arranque optimista de "Married Life" representa el pasado de Marte. Hace miles de millones de años, era un planeta vivo, azul, con ríos, lagos y una atmósfera cálida. Ese vals alegre es la música de un Marte joven que alguna vez tuvo la promesa de albergar vida, corriendo en el cosmos con la misma ilusión y energía con la que Carl y Ellie construían su casa y su futuro desde cero.' },
      { tiempo: 200000, texto: 'A medida que la canción avanza, la música cambia de tono y describe la madurez del planeta, Marte fue perdiendo su atmósfera lentamente, su agua se evaporó y comenzó a enfriarse. El final lento y melancólico del piano es el Marte que conocemos hoy. Un planeta solitario y silencioso, donde los robots que enviamos caminan por la arena como ancianos buscando los recuerdos de un pasado que ya no va a volver; la hermosa y triste nostalgia de lo que alguna vez estuvo lleno de vida y hoy descansa en paz.' }
    ]
  },
'Uranus': {
    fijo: '"Define Dancing", de Thomas Newman para WALL-E, musicaliza la sincronía de dos robots moviéndose juntos en el espacio. A través de un patrón de cuerdas rápido y minimalista, la pieza transmite un equilibrio perfecto. En el universo, esta composición representa a Urano y sus lunas pastoras, un sistema donde pequeños satélites orbitan en los bordes de los anillos, interactuando con las partículas para mantenerlas en su lugar a través de la gravedad.',
    extra: [
      { tiempo: 30000, texto: 'El inicio rápido y constante de la canción describe el juego cósmico en los anillos de Urano. Al ser estructuras tan delgadas, las partículas de hielo deberían dispersarse en el espacio, pero no lo hacen gracias a las lunas pastoras que corren en círculos perfectos por los bordes. El ritmo minimalista de la música imita esta interacción continua, donde los pequeños satélites avanzan en una trayectoria exacta por la zona más silenciosa del sistema solar.' },
      { tiempo: 90000, texto: 'A medida que los instrumentos se suman y se sincronizan, la música refleja el equilibrio de las lunas operando en pareja. Al igual que los personajes de la película coordinando sus movimientos en el vacío, estas lunas utilizan su gravedad para guiar a los fragmentos de hielo, manteniéndolos alineados en su órbita. La melodía ilustra esta física sutil, una coreografía invisible de atracción donde el orden de los cuerpos celestes crea una armonía eterna.' }
    ]
  },
  'Neptune': {
    fijo: '"Nemo Egg", compuesta por Thomas Newman para Buscando a Nemo, transmite una melancolía calmada, una mezcla de belleza y soledad que invita a la reflexión. En el sistema solar, este sentimiento coincide con la realidad de Neptuno, el planeta más lejano de todos. Al encontrarse en el borde de nuestro sistema, es un mundo aislado y silencioso que avanza a su propio ritmo en la penumbra del espacio.',
    extra: [
      { tiempo: 30000, texto: 'Las notas de piano, espaciadas y sin prisa, reflejan el movimiento de Neptuno, que al ser el planeta más distante tarda 165 años terrestres en dar una sola vuelta al Sol. A su vez, el fondo suave de las cuerdas describe el aislamiento de este gigante de hielo, que flota a miles de millones de kilómetros en un entorno oscuro. La música de Newman capta esa tristeza reflexiva, la tranquilidad de un mundo que existe en una quietud perpetua y solitaria.' }
    ]
  },
  'Venus': {
    fijo: '"The End Game" de Alan Silvestri para Avengers Infinity War utiliza un pulso pesado y un tono sombrío que transmiten una sensación de finalidad y un peligro inevitable. En el sistema solar esta atmósfera tan amenazante encaja con Venus, un planeta que representa el entorno más letal y destructivo donde nada puede sobrevivir.',
    extra: [
      { tiempo: 30000, texto: 'El ritmo pesado de la música transmite una constante sensación de opresión. Describe la entrada a un mundo hostil imitando ese peligro invisible que te atrapa y te encierra a medida que te acercas a la superficie de Venus, donde el ambiente se siente pesado, denso y completamente inhabitable.' },
      { tiempo: 135000, texto: 'La entrada de una melodía más lenta refleja un paisaje completamente solitario porque las condiciones extremas impiden cualquier rastro de vida. Hacia el final la música vuelve a estallar con fuerza emulando el golpe destructivo de un entorno que aplasta y consume todo lo que intenta tocar su suelo.' }
    ]
  },
  'Mercury': {
    fijo: '"Gravity Swallows Light" es una pieza de Ludwig Göransson para la película Oppenheimer. El tema hace referencia a las investigaciones del físico sobre el colapso de las estrellas y la formación de los agujeros negros, utilizando cuerdas continuas y sintetizadores para generar una atmósfera de densidad y compresión. En el sistema solar, esta composición se relaciona con Mercurio debido a su posición, al ser el planeta más cercano al Sol, se encuentra en la zona con mayor afectación y deformación gravitatoria de nuestro entorno cósmico.',
    extra: [
      { tiempo: 40000, texto: 'La música se desarrolla mediante un conjunto de cuerdas agudas que sostienen notas largas sobre un fondo electrónico constante. Esta estructura lineal y tensa refleja la condición orbital de Mercurio. Debido a la proximidad del Sol, el planeta se mueve en un espacio-tiempo fuertemente curvado por la masa solar, lo que provoca una precesión en su órbita que la física de Newton no podía explicar y que posteriormente sirvió para comprobar la Teoría de la Relatividad General de Einstein.' },
      { tiempo: 130000, texto: 'Hacia la segunda mitad, los acordes ganan peso y volumen, transmitiendo una sensación de presión y aislamiento. Esta evolución musical coincide con las características ambientales de Mercurio. Es un mundo desprovisto de atmósfera significativa, expuesto directamente a la radiación y al viento solar. La pieza describe sonoramente un cuerpo celeste que, debido a la fuerza de gravedad de su estrella, carece de dinamismo geológico propio y permanece atrapado en un ciclo extremo de temperaturas.' }
    ]
  },
  'Saturn': {
    fijo: '"Cornfield Chase" es una de las piezas centrales de la banda sonora de Interstellar, compuesta por Hans Zimmer. La obra está estructurada alrededor de un órgano y un conjunto de cuerdas que repiten un patrón circular en aumento constante, transmitiendo una sensación de orden, escala y asombro matemático. En el universo, esta composición representa a Saturno, un planeta definido por la simetría perfecta de sus anillos y una presencia monumental que domina el espacio exterior de forma armónica.',
    extra: [
      { tiempo: 35000, texto: 'La pieza introduce una melodía repetitiva que simula un engranaje o un reloj en movimiento constante. Esta estructura rítmica describe la mecánica de los anillos de Saturno. Aunque desde lejos parecen una estructura sólida y estática, en realidad están formados por miles de millones de fragmentos de hielo y roca que orbitan al planeta a velocidades exactas. La música imita este movimiento perpetuo, donde cada partícula sigue una trayectoria geométrica sin romper el equilibrio del sistema.' },
      { tiempo: 80000, texto: 'En este punto, el órgano alcanza su volumen máximo y las cuerdas se expanden, creando una sonoridad masiva pero organizada. Esta evolución musical coincide con la escala física de Saturno. El planeta es un gigante gaseoso tan denso y grande que altera la gravedad de todo el sistema solar exterior, pero a diferencia de la turbulencia de Júpiter, Saturno mantiene una apariencia serena y pulida. La música refleja esa paradoja: una fuerza física descomunal expresada a través de una melodía limpia y ordenada.' }
    ]
  }
};
  // ******  PLANETS DATA  ******
  const planetData = {
    'Mercury': {
        radius: '2,439.7 km',
        tilt: '0.034°',
        rotation: '58.6 Earth days',
        orbit: '88 Earth days',
        distance: '57.9 million km',
        moons: '0',
        info: 'The smallest planet in our solar system and nearest to the Sun.'
    },
    'Venus': {
        radius: '6,051.8 km',
        tilt: '177.4°',
        rotation: '243 Earth days',
        orbit: '225 Earth days',
        distance: '108.2 million km',
        moons: '0',
        info: 'Second planet from the Sun, known for its extreme temperatures and thick atmosphere.'
    },
    'Earth': {
        radius: '6,371 km',
        tilt: '23.5°',
        rotation: '24 hours',
        orbit: '365 days',
        distance: '150 million km',
        moons: '1 (Moon)',
        info: 'Third planet from the Sun and the only known planet to harbor life.'
    },
    'Mars': {
        radius: '3,389.5 km',
        tilt: '25.19°',
        rotation: '1.03 Earth days',
        orbit: '687 Earth days',
        distance: '227.9 million km',
        moons: '2 (Phobos and Deimos)',
        info: 'Known as the Red Planet, famous for its reddish appearance and potential for human colonization.'
    },
    'Jupiter': {
        radius: '69,911 km',
        tilt: '3.13°',
        rotation: '9.9 hours',
        orbit: '12 Earth years',
        distance: '778.5 million km',
        moons: '95 known moons (Ganymede, Callisto, Europa, Io are the 4 largest)',
        info: 'The largest planet in our solar system, known for its Great Red Spot.'
    },
    'Saturn': {
        radius: '58,232 km',
        tilt: '26.73°',
        rotation: '10.7 hours',
        orbit: '29.5 Earth years',
        distance: '1.4 billion km',
        moons: '146 known moons',
        info: 'Distinguished by its extensive ring system, the second-largest planet in our solar system.'
    },
    'Uranus': {
        radius: '25,362 km',
        tilt: '97.77°',
        rotation: '17.2 hours',
        orbit: '84 Earth years',
        distance: '2.9 billion km',
        moons: '27 known moons',
        info: 'Known for its unique sideways rotation and pale blue color.'
    },
    'Neptune': {
        radius: '24,622 km',
        tilt: '28.32°',
        rotation: '16.1 hours',
        orbit: '165 Earth years',
        distance: '4.5 billion km',
        moons: '14 known moons',
        info: 'The most distant planet from the Sun in our solar system, known for its deep blue color.'
    },
    'Pluto': {
        radius: '1,188.3 km',
        tilt: '122.53°',
        rotation: '6.4 Earth days',
        orbit: '248 Earth years',
        distance: '5.9 billion km',
        moons: '5 (Charon, Styx, Nix, Kerberos, Hydra)',
        info: 'Originally classified as the ninth planet, Pluto is now considered a dwarf planet.'
    }
};


// Array of planets and atmospheres for raycasting
const raycastTargets = [
  mercury.planet, venus.planet, venus.Atmosphere, earth.planet, earth.Atmosphere, 
  mars.planet, jupiter.planet, saturn.planet, uranus.planet, neptune.planet, pluto.planet
];

// ******  SHADOWS  ******
renderer.shadowMap.enabled = true;
pointLight.castShadow = true;

//properties for the point light
pointLight.shadow.mapSize.width = 1024;
pointLight.shadow.mapSize.height = 1024;
pointLight.shadow.camera.near = 10;
pointLight.shadow.camera.far = 20;

//casting and receiving shadows
earth.planet.castShadow = true;
earth.planet.receiveShadow = true;
earth.Atmosphere.castShadow = true;
earth.Atmosphere.receiveShadow = true;
earth.moons.forEach(moon => {
moon.mesh.castShadow = true;
moon.mesh.receiveShadow = true;
});
mercury.planet.castShadow = true;
mercury.planet.receiveShadow = true;
venus.planet.castShadow = true;
venus.planet.receiveShadow = true;
venus.Atmosphere.receiveShadow = true;
mars.planet.castShadow = true;
mars.planet.receiveShadow = true;
jupiter.planet.castShadow = true;
jupiter.planet.receiveShadow = true;
jupiter.moons.forEach(moon => {
  moon.mesh.castShadow = true;
  moon.mesh.receiveShadow = true;
  });
saturn.planet.castShadow = true;
saturn.planet.receiveShadow = true;
saturn.Ring.receiveShadow = true;
uranus.planet.receiveShadow = true;
neptune.planet.receiveShadow = true;
pluto.planet.receiveShadow = true;




function animate(){

  //rotating planets around the sun and itself
  sun.rotateY(0.001 * settings.acceleration);
  mercury.planet.rotateY(0.001 * settings.acceleration);
  mercury.planet3d.rotateY(0.004 * settings.accelerationOrbit);
  venus.planet.rotateY(0.0005 * settings.acceleration)
  venus.Atmosphere.rotateY(0.0005 * settings.acceleration);
  venus.planet3d.rotateY(0.0006 * settings.accelerationOrbit);
  earth.planet.rotateY(0.005 * settings.acceleration);
  earth.Atmosphere.rotateY(0.001 * settings.acceleration);
  earth.planet3d.rotateY(0.001 * settings.accelerationOrbit);
  mars.planet.rotateY(0.01 * settings.acceleration);
  mars.planet3d.rotateY(0.0007 * settings.accelerationOrbit);
  jupiter.planet.rotateY(0.005 * settings.acceleration);
  jupiter.planet3d.rotateY(0.0003 * settings.accelerationOrbit);
  saturn.planet.rotateY(0.01 * settings.acceleration);
  saturn.planet3d.rotateY(0.0002 * settings.accelerationOrbit);
  uranus.planet.rotateY(0.005 * settings.acceleration);
  uranus.planet3d.rotateY(0.0001 * settings.accelerationOrbit);
  neptune.planet.rotateY(0.005 * settings.acceleration);
  neptune.planet3d.rotateY(0.00008 * settings.accelerationOrbit);
  pluto.planet.rotateY(0.001 * settings.acceleration)
  pluto.planet3d.rotateY(0.00006 * settings.accelerationOrbit)

// Animate Earth's moon
if (earth.moons) {
  earth.moons.forEach(moon => {
    const time = performance.now();
    const tiltAngle = 5 * Math.PI / 180;

    const moonX = earth.planet.position.x + moon.orbitRadius * Math.cos(time * moon.orbitSpeed);
    const moonY = moon.orbitRadius * Math.sin(time * moon.orbitSpeed) * Math.sin(tiltAngle);
    const moonZ = earth.planet.position.z + moon.orbitRadius * Math.sin(time * moon.orbitSpeed) * Math.cos(tiltAngle);

    moon.mesh.position.set(moonX, moonY, moonZ);
    moon.mesh.rotateY(0.01);
  });
}
// Animate Mars' moons
if (marsMoons){
marsMoons.forEach(moon => {
  if (moon.mesh) {
    const time = performance.now();

    const moonX = mars.planet.position.x + moon.orbitRadius * Math.cos(time * moon.orbitSpeed);
    const moonY = moon.orbitRadius * Math.sin(time * moon.orbitSpeed);
    const moonZ = mars.planet.position.z + moon.orbitRadius * Math.sin(time * moon.orbitSpeed);

    moon.mesh.position.set(moonX, moonY, moonZ);
    moon.mesh.rotateY(0.001);
  }
});
}

// Animate Jupiter's moons
if (jupiter.moons) {
  jupiter.moons.forEach(moon => {
    const time = performance.now();
    const moonX = jupiter.planet.position.x + moon.orbitRadius * Math.cos(time * moon.orbitSpeed);
    const moonY = moon.orbitRadius * Math.sin(time * moon.orbitSpeed);
    const moonZ = jupiter.planet.position.z + moon.orbitRadius * Math.sin(time * moon.orbitSpeed);

    moon.mesh.position.set(moonX, moonY, moonZ);
    moon.mesh.rotateY(0.01);
  });
}

// Rotate asteroids
asteroids.forEach(asteroid => {
  asteroid.rotation.y += 0.0001;
  asteroid.position.x = asteroid.position.x * Math.cos(0.0001 * settings.accelerationOrbit) + asteroid.position.z * Math.sin(0.0001 * settings.accelerationOrbit);
  asteroid.position.z = asteroid.position.z * Math.cos(0.0001 * settings.accelerationOrbit) - asteroid.position.x * Math.sin(0.0001 * settings.accelerationOrbit);
});

// ****** OUTLINES ON PLANETS ******
raycaster.setFromCamera(mouse, camera);

// Check for intersections
var intersects = raycaster.intersectObjects(raycastTargets);

// Reset all outlines
outlinePass.selectedObjects = [];

if (intersects.length > 0) {
  const intersectedObject = intersects[0].object;

  // If the intersected object is an atmosphere, find the corresponding planet
  if (intersectedObject === earth.Atmosphere) {
    outlinePass.selectedObjects = [earth.planet];
  } else if (intersectedObject === venus.Atmosphere) {
    outlinePass.selectedObjects = [venus.planet];
  } else {
    // For other planets, outline the intersected object itself
    outlinePass.selectedObjects = [intersectedObject];
  }
}
// ******  ZOOM IN/OUT  ******
if (isMovingTowardsPlanet) {
  // Smoothly move the camera towards the target position
  camera.position.lerp(targetCameraPosition, 0.03);

  // Check if the camera is close to the target position
  if (camera.position.distanceTo(targetCameraPosition) < 1) {
      isMovingTowardsPlanet = false;
      showPlanetInfo(selectedPlanet.name);

  }
} else if (isZoomingOut) {
  camera.position.lerp(zoomOutTargetPosition, 0.05);

  if (camera.position.distanceTo(zoomOutTargetPosition) < 1) {
      isZoomingOut = false;
  }
}

  controls.update();
  requestAnimationFrame(animate);
  composer.render();
}
loadAsteroids('/asteroids/asteroidPack.glb', 1000, 130, 160);
loadAsteroids('/asteroids/asteroidPack.glb', 3000, 352, 370);
animate();

window.addEventListener('mousemove', onMouseMove, false);
window.addEventListener('mousedown', onDocumentMouseDown, false);
window.addEventListener('resize', function(){
  camera.aspect = window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth,window.innerHeight);
  composer.setSize(window.innerWidth,window.innerHeight);
});
// ---- INTRO CINEMATICA ----
const introScreen = document.getElementById('intro-screen');
const introVideo = document.getElementById('intro-video');

const frases = [
  { texto: "Durante siglos, el ser humano alzó la vista al cielo y se preguntó qué había ahí arriba.", tiempo: 10000, duracion: 10000 },
  { texto: "Primero creamos historias con nuestra imaginación y les pusimos nombres a las luces del cielo. Las convertimos en dioses y guerreros, otorgándoles personalidades, virtudes y defectos que daban sentido al mundo.", tiempo: 20000, duracion: 10000 },
  { texto: "Pero la curiosidad del ser humano no se quedó solo en la imaginación. Lo llevó a investigar. A explorar el espacio. A mandar sondas y telescopios. Descubrimos que el universo resultó ser más extraño de lo que cualquier historia imaginó.", tiempo: 31000, duracion: 10000 },
  { texto: "Y, aun así, seguimos dándoles significado. Interpretándolos. Asignándoles emociones. Relacionándolos con lo que somos.", tiempo: 42000, duracion: 10000 },
  { texto: "Es momento de mirar al cielo una vez más.", tiempo: 51000, duracion: 4000 },
  { texto: "Bienvenidos al sistema solar.", tiempo: 55000, duracion: 10000 }
];

frases.forEach(({ texto, tiempo, duracion = 10000 }) => {
  setTimeout(() => {
    const div = document.createElement('div');
    div.innerText = texto;
    div.style.cssText = `
      position: absolute;
      bottom: 15%;
      left: 50%;
      transform: translateX(-50%);
      color: white;
      font-size: 1.2rem;
      text-align: center;
      max-width: 70%;
      font-family: Georgia, serif;
      text-shadow: 0 0 20px rgba(255,255,255,0.5);
      background: rgba(0, 0, 0, 0.45);
      padding: 16px 24px;
      border-radius: 8px;
      animation: fadeInOut ${duracion/1000}s ease forwards;
    `;
    introScreen.appendChild(div);
    setTimeout(() => div.remove(), duracion);
  }, tiempo);
});

introVideo.addEventListener('ended', () => {
  introScreen.style.transition = 'opacity 1.5s';
  introScreen.style.opacity = '0';
  setTimeout(() => {
    introScreen.style.display = 'none';

    // Mostrar pantalla promocional
    const promoScreen = document.getElementById('promo-screen');
    const promoTitle = document.getElementById('promo-title');
    const promoContent = document.getElementById('promo-content');

    promoScreen.style.opacity = '1';

    // Después de 2 segundos, mover el título hacia arriba
    setTimeout(() => {
      promoTitle.style.top = '15%';
      promoTitle.style.fontSize = '1.8rem';

      // Mostrar el texto y los botones
      setTimeout(() => {
        promoContent.style.opacity = '1';
      }, 1000);
    }, 2000);

  }, 1500);
});

// Botones de rutas
document.querySelectorAll('.ruta-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const ruta = btn.getAttribute('data-ruta');
    window.rutaActual = ruta;
    console.log('Ruta seleccionada:', ruta);

    const promoScreen = document.getElementById('promo-screen');
    promoScreen.style.transition = 'opacity 1.5s';
    promoScreen.style.opacity = '0';

    setTimeout(() => {
      promoScreen.style.display = 'none';
      document.body.classList.remove('no-scene');

      // Mostrar texto introductorio si la ruta es mitológico
      if (ruta === 'mitologico') {
        const introMito = document.getElementById('intro-mitologico');
        introMito.style.opacity = '1';
        introMito.style.pointerEvents = 'auto';

        setTimeout(() => {
          introMito.style.opacity = '0';
          setTimeout(() => {
            introMito.style.pointerEvents = 'none';
          }, 1500);
        }, 20000);
      }
if (ruta === 'cientifico') {
  const introCient = document.getElementById('intro-cientifico');
  introCient.style.opacity = '1';
  introCient.style.pointerEvents = 'auto';

  setTimeout(() => {
    introCient.style.opacity = '0';
    setTimeout(() => {
      introCient.style.pointerEvents = 'none';
    }, 1500);
  }, 20000);
}
if (ruta === 'emocional') {
  const introEmo = document.getElementById('intro-emocional');
  introEmo.style.opacity = '1';
  introEmo.style.pointerEvents = 'auto';

  setTimeout(() => {
    introEmo.style.opacity = '0';
    setTimeout(() => {
      introEmo.style.pointerEvents = 'none';
    }, 1500);
  }, 20000);
}
    }, 1500);
  });
});
document.getElementById('closePlanetInfo').addEventListener('click', closeInfo);
document.getElementById('back-to-rutas').addEventListener('click', () => {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
  currentTimeouts.forEach(t => clearTimeout(t));
  currentTimeouts = [];

  const info = document.getElementById('planetInfo');
  info.style.display = 'none';
  info.style.pointerEvents = 'none';

  document.body.classList.add('no-scene');

  const promoScreen = document.getElementById('promo-screen');
  promoScreen.style.display = 'flex';
  promoScreen.style.opacity = '1';

  const promoTitle = document.getElementById('promo-title');
  const promoContent = document.getElementById('promo-content');
  promoTitle.style.top = '50%';
  promoTitle.style.fontSize = '3.5rem';
  promoContent.style.opacity = '0';

  setTimeout(() => {
    promoTitle.style.top = '15%';
    promoTitle.style.fontSize = '1.8rem';
    setTimeout(() => {
      promoContent.style.opacity = '1';
    }, 1000);
  }, 500);
});
