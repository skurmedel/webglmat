/*
	The MIT License (MIT)

	Copyright (c) 2013 Simon Otter

	Permission is hereby granted, free of charge, to any person obtaining a copy of
	this software and associated documentation files (the "Software"), to deal in
	the Software without restriction, including without limitation the rights to
	use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
	the Software, and to permit persons to whom the Software is furnished to do so,
	subject to the following conditions:

	The above copyright notice and this permission notice shall be included in all
	copies or substantial portions of the Software.

	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
	FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
	COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
	IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
	CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

window.requestAnimFrame = (function(){
  return  window.requestAnimationFrame       ||
          window.webkitRequestAnimationFrame ||
          window.mozRequestAnimationFrame    ||
          function( callback ){
            window.setTimeout(callback, 1000 / 60);
          };
})();


/* ----------------------------------------------------------------------------
	BATCHLOADER CLASS.
   ------------------------------------------------------------------------- */

/*
	This class makes chained loading easier.

	The construct takes a callback, called onSuccess, this callback is called 
	as the last function in the chain, after all the loads are completed.
*/
function BatchLoader(onSuccess)
{
	if (onSuccess === undefined || onSuccess === null)
	{
		var e = new Error();
		e.msg = "Requires a callback."
		throw e;
	}
	this.onSuccess = onSuccess;
	this.current = null;
}

BatchLoader.prototype = 
{
	/*
		Adds a loader and a callback to the chain.

		loader is a function and it must in some way make sure onSuccess 
		is called.

		onSuccess is the callback for when loading is completed,
		it is passed whatever arguments loader calls it with.
	*/
	add: function BatchLoader_add(loader, onSuccess)
	{
		var oldCurrent = this.current;
		if (this.current === null)
		{
			oldCurrent = this.onSuccess;
		}

		var me = this;
		var cb = function call_success_and_run_next()
		{
			onSuccess.apply(me, arguments);
			oldCurrent();
		}
		this.current = function ()
		{
			loader(cb);
		} 
	},

	addUri: function BatchLoader_addUri(uri, onSuccess, cache)
	{
		var cache = cache === undefined? false : cache;
		this.add(function (cb) {
			$.ajax({
				url: uri, 
				dataType: "text",
				cache: cache,
				success: cb
			});
		}, onSuccess);
	},

	run: function BatchLoader_run()
	{
		this.current();
	}
};

/* ----------------------------------------------------------------------------
	DEFAULT DEMO CLASS.
   ------------------------------------------------------------------------- */

function DefaultDemo(vs_url, fs_url, onSetupComplete)
{
	this.fs_url = fs_url == undefined? null : fs_url;
	this.vs_url = vs_url == undefined? null : vs_url;

	this.onSetupComplete = onSetupComplete === undefined? function() {} : onSetupComplete;
}

DefaultDemo.prototype =
{
	load: function DefaultDemo_load(cb)
	{
		var me = this;
		var fs_cb = function(data) 
		{
			me.fs = data;			
		};
		var vs_cb = function(data) 
		{
			me.vs = data;
		};

		var bl = new BatchLoader(cb);
		bl.add(
			function (onSuccess) {
				var jsonLoader = new THREE.JSONLoader();
				jsonLoader.load("assets/teapot_tri_4k.js", onSuccess);
			},
			function (geo)
			{
				me.teapot_geo = geo;
				me.teapot_geo.computeBoundingSphere();
				me.teapot_geo.computeTangents();
				
				var sm = new THREE.Matrix4();
				sm.makeScale(50, 50, 50);
				var tm = new THREE.Matrix4();
				tm.makeTranslation(0.0, -2.5, 0.0);

				me.teapot_geo.applyMatrix(tm.multiply(sm));
			});
		bl.add(
			function (onSuccess) {
				var prefix = "assets/basilica/";
				THREE.ImageUtils.loadTextureCube([
						prefix + "posx.jpg",
						prefix + "negx.jpg",
						prefix + "posy.jpg",
						prefix + "negy.jpg",
						prefix + "posz.jpg",
						prefix + "negz.jpg"
					],
					THREE.CubeReflectionMapping,
					onSuccess);
			},
			function (tex) {
				me.environmentmap = tex;
				me.environmentmap.mapping = THREE.CubeReflectionMapping;
			});
		bl.addUri(me.fs_url, fs_cb);
		bl.addUri(me.vs_url, vs_cb);

		bl.run();
	},

	setup: function DefaultDemo_setup(renderer, scene)
	{
		var VIEWPORT = 
		{
			x: 600,
			y: Math.floor(0.5625 * 600)
		};
		VIEWPORT.aspect = VIEWPORT.x / VIEWPORT.y;
		renderer.setSize(VIEWPORT.x, VIEWPORT.y);

		this.camera = new THREE.PerspectiveCamera(
			50,
			VIEWPORT.aspect,
			0.1,
			1000.0);

		scene.add(this.camera);

		this.camera.position.z = 20;

		var shader = this.createShaders();
		this.mesh = new THREE.Mesh(
			this.teapot_geo, 
			shader);
		this.mesh.geometry.computeFaceNormals();
		this.mesh.geometry.computeVertexNormals();
		this.mesh.normalsNeedUpdate = true;
		this.mesh.buffersNeedUpdate = true;
		scene.add(this.mesh);

		var light = new THREE.PointLight(0xFFFFFF);
		light.position.y = -20;
		light.position.x = -20;
		light.position.z = -20;
		scene.add(light);

		shader.uniforms.light_pos.value = light.position;

		this.y_angle = 0.0;

		this.onSetupComplete(this);
	},

	onRender: function DefaultDemo_onRender(renderer, scene, ms)
	{
		var delta = ms / 1000.0;

		this.y_angle += delta * (3.1417 / 4.0);
		this.y_angle = this.y_angle % 6.28;
		//this.camera.position.z = Math.sin(this.y_angle) * 20;
		//this.camera.position.x = Math.cos(this.y_angle) * 20;
		//this.camera.lookAt(new THREE.Vector3(0.0, 0.0, 0.0));
		
		//this.camera.updateProjectionMatrix();
		this.mesh.rotation.y = this.y_angle;
		this.mesh.rotation.z = 0.3;
		renderer.render(scene, this.camera);
	},

	createShaders: function DefaultDemo_createShaders()
	{
		this.material = new THREE.ShaderMaterial(
			{
				fragmentShader: this.fs, 
				vertexShader: this.vs, 
				uniforms: {
					"env": { type: 't', value: this.environmentmap },
					"light_pos": { type: 'v3', value: new THREE.Vector3(0.0, 1.0, 0.0) },
					"roughness": { type: 'f', value: 0.2 },
					"ior": { type: "f", value: 1.5 }
				}
			}
		);
		return this.material;
	}
};

