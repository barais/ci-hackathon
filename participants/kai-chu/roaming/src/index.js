import * as THREE from 'three';
import { createOrbitController } from './controller';
import { CinematicCamera } from 'three/examples/jsm/cameras/CinematicCamera.js';
import * as dat from 'dat.gui';
import animation from './animation';
import Tone from 'tone';
const WebSocket = require('isomorphic-ws');

/**  Create a scene to be watched */
var scene = new THREE.Scene();
//scene.background = new THREE.Color(0xAAAAAA);
scene.add( new THREE.AmbientLight( 0xffffff, 0.3 ) );
//scene.background = new THREE.Color( 0xcccccc );
const loader = new THREE.TextureLoader();
const bgTexture = loader.load('assets/pos-x.jpg');
scene.background = bgTexture;
        
/*
const loader = new THREE.CubeTextureLoader();
  const texture = loader.load([
    'assets/pos-x.jpg',
    'assets/pos-x.jpg',
    'assets/pos-x.jpg',
    'assets/pos-x.jpg',
    'assets/pos-x.jpg',
    'assets/pos-x.jpg'
  ]);
scene.background = texture;*/
/**
 * Create a camera to watch
 */
//var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
var camera = new THREE.OrthographicCamera(window.innerWidth / - 16, window.innerWidth / 16,window.innerHeight / 16, window.innerHeight / - 16, -200, 1000 );
//var camera = new CinematicCamera( 60, window.innerWidth / window.innerHeight, 1, 1000 );
				//camera.setLens( 5 );
camera.position.set( 200, 200, -400 );
camera.lookAt(0,0,0);

/*********************************************/
/**   Create a object and add it into scene **/
/*********************************************/
/**
 * Create a geometry, which is the shape of the object 
 */
var geometry = new THREE.BoxGeometry(1, 1, 1);

/**
 * Add lights to geometry to make object kind of having color
 */
var material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });


var cube = new THREE.Mesh(geometry, material);

/**
 * Add a bit rotation
 */
//cube.rotation.x += 0.5;
//cube.rotation.y += 0.5;
//cube.rotation.z += 0.5;

/**
 * Add a object in a scene
 */
scene.add(cube);


/**
 * Create a light and add it to scene
 */
const color = 0xFFFFFF;
const intensity = 1;
const light = new THREE.DirectionalLight(color, intensity);
light.position.set(2, 3, 3);
scene.add(light);
//https://codepen.io/anon/pen/VJOaqg
/**
 * To be able to receive lights, use another material
 */
cube.material = new THREE.MeshPhongMaterial({ color: 0x44aa88 });

/**
 * Create a render
 */

var renderer = new THREE.WebGLRenderer({alpha: true});
renderer.autoClearColor = false;

/**
 * To set resolution and size
 */
renderer.setSize(window.innerWidth, window.innerHeight /** false to half resolution */);
/**
 * Add our game into html dom
 */
document.body.appendChild(renderer.domElement);

/**
 * Audio player
 */


//create a synth and connect it to the master output (your speakers)
var synth = new Tone.Synth().toMaster();

//play a middle 'C' for the duration of an 8th note


/**
 * Move camera a near to see the scene which is same as cub.position.z = -20
 */
//camera.position.set(200, 1.8, 3);

/**
 * Render it 
 */
renderer.render(scene, camera);






let wss =  new WebSocket('wss://travis.durieux.me');

wss.onopen = (socket => {
  console.log('connection established')
})

wss.onclose = (() => {
  console.log('disconnected');
});
const passed = 'passed';
const failed = 'failed';
const error = 'errored';
const canceled = 'canceled'

wss.onmessage = (message => {
  if (message.data[0] != '{') return;
  var data = JSON.parse(message.data)
  // event types
  //job created->queued->received
  addOrUpdateRepoCube(data.data);

  if (data.event == 'job') {
    // a new job is detected on TravisCI
    console.log(data.event, data.data.id, data.data.state)
  }
  //job_updated -> started
  //job_updated 558257310 received
  if (data.event == 'job_updated') {
    console.log(data.event, data.data.id, data.data.state)
    // the status of an existing job is updated
    //console.log('updated',data.data)
  }
  if (data.event == 'job_finished') {
    //var cube = new THREE.Mesh(geometry, material);

    /**
     * Add a bit rotation
     */
    //cube.rotation.x += 0.5;
    //cube.rotation.y += 0.5;
    //cube.rotation.z += 0.5;

    /*cube.position.set(Math.random() * 800 - 400, 0, Math.random() * 800 - 400, Math.random() * 800 - 400)
    switch (data.data.state) {
      case passed: {
        cube.material = new THREE.MeshPhongMaterial({ color: 0x3CAEA3 });
        break;
      }
      case failed: {
        cube.material = new THREE.MeshPhongMaterial({ color: 0xF6D55C });
        break;
      }
      case error: {
        cube.material = new THREE.MeshPhongMaterial({ color: 0xED553B });
        break;
      }
      default: {
        cube.material = new THREE.MeshPhongMaterial({ color: 0x20639B });
      }
    }
    

    /**
     * Add a object in a scene
     */
    //scene.add(cube);

    //console.log(data.event, data.data.id, data.data.state)
    //console.log(data.data.id)
    // the execution of a job is finished
  }
  // job details, the structure of the job is available here: https://docs.travis-ci.com/api/#jobs
  //var job = data.data;
  //var commit = job.commit;
  //console.log(job)
})

let repoIdToCube = new Map();

