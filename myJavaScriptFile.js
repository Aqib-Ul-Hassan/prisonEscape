// myJavaScriptFile.js
// Version: 3.0.
// Set the initialise function to be called when the page has loaded.
// set the size of our canvas / view onto the scene.
// set camera properties / attributes.
// Declare the variables we will need for three.js.
/*jslint browser:true */
var THREE;
var performance;
var renderer;
var scene;
var camera;
var raycasterForwardCollision;

// Stats information for our scene.
var stats;
var clock = new THREE.Clock();

// pointer lock interfaces
var blocker = document.getElementById("blocker");
var instructions = document.getElementById("instructions");
var info = document.getElementById("debugInfo");

// guard Values.
var guardMoveSpeedXPos = -0.001;
var guardMoveSpeedZPos = 0.1;
var guardTurnSpeed = Math.PI / 180;
var angleFromCell = 90;
var stepsAway = 0;
var step = 1;
var leftToTurn = 180;
var guardState = "Patrol";
var guardNeedsToTurn = false;
var guardAlerted = false;
var guardSearchTime = 0;

//Game variables
var leftToHit = Math.floor((Math.random() * 100) + 1) * 10;

// Manages controls.
var controls;
var controlsEnabled = false;
var moveForward = false;
var moveBackward = false;
var moveLeft = false;
var moveRight = false;
var canJump = false; // Not currently could be used later for jumping or crouching.

var direction = new THREE.Vector3();
var prevTime = performance.now();
var velocity = new THREE.Vector3();

// Stores graphical meshes for checking collision
var objects = [];

// Fly variables
var flyRandomDirection;
var flyHeight;

// 135 w 180 s 225 e - North wall options
// 225 s 270 e 315 n - West wall options
// 90 w 135 s 45 n - East wall options
// -0.5 directional n - rest directions disabled - South wall options
var flyDirectionalOptions = [
    [135, 225, 180],
    [270, 315, 225],
    [90, 45, 135],
    [-0.5]
];

//pins for cloth
var pinsFormation = [];
var pins = [6];
pinsFormation.push(pins);
pins = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
pinsFormation.push(pins);
pins = pinsFormation[1];

// Stores variables for Animation and 3D model.
// Stores the model loader.
var myColladaLoader;

// Store the model(s).
var myDaeFile;
var tableObj;
var bedObj;
var toiletObj;
var floorObj;
var flyObj;
var guardObj;
var roofObj;
var barsObj;
var clockObj;
var needleObj;
var chairObj;
var windowObj;
var mouseObj;
var holeOneObj;
var holeTwoObj;

// Stores the animations.
var myDaeAnimations;
// Stores the key frame animations.
var keyFrameAnimations = [];
// The length of the key frame animations array.
var keyFrameAnimationsLength = 0;
// Stores the time for the last frame.
// Used to control animation looping.
var lastFrameCurrentTime = [];

// Pointer lock permission - enables controls.
/*ignore jslint start*/
var havePointerLock = "mozPointerLockElement";
/*ignore jslint end*/
if (havePointerLock) {

    var element = document.body;

    var pointerlockchange = function (/*event*/) {
        "use strict";
        if (document.pointerLockElement === element || document.mozPointerLockElement === element || document.webkitPointerLockElement === element) {

            controlsEnabled = true;
            controls.enabled = true;
            instructions.style.display = "none";

        } else {

            controls.enabled = false;
            instructions.style.display = "block";
            instructions.style.display = "";

        }

    };

    var pointerlockerror = function (/*event*/) {
        "use strict";
        instructions.style.display = "";
    };

    // Hook pointer lock state change events
    document.addEventListener("pointerlockchange", pointerlockchange, false);
    document.addEventListener("mozpointerlockchange", pointerlockchange, false);
    document.addEventListener("webkitpointerlockchange", pointerlockchange, false);

    document.addEventListener("pointerlockerror", pointerlockerror, false);
    document.addEventListener("mozpointerlockerror", pointerlockerror, false);
    document.addEventListener("webkitpointerlockerror", pointerlockerror, false);
    instructions.addEventListener("click", function (/*event*/) {
        "use strict";

        instructions.style.display = "none";

        // Ask the browser to lock the pointer
        element.requestPointerLock = element.requestPointerLock || element.mozRequestPointerLock || element.webkitRequestPointerLock;
        element.requestPointerLock();

    }, false);

} else {

    instructions.innerHTML = "Your browser doesn\"t seem to support Pointer Lock API";

}

