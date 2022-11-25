/* global THREE */
/* global dat */
/******************************************************************************
*******************************************************************************
  -The objective of this asignment is to create a planetary system that will 
contain one star, at least five planets and at least two moons
  
Highlighted sources:
https://threejs.org/docs/#manual/en/introduction/Creating-a-scene
https://r105.threejsfundamentals.org/threejs/lessons/threejs-primitives.html
https://threejs.org/docs/#api/en/geometries/LatheGeometry
https://threejs.org/docs/#manual/en/introduction/How-to-update-things
https://threejs.org/docs/?q=buffer#api/en/core/BufferGeometry
https://threejs.org/docs/#api/en/extras/curves/CatmullRomCurve3
*******************************************************************************
******************************************************************************/

// ==============================================================================
// ==============================================================================
// Global variables and function calling
// ==============================================================================
// ==============================================================================
// Scene, renderer and cameras
let scene;
let renderer;

let planetariumCamera;
let planetariumCameraReference;
let spaceshipCamera;
let spaceship;
let flyControls;
let view = 1;
let flyingT0;
let t1;
let secs;

// Basic planetarium related variables
let star;
let planets = [];
let satellites = [];
let planetRotationSpeed = 0.001;

// GUI
let gui = new dat.gui.GUI();
let earthSpeed = 1;

// Light related variables
let t0 = 0;
let timestamp;
let TIME_TIC = 0.001


// Function calling
init();
animate();

// ==============================================================================
// ==============================================================================
// Buttons and html related section
// ==============================================================================
// ==============================================================================
var info = document.createElement("div");
info.style.position = "absolute";
info.style.top = "1em";
info.style.left = "5%";
info.style.color = "#ffffff";
info.style.fontWeight = "bold";
info.style.fontSize = "1.4em";
info.style.zIndex = "1";
info.style.fontFamily = "Monospace";
info.innerHTML = `Instrucciones de uso:
Cambiar de vista con las teclas 1 2 3
`;
var isShowingInfo = true;
document.body.appendChild(info);


// ==================================
// Buttons events listeners functions
// ==================================

/**
 * Function that will the buttons' event listeners
 */
function initButtonsEventListeners() {
}


// ==============================================================================
// ==============================================================================
// Planetarium initialization section
// ==============================================================================
// ==============================================================================
// ******************************************************************************
// ===================================
// Auxiliary object creating functions
// ===================================
/**
 * Will create the planetarium's star
 * @param - {float}           radius   - radius of the star
 * @param - {hex}             color    - color of the star
 * @param - {TextureLoader}   texture  - texture map of the star
 */
function createStar(radius, color, texture = undefined) {
  let geometry = new THREE.SphereGeometry( radius, 32, 16 );
	let material = new THREE.MeshPhongMaterial( { color: color } );
  // Texture
  if (texture != undefined) {
    material.map = texture;
  }
	star = new THREE.Mesh( geometry, material );
	scene.add( star );
}

/**
 * Will create a planet
 * @param - {float}       radius         - radius of the planet
 * @param - {float}       distance       - distance to the star
 * @param - {hex}         color          - color of the planet and orbit
 * @param - {float}       velocity       - orbital speed of the planet
 * @param - {float}       ellipseRadius1 - one of the ellipse's radiuses
 * @param - {float}       ellipseRadius2 - the other ellipse radius
 * @param - {radian}      angle          - angle of the orbit
 * @param - {bool}        castShadow     - whether the satellite will cast a shadow
 * @param - {bool}        receiveShadow  - whether the satellite will receive a shadow
 */
