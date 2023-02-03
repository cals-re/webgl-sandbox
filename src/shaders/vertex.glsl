#version 300 es
in vec2 vertex_xy;
// Position of the parent object
in vec2 object_xy;
// Unix timestamp in ms
uniform float time;
uniform mat4 view;

in vec2 texture_xy;
out vec2 v_texture_xy;

void main() {
    float period = 1000.0;
    float oscillator = abs(mod(time / period, 1.0) - 0.5) * 2.0;
    
    vec2 mirror = vec2((gl_InstanceID & 1) == 0, (gl_InstanceID & 2) == 0) * 2.0 - vec2(1,1);
    vec2 pos = vertex_xy * mirror + object_xy + vec2(0, 0.2 * oscillator - 0.1);
    gl_Position = view * vec4(pos, 1, 1);

    v_texture_xy = texture_xy;
}