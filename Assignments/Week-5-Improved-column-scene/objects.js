function getRandom(min, max) {
  return Math.random() * (max - min) + min;
}

function getVec(point1, point2) {
  return [point1[0]-point2[0], point1[1]-point2[1], point1[2]-point2[2]]
}

function cross_product(vec1, vec2) {
  let vec = []
  vec[0] = vec1[1] * vec2[2] - vec1[2] * vec2[1];
  vec[1] = vec1[2] * vec2[0] - vec1[0] * vec2[2];
  vec[2] = vec1[0] * vec2[1] - vec1[1] * vec2[0];
  return vec
}

class SquarePrism {
  x;
  y;
  z;
  side;
  h;
  color;
  vertexBuffer;
  indexBuffer;
  vertexNormals;

  initVertexBuffer() {
    let left = this.x
    let right = this.x + this.side
    let down = this.y
    let top = this.y + this.h
    let back = this.z
    let front = this.z + this.side
    this.vertexBuffer = [
      // Front face
      left, down, front,
      right, down, front,
      right,  top, front,
      left, top, front,

      // Back face
      left, down, back,
      left, top, back, 
      right,top, back,
      right,down, back,

      // Top face
      left, top, back,
      left, top, front,
      right,top, front,
      right,top, back,

      // Bottom face
      left, down, back,
      right,down, back,
      right,down, front,
      left, down, front,

      // Right face
      right, down, back,
      right, top, back,
      right, top, front,
      right, down, front,

      // Left face
      left, down, back,
      left, down, front,
      left, top, front,
      left, top, back,
    ];
  }
  
  initIndexBuffer() {
    this.indexBuffer = [
      0,  1,  2,      0,  2,  3,    // front
      4,  5,  6,      4,  6,  7,    // back
      8,  9,  10,     8,  10, 11,   // top
      12, 13, 14,     12, 14, 15,   // bottom
      16, 17, 18,     16, 18, 19,   // right
      20, 21, 22,     20, 22, 23,   // left
    ]
  }
  
  initNormals() {
    this.vertexNormals = [
    // Front
     0.0,  0.0,  1.0,
     0.0,  0.0,  1.0,
     0.0,  0.0,  1.0,
     0.0,  0.0,  1.0,

    // Back
     0.0,  0.0, -1.0,
     0.0,  0.0, -1.0,
     0.0,  0.0, -1.0,
     0.0,  0.0, -1.0,

    // Top
     0.0,  1.0,  0.0,
     0.0,  1.0,  0.0,
     0.0,  1.0,  0.0,
     0.0,  1.0,  0.0,

    // Bottom
     0.0, -1.0,  0.0,
     0.0, -1.0,  0.0,
     0.0, -1.0,  0.0,
     0.0, -1.0,  0.0,

    // Right
     1.0,  0.0,  0.0,
     1.0,  0.0,  0.0,
     1.0,  0.0,  0.0,
     1.0,  0.0,  0.0,

    // Left
    -1.0,  0.0,  0.0,
    -1.0,  0.0,  0.0,
    -1.0,  0.0,  0.0,
    -1.0,  0.0,  0.0  
    ];
  }

  constructor(x, y, z, side, h, color) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.side = side;
    this.h = h;
    this.color = color;
    this.initVertexBuffer();
    this.initIndexBuffer();
    this.initNormals();
  }
}

class SquarePyramid {
  x;
  y;
  z;
  side;
  h;
  color;
  vertexBuffer;
  indexBuffer;
  vertexNormals;

  initVertexBuffer() {
    let left = this.x
    let right = this.x + this.side
    let down = this.y 
    let top = this.y + this.h
    let back = this.z
    let front = this.z + this.side
    let top_point_x = this.x + this.side*0.5
    let top_point_z = this.z + this.side*0.5
    this.vertexBuffer = [
      // Front face
      left, down, front,
      right, down, front,
      top_point_x,  top, top_point_z,

      // Back face
      left, down, back,
      right, down, back,
      top_point_x,  top, top_point_z,

      // Bottom face
      left, down, front,
      right, down, front,
      left, down, back,
      right, down, back,
      
      // Right face
      right, down, front,
      right, down, back,
      top_point_x,  top, top_point_z,
      
      // Left face
      left, down, back,
      left,down, front,
      top_point_x,  top, top_point_z,
    ];
  }
  
  initIndexBuffer() {
    this.indexBuffer = [
      0,  1,  2,  // front
      3,  4,  5,  // back
      6,  7,  9,      6,  8,  9,   // bottom
      10, 11, 12, // right
      13, 14, 15, // left
    ]
  }
  
  initNormals() {
    let left = this.x
    let right = this.x + this.side
    let down = this.y 
    let top = this.y + this.h
    let back = this.z
    let front = this.z + this.side
    let top_point_x = this.x + this.side*0.5
    let top_point_z = this.z + this.side*0.5
    
    // Points
    let top_point = [top_point_x, top, top_point_z];
    let front_left = [left, down, front];
    let front_right = [right, down, front];
    let back_left = [left, down, back];
    let back_right = [right, down, back];
    
    // Front
    let normal_front = cross_product(getVec(top_point, front_left), getVec(front_left, front_right));
    // Back
    let normal_back = cross_product(getVec(top_point, back_right), getVec(back_right, back_left));
    //Right
    let normal_right = cross_product(getVec(top_point, front_right), getVec(front_right, back_right));
    //Left
    let normal_left = cross_product(getVec(top_point, back_left), getVec(back_left, front_left));
    
    this.vertexNormals = [
    // Front
     normal_front[0],  normal_front[1],  normal_front[2],
     normal_front[0],  normal_front[1],  normal_front[2],
     normal_front[0],  normal_front[1],  normal_front[2],

    // Back
     normal_back[0],  normal_back[1],  normal_back[2],
     normal_back[0],  normal_back[1],  normal_back[2],
     normal_back[0],  normal_back[1],  normal_back[2],

    // Bottom
     0.0, -1.0,  0.0,
     0.0, -1.0,  0.0,
     0.0, -1.0,  0.0,
     0.0, -1.0,  0.0,

    // Right
     normal_right[0],  normal_right[1],  normal_right[2],
     normal_right[0],  normal_right[1],  normal_right[2],
     normal_right[0],  normal_right[1],  normal_right[2],

    // Left
    normal_left[0],  normal_left[1],  normal_left[2],
    normal_left[0],  normal_left[1],  normal_left[2],
    normal_left[0],  normal_left[1],  normal_left[2],
    
    ];
  }

  constructor(x, y, z, side, h, color) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.side = side;
    this.h = h;
    this.color = color;
    this.initVertexBuffer();
    this.initIndexBuffer();
    this.initNormals();
  }
}
