import vertex_shader from "./shaders/vertex.glsl?raw";
import fragment_shader from "./shaders/fragment.glsl?raw";
import { assert } from "./util";
import { makeProgram, collectUniforms, makeVAO, withVAO } from "./webgl";

export default class {
  constructor(private gl: WebGL2RenderingContext) {
    if (import.meta.hot) {
      import.meta.hot.dispose(() => {
        this.invalid = false;
      })
    }
  }
  private invalid = false;
  canRender(): boolean {
    return !this.gl.isContextLost() && !this.invalid;
  }
  updateViewport() {
    this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
  }

  private program = makeProgram(this.gl, vertex_shader, fragment_shader);
  private uniforms = collectUniforms(this.gl, this.program);
  private vao = withVAO(
    this.gl,
    makeVAO(this.gl, this.program, {
      vertex_xy: [
        [-0.5, 0],
        [0, 0.8660254037844386], // estimating an equilateral :)
        [0.5, 0],
      ],
      // typical triangle uvs
      texture_xy: [[0, 0], [0, 1], [1, 0]],
      // Two instances of the triangle
      object_xy: [[-0.6, 0], [0.6, 0]],
    }),
    () => {
      // Mark `object_xy` to be used for instancing. We tell it to use each position once.
      this.gl.vertexAttribDivisor(assert(this.gl.getAttribLocation(this.program, "object_xy")), 1);
    }
  );

  render(now: number, view_matrix: Float32Array) {
    this.gl.useProgram(this.program);

    this.gl.uniform1f(this.uniforms.time, now);
    this.gl.uniformMatrix4fv(this.uniforms.view, false, view_matrix);

    withVAO(this.gl, this.vao, () => this.gl.drawArraysInstanced(this.gl.TRIANGLES, 0, 3, 2));
  }
}