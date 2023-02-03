import { assert, range } from "./util";

/// Find the locations of all uniforms required by a `program`
export function collectUniforms(
    gl: WebGL2RenderingContext,
    program: WebGLProgram
): { [key: string]: WebGLUniformLocation } {
    return Object.fromEntries(range(gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS)).map(i => {
        const desc = assert(gl.getActiveUniform(program, i));
        return [desc.name, assert(gl.getUniformLocation(program, desc.name))];
    }))
}

export function withVAO(gl: WebGL2RenderingContext, vao: WebGLVertexArrayObject, cb: () => void): WebGLVertexArrayObject {
    gl.bindVertexArray(vao);
    cb();
    gl.bindVertexArray(null);
    return vao;
}


/** Build a VAO suitable for drawing with the `program`.
  * 
  * `buffers` should contain all attributes used by the vertex shader.
  */
export function makeVAO(
    gl: WebGL2RenderingContext,
    program: WebGLProgram,
    buffers: { [key: string]: number[][] }
): WebGLVertexArrayObject {
    return withVAO(gl, assert(gl.createVertexArray()), () => {
        range(gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES)).map(i => {
            const desc = assert(gl.getActiveAttrib(program, i));

            const buffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
            gl.enableVertexAttribArray(i);
            switch (desc.type) {
                case gl.FLOAT_VEC2:
                    if (!(desc.name in buffers))
                        throw new Error(`Missing attribute for vertex shader: ${desc.name}`);
                    const input = buffers[desc.name];
                    const array = new Float32Array(input.length * 2);
                    for (let i = 0; i < input.length; i += 1) array.set(input[i], i * 2);
                    gl.bufferData(gl.ARRAY_BUFFER, array, gl.STATIC_DRAW);
                    gl.vertexAttribPointer(i, 2, gl.FLOAT, false, 0, 0);
                    break;
                default:
                    throw new Error(`Unknown WebGL type ${desc.type}`);
            }
            return [desc.name, i];
        })
    });
}

export function makeProgram(
    gl: WebGL2RenderingContext,
    vertex_shader: string,
    fragment_shader: string
): WebGLProgram {
    var program = assert(gl.createProgram());
    const shaders: [number, string][] = [[gl.VERTEX_SHADER, vertex_shader], [gl.FRAGMENT_SHADER, fragment_shader]];
    for (const [type, source] of shaders) {
        var shader = assert(gl.createShader(type));
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(assert(gl.getShaderInfoLog(shader)));
        gl.attachShader(program, shader);
    }
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(assert(gl.getProgramInfoLog(program)));
    return program;
}