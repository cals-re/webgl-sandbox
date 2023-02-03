import Renderer from "./Renderer";
import { assert, Cached } from "./util";

/// An `App` handles the interaction with the Browser, listening for events about visiblity changes.
export class App extends HTMLCanvasElement {
    private pendingAnimationFrame = 0;
    private isIntersectingViewport = true;
    private Renderer = Renderer;
    private renderer = new Cached(() => new this.Renderer(assert(this.getContext("webgl2"))));
    private viewMatrix = new Cached(() => {
        const { width, height } = this;
        // Map worldspace to clipspace. this places -1:1 in the middle of the screen with proportional x:y.
        // For large screens, -1:1 will only take up 720 logical pixels
        const max_size_of_view_subject = 720;
        const minor_axis_length = Math.min(
            max_size_of_view_subject,
            Math.min(width, height)
        );
    
        return new Float32Array([
            minor_axis_length / width, 0, 0, 0,
            0, minor_axis_length / height, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1,
        ]);
    });
    onAnimate() {
        cancelAnimationFrame(this.pendingAnimationFrame);

        // Connect to the renderer
        const renderer = this.renderer.get();
        const display_visible = this.isIntersectingViewport && this.ownerDocument.visibilityState === "visible"
                             && renderer && renderer.canRender();
        if (!display_visible) return; // Stop the frame loop

        this.pendingAnimationFrame = requestAnimationFrame(() => this.onAnimate());
        renderer.render(performance.now(), this.viewMatrix.get());
    }
    onIntersectViewport(intersection: IntersectionObserverEntry) {
        this.isIntersectingViewport = intersection.isIntersecting;
        this.onAnimate();
    }
    onResize() {
        const { width, height } = this.getBoundingClientRect();
        // Render to the canvas' new resolution
        this.width = width;
        this.height = height;
        this.renderer.get().updateViewport();
        this.viewMatrix.invalidate();

        this.onAnimate();
    }
    constructor() {
        super();
        if (import.meta.hot) {
            import.meta.hot.accept("./renderer", (mod) => {
                if (mod) {
                    this.Renderer = mod.default;
                    this.renderer.invalidate();
                    this.onAnimate();
                }
            });
        }
        
        // Hook the DOM for resize, viewport intersection, document visibility, and WebGL context
        this.ownerDocument.addEventListener("visibilitychange", () => this.onAnimate());
        this.addEventListener("webglcontextrestored", () => (this.renderer.invalidate(), this.onAnimate()));
        new IntersectionObserver(e => this.onIntersectViewport(e[e.length - 1])).observe(this);
        new ResizeObserver(() => this.onResize()).observe(this);
    }
}