//Controller for the game handlers.
function gameController() {
    "use strict";
    //If the player is close to the poster in the X dimension.
    if (controls.getObject().position.x < 10 && controls.getObject().position.x > -10) {
        //If the player is close to the poster in the Z dimension.
        if (controls.getObject().position.z < 10) {
            //Run the game handlers

            //Play sound effect.
            info.innerHTML = "*Realistic Digging Sound*";
            //Reduce left to hit to progress game.
            leftToHit -= 1;
            //Check if gaurd heard it.

            //If he is watching, you lose.
            if (guardState === "Checking Cell") {
                window.alert("You Got Caught, Enjoy Prison");
                location.reload();
            }

            //If he is close enough he comes to investigate.
            if (stepsAway < 150 && stepsAway > 0) {
                guardState = "Responding";
                if (step > 0) {
                    guardNeedsToTurn = true;
                }
            }
        } else {
            //Missed sound effect.
            info.innerHTML = "*You Miss Pathetically*";
        }
    } else {
        //Missed sound effect.
        info.innerHTML = "*You Miss Pathetically*";
    }
    //Check if win condition
    if (leftToHit < 1) {
        //Inform player they have won and reset game.
        window.alert("You Win");
        location.reload();
    }
}

// Start the animations.
function startAnimations() {
    "use strict";
    var i;
    var animation;
    // Loop through all the animations.
    for (i = 0; i < keyFrameAnimationsLength; i += 1) {
        // Get a key frame animation.
        animation = keyFrameAnimations[i];
        animation.play();
    }
}

// Initialise three.js.
function init() {
    "use strict";
    // Renderer.
    // create a WebGL renderer.
    renderer = new THREE.WebGLRenderer();
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    blocker.appendChild(renderer.domElement);


    // Scene.
    // Create scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);
    scene.fog = new THREE.Fog(0xffffff, 0, 750);

    // Lights
    // Create lights and add to scene
    var light = new THREE.HemisphereLight(0xeeeeff, 0x777788, 0.75);
    light.position.set(0.5, 1, 0.75);
    scene.add(light);
    // Camera.
    // Create a WebGl camera
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 1000);

    // Controls
    // Create PointerLockControls and add to scene
    controls = new THREE.PointerLockControls(camera);
    scene.add(controls.getObject());

    // Keybinds
    var event = "";
    var onKeyDown = function (event) {
        switch (event.keyCode) {
        case 38: // up
        case 87: // w
            moveForward = true;
            break;
        case 37: // left
        case 65: // a
            moveLeft = true;
            break;
        case 40: // down
        case 83: // s
            moveBackward = true;
            break;
        case 39: // right
        case 68: // d
            moveRight = true;
            break;
        case 69: //e
            gameController();
            break;
        }
    };
    var onKeyUp = function (event) {
        switch (event.keyCode) {
        case 38: // up
        case 87: // w
            moveForward = false;
            break;
        case 37: // left
        case 65: // a
            moveLeft = false;
            break;
        case 40: // down
        case 83: // s
            moveBackward = false;
            break;
        case 39: // right
        case 68: // d
            moveRight = false;
            break;
        case 69: //e
            info.innerHTML = "";
            break;
        }
    };

    // Event listeners
    document.addEventListener("keydown", onKeyDown, false);
    document.addEventListener("keyup", onKeyUp, false);
    event = event;
}