function createPlanet(radius, distance, color, velocity,
                       ellipseRadius1, ellipseRadius2, angle,
                       castShadow = false, receiveShadow = false,
                       texture = undefined, texbump = undefined, texspec = undefined, texalpha = undefined
                      ) {
  var pivot = new THREE.Object3D();
  pivot.rotation.x = angle;
	scene.add(pivot);
  let geometry = new THREE.SphereGeometry(radius, 32, 16);
	let material = new THREE.MeshPhongMaterial({ color: 0xffffff});
  
  // Textures
  // Texture map
  if (texture != undefined){
    material.map = texture;
  }
  // Bumpmap
  if (texbump != undefined){
    material.bumpMap = texbump;
    material.bumpScale = 0.5;
  }

  // Specular map
  if (texspec != undefined){
    material.specularMap = texspec;
    material.specular = new THREE.Color('grey');
  }
  
	let planet = new THREE.Mesh(geometry, material);
	planet.userData.distance = distance;
	planet.userData.speed = velocity;
  
  // Ellipse
  planet.userData.ellipseRadius1 = ellipseRadius1;
	planet.userData.ellipseRadius2 = ellipseRadius2;
  
  // Shadows
  planet.castShadow = castShadow;
  planet.receiveShadow = castShadow;
  
  planet.rotation.x -= Math.PI/2;
  
	planets.push(planet);
	pivot.add(planet);
  
  let curve = new THREE.EllipseCurve(
		0,  0,            		                                  // Centre
		distance*ellipseRadius1, distance*ellipseRadius2        // Ellipse's radiuses
		);
		let points = curve.getPoints( 50 );
		let curve_geometry = new THREE.BufferGeometry().setFromPoints( points );
		let curve_material = new THREE.LineBasicMaterial( { color: color } );
		let orbit = new THREE.Line( curve_geometry, curve_material );
		pivot.add(orbit);
}

/**
 * Will a satellite
 * @param - {THREE.Mesh}  planet         - the planet the satellite will orbit
 * @param - {float}       radius         - radius of the satellite
 * @param - {float}       distance       - distance to the planet
 * @param - {float}       velocity       - velocity of translation
 * @param - {hex}         color          - color of the satellite
 * @param - {float}       angle          - angle of the orbit
 * @param - {bool}        castShadow     - whether the satellite will cast a shadow
 * @param - {bool}        receiveShadow  - whether the satellite will receive a shadow
 */
function createSatellite(planet, radius, distance, velocity, color, angle, castShadow = false, receiveShadow = false,
                         texture = undefined, texbump = undefined, texspec = undefined
                         ) {
  var pivot = new THREE.Object3D();
	pivot.rotation.x = angle;
	planet.add(pivot);
	var geometry = new THREE.SphereGeometry(radius, 32, 16);
	var material = new THREE.MeshPhongMaterial({ color: color});
  
  // Textures
  // Texture map
  if (texture != undefined){
    material.map = texture;
  }
  // Bumpmap
  if (texbump != undefined){
    material.bumpMap = texbump;
    material.bumpScale = 0.5;
  }

  // Specular map
  if (texspec != undefined){
    material.specularMap = texspec;
    material.specular = new THREE.Color('grey');
  }
  
  
	var satellite = new THREE.Mesh(geometry, material);
	satellite.userData.distance = distance;
	satellite.userData.speed = velocity;
  
  //Shadows
  satellite.castShadow = castShadow;
  satellite.receiveShadow = castShadow;
  

	satellites.push(satellite);
	pivot.add(satellite);
}

/**
 * Will create the planetarium's star
 * @param - {THREE.Mesh} planet          - the planet the with the ring will orbit
 * @param - {hex}        color           - color of the ring
 * @param - {float}      ellipseRadius1  - one of the ellipse's radiuses
 * @param - {float}      ellipseRadius2  - the other ellipse radius
 * @param - {float}      distance        - distance to the planet
 * @param - {float}      thickness       - thickness of the line material
 * @param - {radian}     angle           - angle to the planet
 * @param - {float}      numberOfRings   - number of rings 
 */
