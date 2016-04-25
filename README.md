webglmat
========

A simple material demo for WebGL. Features a viewport and a JavaScript UI to tweak the material.

Current status
--------------

Check out `main.js` in `src/js/`.

The shaders are in `src/shaders/`.

Current shaders implemented:

 - Simple Blinn-Phong
 - Simple material with microfacet specular, currently it is
   mostly Cook-Torrance, but will end up with GGX as the distribution
   term; for pretty specular highlights.

The long term goals are:

 - Simple "dynamic" parameters, controllable through a HTML interface.
 - A nice looking metal shader that supports image based lighting.
 - The ability to easily reuse large parts for new demos, a framework
   for WebGL shader demos.

Can I watch it online?
----------------------

(not at the moment)

Issues
------
Doesn't seem to work in Microsoft Edge. Untested in latest versions of Chrome.

License
-------

Check each individual file, the libraries (Three.js, jQuery etc) are not made by me, but are generally available with a very liberal license. Some of the cubemaps comes from humus.name and are under CC 3.0 Attribution.

The teapot model I don't really know. The original Utah teapot dataset is kind of public domain.

Everything signed by me is under the MIT license for this project.
