import { Howl, Howler } from 'howler';
import EventEmitter from '../Utils/EventEmitter';

export default class SoundManager extends EventEmitter {
    constructor() {
        super();

        this.sounds = {
            click: null,
            ambiance: null,
            applause: null
        };

        this.init();
    }

    init() {
        console.log('Initializing SoundManager');

        this.sounds.click = new Howl({
            src: ['./sounds/click.wav'],
            volume: 0.2,
            preload: true
        });

        this.sounds.ambiance = new Howl({
            src: ['./sounds/ambiance.mp3'],
            volume: 0.1,
            loop: true,
            preload: true
        });

        this.sounds.applause = new Howl({
            src: ['./sounds/applause.wav'],
            volume: 0.2,
            preload: true
        });
    }

    playClick() {
        if (this.sounds.click) {
            return this.sounds.click.play();
        }
        return null;
    }

    playAmbiance() {
        if (this.sounds.ambiance) {
            return this.sounds.ambiance.play();
        }
        return null;
    }

    stopAmbiance() {
        if (this.sounds.ambiance) {
            this.sounds.ambiance.stop();
        }
    }

    fadeOutAmbiance(duration = 1500) {
        if (this.sounds.ambiance) {
            const currentVolume = this.sounds.ambiance.volume();
            const fadeSteps = 20;
            const stepDuration = duration / fadeSteps;
            const volumeStep = currentVolume / fadeSteps;

            let currentStep = 0;

            const fadeInterval = setInterval(() => {
                currentStep++;
                const newVolume = currentVolume - (volumeStep * currentStep);

                if (currentStep >= fadeSteps || newVolume <= 0) {
                    clearInterval(fadeInterval);
                    this.sounds.ambiance.volume(0);
                    this.sounds.ambiance.stop();
                    console.log('Ambiance music stopped after fade out');
                } else {
                    this.sounds.ambiance.volume(newVolume);
                }
            }, stepDuration);

            return fadeInterval;
        }
        return null;
    }

    playApplause(delay = 0) {
        if (this.sounds.applause) {
            if (delay > 0) {
                return setTimeout(() => {
                    console.log('Playing applause sound after delay');
                    this.sounds.applause.play();
                }, delay);
            } else {
                return this.sounds.applause.play();
            }
        }
        return null;
    }

    setAmbianceVolume(volume) {
        if (this.sounds.ambiance) {
            this.sounds.ambiance.volume(volume);
        }
    }

    destroy() {
        console.log('Destroying SoundManager');

        if (this.sounds.click) {
            this.sounds.click.unload();
        }

        if (this.sounds.ambiance) {
            this.sounds.ambiance.stop();
            this.sounds.ambiance.unload();
        }

        if (this.sounds.applause) {
            this.sounds.applause.stop();
            this.sounds.applause.unload();
        }

        this.sounds = null;
    }
}