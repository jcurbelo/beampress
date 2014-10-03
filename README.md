beampress
=========

It's a presentation plugin based on the syntax of beamer.

HOW TO USE IT
---------------

First add jquery >= 1.10.2 and beampress.js.

```html
<!-- include jquery and beampress.js-->
<script src="//ajax.googleapis.com/ajax/libs/jquery/1.10.2/jquery.min.js"></script>
<script src="beampress.js"></script>
```

If your beampress download is placed in a different folder, don't forget to change file path.

Wrap all your presentation into a container e.g `main-container`. This element will contains all the `frames` and `slide-items`.

```html
<div id="main-container">
	<!-- The frames (presentation content) go here -->
</div>
```

Run script after document ready.

```javascript
$(document).ready(function(){
    $("#main-container").beampress();
 });
```