/*global THREE*/
/*global TWEEN*/
/*global dat*/

let scene, renderer;
let camera, controls;
let objects = [];
let pointLight;

let gui = new dat.gui.GUI();

let lifetimeTicks = 3;
let interval;
let tickTime = 2000;
let lastTickTime;

let neigbouringPositions = [
  [1,0,0],[-1,0,0],[1,1,0],[1,-1,0],[0,1,0],[0,-1,0],[-1,1,0],[-1,-1,0],
  [1,0,1],[-1,0,1],[1,1,1],[1,-1,1],[0,1,1],[0,-1,1],[-1,1,1],[-1,-1,1],[0,0,1],
  [1,0,-1],[-1,0,-1],[1,1,-1],[1,-1,-1],[0,1,-1],[0,-1,-1],[-1,1,-1],[-1,-1,-1],[0,0,-1]
]

init();
animationLoop();

/***********************************************************************************************/
// Init block
/***********************************************************************************************/
// ==================================
// Components
// ==================================
/**
 * Will initialize basic components
 */
function initComponents() {
  scene = new THREE.Scene();
  
  camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
	camera.position.set(0, 0, 10);
  
  // Renderer
  renderer = new THREE.WebGLRenderer();
  // Shadow activation
  renderer.shadowMap.enabled = true;
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);
  
  controls = new THREE.OrbitControls(camera, renderer.domElement);
}

// ==================================
// Light
// ==================================
/**
 * Will initialize ambient light
 */
function initAmbientLight() {
  const ambientLight = new THREE.AmbientLight(0xffffff, 1);
	scene.add(ambientLight);
}

/**
 * Will initialize the point light (the star)
 */
function initPointLight(castShadow = false) {
  pointLight = new THREE.PointLight(0xffffff, 10, 0, 1);
	pointLight.position = camera.position;
  pointLight.castShadow = castShadow;
	scene.add(pointLight);
}

/**
 * Will initialize the lighting present in the scene
 */
function initLighting() {
  initAmbientLight();
  initPointLight(true);
}


// ==================================
// GUI and Interval handling
// ==================================
/**
 * Will init gui elements
 */
function initGUI() {
  // Shader controls
  const timeFolder = gui.addFolder("Tiempo de actualización de la animación");
  const shaderControlParams = { "Tiempo (ms)": tickTime }
  timeFolder
    .add(shaderControlParams, 'Tiempo (ms)', 100, 5000, 50)
    .onChange((value) => updateInterval(value));
  timeFolder.open();
}

/**
 * Will update the interval with the gui given time
 */
function updateInterval(newTime) {
  tickTime = newTime;
  clearInterval(interval);
  interval = setInterval(nextTick, tickTime);
}

/*function pauseEventListener() {
  updateInterval(100000);
}

function resumeEventListener() {
  if (lastTickTime > 5000){
    updateInterval(2000);
  } else {
    updateInterval(lastTickTime);
  }
}*/

function restartEventListener() {
  for (let object of objects){
    scene.remove(object);
  }
  objects = [];
  createCube(0, 0, 0);
}

/**
 * Function that will the buttons' event listeners
 */
function initButtonsEventListeners() {
  //document.getElementById("pause").addEventListener("click", pauseEventListener);
  //document.getElementById("resume").addEventListener("click", resumeEventListener);
  document.getElementById("restart").addEventListener("click", restartEventListener);
}

function init() {
  initComponents();
  initLighting();
  createCube(0, 0, 0);
  interval = setInterval(nextTick, tickTime);
  initGUI();
  initButtonsEventListeners();
}

/***********************************************************************************************/
// Cube block
/***********************************************************************************************/
/**
 * Will create a cube
 */
function createCube(px, py, pz, sx=0.9, sy=0.9, sz=0.9, col=0x101010) {
  let geometry = new THREE.BoxGeometry(sx, sy, sz);
  let material = new THREE.MeshPhongMaterial({
    color: col,
    //wireframe: true,
  });

  let mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(px, py, pz);
  mesh.userData.lifetime = lifetimeTicks;
  scene.add(mesh);
  objects.push(mesh);
  return mesh;
}

