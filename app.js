const canvas = document.getElementById("renderCanvas"); // Get the canvas element

const engine = new BABYLON.Engine(canvas, true); // Generate the BABYLON 3D engine

// Helper functions
const degToRad = function( degrees ){
  radians = (degrees * Math.PI)/180;
  return radians
}

const createScene = function () {
    
  const scene = new BABYLON.Scene( engine );
  scene.collisionsEnabled = true;
  scene.clearColor = new BABYLON.Color3.FromHexString('#e8f2ff');

  // Scene Gravity
  const assumedFramesPerSecond = 60;
  const earthGravity = -9.81;
  scene.gravity = new BABYLON.Vector3( 0, earthGravity / assumedFramesPerSecond, 0 );

  // Camera
  const camera = new BABYLON.UniversalCamera( "UniversalCamera", new BABYLON.Vector3(0, 0, 1), scene );
  camera.attachControl( canvas, true );
  camera.position = new BABYLON.Vector3( 0, 1.5, 0 );
  camera.ellipsoid = new BABYLON.Vector3(.75, .75, .75);
  camera.speed = .1;
  // camera.invertRotation = true;
  camera.applyGravity = true;
  camera.checkCollisions = true;
  camera.fov = 1;

  camera.keysUp.push( 87 ); //W
  camera.keysLeft.push( 65 ); //A
  camera.keysDown.push( 83 ); //S
  camera.keysRight.push( 68 ); //D

  // // Rendering pipeline
  // var pipeline = new BABYLON.DefaultRenderingPipeline("default", true, scene);

  // // Tone mapping
  // scene.imageProcessingConfiguration.toneMappingEnabled = true;
  // scene.imageProcessingConfiguration.toneMappingType = BABYLON.ImageProcessingConfiguration.TONEMAPPING_ACES;

  // Auto Exposure Pipeline
  var pipeline = new BABYLON.StandardRenderingPipeline(
    "standard", // The name of the pipeline
    scene, // The scene instance
    1.0, // The rendering pipeline ratio
    null, // The original post-process that the pipeline will be based on
    [camera] // The list of cameras to be attached to
  );

  pipeline.HDREnabled = true;
  pipeline.hdrMinimumLuminance = 0.1;
  pipeline.hdrDecreaseRate = 0.2;
  pipeline.hdrIncreaseRate = 0.2;

  // Environment Lighting
  var envTexture = new BABYLON.CubeTexture("environments/sponza.env", scene);
  scene.environmentTexture = envTexture;
  envTexture.setReflectionTextureMatrix(BABYLON.Matrix.RotationY( degToRad(180) ));

  // // Hemisphere Light
  // const light = new BABYLON.HemisphericLight( "light", new BABYLON.Vector3( 1, 1, 0 ));
  // light.diffuse = new BABYLON.Color3.FromHexString('#ffffff');
  // light.specular = new BABYLON.Color3.FromHexString('#ffffff');
  // light.groundColor = new BABYLON.Color3.FromHexString('#ffffff');
  

  // Ground
  const ground = BABYLON.Mesh.CreatePlane( "ground", 1000, scene );
  ground.material = new BABYLON.StandardMaterial( "groundMat", scene );
  ground.material.backFaceCulling = false;
  ground.isVisible = false;
  ground.position = new BABYLON.Vector3( 0, 0, 0 );
  ground.rotation = new BABYLON.Vector3( Math.PI / 2, 0, 0 );
  ground.checkCollisions = true;

  lightmaps = [];
  lightmaps.push( { 'lm_cartouche': new BABYLON.Texture("lightmaps/512_building_cartouche_lm.png", scene, false, false) } );
  lightmaps.push( { 'lm_lion': new BABYLON.Texture("lightmaps/512_building_lion_lm.png", scene, false, false) } );
  lightmaps.push( { 'lm_ceiling': new BABYLON.Texture("lightmaps/1024_building_ceiling_lm.png", scene, false, false) } );
  lightmaps.push( { 'lm_details': new BABYLON.Texture("lightmaps/1024_building_details_lm.png", scene, false, false) } );
  lightmaps.push( { 'lm_roof': new BABYLON.Texture("lightmaps/1024_building_roof_lm.png", scene, false, false) } );
  lightmaps.push( { 'lm_arch': new BABYLON.Texture("lightmaps/2048_building_arch_lm.png", scene, false, false) } );
  lightmaps.push( { 'lm_bricks': new BABYLON.Texture("lightmaps/2048_building_bricks_lm.png", scene, false, false) } );
  lightmaps.push( { 'lm_column_a': new BABYLON.Texture("lightmaps/2048_building_column_a_lm.png", scene, false, false) } );
  lightmaps.push( { 'lm_column_b': new BABYLON.Texture("lightmaps/2048_building_column_b_lm.png", scene, false, false) } );
  lightmaps.push( { 'lm_column_c': new BABYLON.Texture("lightmaps/2048_building_column_c_lm.png", scene, false, false) } );
  lightmaps.push( { 'lm_floor': new BABYLON.Texture("lightmaps/2048_building_floor_lm.png", scene, false, false) } );

  lightmaps.forEach( lightmap => {
    const key = Object.keys( lightmap )[0];
    lightmap[ key ].isRGBD = true;
    // BABYLON.RGBDTextureTools.ExpandRGBDTexture( lightmap );
  });

  // Load environment model
  BABYLON.SceneLoader.ImportMeshAsync("", "models/", "sponza.glb").then( ( model ) => {
    prepareModel( model, lightmaps );
  });

  // Look up gltf metadata, find and attach corresponding lightmaps from array of lightmap textures
  const prepareModel = function( model, lightmaps ){

    scene.materials.forEach( material => {
      
      // material.environmentIntensity = 0.0;

      material.roughness = 1.0;

      material.albedoColor = new BABYLON.Color3( 0.5, 0.5, 0.5 );

      // if( material.albedoTexture ){
      //   material.albedoTexture = null;
      // }
      if( material.bumpTexture ){
        material.bumpTexture = null;
      }
      if( material.bumpTexture ){
        material.bumpTexture = null;
      }

      if( material.metadata ){
        if( material.metadata.gltf ) {
          if( material.metadata.gltf.extras ) {
            const lmName = material.metadata.gltf.extras['lightmap'];

            lightmaps.forEach( lightmap => {

              const lmKey = Object.keys( lightmap )[0];
              
              if( lmName == lmKey ){
                // lightmap[ lmKey ].vScale = -1;
                material.lightmapTexture = lightmap[ lmKey ];
                material.lightmapTexture.coordinatesIndex = 1;
                material.useLightmapAsShadowmap = true;
              }

            });
          } 
        }
      }
    });
  }

  return scene;
};

const scene = createScene(); // Call the createScene function

// Register a render loop to repeatedly render the scene
engine.runRenderLoop(function () {
  scene.render();
});

// Watch for browser/canvas resize events
window.addEventListener("resize", function () {
  engine.resize();
});