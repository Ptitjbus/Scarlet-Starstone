import { PerspectiveCamera, Scene, WebGLRenderer, AmbientLight, DirectionalLight, Fog } from "three"
import EventEmitter from "./Utils/EventEmitter"
import CanvasSize from "./Core/CanvasSize"
import Camera from "./Core/Camera"
import Renderer from "./Core/Renderer"
import { AnimationLoop } from "./Core/AnimationLoop"
import { AssetManager } from "./Assets/AssetManager"
import SoundManager from "./World/SoundManager"

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

        this.updateBound = null
        this.assetsLoadCompleteHandlerBound = null

        this.animationLoop = null

        this.scene = null
        this.camera = null
        this.renderer = null

        this.assetManager = null
        this.soundManager = null

        this.cube = null

        this.entranceOverlay = null
        this.enterButton = null
        this.enterButtonClickHandlerBound = null

        this.actionButtonContainer = null
        this.actionButton = null
        this.actionButtonClickHandlerBound = null
        this.keyboardEventHandlerBound = null
        this.isSceneActive = false

        this.init()
    }

    init() {
        this.renderer = new Renderer()
        this.camera = new Camera()

        this.animationLoop = new AnimationLoop()
        this.updateBound = this.update.bind(this)
        this.animationLoop.on('update', this.updateBound)

        this.assetManager = new AssetManager()
        this.soundManager = new SoundManager()

        this.assetsLoadCompleteHandlerBound = this.assetsLoadCompleteHandler.bind(this)
        this.assetManager.on('ready', this.assetsLoadCompleteHandlerBound)
        this.assetManager.load()

        this.entranceOverlay = document.getElementById('entrance-overlay')
        this.enterButton = document.getElementById('enter-button')

        this.enterButtonClickHandlerBound = this.enterButtonClickHandler.bind(this)

        if (this.enterButton) {
            console.log('Enter button found, adding event listener')
            this.enterButton.addEventListener('click', this.enterButtonClickHandlerBound)
        } else {
            console.error('Enter button not found in the DOM')
        }

        this.actionButtonContainer = document.getElementById('action-button-container')
        this.actionButton = document.getElementById('action-button')

        this.actionButtonClickHandlerBound = this.actionButtonClickHandler.bind(this)
        this.keyboardEventHandlerBound = this.keyboardEventHandler.bind(this)

        if (this.actionButton) {
            console.log('Action button found, adding event listener')
            this.actionButton.addEventListener('click', this.actionButtonClickHandlerBound)
        } else {
            console.error('Action button not found in the DOM')
        }
    }

    enterButtonClickHandler() {
        console.log('Enter button clicked')

        if (this.soundManager) {
            this.soundManager.playClick()

            this.soundManager.playAmbiance()
        }

        if (this.entranceOverlay) {
            this.entranceOverlay.classList.add('hide')

            setTimeout(() => {
                this.entranceOverlay.style.display = 'none'
            }, 1500)
        }

        this.isSceneActive = true
        window.addEventListener('keydown', this.keyboardEventHandlerBound)

        console.log('Scene activated, listening for keyboard events')
    }

    keyboardEventHandler(event) {
        if (this.isSceneActive && event.key.toLowerCase() === 'o') {
            console.log('Key "o" pressed, showing action button')

            if (this.actionButtonContainer) {
                this.actionButtonContainer.style.display = 'block'
            }
        }
    }

    actionButtonClickHandler() {
        console.log('Action button clicked')

        if (this.soundManager) {
            this.soundManager.playClick()

            this.soundManager.fadeOutAmbiance(1500)

            this.soundManager.playApplause(2500)
        }

        if (this.actionButton) {
            this.actionButton.disabled = true
            this.actionButton.style.opacity = '0.5'
            this.actionButton.style.cursor = 'default'
            this.actionButton.textContent = 'Scène terminée'
        }
    }

    initScene() {
        this.scene = new Scene()

        this.scene.fog = new Fog(0x000000, 2, 20)

        const ambientLight = new AmbientLight(0xffffff, 0.1)
        this.scene.add(ambientLight)

        const directionalLight = new DirectionalLight(0xffffff, 1)
        directionalLight.position.set(5, 5, 5)
        directionalLight.castShadow = true
        this.scene.add(directionalLight)

        const theatre = this.assetManager.getItem('Theatre')
        const oldPiano = this.assetManager.getItem('Old piano')

        oldPiano.scene.position.set(-10, 1, 0)
        this.scene.add(oldPiano.scene)
        this.scene.add(theatre.scene)
    }

    assetsLoadCompleteHandler() {
        this.initScene()
        this.animationLoop.start()
    }

    update() {
        this.renderer.instance.render(this.scene, this.camera.perspective)
    }

    destroy() {
        window.removeEventListener('keydown', this.keyboardEventHandlerBound)

        if (this.cube) {
            this.scene.remove(this.cube)
            this.cube.destroy()
            this.cube = null
        }

        this.scene = null

        if (this.camera) {
            this.camera.destroy()
            this.camera = null
        }

        if (this.renderer) {
            this.renderer.destroy()
            this.renderer = null
        }

        if (this.animationLoop) {
            this.animationLoop.off('update')
            this.animationLoop = null
            this.updateBound = null
        }

        if (this.assetManager) {
            this.assetManager.off('ready')
            this.assetsLoadCompleteHandlerBound = null
            this.assetManager.destroy()
            this.assetManager = null
        }

        if (this.soundManager) {
            this.soundManager.destroy()
            this.soundManager = null
        }

        if (this.enterButton) {
            this.enterButton.removeEventListener('click', this.enterButtonClickHandlerBound)
            this.enterButtonClickHandlerBound = null
            this.enterButton = null
        }

        if (this.actionButton) {
            this.actionButton.removeEventListener('click', this.actionButtonClickHandlerBound)
            this.actionButtonClickHandlerBound = null
            this.actionButton = null
        }

        this.entranceOverlay = null
        this.actionButtonContainer = null
        this.canvas = null
        this.keyboardEventHandlerBound = null

        myAppInstance = null
    }
}