function initScene() {
    "use strict";
    // initialise the scene. Put things in it, such as meshes and lights.

    // Floor mesh
    var meshFloor = new THREE.Mesh(
        new THREE.PlaneGeometry(200, 200, 10, 10),
        new THREE.MeshBasicMaterial({
            color: "grey",
            wireframe: false
        })
    );
    meshFloor.rotation.x -= Math.PI / 2; // Rotate the floor 90 degrees
    scene.add(meshFloor);
    // Add a model to the scene - needs a rename is currently the room model.
    myColladaLoader = new THREE.ColladaLoader();
    myColladaLoader.options.convertUpAxis = true;

    myColladaLoader.load("models/room.dae", function (collada) {
        // Here we store the dae in a global variable.
        myDaeFile = collada.scene;
        // Scale your model to the correct size.
        myDaeFile.position.x = 0;
        myDaeFile.position.y = 0;
        myDaeFile.position.z = 0;
        myDaeFile.scale.x = 1;
        myDaeFile.scale.y = 1;
        myDaeFile.scale.z = 1;
        myDaeFile.updateMatrix();
        // Add the model to the scene.
        scene.add(myDaeFile);
        // Adds model to objects array which is checked for collision.
        objects.push(myDaeFile);
    });


    // Add a model to the scene.
    // -------------------------
    myColladaLoader = new THREE.ColladaLoader();
    myColladaLoader.options.convertUpAxis = true;

    myColladaLoader.load("models/floor.dae", function (collada) {
        // Here we store the dae in a global variable.
        floorObj = collada.scene;
        // Scale your model to the correct size.
        floorObj.position.x = 0;
        floorObj.position.y = 0;
        floorObj.position.z = 0;
        floorObj.scale.x = 1;
        floorObj.scale.y = 1;
        floorObj.scale.z = 1;
        floorObj.updateMatrix();
        // Add the model to the scene.
        scene.add(floorObj);
        objects.push(floorObj);
    });


    // Add a model to the scene.
    // -------------------------
    myColladaLoader = new THREE.ColladaLoader();
    myColladaLoader.options.convertUpAxis = true;
    myColladaLoader.load("models/table.dae", function (collada) {
        // Here we store the dae in a global variable.
        tableObj = collada.scene;
        // Scale your model to the correct size.
        tableObj.position.x = 7;
        tableObj.position.y = 2;
        tableObj.position.z = 30;
        tableObj.scale.x = 0.2;
        tableObj.scale.y = 0.2;
        tableObj.scale.z = 0.2;
        tableObj.updateMatrix();

        // Add the model to the scene.
        scene.add(tableObj);
        objects.push(tableObj);
    });

    // Add a model to the scene.
    // -------------------------
    myColladaLoader = new THREE.ColladaLoader();
    myColladaLoader.options.convertUpAxis = true;
    myColladaLoader.load("models/bars.dae", function (collada) {
        // Here we store the dae in a global variable.
        barsObj = collada.scene;
        // Scale your model to the correct size.
        barsObj.position.x = -15;
        barsObj.position.y = 2;
        barsObj.position.z = 20;
        barsObj.scale.x = 15;
        barsObj.scale.y = 4;
        barsObj.scale.z = 10;
        barsObj.rotation.y = 3 * Math.PI / 2;
        barsObj.updateMatrix();

        // Add the model to the scene.
        scene.add(barsObj);
        objects.push(barsObj);
    });

	//***** MOUSE *****
	
	// Add a model to the scene.
    // -------------------------
    myColladaLoader = new THREE.ColladaLoader();
    myColladaLoader.options.convertUpAxis = true;

    myColladaLoader.load("models/mouse.dae", function(collada) {
        // Here we store the dae in a global variable.
        mouseObj = collada.scene;

		// Store the animations.
			myDaeAnimations = collada.animations;
			// Store the number of animations.
			keyFrameAnimationsLength = myDaeAnimations.length;

		    // Initialise last frame current time.
		    for ( var i = 0; i < keyFrameAnimationsLength; i++ ) {
		    	lastFrameCurrentTime[i] = 0;
		    }

			// Get all the key frame animations.
			for ( var i = 0; i < keyFrameAnimationsLength; i++ ) {
				var animation = myDaeAnimations[ i ];

				var keyFrameAnimation = new THREE.KeyFrameAnimation( animation );
				keyFrameAnimation.timeScale = 1;
				keyFrameAnimation.loop = false;
				// Add the key frame animation to the keyFrameAnimations array.
				keyFrameAnimations.push( keyFrameAnimation );
			}


        // Scale your model to the correct size.
        mouseObj.position.x = 24;
        mouseObj.position.y = 1.5;
        mouseObj.position.z = 25;
		
		//Rotate Mouse
		mouseObj.rotation.y = 275;

        mouseObj.scale.x = mouseObj.scale.y = mouseObj.scale.z = 0.15;
        mouseObj.updateMatrix();

        // Add the model to the scene.
        scene.add(mouseObj);
        objects.push(mouseObj);
    });
	
	//**********
	
	//******* HOLE *********
	// Add a model to the scene.
    // -------------------------
    myColladaLoader = new THREE.ColladaLoader();
    myColladaLoader.options.convertUpAxis = true;

    myColladaLoader.load("models/hole.dae", function(collada) {
        // Here we store the dae in a global variable.
        holeOneObj = collada.scene;



        // Scale your model to the correct size.
        holeOneObj.position.x = 26.25;
        holeOneObj.position.y = 1.5;
        holeOneObj.position.z = 45;

		
		
        holeOneObj.scale.x = holeOneObj.scale.y = holeOneObj.scale.z = 0.8;
        holeOneObj.updateMatrix();

        // Add the model to the scene.
        scene.add(holeOneObj);
        objects.push(holeOneObj);




    });
	
	//******* HOLE 2 *********
	// Add a model to the scene.
    // -------------------------
    myColladaLoader = new THREE.ColladaLoader();
    myColladaLoader.options.convertUpAxis = true;

    myColladaLoader.load("models/hole.dae", function(collada) {
        // Here we store the dae in a global variable.
        holeTwoObj = collada.scene;



        // Scale your model to the correct size.
        holeTwoObj.position.x = 26.25;
        holeTwoObj.position.y = 1.5;
        holeTwoObj.position.z = 25;

		
		
        holeTwoObj.scale.x = holeTwoObj.scale.y = holeTwoObj.scale.z = 0.8;
        holeTwoObj.updateMatrix();

        // Add the model to the scene.
        scene.add(holeTwoObj);
        objects.push(holeTwoObj);




    });
	
	
	//**********************

    // Add a model to the scene.
    // -------------------------
    myColladaLoader = new THREE.ColladaLoader();
    myColladaLoader.options.convertUpAxis = true;
    myColladaLoader.load("models/roof.dae", function (collada) {
        // Here we store the dae in a global variable.
        roofObj = collada.scene;
        // Scale your model to the correct size.
        roofObj.position.x = 7;
        roofObj.position.y = 15;
        roofObj.position.z = 30;
        roofObj.scale.x = 300;
        roofObj.scale.y = 2;
        roofObj.scale.z = 200;
        roofObj.updateMatrix();

        // Add the model to the scene.
        scene.add(roofObj);
        objects.push(roofObj);
    });

    // Add a model to the scene.
    // -------------------------
    myColladaLoader = new THREE.ColladaLoader();
    myColladaLoader.options.convertUpAxis = true;
    myColladaLoader.load("models/clock.dae", function (collada) {
        // Here we store the dae in a global variable.
        clockObj = collada.scene;
        // Scale your model to the correct size.
        clockObj.position.x = 5;
        clockObj.position.y = 10;
        clockObj.position.z = -8.5;
        clockObj.scale.x = 40;
        clockObj.scale.y = 40;
        clockObj.scale.z = 25;
        clockObj.updateMatrix();

        // Add the model to the scene.
        scene.add(clockObj);
        objects.push(clockObj);
    });

    // Add a model to the scene.
    // -------------------------
    myColladaLoader = new THREE.ColladaLoader();
    myColladaLoader.options.convertUpAxis = true;
    myColladaLoader.load("models/needle.dae", function (collada) {
        // Here we store the dae in a global variable.
        needleObj = collada.scene;
        // Scale your model to the correct size.
        needleObj.position.x = 5.5;
        needleObj.position.y = 12;
        needleObj.position.z = -7.9;
        needleObj.scale.x = 0.5;
        needleObj.scale.y = 0.5;
        needleObj.scale.z = 0.5;
        needleObj.updateMatrix();

        // Add the model to the scene.
        scene.add(needleObj);
        objects.push(needleObj);
    });

    // Add a model to the scene.
    // -------------------------
    myColladaLoader = new THREE.ColladaLoader();
    myColladaLoader.options.convertUpAxis = true;
    myColladaLoader.load("models/bed.dae", function (collada) {
        // Here we store the dae in a global variable.
        bedObj = collada.scene;
        // Scale your model to the correct size.
        bedObj.position.x = 10;
        bedObj.position.y = -2;
        bedObj.position.z = 10;
        bedObj.scale.x = 0.2;
        bedObj.scale.y = 0.2;
        bedObj.scale.z = 0.2;
        bedObj.updateMatrix();

        // Add the model to the scene.
        scene.add(bedObj);
        objects.push(bedObj);

    });

    // Add a model to the scene.
    // -------------------------
    myColladaLoader = new THREE.ColladaLoader();
    myColladaLoader.options.convertUpAxis = true;
    myColladaLoader.load("models/toilet.dae", function (collada) {
        // Here we store the dae in a global variable.
        toiletObj = collada.scene;
        // Scale your model to the correct size.
        toiletObj.position.x = 24;
        toiletObj.position.y = 5;
        toiletObj.position.z = 40;
        toiletObj.scale.x = 0.08;
        toiletObj.scale.y = 0.08;
        toiletObj.scale.z = 0.08;
        toiletObj.updateMatrix();
        // Add the model to the scene.
        scene.add(toiletObj);
        objects.push(toiletObj);

    });

    // Add a model to the scene.
    // -------------------------
    myColladaLoader = new THREE.ColladaLoader();
    myColladaLoader.options.convertUpAxis = true;
    myColladaLoader.load("models/guard.dae", function (collada) {
        // Here we store the dae in a global variable.
        guardObj = collada.scene;
        // Scale your model to the correct size.
        guardObj.position.x = -20;
        guardObj.position.y = 8;
        guardObj.position.z = 1;
        guardObj.scale.x = 3;
        guardObj.scale.y = 3;
        guardObj.scale.z = 3;
        guardObj.updateMatrix();
        // Add the model to the scene.
        scene.add(guardObj);
        objects.push(guardObj);

    });

    // Add a model to the scene.
    // -------------------------
    myColladaLoader = new THREE.ColladaLoader();
    myColladaLoader.options.convertUpAxis = true;
    myColladaLoader.load("models/chair.dae", function (collada) {
        // Here we store the dae in a global variable.
        chairObj = collada.scene;
        // Scale your model to the correct size.
        chairObj.position.x = 7;
        chairObj.position.y = 4;
        chairObj.position.z = 17;
        chairObj.scale.x = 0.25;
        chairObj.scale.y = 0.25;
        chairObj.scale.z = 0.25;
        chairObj.updateMatrix();
        // Add the model to the scene.
        scene.add(chairObj);
        objects.push(chairObj);

    });

    // Add a model to the scene.
    // -------------------------
    myColladaLoader = new THREE.ColladaLoader();
    myColladaLoader.options.convertUpAxis = true;
    myColladaLoader.load("models/window.dae", function (collada) {
        // Here we store the dae in a global variable.
        windowObj = collada.scene;
        // Scale your model to the correct size.
        windowObj.position.x = 26;
        windowObj.position.y = 10;
        windowObj.position.z = 17;
        windowObj.scale.x = 0.7;
        windowObj.scale.y = 0.4;
        windowObj.scale.z = 0.25;
        windowObj.updateMatrix();
        // Add the model to the scene.
        scene.add(windowObj);
        objects.push(windowObj);

    });

    myColladaLoader = new THREE.ColladaLoader();
    myColladaLoader.options.convertUpAxis = true;
    myColladaLoader.load("models/fly.dae", function (collada) {
        // Here we store the dae in a global variable.
        flyObj = collada.scene;

        // Store the animations.
        myDaeAnimations = collada.animations;
        // Store the number of animations.
        keyFrameAnimationsLength = myDaeAnimations.length;
        var i;
        var animation;
        var keyFrameAnimation;
        // Initialise last frame current time.
        for (i = 0; i < keyFrameAnimationsLength; i += 1) {
            lastFrameCurrentTime[i] = 0;
        }

        // Get all the key frame animations.
        for (i = 0; i < keyFrameAnimationsLength; i += 1) {
            animation = myDaeAnimations[i];

            keyFrameAnimation = new THREE.KeyFrameAnimation(animation);
            keyFrameAnimation.timeScale = 1;
            keyFrameAnimation.loop = false;
            // Add the key frame animation to the keyFrameAnimations array.
            keyFrameAnimations.push(keyFrameAnimation);
        }

        // Scale your model to the correct size.
        flyObj.position.x = -3;
        flyObj.position.y = 12;
        flyObj.position.z = 0;

        flyObj.scale.x = 0.003;
        flyObj.scale.y = 0.003;
        flyObj.scale.z = 0.003;
        //flyObj.rotation.y = 360 * Math.PI / 180;
        flyObj.updateMatrix();

        // Add the model to the scene.
        scene.add(flyObj);
        // start animations
        startAnimations();
    });
}

