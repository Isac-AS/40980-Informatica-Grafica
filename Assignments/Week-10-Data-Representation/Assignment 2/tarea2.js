/*global THREE*/
let scene, renderer, camera;
let mapa, mapsx, mapsy;

//Latitud y longitud de los extremos del mapa de la imagen
let minlon = -15.5304,  maxlon = -15.3656;
let minlat = 28.0705,  maxlat = 28.1817;
let txwidth, txheight;
let psx, psy;
let names = [];
let objects = [];
let lats = [], longs = [], nest;

let months = [
  
  {
    "name": "Whole-2021",
    "file": "https://cdn.glitch.global/bd306168-4e32-42b3-9d13-f7bfac9ea61b/siticlea2021.csv?v=1668795348385"
  },
  {
    "name": "January-2022",
    "file": "https://cdn.glitch.global/bd306168-4e32-42b3-9d13-f7bfac9ea61b/01-Alquileres-Enero-2022.csv?v=1668779703915"
  },
  {
    "name": "February-2022",
    "file": "https://cdn.glitch.global/bd306168-4e32-42b3-9d13-f7bfac9ea61b/02-Alquileres-Febrero-2022.csv?v=1668779705309"
  },
  {
    "name": "March-2022",
    "file": "https://cdn.glitch.global/bd306168-4e32-42b3-9d13-f7bfac9ea61b/03-Alquileres-Marzo-2022.csv?v=1668779707219"
  },
  {
    "name": "April-2022",
    "file": "https://cdn.glitch.global/bd306168-4e32-42b3-9d13-f7bfac9ea61b/04-Alquileres-Abril-2022.csv?v=1668779708130"
  },
  {
    "name": "May-2022",
    "file": "https://cdn.glitch.global/bd306168-4e32-42b3-9d13-f7bfac9ea61b/05-Alquileres-Mayo-2022.csv?v=1668779712445"
  },
  {
    "name": "June-2022",
    "file": "https://cdn.glitch.global/bd306168-4e32-42b3-9d13-f7bfac9ea61b/06-Alquileres-Junio-2022.csv?v=1668779716403"
  },
  {
    "name": "July-2022",
    "file": "https://cdn.glitch.global/bd306168-4e32-42b3-9d13-f7bfac9ea61b/07-Alquileres-Julio-2022.csv?v=1668779720254"
  },
  {
    "name": "August-2022",
    "file": "https://cdn.glitch.global/bd306168-4e32-42b3-9d13-f7bfac9ea61b/08-Alquileres-Agosto-2022.csv?v=1668779721514"
  },
  {
    "name": "September-2022",
    "file": "https://cdn.glitch.global/bd306168-4e32-42b3-9d13-f7bfac9ea61b/09-Alquileres-Septiembre-2022.csv?v=1668779725824"
  },
  {
    "name": "October-2022",
    "file": "https://cdn.glitch.global/bd306168-4e32-42b3-9d13-f7bfac9ea61b/10-Alquileres-Octubre-2022.csv?v=1668779726646"
  },
]
let currentMonth = 0;
let numberOfRoutes = 10;

let bikePlaces = [];
class BikePlace {
  constructor(name, latitude, longitude, xCoordinate, yCoordinate) {
    this.name = name;
    this.latitude = latitude;
    this.longitude = longitude;
    this.xCoordinate = xCoordinate;
    this.yCoordinate = yCoordinate;
  }
}

let routes = []
let lines = []
let sameRentalAndReturn = 0;
class Route {
  constructor(rentalPlace, returnPlace) {
    this.rentalPlace = rentalPlace;
    this.returnPlace = returnPlace;
    this.numberOfRepetitions = 1;
  }
}

var info = document.createElement("div");
info.style.position = "absolute";
info.style.top = "1em";
info.style.left = "2em";
info.style.color = "white";
info.style.fontWeight = "bold";
info.style.zIndex = "1";
info.style.backgroundColor = "black";
info.style.paddingLeft = "2em";
info.style.paddingRight = "2em";
info.style.fontFamily = "Monospace";
info.innerHTML = `<h1>'v'</h1>`;

init();
animate();


// ===========================================================================
// HTML and interaction block
// ===========================================================================
function updateInfo() {
  info.innerHTML = "<h1>Current month: " +
    months[currentMonth].name + 
    "; Number of routes: " +
    numberOfRoutes +
    "; Same rental & return: " +
    sameRentalAndReturn +
    "</h1>";
}

