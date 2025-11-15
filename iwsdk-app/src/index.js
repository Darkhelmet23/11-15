import {
  Mesh,
  MeshStandardMaterial,
  SphereGeometry,PlaneGeometry,
  SessionMode,
  World,
  LocomotionEnvironment,EnvironmentType,
  OneHandGrabbable,
  PhysicsBody, PhysicsShape, PhysicsShapeType, PhysicsState, PhysicsSystem
} from '@iwsdk/core';
import { TextureLoader } from 'three';

import {
  Interactable,
  PanelUI,
  ScreenSpace
} from '@iwsdk/core';

import { PanelSystem } from './panel.js'; // system for displaying "Enter VR" panel on Quest 1

const assets = { };

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
  const sphereGeometry = new SphereGeometry(0.25, 32, 32);
  const greenMaterial =   new MeshStandardMaterial({
    map: softballTexture
  })
  const sphere = new Mesh(sphereGeometry, greenMaterial);
  sphere.position.set(1, 1.5, -3);
  const sphereEntity = world.createTransformEntity(sphere);
    sphereEntity.addComponent(Interactable)
    sphereEntity.addComponent(OneHandGrabbable);
    sphereEntity.addComponent(PhysicsShape, { shape: PhysicsShapeType.Auto,  density: 0.2,  friction: 0.5,  restitution: 0.9 }); 
    sphereEntity.addComponent(PhysicsBody, { state: PhysicsState.Dynamic });



  // create a floor
  const floorMesh = new Mesh(new PlaneGeometry(20, 40), new MeshStandardMaterial({color:"green"}));
  floorMesh.rotation.x = -Math.PI / 2;
  const floorEntity = world.createTransformEntity(floorMesh);
  floorEntity.addComponent(LocomotionEnvironment, { type: EnvironmentType.STATIC });
  floorEntity.addComponent(PhysicsShape, { shape: PhysicsShapeType.Auto}); 
  floorEntity.addComponent(PhysicsBody, { state: PhysicsState.Static });
  const wallMesh = new Mesh(new PlaneGeometry(20, 5), new MeshStandardMaterial({color:"grey"}
  ));
  wallMesh.position.set(0, 2.5, -20);
  const wallEntity = world.createTransformEntity(wallMesh);

  // === Main Game Loop ===
function gameLoop() {
  requestAnimationFrame(gameLoop);
  if (sphereEntity.object3D.position.x < -20) {
      sphereEntity.destroy()
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
