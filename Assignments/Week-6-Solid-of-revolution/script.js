/* global THREE */
/******************************************************************************
*******************************************************************************
  -The objective of this asignment is to create a solid of revolution given its
profile.
  -Thus, the program is structured in two steps or phases:
  * Phase One: The phase where the user will proceed to select the points that
constitute the profile of the solid.
  * Phase Two: The phase where the user interacts looking at the solid of
revolution.

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
// Scene and sphere related variaibles
let scene;
let camera;
let renderer;
let intersectionPoints = [];

// Phase One related variables
let grid, profile, plain;
const MAX_POINTS = 500;
let raycaster;
let numberOfPoints;
let cameraXOffset = 2;

// Change this constant to change the divisions done when getting curves
const CURVE_DIVISIONS = 5;

let showCurvedProfile = false;
let curveProfile;

let clickedPointsAsVectors = [];

// Phase Two related variables
let curvedObject;
let straightEdgedObject;
let showCurvedObject = false;
let controls;

let isInPhaseOne = true;

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

/**
 * Will initialize the expected visibilities for the buttons in phase one
 */
function setPhaseOneButtonsVisibilities() {
  document.getElementById("showInfo").style.visibility = "visible";
  document.getElementById("displayStraightLines").style.visibility = "visible";
  document.getElementById("displayCurves").style.visibility = "visible";
  document.getElementById("createSolidOfRevolution").style.visibility ="hidden";
  document.getElementById("toggleObject").style.visibility = "hidden";
  document.getElementById("goToPhaseOne").style.visibility = "hidden";
}

/**
 * Will initialize the expected visibilities for the buttons in phase two
 */
function setPhaseTwoButtonsVisibilities() {
  document.getElementById("showInfo").style.visibility = "hidden";
  document.getElementById("displayStraightLines").style.visibility = "hidden";
  document.getElementById("displayCurves").style.visibility = "hidden";
  document.getElementById("createSolidOfRevolution").style.visibility ="hidden";
  document.getElementById("toggleObject").style.visibility = "visible";
  document.getElementById("goToPhaseOne").style.visibility = "visible";
}

// ==================================
// Buttons events listeners functions
// ==================================
function showInfoEventListener() {
  if (isShowingInfo) document.body.removeChild(info);
  else document.body.appendChild(info);
  isShowingInfo = !isShowingInfo;
}

function displayStraightLinesEventListener() {
  if (!showCurvedProfile) return null;
  if (curveProfile) curveProfile.visible = false;
  profile.visible = true;
  showCurvedProfile = !showCurvedProfile;
}

function displayCurvesEventListener() {
  if (showCurvedProfile) return null;
  if (curveProfile) curveProfile.visible = true;
  profile.visible = false;
  showCurvedProfile = !showCurvedProfile;
}

function toggleObjectEventListener() {
  showCurvedObject = !showCurvedObject;
  if (showCurvedObject) {
    curvedObject.visible = true;
    straightEdgedObject.visible = false;
  } else {
    curvedObject.visible = false;
    straightEdgedObject.visible = true;
  }
}

function goBackToPhaseOne() {
  // Will clear global variables
  intersectionPoints = [];
  clickedPointsAsVectors = [];
  controls.dispose();
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  isInPhaseOne = true;
  showCurvedProfile = false;
  curveProfile.visible = false;
  profile.visible = true;
  initPhaseOne();
}

/**
 * Function that will the buttons' event listeners
 */
function initButtonsEventListeners() {
  document.getElementById("showInfo").addEventListener("click", showInfoEventListener);
  document.getElementById("displayStraightLines").addEventListener("click", displayStraightLinesEventListener);
  document.getElementById("displayCurves").addEventListener("click", displayCurvesEventListener);
  document.getElementById("toggleObject").addEventListener("click", toggleObjectEventListener);
  document.getElementById("createSolidOfRevolution").addEventListener("click", advanceToPhaseTwo);
  document.getElementById("goToPhaseOne").addEventListener("click", goBackToPhaseOne);
}


// ==============================================================================
// ==============================================================================
// Init function and Phase One related section
// ==============================================================================
// ==============================================================================
/**
 * Will handle the initialization of the program
 */