/*
	Sets up a WebGL context in some element, loads two shaders
	from the path specified and displays it.

	Arguments:

		canvas		an element to add the WebGL context under.
		bg			an integer specifying a colour, i.e 0xFF00FF
		demo 		an object with the following methods:
						load(callback) -> null
						setup(renderer, scene) -> null
						onRender(renderer, scene, ms) -> null
					onRender should call:
						renderer.render(scene, cam)


*/
function setupShaderDemoArea(canvas, bg, demo) {
	var renderer = new THREE.WebGLRenderer({antialias: true});
	renderer.setClearColor(bg);
	canvas.append(renderer.domElement);

	var scene = new THREE.Scene();

	if (demo == undefined)
	{
		demo = new DefaultDemo();
	}

	demo.load(function ()
	{
		demo.setup(renderer, scene);

		var ms = Date.now();
		function render()
		{
			requestAnimationFrame(render);
			
			var tmp = Date.now();
			demo.onRender(renderer, scene, tmp - ms);
			ms = tmp;
		}
		render();
	});
}

/* ----------------------------------------------------------------------------
	USER INTERFACE MODEL & CONTROLLER.
   ------------------------------------------------------------------------- */

function FloatProperty(targetObj, name, min, max, description)
{
	this.obj = targetObj;
	this.name = name;
	this.range = {};
	if (min !== undefined)
		this.range.min = new Number(min);
	if (max !== undefined)
		this.range.max = new Number(max);

	this.type = "float";

	this.description = description;
}

FloatProperty.prototype =
{
	set: function (v)
	{
		this.obj[this.name] = v;
	}
};

function Vector3Property(targetObj, name, description)
{
	this.obj = targetObj;
	this.name = name;
	this.type = "vec3";

	this.description = description;
}

Vector3Property.prototype = 
{
	set: function (x, y, z)
	{
		if (y === undefined)
		{
			y = x;
			z = x;
		}

		this.obj[this.name].x = x;
		this.obj[this.name].y = y;
		this.obj[this.name].z = z;
	},

	setX: function (v)
	{
		this.obj[this.name].x = v;
	},

	setY: function (v)
	{
		this.obj[this.name].y = v;
	},

	setZ: function (v)
	{
		this.obj[this.name].x = v;
	}
};

RGBProperty = Vector3Property;

function UniformModel(targetObj)
{
	this.targetObj;
	this.properties = {};
}

UniformModel.prototype = 
{
	createVector3Property: function (name)
	{
		this.properties[name] = new Vector3Property(this.targetObj, name);
	},

	createFloatProperty: function (name)
	{
		this.properties[name] = new FloatProperty(this.targetObj, name);
	},

	createRGBProperty: function (name)
	{
		this.properties[name] = new RGBProperty(this.targetObj, name);
	}
};

/* ----------------------------------------------------------------------------
	USER INTERFACE CONTROLS.
   ------------------------------------------------------------------------- */

function createControl(property)
{
	var t = typeof property;
	if (t != "object")
		return null;
	
	t = property.type;
	if (t === "float")
	{
		var control = $("<input type='range'/>");
		control.attr(property.range);
		control.attr("step", "0.05");
		control.change(function () { property.set(this.value); });

		return control;		
	}
	else
	{
		return null;
	}
}