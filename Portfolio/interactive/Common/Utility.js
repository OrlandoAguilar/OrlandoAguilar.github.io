function degrees(rad) {
    return rad * 180.0 / Math.PI;
}


function color2fvec(color) {
    var r = ((color >> 16) & 0xFF) / 255.0;
    var g = ((color >> 8) & 0xFF) / 255.0;
    var b = (color & 0xFF) / 255.0;
    return vec3(r, g, b);
}

function vec2htmColor(color) {
    return (Math.floor(color[0] * 255) << 16) | (Math.floor(color[1] * 255) << 8) | Math.floor(color[2] * 255);
}

function rand(min, max) {
    return (Math.random() * (max-min)) + min;
}

function randi(min, max) {
    return Math.round((Math.random() * (max - min)) + min);
}

function clamp(a,b,c){return Math.max(b,Math.min(c,a))};

function CameraController(element) {
    var controller = this;
    this.onchange = null;
    this.xRot = 0;
    this.yRot = 0;
    this.scaleFactor = 80.0;
    this.dragging = false;
    this.curX = 0;
    this.curY = 0;
    this.radius = 3.0;

    element.onmousewheel=function(e) {

        // cross-browser wheel delta
        var e = window.event || e;
        var delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)));
        controller.radius += delta;

        return false;
    }


    // Assign a mouse down handler to the HTML element.
    element.onmousedown = function (ev) {
        controller.dragging = true;
        controller.curX = ev.clientX;
        controller.curY = ev.clientY;
    };

    // Assign a mouse up handler to the HTML element.
    element.onmouseup = function (ev) {
        controller.dragging = false;
    };

    element.onmouseout = function (ev) {
        controller.dragging = false;
    };

    // Assign a mouse move handler to the HTML element.
    element.onmousemove = function (ev) {
        if (controller.dragging) {
            // Determine how far we have moved since the last mouse move
            // event.
            var curX = ev.clientX;
            var curY = ev.clientY;
            var deltaX = (controller.curX - curX) / controller.scaleFactor;
            var deltaY = (controller.curY - curY) / controller.scaleFactor;
            controller.curX = curX;
            controller.curY = curY;
            // Update the X and Y rotation angles based on the mouse motion.
            controller.yRot = (controller.yRot + deltaX) % 360;
            controller.xRot = (controller.xRot + deltaY);
            // Clamp the X rotation to prevent the camera from going upside
            // down.
            if (controller.xRot < -90) {
                controller.xRot = -90;
            } else if (controller.xRot > 90) {
                controller.xRot = 90;
            }
            // Send the onchange event to any listener.
            if (controller.onchange != null) {
                controller.onchange(controller.xRot, controller.yRot);
            }
        }
    };
}