function init() {
  initButtonsEventListeners();
  initCameraAndRenderer();
  initPhaseOne();
}

/**
 * Will initialize the camera and renderer for the first time
 */
function initCameraAndRenderer() {
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);
}

/**
 * Will proceed with the first part of the expected interaction, where the user
 * inputs the points to create the solid of revolution.
 */
function initPhaseOne() {
  // Init Scene
  scene = new THREE.Scene();
  
  // Will position the camera slightly to the "right"
  camera.position.set(cameraXOffset, 0, 7);

  // GridHelper Assistant
  grid = new THREE.GridHelper(20, 20);
  grid.position.set(0, 0, 0);
  grid.geometry.rotateX(Math.PI / 2);

  // Move slightly todwards the camera
  grid.position.set(0, 0, 0.05);
  scene.add(grid);

  // Plain in z=0
  let geometryp = new THREE.PlaneGeometry(20, 20);
  let materialp = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    side: THREE.DoubleSide,
  });
  plain = new THREE.Mesh(geometryp, materialp);
  plain.visible = false;
  scene.add(plain);

  // Raycaster to get the intersection
  raycaster = new THREE.Raycaster();

  // Poliline, more info in https://threejs.org/docs/#manual/en/introduction/How-to-update-things
  let geometry = new THREE.BufferGeometry();

  // Three values per vertex
  let positions = new Float32Array(MAX_POINTS * 3);
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

  // Drawing range
  numberOfPoints = 0;
  geometry.setDrawRange(0, numberOfPoints);
  let material = new THREE.LineBasicMaterial({ color: 0xff0000 });
  profile = new THREE.Line(geometry, material);
  // Add the graph to the scene
  scene.add(profile);

  // Draws a reference line at x = 0
  const xEquals0LineMaterial = new THREE.LineBasicMaterial({ color: 0x0ffff0 });
  const xEquals0LinePoints = [
    new THREE.Vector3(0, -20, 0),
    new THREE.Vector3(0, 20, 0),
  ];
  const xEquals0LineGeometry = new THREE.BufferGeometry().setFromPoints(
    xEquals0LinePoints
  );
  const xEquals0Line = new THREE.Line(
    xEquals0LineGeometry,
    xEquals0LineMaterial
  );
  scene.add(xEquals0Line);

  // Adds curved profile to the scene
  const curveGeometry = new THREE.BufferGeometry();
  let curvePositions = new Float32Array(MAX_POINTS * 3 * CURVE_DIVISIONS);
  curveGeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(curvePositions, 3)
  );
  const curveMaterial = new THREE.LineBasicMaterial({ color: 0x00ff00 });

  // Create the final object to add to the scene
  curveProfile = new THREE.Line(curveGeometry, curveMaterial);
  scene.add(curveProfile);
  curveProfile.visible = false;

  // Mouse click handler
  document.addEventListener("mousedown", onDocumentMouseDown);
  setPhaseOneButtonsVisibilities();
}

/**
 * Auxiliary function that will update the geometry related to the curved profile
 * of the solid of revolution
 */
function updateCurveProfile() {
  // Adds curved profile to the scene
  const curve = new THREE.CatmullRomCurve3(clickedPointsAsVectors);
  const curvePoints = curve.getPoints(CURVE_DIVISIONS * numberOfPoints);
  curveProfile.geometry.setFromPoints(curvePoints);
  curveProfile.geometry.attributes.position.needsUpdate = true;
}

/**
 * Event handler for mouse signals in Phase One
 */
