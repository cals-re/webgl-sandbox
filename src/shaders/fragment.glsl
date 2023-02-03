precision mediump float;
varying vec2 v_texture_xy;

void main() {
    gl_FragColor = vec4(v_texture_xy, 0.5, 1);
}