// Manually loop the animations.
function loopAnimations() {
    "use strict";
    var i;
    // Loop through all the animations.
    for (i = 0; i < keyFrameAnimationsLength; i += 1) {
        // Check if the animation is player and not paused.
        if (keyFrameAnimations[i].isPlaying && !keyFrameAnimations[i].isPaused) {
            if (keyFrameAnimations[i].currentTime === lastFrameCurrentTime[i]) {
                keyFrameAnimations[i].stop();
                keyFrameAnimations[i].play();
                lastFrameCurrentTime[i] = 0;
            }
        }

    }
}

function playerControls() {
    "use strict";
    // Check browser has pointer lock)
    if (controlsEnabled === true) {

        // Save time now
        var time = performance.now();
        // Create a delta value based on time
        var delta = (time - prevTime) / 1000;

        // Set the velocity.x and velocity.z using the calculated time delta
        velocity.x -= velocity.x * 10.0 * delta;
        velocity.z -= velocity.z * 10.0 * delta;

        // As velocity.y is our "gravity," calculate delta
        velocity.y -= 9.8 * 100.0 * delta; // 100.0 = mass

        // If moving forward and move forward is not blocked.
        if (moveForward && moveForward !== false) {
            velocity.z -= 400.0 * delta;
        }

        if (moveBackward) {
            velocity.z += 400.0 * delta;
        }

        if (moveLeft) {
            velocity.x -= 400.0 * delta;
        }

        if (moveRight) {
            velocity.x += 400.0 * delta;
        }

        // Update the position using the changed delta
        controls.getObject().translateX(velocity.x * delta);
        controls.getObject().translateY(velocity.y * delta);
        controls.getObject().translateZ(velocity.z * delta);

        // Prevent the camera/player from falling out of the world
        if (controls.getObject().position.y < 10) {

            velocity.y = 0;
            controls.getObject().position.y = 10;

        }

        // Save the time for future delta calculations
        prevTime = time;

    }
}


