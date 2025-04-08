import { BoxGeometry, MeshNormalMaterial } from "three"
import { Mesh } from "three"
import App from "../App.js"

export default class Cube {
    constructor() {
        this.instance = null

        this.app = new App()
        this.init()
    }

    init() {
        const geometry = new BoxGeometry(2,2,2)
        const material = new MeshNormalMaterial()
        this.instance = new Mesh(geometry, material)
    }

    destroy() {
        this.instance.geometry.dispose()
        this.instance.material.dispose()
        this.instance = null
        this.app = null
    }
}