function createRings(planet, color, ellipseRadius1, ellipseRadius2, distance, thickness, angle, numberOfRings) {
  var pivot = new THREE.Object3D();
	pivot.rotation.x = angle;
	planet.add(pivot);
  for (let i = distance - numberOfRings; i < distance + numberOfRings; i += 0.1) {
    let curve = new THREE.EllipseCurve(
		0,  0,            		                                  // Centre
		i*ellipseRadius1, i*ellipseRadius2        // Ellipse's radiuses
		);
		let points = curve.getPoints( 50 );
		let curve_geometry = new THREE.BufferGeometry().setFromPoints( points );
		let curve_material = new THREE.LineBasicMaterial( { color: color, linewidth: thickness } );
		let orbit = new THREE.Line( curve_geometry, curve_material );
		pivot.add(orbit);
  }
}
// ******************************************************************************
// ==================================
// Tier II calling functions
// ==================================
/**
 * Will initialize the planetarium's disposition by calling object 
 * creating functions.
 */
function initPlanetarium() {
  // Sun
  createStar(2, 0xffff00, new THREE.TextureLoader().load("https://cdn.glitch.global/b87391a0-3d13-4626-8a39-3b08374d727c/sunmap.jpg?v=1667388961013"));
  
  // Mercury
  const mercuryTexture = new THREE.TextureLoader().load("https://cdn.glitch.global/b87391a0-3d13-4626-8a39-3b08374d727c/mercurymap.jpg?v=1667388959816");
  const mercuryBump = new THREE.TextureLoader().load("https://cdn.glitch.global/b87391a0-3d13-4626-8a39-3b08374d727c/mercurybump.jpg?v=1667388960114");
  createPlanet(0.3, 5, 0xb1adad, 4.16*earthSpeed, 1.1, 1.5, Math.PI/2.1, true, true, mercuryTexture, mercuryBump);
  
  // Venus
  const venusTexture = new THREE.TextureLoader().load("https://cdn.glitch.global/b87391a0-3d13-4626-8a39-3b08374d727c/venusmap.jpg?v=1667388949248");
  const venusBump = new THREE.TextureLoader().load("https://cdn.glitch.global/b87391a0-3d13-4626-8a39-3b08374d727c/venusbump.jpg?v=1667388961349");
  createPlanet(0.9, 9, 0xa57c1b, 1.62*earthSpeed, 1.3, 1.4, Math.PI/2.2, true, true, venusTexture, venusBump);
  
  // Earth
  const earthTexture = new THREE.TextureLoader().load("https://cdn.glitch.global/b87391a0-3d13-4626-8a39-3b08374d727c/earthmap1k.jpg?v=1667388959614");
  const earthBump = new THREE.TextureLoader().load("https://cdn.glitch.global/b87391a0-3d13-4626-8a39-3b08374d727c/earthbump1k.jpg?v=1667388958724");
  const earthSpec = new THREE.TextureLoader().load("https://cdn.glitch.global/b87391a0-3d13-4626-8a39-3b08374d727c/earthspec1k.jpg?v=1667388958972");
  createPlanet(1, 13, 0x0000ff, earthSpeed, 1.5, 1.8, Math.PI/2, true, true, earthTexture, earthBump, earthSpec)
  
  // Moon
  const moonTexture = new THREE.TextureLoader().load("https://cdn.glitch.global/b87391a0-3d13-4626-8a39-3b08374d727c/moonmap1k.jpg?v=1667388960730");
  const moonBump = new THREE.TextureLoader().load("https://cdn.glitch.global/b87391a0-3d13-4626-8a39-3b08374d727c/moonbump1k.jpg?v=1667388960408");
  createSatellite(planets[2], 0.26, 2, 2*earthSpeed, 0x8c8c94, 2, true, true, moonTexture, moonBump)
  
  // Mars
  const marsTexture = new THREE.TextureLoader().load("https://cdn.glitch.global/b87391a0-3d13-4626-8a39-3b08374d727c/mars_1k_color.jpg?v=1667391338604");
  const marsBump = new THREE.TextureLoader().load("https://cdn.glitch.global/b87391a0-3d13-4626-8a39-3b08374d727c/mars_1k_topo.jpg?v=1667391338066");
  createPlanet(0.6, 18, 0xc1440e, 0.53*earthSpeed, 1.7, 1.6, Math.PI/1.8, true, true, marsTexture, marsBump)
  // Phobos
  const phobosBump = new THREE.TextureLoader().load("https://cdn.glitch.global/b87391a0-3d13-4626-8a39-3b08374d727c/phobosbump.jpg?v=1667391339074");
  createSatellite(planets[3], 0.3, 1.5, 1.4*earthSpeed, 0x8c8c94, 0, true, true, moonTexture, phobosBump)
  // Deimos
  const deimosBump = new THREE.TextureLoader().load("https://cdn.glitch.global/b87391a0-3d13-4626-8a39-3b08374d727c/deimosbump.jpg?v=1667391338532");
  createSatellite(planets[3], 0.4, 2.5, 2*earthSpeed, 0x8c8c94, 90, true, true, moonTexture, deimosBump)
  
  // Jupiter
  const jupiterTexture = new THREE.TextureLoader().load("https://cdn.glitch.global/b87391a0-3d13-4626-8a39-3b08374d727c/jupitermap.jpg?v=1667391339104");
  createPlanet(3.5, 21, 0xd1a77f, 0.084*earthSpeed, 1.8, 2, Math.PI/2.1, true, true, jupiterTexture);
  // Europa
  createSatellite(planets[4], 0.8, 5, 2*earthSpeed, 0x8c8c94, 90, true, true)
  
  // Saturn
  const saturnTexture = new THREE.TextureLoader().load("https://cdn.glitch.global/b87391a0-3d13-4626-8a39-3b08374d727c/saturnmap.jpg?v=1667391338851");
  createPlanet(3, 30, 0xc3924f, 0.04*earthSpeed, 2, 2.2, Math.PI/1.9, true, true, saturnTexture);
  // Rings
  createRings(planets[5], 0xd8ae6d, 2, 2.5, 2, 50, Math.PI/6, 0.5, true, true)
  
  
  // Uranus
  const uranusTexture = new THREE.TextureLoader().load("https://cdn.glitch.global/b87391a0-3d13-4626-8a39-3b08374d727c/uranusmap.jpg?v=1667391337960");
  createPlanet(2.8, 38, 0x36add0, 0.03*earthSpeed, 2.2, 2, Math.PI/2.1, true, true, uranusTexture);
  // Rings
  createRings(planets[6], 0x43b0d0, 2, 2.5, 2, 50, 0, 0.2, true, true)
  
}