function flyMovement() {
    "use strict";
    // If fly exists
    if (flyObj) {
        // If Fly collided into the North wall
        if (flyObj.position.z > 40) {
            flyRandomDirection = flyDirectionalOptions[0][Math.floor(Math.random() * flyDirectionalOptions[0].length)];
            // fly west
            if (flyRandomDirection === 135) {
                flyObj.rotation.y = flyRandomDirection * Math.PI / 180;
            }
            // east
            if (flyRandomDirection === 225) {
                flyObj.rotation.y = flyRandomDirection * Math.PI / 180;
            }
            // south
            if (flyRandomDirection === 180) {
                flyObj.rotation.y = flyRandomDirection * Math.PI / 180;
            }
        }

        // If Fly collided into the West wall
        if (flyObj.position.x > 20) {
            flyRandomDirection = flyDirectionalOptions[1][Math.floor(Math.random() * flyDirectionalOptions[1].length)];
            // fly east
            if (flyRandomDirection === 270) {
                flyObj.rotation.y = flyRandomDirection * Math.PI / 180;
            }
            // north
            if (flyRandomDirection === 315) {
                flyObj.rotation.y = flyRandomDirection * Math.PI / 180;
            }
            // south
            if (flyRandomDirection === 225) {
                flyObj.rotation.y = flyRandomDirection * Math.PI / 180;
            }
        }

        // If Fly collided into the East wall
        if (flyObj.position.x < -25) {
            flyRandomDirection = flyDirectionalOptions[2][Math.floor(Math.random() * flyDirectionalOptions[2].length)];
            // fly west
            if (flyRandomDirection === 90) {
                flyObj.rotation.y = flyRandomDirection * Math.PI / 180;
            }
            // north
            if (flyRandomDirection === 45) {
                flyObj.rotation.y = flyRandomDirection * Math.PI / 180;
            }
            // south
            if (flyRandomDirection === 135) {
                flyObj.rotation.y = flyRandomDirection * Math.PI / 180;
            }
        }
        // If Fly collided into the South wall
        if (flyObj.position.z < 1) {
            flyRandomDirection = flyDirectionalOptions[3][Math.floor(Math.random() * flyDirectionalOptions[3].length)];
            // fly north
            if (flyRandomDirection === -0.5) {
                flyObj.rotation.y = flyRandomDirection * Math.PI / 180;
            }

        }

        // If Fly gets too high, bring down
        if (flyObj.position.y > 12) {
            flyObj.translateY(-5);
        }

        // Send the Fly to a random height
        if (flyObj.position.y < 12) {
            flyHeight = Math.floor(Math.random() * 4) + 1;
            flyObj.translateY(flyHeight);
        }

        // If Fly too low, bring up
        if (flyObj.position.y < 2) {
            flyObj.translateY(5);
        }

        // Move Fly forward
        flyObj.translateZ(0.18);
    }
}

