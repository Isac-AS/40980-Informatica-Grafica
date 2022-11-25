/*global THREE*/
let scene, renderer;
let camera;
let camControls;
let objects = [];
let nodes = [],  ways = [],  relations = [];
let minlat, maxlat, minlon, maxlon;
let t0

init();
animationLoop();

/**
 * Will load and parse the content of an OSM XML file
 */
function loadXML() {
  var loader = new THREE.FileLoader();
  loader.load("https://cdn.glitch.global/b496d24c-4a0e-4a1a-84b7-803b89cf3434/guiniguada_map.osm?v=1668768644300", function (text) {   
    //Fuente https://www.w3schools.com/xml/xml_parser.asp
    var text, parser, xmlDoc;
    parser = new DOMParser();
    xmlDoc = parser.parseFromString(text, "text/xml");

    // Recorremos xml
    //Obtiene los límites del mapa
    var x = xmlDoc.getElementsByTagName("bounds");
    minlat = x[0].getAttribute("minlat");
    maxlat = x[0].getAttribute("maxlat");
    minlon = x[0].getAttribute("minlon");
    maxlon = x[0].getAttribute("maxlon");
    
    //Elementos nodes para cada referencia contyienen latitud y longitud
    let nodes = xmlDoc.getElementsByTagName("node");
    //Elementos relations (no se utilizan)
    let relations = xmlDoc.getElementsByTagName("relations");
    
    //Accede a los elementos ways
    x = xmlDoc.getElementsByTagName("way");
    
    //Recorro los elementos buscando aquellos que sean highway o building
    for (let i = 0; i < x.length; i++) {
      ways.push(x[i].getAttribute("id"));
      let tags = x[i].getElementsByTagName("tag");
      let interest = 0; //Por defecto no es elemento de interés
      //Recorro tags del elemento way
      for (let j = 0; j < tags.length; j++) {
        if (tags[j].hasAttribute("k")) {
          let k = tags[j].getAttribute("k");
          let v = tags[j].getAttribute("v");
          if (k == "highway") {
            interest = 1;
            break;
          } 
          else if (k == "building") {
            interest = 2;
            break;
          }
          else if (k == "leisure" && v == "garden") {
            interest = 3;
            break;
          }
          else if (k == "leisure" && v == "park") {
            interest = 4;
            break;
          }
          else if (k == "amenity" && v == "place_of_worship") {
            interest = 5;
            break;
          }
          else if (k == "amenity" && v == "fountain") {
            interest = 6;
            break;
          }
          else if (k == "amenity" && v == "theatre") {
            interest = 7;
            break;
          }
          else if (k == "amenity" && v == "restaurant") {
            interest = 8;
            break;
          }
        }
      }
      //Si el elemento way es  de interés
      if (interest > 0) {
        const hmaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
        const points = [];

        //Recorre los nodos del elemento
        let nds = x[i].getElementsByTagName("nd");
        for (let k = 0; k < nds.length; k++) {
          let ref = nds[k].getAttribute("ref");

          //Probablemente hay mejores formas con xmlDoc.querySelector
          //de momento busco referencia de forma iterativa a mano para obtener coordenaas
          for (let nd = 0; nd < nodes.length; nd++) {
            if (nodes[nd].getAttribute("id") == ref) {
              let lat = Number(nodes[nd].getAttribute("lat"));
              let lon = Number(nodes[nd].getAttribute("lon"));
              //longitudes crecen hacia la derecha, como la x
              let mlon = mapCoordinates(lon, minlon, maxlon, -5, 5);
              //Latitudes crecen hacia arriba, como la y
              let mlat = mapCoordinates(lat, minlat, maxlat, -5, 5);
              //Crea createSphere del nodo del elemento
              createSphere(mlon, mlat, 0, 0.02, 10, 10, 0xffffff);
              //Añade punto
              points.push(new THREE.Vector3(mlon, mlat, 0));
              //Nodo localizado, no sigue recorriendo
              break;
            }
          }
        }

        //Según elemento de interés crea objeto
        let line;
        
        // Highways
        if (interest == 1) {
          const geometry = new THREE.BufferGeometry().setFromPoints(points);
          line = new THREE.Line(geometry, hmaterial);
          scene.add(line);
        } 
        
        // Buildings
        else if (interest == 2) {
          
          const shape = new THREE.Shape();
          shape.autoClose = true;
          
          //Objeto por extrusión
          for (let np = 0; np < points.length; np++) {
            if (np > 0) shape.lineTo(points[np].x, points[np].y);
            else shape.moveTo(points[np].x, points[np].y);
          }

          const extrudeSettings = {
            steps: 1,
            depth: 0.2 + THREE.MathUtils.randFloat(-0.05, 0.5),
            bevelThickness: 0,
            bevelSize: 0,
          };

          const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
          let grayScaleColours = [0x808080, 0x3B3B3B, 0x525252, 0x696969, 0xAEAEAE, 0x979797, 0x888888, 0x909090]
          let randInt = THREE.MathUtils.randInt(0, grayScaleColours.length)

          let bmaterial = new THREE.LineBasicMaterial({ color: grayScaleColours[randInt] });
          
          //let c = new THREE.Color();
          // Any color
          //c.set(THREE.MathUtils.randInt(0, 16777216));
          // Reduced color pallete
          //c.set(THREE.MathUtils.randInt(8388608, 16777216));
          //c.getHexString();
          //bmaterial.color = c;
          const mesh = new THREE.Mesh(geometry, bmaterial);
          scene.add(mesh);
        }
        
        // Garden
        else if (interest == 3) {
          const shape = new THREE.Shape();
          shape.autoClose = true;
          
          //Objeto por extrusión
          for (let np = 0; np < points.length; np++) {
            if (np > 0) shape.lineTo(points[np].x, points[np].y);
            else shape.moveTo(points[np].x, points[np].y);
          }

          const extrudeSettings = {
            steps: 1,
            depth: 0.1,
            bevelThickness: 0,
            bevelSize: 0,
          };

          const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);

          let bmaterial = new THREE.LineBasicMaterial({ color: 0x089000 });
          const mesh = new THREE.Mesh(geometry, bmaterial);
          scene.add(mesh);
        }
        
        // Parks
        else if (interest == 4) {
          const shape = new THREE.Shape();
          shape.autoClose = true;
          
          //Objeto por extrusión
          for (let np = 0; np < points.length; np++) {
            if (np > 0) shape.lineTo(points[np].x, points[np].y);
            else shape.moveTo(points[np].x, points[np].y);
          }

          const extrudeSettings = {
            steps: 1,
            depth: 0.2,
            bevelThickness: 0,
            bevelSize: 0,
          };

          const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);

          let bmaterial = new THREE.LineBasicMaterial({ color: 0x90ee90 });
          const mesh = new THREE.Mesh(geometry, bmaterial);
          scene.add(mesh);
        }
        
        // Place of worship
        else if (interest == 5) {
          const shape = new THREE.Shape();
          shape.autoClose = true;
          
          //Objeto por extrusión
          for (let np = 0; np < points.length; np++) {
            if (np > 0) shape.lineTo(points[np].x, points[np].y);
            else shape.moveTo(points[np].x, points[np].y);
          }

          const extrudeSettings = {
            steps: 1,
            depth: 0.2 + THREE.MathUtils.randFloat(0., 0.5),
            bevelThickness: 0,
            bevelSize: 0,
          };

          const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);

          let bmaterial = new THREE.LineBasicMaterial({ color: 0xA020F0 });
          const mesh = new THREE.Mesh(geometry, bmaterial);
          scene.add(mesh);
        }
        
        // Fountains
        else if (interest == 6) {
          const shape = new THREE.Shape();
          shape.autoClose = true;
          
          //Objeto por extrusión
          for (let np = 0; np < points.length; np++) {
            if (np > 0) shape.lineTo(points[np].x, points[np].y);
            else shape.moveTo(points[np].x, points[np].y);
          }

          const extrudeSettings = {
            steps: 1,
            depth: 0.2 + THREE.MathUtils.randFloat(0., 0.3),
            bevelThickness: 0,
            bevelSize: 0,
          };

          const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);

          let bmaterial = new THREE.LineBasicMaterial({ color: 0x0000ff });
          const mesh = new THREE.Mesh(geometry, bmaterial);
          scene.add(mesh);
        }
        
        // Theatres
        else if (interest == 7) {
          const shape = new THREE.Shape();
          shape.autoClose = true;
          
          //Objeto por extrusión
          for (let np = 0; np < points.length; np++) {
            if (np > 0) shape.lineTo(points[np].x, points[np].y);
            else shape.moveTo(points[np].x, points[np].y);
          }

          const extrudeSettings = {
            steps: 1,
            depth: 0.2 + THREE.MathUtils.randFloat(0.2, 0.6),
            bevelThickness: 0,
            bevelSize: 0,
          };

          const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);

          let bmaterial = new THREE.LineBasicMaterial({ color: 0xb6433e });
          const mesh = new THREE.Mesh(geometry, bmaterial);
          scene.add(mesh);
        }
        
        // Theatres
        else if (interest == 8) {
          const shape = new THREE.Shape();
          shape.autoClose = true;
          
          //Objeto por extrusión
          for (let np = 0; np < points.length; np++) {
            if (np > 0) shape.lineTo(points[np].x, points[np].y);
            else shape.moveTo(points[np].x, points[np].y);
          }

          const extrudeSettings = {
            steps: 1,
            depth: 0.2 + THREE.MathUtils.randFloat(0.2, 0.6),
            bevelThickness: 0,
            bevelSize: 0,
          };

          const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);

          let bmaterial = new THREE.LineBasicMaterial({ color: 0xfcdc04 });
          const mesh = new THREE.Mesh(geometry, bmaterial);
          scene.add(mesh);
        }
      }
    }
    console.log("Obtenidos " + ways.length + " elementos");
  });
}


/**
 * Will map earth coordinates to local this context
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
  let geometry = new THREE.SphereBufferGeometry(radio, nx, ny);
  let material = new THREE.MeshBasicMaterial({});

  let mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(px, py, pz);
  scene.add(mesh);
  objects.push(mesh);
}


function initElements() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(
    20, window.innerWidth / window.innerHeight,
    0.1, 1000
  );
  camera.position.set(0, 0, 30);
  
  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);
}

function setCamControls() {
  //OrbitControls
  //camControls = new THREE.OrbitControls(camera, renderer.domElement);
  //TrackballControls
  camControls = new THREE.TrackballControls(camera, renderer.domElement);
}

function init() {
  initElements();
  loadXML();
  setCamControls();
  t0 = new Date();
}

//Bucle de animación
function animationLoop() {  
  requestAnimationFrame(animationLoop);
  
  //TrackballControls
  let t1 = new Date();
  let secs = (t1 - t0) / 1000;
  camControls.update(1 * secs);
  renderer.render(scene, camera);
}