/**
 * For each tick the following happens
 * - All cubes lifetime is decreased by one => if 0 -> death animation; if 1 -> turning red
 * - Each cube with negative lifetime is removed from the scene freeing up space
 * - Cubes with lifetime of 2 can reproduce a maximum of 3 times
 *   - As we are in 3D -> 26 neighbours will be considered for each possible reproduction time
 *     there is a 75% chance of actually reproducing
 */
function nextTick() {
  //console.log("Tick")
  //console.log("Objects", objects)
  // Addition and update of objects
  let currentObjectsLength = objects.length
  for (let i = 0; i < currentObjectsLength; i++) {
    let object = objects[i];
    object.userData.lifetime -= 1
    let objectLifetime = object.userData.lifetime
    if (objectLifetime == 0) {
      shrink(object)
    } else if (objectLifetime == 1) {
      object.material.color.setHex(0x990000) 
    } else if (objectLifetime == 2) {
      reproduce(object)
    }
  }
  
  // Removal of objects
  objects = objects.filter(function(el) {return el.userData.lifetime > -1; });
}

/**
 * Will shrink a cube
 */
function shrink(object) {
  var tweenDeflate = new TWEEN.Tween(object.scale)
    .to({x:0,y:0,z:0}, tickTime)
    .easing(TWEEN.Easing.Exponential.Out);
  tweenDeflate.start()
}

function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}


/**
 * Will handle the reproduction of the object
 */
function reproduce(object) {
  let numberOfReproductions = getRandomInt(3)
  let reproductionTargets = []
  // Go through possible reproductions
  for (let i = 0; i < numberOfReproductions; i++) {
    // 80% chance
    if (!(Math.random() > 0.2)) continue;
    // Get neighbour position
    let newCoordinates = getNewCoordinates(object);
    if (newCoordinates) reproductionTargets.push(newCoordinates);
  }
  
  // Some help to keep the game going
  let objectsThatCanReproduce = objects.filter(function(el) {return el.userData.lifetime == 2; })
  if (reproductionTargets.length == 0 && objectsThatCanReproduce.length < 3) {
    reproductionTargets.push(getNewCoordinates(object))
    reproductionTargets.push(getNewCoordinates(object))
  }
  
  // Reproduction of the cube
  for (let target of reproductionTargets) {
    if (typeof target == 'undefined') continue
    let targetPosition = new THREE.Vector3(target[0], target[1], target[2])
    let newCube = createCube(object.position.x, object.position.y, object.position.z)
    var tweenMove = new TWEEN.Tween({pos: newCube.position, xRotation: 0, yRotation: 0})
      .to({pos: targetPosition, xRotation: Math.PI / 2, yRotation: Math.PI / 2.2}, tickTime)
      .easing(TWEEN.Easing.Exponential.InOut);
    tweenMove.start();
  }
  
}

function getNewCoordinates(object) {
  // Get random neighbour
  let randomNeighbour = getRandomInt(neigbouringPositions.length-1);
  let newCoordinates = [
    object.position.x + neigbouringPositions[randomNeighbour][0],
    object.position.y + neigbouringPositions[randomNeighbour][1],
    object.position.z + neigbouringPositions[randomNeighbour][2],
  ]
  // Compare if its a viable reproduction spot
  if (!checkIfOcuppied(newCoordinates[0], newCoordinates[1], newCoordinates[2])) {
    return newCoordinates;
  }
}

/**
 * Will check if a certain position is ocuppied by another cube
 */
function checkIfOcuppied(x, y, z) {
  for (let object of objects) {
    if (object.position.x == x && object.position.y == y && object.position.z == z) {
      return true;
    }
  }
  return false;
}

/***********************************************************************************************/
// Animation loop
/***********************************************************************************************/
function animationLoop() {
  requestAnimationFrame(animationLoop);
  pointLight.position.set(camera.position.x, camera.position.y, camera.position.z);
  TWEEN.update();
  renderer.render( scene, camera );
}
