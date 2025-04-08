import { PerspectiveCamera, Scene, WebGLRenderer } from "three"
import Cube from "./World/Cube"
import { OrbitControls } from "three/examples/jsm/Addons.js"
import EventEmitter from "./Utils/EventEmitter"
import CanvasSize from "./Core/CanvasSize"
import Camera from "./Core/Camera"
import Renderer from "./Core/Renderer"
import { AnimationLoop } from "./Core/AnimationLoop"

let myAppInstance = null

export default class App extends EventEmitter {
    constructor(canvas) {
        if (myAppInstance !== null) {
            return myAppInstance
        }

        super()

        myAppInstance = this

        this.canvas = canvas
        this.canvasSize = new CanvasSize(canvas)

        this.animationLoop = null
        this.updateBound = this.update.bind(this)

        this.scene = null
        this.camera = null
        this.renderer = null

        this.cube = null

        this.init()
    }

    init() {
        this.scene = new Scene()

        this.renderer = new Renderer()
        this.camera = new Camera()


        this.animationLoop = new AnimationLoop()
        this.animationLoop.on('update', this.updateBound)
        this.animationLoop.start()

        this.cube = new Cube()
        this.scene.add(this.cube.instance)
    }

    update() {
        this.renderer.instance.render(this.scene, this.camera.perspective)
    }

    destroy() {
        // Release memory of the scene
        this.scene.remove(this.cube)
        this.cube.destroy()
        this.cube = null
        
        this.scene = null

        this.camera.destroy()
        this.camera = null

        this.renderer.destroy()
        this.renderer = null

        this.animationLoop.off('update')
        this.animationLoop = null
        this.updateBound = null

        this.canvas = null

        myAppInstance = null
    }
} 