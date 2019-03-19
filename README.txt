MODELS go in /models and texture images go in /models/images

First of all go to MyJavaScriptFile and add a global variable for your model object. This is found on line 42.

Then to add your model use the code below with your own model names. Add models in the initscene function. You will see my 3 existing models. 

You can move stuff around with position.x and position.z and scale with scale.z.
You must add a global variable to store your model - in this case mine is bedObj -



 // Add a model to the scene.
    // -------------------------
    myColladaLoader = new THREE.ColladaLoader();
    myColladaLoader.options.convertUpAxis = true;

    myColladaLoader.load('models/bed.dae', function(collada) {
        // Here we store the dae in a global variable.
        bedObj = collada.scene;
		
        // Scale your model to the correct size.
        bedObj.position.x = -20;
        bedObj.position.y = -2;
        bedObj.position.z = 0.9;

        bedObj.scale.x = bedObj.scale.y = bedObj.scale.z = 0.2;
        bedObj.updateMatrix();

        // Add the model to the scene.
        scene.add(bedObj);
        objects.push(bedObj);

    });
}



KNOWN ISSUES - 
* Only walls are working for collision other models are not yet
* Only forwards collision works.
* The spawn point needs to be moved to middle of the room
* Textures needed for models.
