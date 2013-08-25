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

The long term goals is:

 - Simple "dynamic" parameters, controllable through a HTML interface.
 - A nice looking metal shader that supports image based lighting.
 - The ability to easily reuse large parts for new demos, a framework
   for WebGL shader demos.

Can I watch it online?
----------------------

Head over too http://quaternion.se/demos/ibl/ for reasonably up to date version.

License
-------

Check each individual file, the libraries are not mine, but everything else is and is under MIT.