//******* MOUSE MOVEMENT *******
function mouseMovement() {
    "use strict";
	var waitTime;
// If mouse exists
    if (mouseObj) {
        if (mouseObj.position.x < 15) { //Mouse moves towards centre
            mouseObj.rotation.y = 0.5 * Math.PI / 180;
        }
        if (mouseObj.position.z > 45) { // Mouse rotates left
            waitTime = Math.floor((Math.random() * 300) + 51); //Sets a random wait time between 51 - 350 frames
            mouseObj.rotation.y = 90 * Math.PI / 180;
        }
        if (mouseObj.position.x > 37) { //Mouse has left the cell, waits and then returns to starting position
            if (waitTime > 0){
                waitTime +-1;
            }
            //Mouse starting position
            mouseObj.rotation.y = 275 * Math.PI / 180;
            mouseObj.position.x = 24;
            mouseObj.position.y = 1.5;
            mouseObj.position.z = 25;
        }
        //Mouse moves forward
        mouseObj.translateZ(+0.10);	
    }
}
	
//*****************************

function collide() {
    "use strict";
    // Direction vector when moving left,right,backwards
    var rotationMatrix;
    // Generic camera direction to set
    var cameraDirection = controls.getDirection(new THREE.Vector3(0, 0, 0)).clone();
    // Camera needs to slightly look down to intersect ground objects.
    cameraDirection.y = -0.8;
    // Generic forward facing raycaster
    var raycaster = new THREE.Raycaster(
        new THREE.Vector3(),
        new THREE.Vector3(0, 0, 1),
        0,
        10
    );


    // If moving forward
    if (moveForward) {
        // Direction does not need updating as we are facing forward!
        raycaster.set(controls.getObject().position, cameraDirection);

        // Check what raycaster intersects.
        var intersectsForward = raycaster.intersectObjects(objects, true);
        // If we have collided with an object - disable moving forward.
        if (intersectsForward.length > 0) {
            moveForward = false;
        }
    }


    // If moving left
    if (moveLeft) {
        rotationMatrix = new THREE.Matrix4();
        // Set direction vector to left side
        rotationMatrix.makeRotationY(90 * Math.PI / 180);
        // Set camera direction
        cameraDirection.applyMatrix4(rotationMatrix);
        // Update raycaster
        raycaster.set(controls.getObject().position, cameraDirection);

        // Check what raycaster intersects.
        var intersectsLeft = raycaster.intersectObjects(objects, true);
        // If we have collided with an object - disable moving left.
        if (intersectsLeft.length > 0) {
            moveLeft = false;
        }
    }


    // if moving right
    if (moveRight) {
        rotationMatrix = new THREE.Matrix4();
        // Set direction vector to right side
        rotationMatrix.makeRotationY(270 * Math.PI / 180);
        // Set camera direction
        cameraDirection.applyMatrix4(rotationMatrix);
        // Update raycaster
        raycaster.set(controls.getObject().position, cameraDirection);

        // Check what raycaster intersects.
        var intersectsRight = raycaster.intersectObjects(objects, true);
        // If we have collided with an object - disable moving right.
        if (intersectsRight.length > 0) {
            moveRight = false;
        }
    }


    // if moving backwards
    if (moveBackward) {
        rotationMatrix = new THREE.Matrix4();
        // Set direction vector to back side
        rotationMatrix.makeRotationY(180 * Math.PI / 180);

        cameraDirection.applyMatrix4(rotationMatrix);
        raycaster.set(controls.getObject().position, cameraDirection);

        // Check what raycaster intersects.
        var intersectsBackwards = raycaster.intersectObjects(objects, true);
        // If we have collided with an object - disable moving forward.
        if (intersectsBackwards.length > 0) {
            moveBackward = false;
        }
    }

}

