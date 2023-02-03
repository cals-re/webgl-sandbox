#version 300 es
precision mediump float;
in vec2 v_texture_xy;
out vec4 fragColor;

void main() {
    fragColor = vec4(v_texture_xy, 0.5, 1);
}