function onDocumentMouseDown(event) {
  // Coordinate conversion
  const mouse = {
    x: (event.clientX / renderer.domElement.clientWidth) * 2 - 1,
    y: -(event.clientY / renderer.domElement.clientHeight) * 2 + 1,
  };

  // Ray definition for the intersection
  raycaster.setFromCamera(mouse, camera);

  // Intersection
  const intersects = raycaster.intersectObject(plain);

  // Asks for intersection
  if (intersects.length > 0) {
    // Will ignore negative x values for two reasons
    // 1: Using the buttons
    // 2: Creating the solid of revolution.
    let xIntersection = intersects[0].point.x;
    if (xIntersection < -0.2) {
      return null;
    } else if (xIntersection >= -0.2 && xIntersection < 0.1) {
      intersects[0].point.x = 0;
    }

    // The first point must be in x = 0
    if (numberOfPoints <= 0) {
      intersects[0].point.x = 0;
    }

    // Adds the vertex to the polyline
    const vertices = profile.geometry.attributes.position.array;

    vertices[numberOfPoints * 3] = intersects[0].point.x;
    vertices[numberOfPoints * 3 + 1] = intersects[0].point.y;
    vertices[numberOfPoints * 3 + 2] = intersects[0].point.z;
    numberOfPoints++;

    // Adds the vertex to the global variable
    clickedPointsAsVectors.push(
      new THREE.Vector3(
        intersects[0].point.x,
        intersects[0].point.y,
        intersects[0].point.z
      )
    );
    if (numberOfPoints > 1) updateCurveProfile();

    //Muestra el valor de la intersección
    console.log(intersects[0].point);

    createSphere(
      intersects[0].point.x,
      intersects[0].point.y,
      intersects[0].point.z,
      0.2,
      10,
      10,
      0xff00ff
    );
    
    // Phase One is over
    if (numberOfPoints > 2 && intersects[0].point.x == 0) {
      document.getElementById("createSolidOfRevolution").style.visibility =
        "visible";
      document.removeEventListener("mousedown", onDocumentMouseDown);
    }
  }
}

/**
 * Auxiliary function that will create a sphere
 */
function createSphere(px, py, pz, radius, nx, ny, col) {
  let geometry = new THREE.SphereBufferGeometry(radius, nx, ny);
  //Material con o sin relleno
  let material = new THREE.MeshBasicMaterial({
    color: col,
    //wireframe: true, //Descomenta para activar modelo de alambres
  });

  let mesh = new THREE.Mesh(geometry, material);
  //Posición de la esfera
  mesh.position.set(px, py, pz);
  scene.add(mesh);
  intersectionPoints.push(mesh);
}


// ==============================================================================
// ==============================================================================
// Phase Two related section
// ==============================================================================
// ==============================================================================
/**
 * Will create a solid of revolution given its profile in 3 dimension points
 * @param {array}       vec3_points - Points that constitute the solid of 
 *                                   revolution profile
 * @param {hex_color}   color - Color of the solid of revolution
 * @param {bool}        visible - Whether or not it should be visible
 * @return {THREE.Mesh} lathe - The representation of the solid of revolution
 */
function createSolidOfRevolution(vec3_points, color, visible) {
  const points = [];
  for (let vec3 of vec3_points) {
    points.push(new THREE.Vector2(vec3.x, vec3.y));
  }
  const geometry = new THREE.LatheGeometry(points);
  const material = new THREE.MeshBasicMaterial({
    color: color,
    wireframe: true,
  });
  const lathe = new THREE.Mesh(geometry, material);
  if (!visible) {
    lathe.visible = false;
  }
  scene.add(lathe);
  return lathe;
}

/**
 * Call that will advance to phase two, changing button visibilities and
 * displaying the solids of revolution.
 */
function advanceToPhaseTwo() {
  isInPhaseOne = false;
  scene = new THREE.Scene();

  // Cambios en la cámara
  camera.position.set(0, 0, 15);
  //Controles órbita
  controls = new THREE.OrbitControls(camera, renderer.domElement);

  // Create solids of revolution
  straightEdgedObject = createSolidOfRevolution(
    clickedPointsAsVectors,
    0xff0000,
    true
  );
  const curve = new THREE.CatmullRomCurve3(clickedPointsAsVectors);
  const curvePoints = curve.getPoints(CURVE_DIVISIONS * numberOfPoints);
  curvedObject = createSolidOfRevolution(curvePoints, 0x00ff00, false);

  // User interaction
  setPhaseTwoButtonsVisibilities();
}


// ==============================================================================
// ==============================================================================
// Animation loop
// ==============================================================================
// ==============================================================================
function animate() {
  requestAnimationFrame(animate);
  if (!showCurvedProfile && isInPhaseOne) {
    //Polilínea, define el número de vértices y actualiza posiciones
    profile.geometry.setDrawRange(0, numberOfPoints);
    profile.geometry.attributes.position.needsUpdate = true;
  }
  renderer.render(scene, camera);
}
