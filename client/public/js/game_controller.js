"use strict";

class GameController {

    constructor(options) {
        this.initGame(options);
    }

    initGame(options) {
        const {containerEl, assetsUrl, onBoardPainted} = options;

        this.boardController = new BoardController({
            containerEl: containerEl,
            assetsUrl: assetsUrl
        });

        this.boardController.drawBoard(onBoardPainted);
    }

    addPlayer(count, initPos, tokens) {
        return this.boardController.drawPlayers(count, initPos, tokens);
    }

    movePlayer(playerIndex, newTileId) {
        // TODO: change viewport
        this.boardController.movePlayer(playerIndex, newTileId);
    }

    addProperty(type, tileId, playerIndex) {
        if (type === PropertyManager.PROPERTY_OWNER_MARK) {
            this.boardController.addLandMark(playerIndex, tileId);
        } else {
            this.boardController.addProperty(type, tileId);
        }
    }

    resizeBoard() {
        this.boardController.resize();
    }
}
