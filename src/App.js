import { PerspectiveCamera, Scene, WebGLRenderer } from "three"
import Cube from "./world/Cube"
import { OrbitControls } from "three/examples/jsm/Addons.js"

let appInstance = null
export default class App  {
    constructor(canvas) {
        if (appInstance) {
            return appInstance
        }
        appInstance = this

        this.canvas = canvas
        this.scene = null
        this.camera = null
        this.renderer = null
        this.cube = null
        this.controls = null

        this.animateBound = this.animate.bind(this)

        this.init()
        this.animate()
    }

    init () {
        this.scene = new Scene()

        const aspect = this.canvas.clientWidth / this.canvas.clientHeight
        this.camera = new PerspectiveCamera(90, aspect, 0.1, 1000)
        this.camera.position.set(0, 0, 10)
        this.controls = new OrbitControls(this.camera, this.canvas)

        this.renderer = new WebGLRenderer({
            canvas: this.canvas,
            antialias: true
        })

        this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight)
        this.renderer.setPixelRatio(1)

        this.cube = new Cube()

        this.scene.add(this.cube.instance)
    }

    animate () {
        requestAnimationFrame(this.animateBound)
        
        this.renderer.render(this.scene, this.camera)
    }

    destroy () {
        //release memory of the scene 

        this.scene = null
        this.camera = null
        this.renderer = null

        this.cube.destroy()
        this.cube = null

        this.animateBound = null
        this.canvas = null

        appInstance = null
    }
}