function nextMonthEventListener() {
  currentMonth += 1;
  if (currentMonth >= months.length) {
    currentMonth = 0;
  }
  updateInfo();
  clearCurrentMonth();
  updateMap();
}

function prevMonthEventListener() {
  currentMonth -= 1;
  if (currentMonth < 0) {
    currentMonth = months.length - 1;
  }
  updateInfo();
  clearCurrentMonth();
  updateMap();
}

function increaseRoutesEventListener() {
  numberOfRoutes += 1;
  updateInfo();
}

function decreaseRoutesEventListener() {
  numberOfRoutes -= 1;
  updateInfo();
}

function refreshRoutesEventListener() {
  for (let line of lines) {
    scene.remove(line)
  }
  plotTopRoutes();
  updateInfo();
}

/**
 * Function that will the buttons' event listeners
 */
function initButtonsEventListeners() {
  document.body.appendChild(info);
  document.getElementById("nextMonth").addEventListener("click", nextMonthEventListener);
  document.getElementById("prevMonth").addEventListener("click", prevMonthEventListener);
  document.getElementById("increaseRoutes").addEventListener("click", increaseRoutesEventListener);
  document.getElementById("decreaseRoutes").addEventListener("click", decreaseRoutesEventListener);
  document.getElementById("refreshRoutes").addEventListener("click", refreshRoutesEventListener);
  updateInfo();
}

// ===========================================================================
// Data processing functions block
// ===========================================================================
/**
 * Will clear current month config
 */
function clearCurrentMonth() {
  for (let line of lines) {
    scene.remove(line)
  }
  routes = []
}

/**
 * Auxiliary function to properly sort the routes array
 */
function compareRoutes(route1, route2) {
  return route2.numberOfRepetitions - route1.numberOfRepetitions
}

/**
 * Will return both map coordinates of a bike stop
 */ 
function getCoordinatesOfStop(name) {
  const bikeStop = bikePlaces.find(item => item.name.toLowerCase() == name.toLowerCase())
  try {
    return [bikeStop.xCoordinate, bikeStop.yCoordinate]
  } catch {
    return [1.1031294715182858, -0.5637140287769782]
  }
}

/**
 * Will draw a line given x and y coordinates
 */
function drawLine(start, end, color) {
  const z = 0.005
  const material = new THREE.LineBasicMaterial({
    color: color
  })
  const points = [];
  points.push( new THREE.Vector3(start[0], start[1], z));
  points.push( new THREE.Vector3(end[0], end[1], z));
  
  const geometry = new THREE.BufferGeometry().setFromPoints( points );
  
  const line = new THREE.Line( geometry, material );
  lines.push(line);
  scene.add(line);
}

/**
 * Will create a line connecting both ends of a route
 */
function plotRoute(route, color) {
  console.log(route);
  let rentalPlaceCoordinates = getCoordinatesOfStop(route.rentalPlace)
  let returnPlaceCoordinates = getCoordinatesOfStop(route.returnPlace)
  
  drawLine(rentalPlaceCoordinates, returnPlaceCoordinates, color);
}

//let color = new THREE.Color();
//color.set(THREE.MathUtils.randInt(0, 16777216));
//color.getHexString();
//plotRoute(routes[i], color);
/**
 * Will plot the top n most used routes
 */
function plotTopRoutes() {
  routes.sort(compareRoutes);
  sameRentalAndReturn = 0
  for (let i = 0; i < numberOfRoutes; i++) {
    if (routes[i].rentalPlace == routes[i].returnPlace) {
      sameRentalAndReturn += 1;
      continue;
    }
    plotRoute(routes[i], 0x000000);
  }
}

// ===========================================================================
// CSV processing functions block
// ===========================================================================
/**
 * Will read the csv file with the bikeStop / rental / return places and create a 
 * sphere on them.
 */
function initStops() {
  //Lectura del archivo csv
  var loader = new THREE.FileLoader();
  loader.load("https://cdn.glitch.global/bd306168-4e32-42b3-9d13-f7bfac9ea61b/GeolocalizaionEstacionesSitycleta.csv?v=1668793528940", function (text) {
    let lines = text.split("\n");
    //Cargo archivo con información mde estaciones
    nest = 0;
    for (let line of lines) {
      //No trata primera línea al ser la cabecera
      if (nest > 0) {
        //Separo por comas
        let values = line.split(",");
        // Information extraction
        let name = values[1].substring(1, values[1].length - 1);
        //let name = values[1];
        let latitude = Number(values[6].substring(1, values[6].length - 1));
        let longitude = Number(values[7].substring(1, values[7].length - 1));
        let mlon = mapCoordinates(longitude, minlon, maxlon, -mapsx / 2, mapsx / 2);
        let mlat = mapCoordinates(latitude, minlat, maxlat, -mapsy / 2, mapsy / 2);
        
        // Filling data structures
        bikePlaces.push(new BikePlace(name, latitude, longitude, mlon, mlat))
        names[nest - 1] = name;
        lats[nest - 1] = latitude;
        longs[nest - 1] = longitude;
        
        // Create sphere 
        createSphere(mlon, mlat, 0, 0.01, 10, 10, 0xff0000);
      }
      nest += 1;
    }
  });
}

