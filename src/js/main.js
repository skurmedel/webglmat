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

function LoadResource(url, cb)
{
	$.ajax({
		url: url, 
		dataType: "text",
		cache: false, /* helps immensely during testing. */
		success: cb
	});
}

function DefaultDemo(vs_url, fs_url)
{
	this.fs_url = fs_url == undefined? null : fs_url;
	this.vs_url = vs_url == undefined? null : vs_url;
}

DefaultDemo.prototype =
{
	load: function DefaultDemo_load(cb)
	{
		var me = this;
		var fs_cb = function(data) 
		{
			me.fs = data;
			cb();
		};
		var vs_cb = function(data) 
		{
			me.vs = data; 
			if (me.fs_url == null)
			{
				fs_cb(
					  "varying vec3 N;"
					+ "varying vec3 p;"
					+ "uniform vec3 light_pos;"
					+ "void main() {"
					+ "  vec3 L = normalize(p - (viewMatrix * vec4(light_pos, 1.0)).xyz);"
					+ "  gl_FragColor = vec4(dot(N, L) * vec3(1.0, 0.0, 0.0), 1.0);"
					+ "}");
			}
			else
				LoadResource(me.fs_url, fs_cb);
		};

		if (me.vs_url == null)
		{
			vs_cb(
				  "varying vec3 N;"
				+ "varying vec3 p;"
				+ "void main() { gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); p = gl_Position.xyz; N = normalize((normalMatrix * normal)).xyz;}");
		}
		else
			LoadResource(me.vs_url, vs_cb);
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
		sphere = new THREE.Mesh(
			new THREE.SphereGeometry(2, 32, 20), 
			shader);
		scene.add(sphere);

		var light = new THREE.PointLight(0xFFFFFF);
		light.position.y = -20;
		light.position.x = -20;
		light.position.z = -20;
		scene.add(light);

		shader.uniforms.light_pos.value = light.position;
	},

	onRender: function DefaultDemo_onRender(renderer, scene, ms)
	{
		var delta = ms / 1000.0;
		
		this.camera.updateProjectionMatrix();

		renderer.render(scene, this.camera);
	},

	createShaders: function DefaultDemo_createShaders()
	{
		var material = new THREE.ShaderMaterial(
			{
				fragmentShader: this.fs, 
				vertexShader: this.vs, 
				uniforms: {
					"light_pos": { type: 'v3', value: new THREE.Vector3(0.0, 1.0, 0.0) },
				}
			}
		);
		return material;
	}
}

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

