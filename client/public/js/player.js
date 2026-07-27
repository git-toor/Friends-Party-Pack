"use strict";

class Player {

    constructor(options) {
        const {index, modelUrl, scene, initPos, initTileId, modelIndex} = options;

        this.scene = scene;
        this.index = index;
        this.modelIndex = (modelIndex !== undefined) ? modelIndex : index;

        this.modelUrl = modelUrl;
        this.initPos = initPos;
        this.tileId = initTileId;
    }

    load() {
        return new Promise((resolve => {
            new THREE.ObjectLoader().load(
                this.modelUrl,

                (obj) => {
                    // Add the loaded object to the scene
                    this.model = obj;
                    this.model.position.set(this.initPos[0], Player.ELEVATION[this.modelIndex], this.initPos[2]);
                    this.model.scale.set(...Player.SCALES[this.modelIndex]);
                    this.scene.add(this.model);
                },

                // onProgress callback
                (xhr) => {
                    if (xhr.loaded === xhr.total) {
                        console.log(this.modelUrl + " loaded!");
                        resolve();
                    }
                },

                // onError callback
                (err) => {
                    console.error(err);
                });
        }))
    }

    advanceTo(newTileId, newPos) {
        var oldX = this.model.position.x;
        var oldZ = this.model.position.z;
        this.model.position.set(newPos[0], Player.ELEVATION[this.index], newPos[2]);
        // Face direction of travel (Three.js default forward is -Z)
        var dx = this.model.position.x - oldX;
        var dz = this.model.position.z - oldZ;
        if (dx !== 0 || dz !== 0) {
            this.model.rotation.y = Math.atan2(dx, -dz) + Math.PI;
        }
        this.tileId = newTileId;
    }

    getTileId() {
        return this.tileId;
    }
}

Player.SCALES = [
    [0.04, 0.04, 0.04],
    [1.5, 1.5, 1.5],
    [0.03, 0.03, 0.03],
    [0.03, 0.03, 0.03]
];

Player.ELEVATION = [2.5, 2.0, 0, 0];