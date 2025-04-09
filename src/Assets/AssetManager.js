import * as THREE from 'three'

import EventEmitter from "../Utils/EventEmitter"

import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'

import { RGBELoader } from 'three/examples/jsm/Addons.js'
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader.js'

import assets from "./assets"

import App from '../App';

import gsap from 'gsap'

export class AssetManager extends EventEmitter {
    constructor() {
        super()

        this.app = new App()

        this.assets = assets

        this.loaders = null
        this.items = null
        this.loadingCount = assets.length
        this.loadedCount = 0

        this.loadingComplete = false
        this.loadingScreen = null
        this.loadingBar = null
        this.loadingPercentage = null
        this.entranceOverlay = null

        this.init()
    }

    init() {
        this.items = {}

        this.initLoaders()
        this.initLoadingScreen()

        const dracoLoader = new DRACOLoader()
        dracoLoader.setDecoderPath('./lib/draco/');
        this.loaders.gltf.setDRACOLoader(dracoLoader);
    }

    initLoaders() {
        this.loaders = {}

        this.loadingManager = new THREE.LoadingManager(
            // Loaded callback - everything is loaded
            () => {
                this.loadingComplete = true
                console.log('Loading complete!')

                // Update loading screen to 100%
                if (this.loadingBar && this.loadingPercentage) {
                    this.loadingBar.style.transform = 'scaleX(1)'
                    this.loadingPercentage.textContent = '100%'
                }

                // Forcer directement la transition vers l'écran d'entrée
                this.completeLoading();
            },

            // Progress callback
            (itemUrl, itemsLoaded, itemsTotal) => {
                // Calculate the loading progress
                const progressRatio = itemsLoaded / itemsTotal
                const progressPercent = Math.floor(progressRatio * 100)

                // Update the loading bar and percentage text
                if (this.loadingBar) {
                    this.loadingBar.style.transform = `scaleX(${progressRatio})`
                }

                if (this.loadingPercentage) {
                    this.loadingPercentage.textContent = `${progressPercent}%`
                }

                console.log(`Loading progress: ${progressPercent}% (${itemsLoaded}/${itemsTotal})`)

                // Si les modèles sont chargés mais que le manager ne se termine pas,
                // forcer la transition après un délai
                if (progressPercent >= 100) {
                    setTimeout(() => {
                        if (this.loadingScreen && !this.loadingScreen.classList.contains('ended')) {
                            console.log('Forcing loading completion after timeout');
                            this.completeLoading();
                        }
                    }, 2000);
                }
            },

            // Error callback
            (url, itemsLoaded, itemsTotal) => {
                console.error('Error loading asset:', url);

                // En cas d'erreur, afficher quand même l'écran d'entrée
                // après un délai raisonnable
                if (itemsLoaded === itemsTotal - 1) {
                    setTimeout(() => {
                        this.completeLoading();
                    }, 3000);
                }
            }
        )

        this.loaders.texture = new THREE.TextureLoader(this.loadingManager)
        this.loaders.exr = new EXRLoader(this.loadingManager)
        this.loaders.hdr = new RGBELoader(this.loadingManager)
        this.loaders.fbx = new FBXLoader(this.loadingManager)
        this.loaders.gltf = new GLTFLoader(this.loadingManager)
    }

    // Méthode dédiée pour finaliser le chargement et passer à l'écran d'entrée
    completeLoading() {
        if (this.loadingScreen) {
            this.loadingScreen.classList.add('ended');

            // Assurer que l'écran de chargement est masqué même si la transition CSS échoue
            setTimeout(() => {
                if (this.loadingScreen) {
                    this.loadingScreen.style.display = 'none';
                }

                if (this.entranceOverlay) {
                    this.entranceOverlay.style.display = 'flex';
                }

                // Déclencher l'événement ready pour initialiser la scène
                this.trigger('ready');
            }, 1000);
        } else {
            // Si l'écran de chargement n'existe pas, afficher directement l'entrée
            if (this.entranceOverlay) {
                this.entranceOverlay.style.display = 'flex';
            }

            this.trigger('ready');
        }
    }

    initLoadingScreen() {
        this.loadingScreen = document.querySelector('.loading-screen')
        this.loadingBar = document.querySelector('.loading-bar')
        this.loadingPercentage = document.querySelector('.loading-percentage')
        this.entranceOverlay = document.getElementById('entrance-overlay')

        if (!this.loadingScreen || !this.loadingBar || !this.loadingPercentage) {
            console.error('Loading screen elements not found in the DOM')
        }

        // Show loading screen, hide entrance overlay initially
        if (this.loadingScreen) {
            this.loadingScreen.style.opacity = '1'
        }

        if (this.entranceOverlay) {
            this.entranceOverlay.style.display = 'none'
        }
    }