/**
 * Will initialize ambient light
 */
function initAmbientLight() {
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
	scene.add(ambientLight);
}

/**
 * Will initialize the point light (the star)
 */
function initPointLight(castShadow = false) {
  const pointLight = new THREE.PointLight(0xffffff, 3, 100, 1);
	pointLight.position.set(0, 0, 0);
  pointLight.castShadow = castShadow;
	scene.add(pointLight);
}


// ******************************************************************************
// ==================================
// Tier I calling functions
// ==================================

/**
 * Will initialize the scene and renderer
 */
function initSceneAndRenderer() {
  // Scene
  scene = new THREE.Scene();
  // Renderer
  renderer = new THREE.WebGLRenderer();
  // Shadow activation
  renderer.shadowMap.enabled = true;
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);
}

/**
 * Will initialize both cameras
 */
function initCamerasAndControls() {
  // Planetarium view
  planetariumCamera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  // Updating position
  planetariumCamera.position.set(0, 20, 60);
  // Orbit controls
  let controls = new THREE.OrbitControls(planetariumCamera, renderer.domElement);
  
  // Spaceship view
  spaceshipCamera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  // Updating position
  spaceshipCamera.position.set(0, 0, 40);
  flyControls = new THREE.FlyControls(spaceshipCamera, renderer.domElement);
  flyControls.dragToLook = true;
  flyControls.movementSpeed = .005;
  flyControls.rollSpeed = .0005;

  flyingT0 = new Date();
}