function cleanQuotationMarks(name) {
  if (name[0] == "\"") {
    return name.substring(1, name.length - 1)
  }
  return name
}

/**
 * Will read the csv file with the routes of a certain month it will create an array
 * with the routes and their frequencies
 */
function readRentalFile() {
  var loader = new THREE.FileLoader();
  loader.load(months[currentMonth].file, function (text) {
    let lines = text.split("\n");
    nest = 0;
    for (let line of lines) {
      if (nest > 0) {
        let values = line.split(",");
        
        // Information extraction
        let rentalPlace = values[3];
        let returnPlace = values[4];
        
        rentalPlace = cleanQuotationMarks(rentalPlace);
        returnPlace = cleanQuotationMarks(returnPlace);
        
        const index = routes.findIndex(item => item.rentalPlace == rentalPlace && item.returnPlace == returnPlace)
        if (index > 0) {
          routes[index].numberOfRepetitions += 1
        } else {
          routes.push(new Route(rentalPlace, returnPlace))
        }
      }
      nest += 1;
    }
  });
  
  routes.sort(compareRoutes);
}

// ===========================================================================
// Given functions block
// ===========================================================================
/**
 * Will map given coordinates to get adjusted representation coordinates
 */
function mapCoordinates(val, vmin, vmax, dmin, dmax) {
  //Normaliza valor en el rango de partida, t=0 en vmin, t=1 en vmax
  let t = 1 - (vmax - val) / (vmax - vmin);
  return dmin + t * (dmax - dmin);
}

/**
 * Will create a sphere
 */
function createSphere(px, py, pz, radio, nx, ny, col) {
  let geometry = new THREE.SphereGeometry(radio, nx, ny);
  let material = new THREE.MeshBasicMaterial({
    color: col,
  });
  let mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(px, py, pz);
  objects.push(mesh);
  scene.add(mesh);
}

/**
 * Creates a plane
 */
function createPlane(px, py, pz, sx, sy) {
  let geometry = new THREE.PlaneBufferGeometry(sx, sy);

  let material = new THREE.MeshBasicMaterial({ });

  let mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(px, py, pz);
  scene.add(mesh);
  mapa = mesh;
}


// ===========================================================================
// Init functions block
// ===========================================================================
/**
 * Will init scene camera and renderer
 */
function initElements() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  //Posición de la cámara
  camera.position.z = 2;

  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  let camcontrols1 = new THREE.OrbitControls(camera, renderer.domElement);
}

/**
 * Will init the plane that will act as a map and will add the texture to it.
 */
function initPlane() {
  //Objeto
  mapsx = 5;
  mapsy = 5;
  createPlane(0, 0, 0, mapsx, mapsy);
  
  //Textura del mapa
  const tx1 = new THREE.TextureLoader().load(
    "https://cdn.glitch.global/bd306168-4e32-42b3-9d13-f7bfac9ea61b/mapaLPGC.png?v=1668783274877",

    // Acciones a realizar tras la carga
    function (texture) {
      //dimensiones
      //console.log(texture.image.width, texture.image.height);

      mapa.material.map = texture;
      mapa.material.needsUpdate = true;

      txwidth = texture.image.width;
      txheight = texture.image.height;

      //Adapta dimensiones del plano a la textura
      if (txheight > txwidth) {
        let factor = txheight / (maxlon - minlon);
        mapa.scale.set(1, factor, 1);
        mapsy *= factor;
      } else {
        let factor = txwidth / txheight;
        mapa.scale.set(factor, 1, 1);
        mapsx *= factor;
      }
    }
  );
}

async function updateMap() {
  await readRentalFile();
  plotTopRoutes();
}

function init() {
  initButtonsEventListeners();
  initElements();
  initPlane();
  initStops();
  updateMap();
}



//Bucle de animación
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