    load() {
        if (this.assets.length === 0) {
            // Si pas d'assets, passer directement à l'écran d'entrée
            setTimeout(() => {
                this.completeLoading();
            }, 1000);
            return;
        }

        // Ajouter un délai de sécurité pour éviter un loader bloqué indéfiniment
        setTimeout(() => {
            if (!this.loadingComplete) {
                console.warn('Loading timeout reached, forcing completion');
                this.completeLoading();
            }
        }, 30000); // 30 secondes max pour le chargement

        for (const asset of this.assets) {
            if (asset.type.toLowerCase() === "texture") {
                this.loaders.texture.load(asset.path, (texture) => {
                    if (asset.envmap) {
                        texture.mapping = THREE.EquirectangularReflectionMapping
                    }
                    this.loadComplete(asset, texture)
                }, undefined, error => {
                    console.error(`Error loading texture ${asset.name}:`, error);
                    this.loadComplete(asset, null); // Considérer comme chargé même en cas d'erreur
                })
            }
            else
            if (asset.type.toLowerCase() === "exr") {
                this.loaders.exr.load(asset.path, (texture) => {
                    texture.mapping = THREE.EquirectangularReflectionMapping
                    this.loadComplete(asset, texture)
                }, undefined, error => {
                    console.error(`Error loading EXR ${asset.name}:`, error);
                    this.loadComplete(asset, null);
                })
            }
            else
            if (asset.type.toLowerCase() === "hdr") {
                this.loaders.hdr.load(asset.path, (texture) => {
                    texture.mapping = THREE.EquirectangularReflectionMapping
                    this.loadComplete(asset, texture)
                }, undefined, error => {
                    console.error(`Error loading HDR ${asset.name}:`, error);
                    this.loadComplete(asset, null);
                })
            }
            else
            if (asset.type.toLowerCase() === "fbx") {
                this.loaders.fbx.load(asset.path, (model) => {
                    this.loadComplete(asset, model)
                }, undefined, error => {
                    console.error(`Error loading FBX ${asset.name}:`, error);
                    this.loadComplete(asset, null);
                })
            }
            else
            if (asset.type.toLowerCase() === "gltf") {
                this.loaders.gltf.load(asset.path, (model) => {
                    this.loadComplete(asset, model)
                }, undefined, error => {
                    console.error(`Error loading GLTF ${asset.name}:`, error);
                    this.loadComplete(asset, null);
                })
            }
            else
            if (asset.type.toLowerCase() === "material") {
                const textures = Object.entries(asset.textures)
                const material = Object.assign(asset.textures)

                let nTex = textures.length
                let path = asset.path
                if (path.charAt(path.length - 1) !== '/') {
                    path += '/'
                }

                textures.map((texObject, idx) => {
                    const type = texObject[0]

                    if (typeof texObject[1] === 'object' && !Array.isArray(texObject[1]) && texObject[1] !== null) {
                        for (const [key, value] of Object.entries(texObject[1])) {
                            const url = path + value

                            this.loaders.texture.load(url, (texture) => {
                                texture.flipY = false
                                material[type][key] = texture
                                if (--nTex === 0) {
                                    this.loadComplete(asset, material)
                                }
                            }, undefined, error => {
                                console.error(`Error loading material texture ${asset.name}:`, error);
                                material[type][key] = null;
                                if (--nTex === 0) {
                                    this.loadComplete(asset, material);
                                }
                            })
                        }
                    }
                    else {
                        const url = path + texObject[1]
                        this.loaders.texture.load(url, (texture) => {
                            texture.flipY = false
                            material[type] = texture
                            if (--nTex === 0) {
                                this.loadComplete(asset, material)
                            }
                        }, undefined, error => {
                            console.error(`Error loading material texture ${asset.name}:`, error);
                            material[type] = null;
                            if (--nTex === 0) {
                                this.loadComplete(asset, material);
                            }
                        })
                    }
                })
            }
        }
    }

    loadComplete(asset, object) {
        console.log(`AssetManager :: new item stored : ${asset.name}`)
        this.items[asset.name] = object
    }

    getItemNamesOfType(type) {
        return this.assets.filter(asset => asset.type.toLowerCase() === type.toLowerCase()).map(e => e.name)
    }

    getItem(name) {
        // Vérifier si l'élément existe
        if (!this.items[name]) {
            console.warn(`Asset not found: ${name}`);
            return null;
        }

        // Check if it's a gltf material
        if (this.items[name].scene
            && this.items[name].scene.getObjectByName('pbr_node')
            && this.items[name].scene.getObjectByName('pbr_node').material) {
            return this.items[name].scene.getObjectByName('pbr_node').material
        }

        return this.items[name]
    }

    destroy() {
        this.assets = null

        this.loadingScreen = null
        this.loadingBar = null
        this.loadingPercentage = null
        this.entranceOverlay = null

        this.loadingManager = null

        if (this.loaders) {
            this.loaders.texture = null
            this.loaders.exr = null
            this.loaders.hdr = null
            this.loaders.fbx = null
            this.loaders.gltf = null
            this.loaders = null
        }

        if (this.items) {
            this.items = null
        }

        this.app = null
    }
}