/**
 * Will initialize the lighting present in the scene
 */
function initLighting() {
  initAmbientLight();
  initPointLight(true);
}

/**
 * Will initialize keyboard listener
 */
function onDocumentKeyDown(event) {
  var keyCode = event.which;
  switch(keyCode) {
    case 49:
    case 97:
      view = 1;
      break;
    case 50:
    case 98:
      view = 2;
      break;
    case 51:
    case 99:
      view = 3;
      break;
    default:
      console.log(keyCode);
  }
};


/**
 * Will init gui elements
 */
function initGUI() {
  // Planets velocity in relation to Earth's velocity
  const translationSpeedFolder = gui.addFolder("Controles de los Planetas");
  const translationSpeedParams = { "Traslacion": 1.0, "Rotacion": 0.001}
  translationSpeedFolder
    .add(translationSpeedParams, 'Traslacion', 0.001, 1.4, 0.001)
    .onChange((value) => earthSpeed = value);
  translationSpeedFolder
    .add(translationSpeedParams, 'Rotacion', 0.0001, 0.01, 0.0001)
    .onChange((value) => planetRotationSpeed = value);
  translationSpeedFolder.open();
  
  // Fly controls velocity
  const flyControlsFolder = gui.addFolder("Controles de la nave");
  const flyControlsParams = { "Movimiento": 0.005, "Rotacion": 0.0005}
  flyControlsFolder
    .add(flyControlsParams, 'Movimiento', 0.0001, 0.01, 0.0001)
    .onChange((value) => flyControls.movementSpeed = value);
  flyControlsFolder
    .add(flyControlsParams, 'Rotacion', 0.00001, 0.001, 0.00001)
    .onChange((value) => flyControls.rollSpeed = value);
  flyControlsFolder.open();
}
 
/**
 * Will init the spaceship, a tetrahedron
 */
function initSpaceShip() {
  const geometry = new THREE.TetrahedronGeometry(1);
  const material = new THREE.MeshPhongMaterial({ color: 0xabcdef });
  spaceship = new THREE.Mesh(geometry, material);
  spaceship.castShadow = true;
  spaceship.receiveShadow = true;
  spaceship.position.x = spaceshipCamera.position.x;
  spaceship.position.y = spaceshipCamera.position.y;
  spaceship.position.z = spaceshipCamera.position.z;
  scene.add(spaceship);
}

/**
 * Will init the spaceship, a tetrahedron
 */
function initOrbitalCameraDeathStar() {
  const geometry = new THREE.TetrahedronGeometry(0.5, 5);
  const material = new THREE.MeshPhongMaterial({ color: 0xfedcba });
  planetariumCameraReference = new THREE.Mesh(geometry, material);
  planetariumCameraReference.castShadow = true;
  planetariumCameraReference.receiveShadow = true;
  planetariumCameraReference.position.x = planetariumCamera.position.x;
  planetariumCameraReference.position.y = planetariumCamera.position.y;
  planetariumCameraReference.position.z = planetariumCamera.position.z;
  scene.add(planetariumCameraReference);
}


/**
 * Will handle the initialization of the program
 */
function init() {
  initButtonsEventListeners();
  initSceneAndRenderer();
  initCamerasAndControls();
  initPlanetarium();
  initLighting();
  initGUI();
  initSpaceShip();
  initOrbitalCameraDeathStar();
  document.addEventListener("keydown", onDocumentKeyDown, false);
}



// ==============================================================================
// ==============================================================================
// Animation loop
// ==============================================================================
// ==============================================================================
/**
 * Planetarium view
 */