function guard() {
    "use strict";
    if (guardObj) {
        //Finite state machine.
        switch (guardState) {
        //guard patroling the cell block.
        case "Patrol":
            //If the guard is facing a wall.
            if (guardNeedsToTurn) {
                //While the guard has to still turn.
                if (leftToTurn > 0) {
                    //Reduce counter.
                    leftToTurn -= 1;
                    //Turn guard.
                    guardObj.rotateY(-guardTurnSpeed);
                } else {
                    //Reset value of turn.
                    leftToTurn = 180;
                    //Continue patrolling.
                    guardNeedsToTurn = false;
                }
            } else {
                //Move the guard according to the speeds.
                guardObj.position.x = guardObj.position.x + guardMoveSpeedXPos;
                guardObj.position.z = guardObj.position.z + guardMoveSpeedZPos;
                //Increment the step counter.
                stepsAway += step;
                //Detect if the guard needs to turn.
                if (stepsAway === 300 || stepsAway === 0) {
                    //Flip the direction of movement.
                    guardMoveSpeedXPos = 0.0 - guardMoveSpeedXPos;
                    guardMoveSpeedZPos = 0.0 - guardMoveSpeedZPos;
                    step = 0 - step;
                    //Prepare to turn.
                    guardNeedsToTurn = true;
                }
            }
            break;
        //guard heard a noise.
        case "Responding":
            if (stepsAway === 0) {
                if (leftToTurn > angleFromCell) {
                    //Reduce counter.
                    leftToTurn -= 2;
                    //Turn guard.
                    guardObj.rotateY(-(2 * guardTurnSpeed));
                } else if (leftToTurn < angleFromCell) {
                    leftToTurn += 2;
                    //Turn guard.
                    guardObj.rotateY(2 * guardTurnSpeed);
                } else {
                    guardState = "Checking Cell";
                    guardSearchTime = Math.floor((Math.random() * 100) + 1) * 3;
                }
            } else {
                if (guardNeedsToTurn) {
                    //While the guard has to still turn.
                    if (leftToTurn > 0) {
                        //Reduce counter.
                        leftToTurn -= 2;
                        //Turn guard.
                        guardObj.rotateY(-(2 * guardTurnSpeed));
                    } else {
                        //Reset value of turn.
                        leftToTurn = 180;
                        guardNeedsToTurn = false;
                        //Flip the direction of movement.
                        guardMoveSpeedXPos = 0.0 - guardMoveSpeedXPos;
                        guardMoveSpeedZPos = 0.0 - guardMoveSpeedZPos;
                        step = 0 - step;
                    }
                    //Bug fix if steps away wont end up as 0.s
                } else if (stepsAway === 1) {
                    //Move the guard according to the speeds.
                    guardObj.position.x = guardObj.position.x + (1 * guardMoveSpeedXPos);
                    guardObj.position.z = guardObj.position.z + (1 * guardMoveSpeedZPos);
                    //Increment the step counter.
                    stepsAway += (1 * step);
                } else {
                    //Move the guard according to the speeds.
                    guardObj.position.x = guardObj.position.x + (2 * guardMoveSpeedXPos);
                    guardObj.position.z = guardObj.position.z + (2 * guardMoveSpeedZPos);
                    //Increment the step counter.
                    stepsAway += (2 * step);
                }
            }
            break;
        //Checking cell.
        case "Checking Cell":
            if (guardSearchTime > 0) {
                guardSearchTime -= 1;
            } else {
                guardNeedsToTurn = true;
                leftToTurn = 90;
                guardState = "Returning";

            }
            break;
        //Returning to patrol.
        case "Returning":
            if (guardNeedsToTurn) {
                //While the guard has to still turn.
                if (leftToTurn > 0) {
                    //Reduce counter.
                    leftToTurn -= 1;
                    //Turn guard.
                    guardObj.rotateY(-guardTurnSpeed);
                } else {
                    //Reset value of turn.
                    leftToTurn = 180;
                    guardNeedsToTurn = false;
                    if (step < 0) {
                        //Flip the direction of movement.
                        guardMoveSpeedXPos = 0.0 - guardMoveSpeedXPos;
                        guardMoveSpeedZPos = 0.0 - guardMoveSpeedZPos;
                        step = 0 - step;
                    }
                    guardState = "Patrol";
                }
            }
            break;
        default:
            window.alert("guard error, please restart");
        }
    }
}

