import {
  Mesh,
  MeshStandardMaterial,
  SphereGeometry,PlaneGeometry,
  SessionMode,
  World,
  LocomotionEnvironment,EnvironmentType,
  OneHandGrabbable,
  AssetManager,
  AssetType,
  PhysicsBody, PhysicsShape, PhysicsShapeType, PhysicsState, PhysicsSystem
} from '@iwsdk/core';
import { TextureLoader,CylinderGeometry,BoxGeometry  } from 'three';

import {
  Interactable,
  PanelUI,
  ScreenSpace
} from '@iwsdk/core';

import { PanelSystem } from './panel.js'; // system for displaying "Enter VR" panel on Quest 1

const assets = {   
  bat: {
    url: "/gltf/plantSansevieria/bat.glb",
    type: AssetType.GLTF,
    priority: "critical",
  },};

World.create(document.getElementById('scene-container'), {
  assets,
  xr: {
    sessionMode: SessionMode.ImmersiveVR,
    offer: 'always',
    features: { }
  },

  features: { locomotion: true,
    grabbing: true
   },

}).then((world) => {

  const { camera } = world;

  const loader = new TextureLoader();
  const softballTexture = loader.load('/textures/softball.jpg');

  // Create a green sphere
function spawnBall(position = { x: 1, y: 1.5, z: -3 }) {
  const sphereGeometry = new SphereGeometry(0.25, 32, 32);
  const greenMaterial = new MeshStandardMaterial({
    map: softballTexture
  });
  const sphere = new Mesh(sphereGeometry, greenMaterial);
  sphere.position.set(position.x, position.y, position.z);

  const sphereEntity = world.createTransformEntity(sphere);
  sphereEntity.addComponent(Interactable);
  sphereEntity.addComponent(OneHandGrabbable);
  sphereEntity.addComponent(PhysicsShape, { 
    shape: PhysicsShapeType.Auto,  
    density: 0.2,  
    friction: 0.5,  
    restitution: 0.9 
  }); 
  sphereEntity.addComponent(PhysicsBody, { state: PhysicsState.Dynamic });

  return sphereEntity;
}
  const batGeometry = new CylinderGeometry(0.05, 0.05, 1.2, 16);
  const batMaterial = new MeshStandardMaterial({ color: 0x885522 });
  const bat = new Mesh(batGeometry, batMaterial);
  bat.position.set(2, 1.5, 1);
  bat.rotation.z = Math.PI / 2;
  const batEntity = world.createTransformEntity(bat);
    batEntity.addComponent(Interactable)
    batEntity.addComponent(OneHandGrabbable);
    batEntity.addComponent(PhysicsShape, { shape: PhysicsShapeType.Auto,  density: 0.2,  friction: 0.5,  restitution: 0.9 }); 
    batEntity.addComponent(PhysicsBody, { state: PhysicsState.Kinematic });

  // create a floor
  const floorMesh = new Mesh(new PlaneGeometry(20, 40), new MeshStandardMaterial({color:"green"}));
  floorMesh.rotation.x = -Math.PI / 2;
  const floorEntity = world.createTransformEntity(floorMesh);
  floorEntity.addComponent(LocomotionEnvironment, { type: EnvironmentType.STATIC });
  floorEntity.addComponent(PhysicsShape, { shape: PhysicsShapeType.Auto}); 
  floorEntity.addComponent(PhysicsBody, { state: PhysicsState.Static });
  const wallMesh = new Mesh(new BoxGeometry(20, 5, 0.5), new MeshStandardMaterial({color:"grey"}));

  wallMesh.position.set(0, 2.5, -20);
  const wallEntity = world.createTransformEntity(wallMesh);
  wallEntity.addComponent(PhysicsShape, { shape: PhysicsShapeType.Auto}); 
  wallEntity.addComponent(PhysicsBody, { state: PhysicsState.Static });
   var messageBoard; // { canvas, ctx, texture, entity } — hoisted
  function showMessage(message) {
    const { ctx, canvas, texture, entity } = initMessageBoard();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 120px sans-serif';
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 8;
    ctx.fillStyle = '#111010ff';
    ctx.strokeText(String(message), canvas.width / 2, canvas.height / 2);
    ctx.fillText(String(message), canvas.width / 2, canvas.height / 2);
    texture.needsUpdate = true;
    entity.object3D.visible = true;
  }
  function hideMessage() {
    if (!messageBoard) return;
    const { ctx, canvas, texture, entity } = messageBoard;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    texture.needsUpdate = true;
    entity.object3D.visible = false;
  }
  function showTemporaryMessage(message, duration = 2000) {
    showMessage(message);
    setTimeout(hideMessage, duration);
  }
  function initMessageBoard() {
    if (messageBoard) return messageBoard;
    const canvas = document.createElement('canvas');
    canvas.width = 2000;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    const texture = new CanvasTexture(canvas);
    const aspect = canvas.width / canvas.height;
    const boardWidth = 3;
    const boardHeight = boardWidth / aspect;
    const boardMat = new MeshBasicMaterial({ map: texture, transparent: true, depthTest: false });
    const boardGeo = new PlaneGeometry(boardWidth, boardHeight);
    const boardMesh = new Mesh(boardGeo, boardMat);
    const entity = world.createTransformEntity(boardMesh);
    entity.object3D.position.set(1, 3, -5);
    entity.object3D.visible = false;
    messageBoard = { canvas, ctx, texture, entity };
    return messageBoard;
  }
  // === Main Game Loop ===

let sphereEntity = spawnBall(); // spawn first ball

function destroyAndRespawn(showMsg = null) {
  if (sphereEntity) {
    // Remove physics components first for Oculus
    sphereEntity.removeComponent(PhysicsBody);
    sphereEntity.removeComponent(PhysicsShape);
    sphereEntity.destroy();
    sphereEntity = null;
  }

  if (showMsg) showMessage(showMsg);

  // Delay spawn slightly for Oculus to avoid physics engine conflicts
  setTimeout(() => {
    sphereEntity = spawnBall();
  }, 50); // 50ms usually works well
}

function gameLoop() {
  requestAnimationFrame(gameLoop);

  if (!sphereEntity || !sphereEntity.object3D) return;

  const pos = sphereEntity.object3D.position;
  if (!pos) return; // safety check

  // Back wall (special message)
  if (pos.z < -20) {
    destroyAndRespawn('HOME RUN');
    return;
  }

  // Front wall
  if (pos.z > 20) {
    destroyAndRespawn();
    return;
  }

  // Left wall
  if (pos.x < -10) {
    destroyAndRespawn();
    return;
  }

  // Right wall
  if (pos.x > 10) {
    destroyAndRespawn();
    return;
  }

  // Floor
  if (pos.y < -20) {
    destroyAndRespawn();
    return;
  }
}

gameLoop();

  




  world.registerSystem(PhysicsSystem).registerComponent(PhysicsBody).registerComponent(PhysicsShape);
  // vvvvvvvv EVERYTHING BELOW WAS ADDED TO DISPLAY A BUTTON TO ENTER VR FOR QUEST 1 DEVICES vvvvvv
  //          (for some reason IWSDK doesn't show Enter VR button on Quest 1)
  world.registerSystem(PanelSystem);
  
  if (isMetaQuest1()) {
    const panelEntity = world
      .createTransformEntity()
      .addComponent(PanelUI, {
        config: '/ui/welcome.json',
        maxHeight: 0.8,
        maxWidth: 1.6
      })
      .addComponent(Interactable)
      .addComponent(ScreenSpace, {
        top: '20px',
        left: '20px',
        height: '40%'
      });
    panelEntity.object3D.position.set(0, 1.29, -1.9);
  } else {
    // Skip panel on non-Meta-Quest-1 devices
    // Useful for debugging on desktop or newer headsets.
    console.log('Panel UI skipped: not running on Meta Quest 1 (heuristic).');
  }
  function isMetaQuest1() {
    try {
      const ua = (navigator && (navigator.userAgent || '')) || '';
      const hasOculus = /Oculus|Quest|Meta Quest/i.test(ua);
      const isQuest2or3 = /Quest\s?2|Quest\s?3|Quest2|Quest3|MetaQuest2|Meta Quest 2/i.test(ua);
      return hasOculus && !isQuest2or3;
    } catch (e) {
      return false;
    }
  }

});