function addOrUpdateRepoCube(job) {
  let repoId = job.repository_id;
  if(repoIdToCube.has(repoId)) {
    let cubeMeta = repoIdToCube.get(repoId);
    addOrUpdateBuildCube(cubeMeta, job);
  }
  else {
    let cube = new THREE.Mesh(geometry, material);
    cube.translateZ((repoIdToCube.size+1)*2)
    var pivotPoint = new THREE.Object3D();
    cube.add(pivotPoint);
    const cubeMeta = {cube: cube, pivotPoint: pivotPoint, builds: new Map()};
    repoIdToCube.set(repoId, cubeMeta)
    scene.add(cube);
    addOrUpdateBuildCube(cubeMeta, job);
   
  }
}

function addOrUpdateBuildCube(cubeMeta, job) {
  let buildId = job.build_id;
  let state = job.state;
  if(cubeMeta.builds.has(buildId)) {
    let cube = cubeMeta.builds.get(buildId);
    updateCubeState(cube, state)
  }
  else {
    let cube = new THREE.Mesh(geometry, material);
    cubeMeta.pivotPoint.add(cube);
    cube.translateX((cubeMeta.builds.size + 1) * 2);
    cubeMeta.builds.set(buildId, cube);
    updateCubeState(cube, state);
  }
}

function updateCubeState(cube, state) {
  switch (state) {
    case passed: {
      cube.material = new THREE.MeshPhongMaterial({ color: 0x7ac74f });
      Tone.Transport.schedule(passedSynth, "+0:1:0")
      break;
    }
    case failed: {
      cube.material = new THREE.MeshPhongMaterial({ color: 0xe87461 });
      Tone.Transport.schedule(failedSynth, "+0:2:0")
      break;
    }
    case error: {
      cube.material = new THREE.MeshPhongMaterial({ color: 0xe0c879 });
      Tone.Transport.schedule(errorSynth, "+0:3:0")
      break;
    }
    case canceled: {
      cube.material = new THREE.MeshPhongMaterial({ color: 0xdedede});
      Tone.Transport.schedule(canceledSynth, "+0:3:2")
      break;
    }
    default: {
      cube.material = new THREE.MeshPhongMaterial({ color: 0x7eb09b });
      Tone.Transport.schedule(passedSynth, "+0:1:0")
    }
  }
}

function passedSynth(time){
	//the time is the sample-accurate time of the event
	synth.triggerAttackRelease('C2', '8n', time)
}

function failedSynth(time){
	//the time is the sample-accurate time of the event
	synth.triggerAttackRelease('C3', '8n', time)
}

function errorSynth(time){
	//the time is the sample-accurate time of the event
	synth.triggerAttackRelease('C4', '8n', time)
}

function canceledSynth(time){
	//the time is the sample-accurate time of the event
	synth.triggerAttackRelease('C1', '8n', time)
}


function updateBuildCubes() {
  repoIdToCube.forEach( v => {
    v.pivotPoint.rotateZ(0.02);
  })
}
/* Test
let jobs = []
for (var i = 0; i < 19; i++) {
  for (var j = 0; j < 9; j++) {
    jobs.push({repository_id: `repo${i}`, build_id: `build${j}`, state: 'created'})
}}

jobs.forEach(v => {
  //addOrUpdateRepoCube(v)
})
*/
// Floor
/*
var floorGeometry = new THREE.PlaneGeometry(100, 100, 20, 20);
var floorMaterial = new THREE.MeshPhongMaterial({
  color: 0xecebec,
  specular: 0x000000,
  shininess: 100
});

var floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = -0.5 * Math.PI;
floor.receiveShadow = true;
scene.add(floor);
*/
var FizzyText = function() {
  this.title = "CI Romaing";
  this.project = "KTH CI hackathon";
  this.numOfRepos = 0;
  this.audio=false;
};

var text = new FizzyText();
  var gui = new dat.GUI();
  gui.add(text, 'title');
  gui.add(text, 'project');
  gui.add(text, 'numOfRepos', 0).listen();
  gui.add(text, 'audio', false).onChange(value=> {
    if(value) {
      //sound1.play();
      Tone.Transport.toggle();
      //synth.triggerAttackRelease("C4", "8n");
    }else{
      //sound1.stop();
    }
  });
// Resize
function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize( window.innerWidth, window.innerHeight );
}
// Event Listener
window.addEventListener( 'resize', onWindowResize, false );



var clock = new THREE.Clock();
var controller;
animation(
  () => {
    // Create a controller
    controller = createOrbitController(camera);
    controller.domElement=renderer.domElement;
  },
  () => {
    // Set the repeat and offset properties of the background texture
    // to keep the image's aspect correct.
    // Note the image may not have loaded yet.
    const canvasAspect = renderer.domElement.clientWidth / renderer.domElement.clientHeight;
    const imageAspect = bgTexture.image ? bgTexture.image.width / bgTexture.image.height : 1;
    const aspect = imageAspect / canvasAspect;
  
    bgTexture.offset.x = aspect > 1 ? (1 - 1 / aspect) / 2 : 0;
    bgTexture.repeat.x = aspect > 1 ? 1 / aspect : 1;
  
    bgTexture.offset.y = aspect > 1 ? 0 : (1 - aspect) / 2;
    bgTexture.repeat.y = aspect > 1 ? 1 : aspect;

    // Update cube
    //cube.rotation.x += 0.01;
    //controller.update( clock.getDelta() );
    //buildCube.rotateOnAxis( new THREE.Vector3( 0, 1, 0 ), 0.1);
    updateBuildCubes() ;
    text.numOfRepos = repoIdToCube.size
    controller.update();
  },
  () => {
    renderer.render(scene, camera);

  },
  () => {
  }
)