//Catch player out of bounds
function catchError() {
    "use strict";
    //if z pos is out of bounds.
    if (controls.getObject().position.z < -4 || controls.getObject().position.z > 42) {
        //reset position.
        controls.getObject().position.z = 0;
        controls.getObject().position.x = 0;
    }
    if (controls.getObject().position.x < -30 || controls.getObject().position.x > 22) {
        //reset position.
        controls.getObject().position.z = 0;
        controls.getObject().position.x = 0;
    }
}

// The game timer (aka game loop). Called x times per second.
function render() {
    "use strict";

    // Get the time since this method was called.
    var deltaTime = clock.getDelta();
    var animation;
    // Here we control how the camera looks around the scene.
    window.requestAnimationFrame(render);

    // Update the model animations.
    var i;
    for (i = 0; i < keyFrameAnimationsLength; i += 1) {
        // Get a key frame animation.
        animation = keyFrameAnimations[i];
        animation.update(deltaTime);
    }

    // Check if need to loop animations. Call loopAnimations() after the
    // animation handler update.
    loopAnimations();
    // Check collide
    collide();
    // Get movement
    playerControls();
    // handle fly movement
    flyMovement();
	//Mouse movement
    mouseMovement();
    // guard operations.
    guard();
    // Render the scene.
    renderer.render(scene, camera);

    catchError();

    for (i = 0; i < keyFrameAnimationsLength; i += 1) {
        lastFrameCurrentTime[i] = keyFrameAnimations[i].currentTime;
    }
}

// Initialise three.js.
init();
// initialise scene
initScene();
// render
render();