function view1() {
  let x,y,w,h;
  x = Math.floor( window.innerWidth * 0.0 );
  y = Math.floor( window.innerHeight * 0.0 );
  w = Math.floor( window.innerWidth * 1.0 );
  h = Math.floor( window.innerHeight * 1.0 );
  renderer.setScissorTest( false );
  planetariumCamera.aspect = w/h;
  planetariumCamera.updateProjectionMatrix();
  renderer.setViewport( x,y,w,h );
  // Update camera element
  planetariumCameraReference.position.x = planetariumCamera.position.x;
  planetariumCameraReference.position.y = planetariumCamera.position.y;
  planetariumCameraReference.position.z = planetariumCamera.position.z;
  renderer.render(scene, planetariumCamera);
}

/**
 * Spaceship view
 */
function view2() {
  // Update viewport and camera aspect
  let x,y,w,h;
  x = Math.floor( window.innerWidth * 0.0 );
  y = Math.floor( window.innerHeight * 0.0 );
  w = Math.floor( window.innerWidth * 1.0 );
  h = Math.floor( window.innerHeight * 1.0 );
  renderer.setScissorTest( false );
  spaceshipCamera.aspect = w/h;
  spaceshipCamera.updateProjectionMatrix();
  renderer.setViewport( x,y,w,h );
  // Movement
  t1 = new Date();
  secs = (t1 - flyingT0) / 1000;
  flyControls.update(1 * secs);
  // Update tetrahedron
  spaceship.position.x = spaceshipCamera.position.x;
  spaceship.position.y = spaceshipCamera.position.y;
  spaceship.position.z = spaceshipCamera.position.z;
  renderer.render(scene, spaceshipCamera);
  
}

/**
 * Both views
 */
function view3() {
  renderer.setScissorTest( true );
  // Update viewport and camera aspect
  let x,y,w,h;
  x = 0.0;
  y = 0.0;
  w = Math.floor( window.innerWidth * 0.5 );
  h = Math.floor( window.innerHeight * 1.0 );
  renderer.setViewport( x,y,w,h );
  renderer.setScissor( x,y,w,h );
  // Movement
  t1 = new Date();
  secs = (t1 - flyingT0) / 1000;
  flyControls.update(1 * secs);
  spaceshipCamera.aspect = w/h;
  spaceshipCamera.updateProjectionMatrix();
  // Update tetrahedron
  spaceship.position.x = spaceshipCamera.position.x;
  spaceship.position.y = spaceshipCamera.position.y;
  spaceship.position.z = spaceshipCamera.position.z;
  renderer.render( scene, spaceshipCamera );
  

  x = Math.floor( window.innerWidth * 0.5 );
  y = 0;
  w = Math.floor( window.innerWidth * 1.0 );
  h = Math.floor( window.innerHeight * 1.0 );
  renderer.setViewport( x,y,w,h );
  renderer.setScissor( x,y,w,h );
  planetariumCamera.aspect = w/h;
  planetariumCamera.updateProjectionMatrix();
  // Update camera element
  planetariumCameraReference.position.x = planetariumCamera.position.x;
  planetariumCameraReference.position.y = planetariumCamera.position.y;
  planetariumCameraReference.position.z = planetariumCamera.position.z;
  renderer.render(scene, planetariumCamera);
}

function animate() {
  requestAnimationFrame(animate);
  
  timestamp = (Date.now() - t0) * TIME_TIC;
  // Update planets
  for (let planet of planets) {
    planet.position.x = Math.cos(timestamp * planet.userData.speed*earthSpeed) * planet.userData.ellipseRadius1 * planet.userData.distance;
    planet.position.y = Math.sin(timestamp * planet.userData.speed*earthSpeed) * planet.userData.ellipseRadius2 * planet.userData.distance;
    planet.rotation.y += planetRotationSpeed;
  }
  
  // Update satellites
  for (let satellite of satellites) {
    satellite.position.x = Math.cos(timestamp * satellite.userData.speed*earthSpeed) * satellite.userData.distance;
	  satellite.position.y = Math.sin(timestamp * satellite.userData.speed*earthSpeed) * satellite.userData.distance;
  }
  
  switch(view) {
    case 1:
      view1();
      break;
    case 2:
      view2();
      break;
    case 3:
      view3();
      break;
  }
}
