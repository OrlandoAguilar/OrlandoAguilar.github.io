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