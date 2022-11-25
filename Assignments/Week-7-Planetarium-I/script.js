/* global THREE */
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
// Scene, renderer and camera
let scene;
let camera;
let renderer;

// Basic planetarium related variables
let star;
let planets = [];
let satellites = [];

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
info.style.top = "4em";
info.style.left = "25%";
info.style.width = "60%";
info.style.textAlign = "center";
info.style.color = "#ffffff";
info.style.fontWeight = "bold";
info.style.fontSize = "1.3em";
info.style.backgroundColor = "black";
info.style.zIndex = "1";
info.style.fontFamily = "Monospace";
info.innerHTML = `<h1>Instrucciones de uso:</h1>
<ol><li>Seleccionar un primer punto sobre la recta x = 0.</li>
<li>Ir seleccionando el resto de puntos donde x > 0.</li>
<li>Seleccionar el punto final de nuevo sobre la recta x = 0.</li>
<li>Pulsar el botón para crear el sólido de revolución</li>
<li>Observar el sólido de revolución resultante con los controles de la cámara.</li>
`;
var isShowingInfo = false;



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
 * @param - {float} radius - radius of the star
 * @param - {hex}   color  - color of the star
 */
function createStar(radius, color) {
  let geometry = new THREE.SphereGeometry( radius, 32, 16 );
	let material = new THREE.MeshBasicMaterial( { color: color } );
	star = new THREE.Mesh( geometry, material );
	scene.add( star );
}

/**
 * Will create a planet
 * @param - {float}  radius         - radius of the planet
 * @param - {float}  distance       - distance to the star
 * @param - {hex}    color          - color of the planet
 * @param - {float}  velocity       - orbital speed of the planet
 * @param - {float}  ellipseRadius1 - one of the ellipse's radiuses
 * @param - {float}  ellipseRadius2 - the other ellipse radius
 * @param - {radian} angle          - angle of the orbit
 */
function createPlanet(radius, distance, color, velocity, ellipseRadius1, ellipseRadius2, angle) {
  var pivot = new THREE.Object3D();
  pivot.rotation.x = angle;
	scene.add(pivot);
  let geometry = new THREE.SphereGeometry(radius, 32, 16);
	let material = new THREE.MeshPhongMaterial({ color: color});
	let planet = new THREE.Mesh(geometry, material);
	planet.userData.distance = distance;
	planet.userData.speed = velocity;
  
  planet.userData.ellipseRadius1 = ellipseRadius1;
	planet.userData.ellipseRadius2 = ellipseRadius2;
  
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
 * @param - {THREE.Mesh}  planet   - the planet the satellite will orbit
 * @param - {float}       radius   - radius of the satellite
 * @param - {float}       distance - distance to the planet
 * @param - {float}       velocity - velocity of translation
 * @param - {hex}         color    - color of the satellite
 * @param - {float}       angle    - angle of the orbit
 */
function createSatellite(planet, radius, distance, velocity, color, angle) {
  var pivot = new THREE.Object3D();
	pivot.rotation.x = angle;
	planet.add(pivot);
	var geometry = new THREE.SphereGeometry(radius, 32, 16);
	var material = new THREE.MeshPhongMaterial({ color: color});
	var satellite = new THREE.Mesh(geometry, material);
	satellite.userData.distance = distance;
	satellite.userData.speed = velocity;

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
  createStar(2, 0xffff00);
  
  // Mercury
  createPlanet(0.3, 3, 0xb1adad, 4.16, 1.1, 1.5, Math.PI/2.1)
  
  // Venus
  createPlanet(0.9, 5, 0xa57c1b, 1.62, 1.3, 1.4, Math.PI/2.2)
  
  // Earth
  createPlanet(1, 7, 0x0000ff, 1, 1.5, 1.8, Math.PI/2)
  // Moon
  createSatellite(planets[2], 0.26, 2, 2, 0x8c8c94, 2)
  
  // Mars
  createPlanet(0.6, 10, 0xc1440e, 0.53, 1.7, 1.6, Math.PI/1.8)
  // Phobos
  createSatellite(planets[3], 0.3, 1.5, 1.4, 0x8c8c94, 0)
  // Deimos
  createSatellite(planets[3], 0.4, 2.5, 2, 0x8c8c94, 90)
  
  // Jupiter
  createPlanet(3.5, 14, 0xd1a77f, 0.084, 1.8, 2, Math.PI/2.1)
  // Europa
  createSatellite(planets[4], 0.8, 5, 2, 0x8c8c94, 90)
  
  // Saturn
  createPlanet(3, 19, 0xc3924f, 0.04, 2, 2.3, Math.PI/1.9)
  // Rings
  createRings(planets[5], 0xd8ae6d, 2, 2.5, 2, 50, Math.PI/6, 0.5)
  
  
  // Uranus
  createPlanet(2.8, 24, 0x36add0, 0.03, 2.3, 2, Math.PI/2.1)
  // Rings
  createRings(planets[6], 0x43b0d0, 2, 2.5, 2, 50, Math.PI/2, 0.2)
  
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
function initPointLight() {
  const pointLight = new THREE.PointLight(0xffffff, 3, 70, 1);
	pointLight.position.set(0, 0, 0);
	scene.add(pointLight);
}


// ******************************************************************************
// ==================================
// Tier I calling functions
// ==================================

/**
 * Will initialize the THREE elements such as the 
 * camera, scene and renderer
 */
function initBasicElements() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  // Updating position
  camera.position.set(0, 20, 60);
  // Orbit controls
  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  let controls = new THREE.OrbitControls(camera, renderer.domElement);
  document.body.appendChild(renderer.domElement);
}

/**
 * Will initialize the lighting present in the scene
 */
function initLighting() {
  initAmbientLight();
  initPointLight();
}

/**
 * Will handle the initialization of the program
 */
function init() {
  initButtonsEventListeners();
  initBasicElements();
  initPlanetarium();
  initLighting();
}


// ==============================================================================
// ==============================================================================
// Animation loop
// ==============================================================================
// ==============================================================================
function animate() {
  requestAnimationFrame(animate);
  
  timestamp = (Date.now() - t0) * TIME_TIC;
  // Update planets
  for (let planet of planets) {
    planet.position.x = Math.cos(timestamp * planet.userData.speed) * planet.userData.ellipseRadius1 * planet.userData.distance;
    planet.position.y = Math.sin(timestamp * planet.userData.speed) * planet.userData.ellipseRadius2 * planet.userData.distance;
  }
  
  // Update satellites
  for (let satellite of satellites) {
    satellite.position.x = Math.cos(timestamp * satellite.userData.speed) * satellite.userData.distance;
	  satellite.position.y = Math.sin(timestamp * satellite.userData.speed) * satellite.userData.distance;
  }
  
  renderer.render(scene, camera);
}
