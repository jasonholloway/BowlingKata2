
abstract class GameState {

}

class Game implements GameState {
    constructor() {}

    beginFrame(): Frame {
        return null;
    }
}

class Frame implements GameState {
    constructor() {}

    rollTurn(downedPins: number): Turn {
        return null;
    }
}

class Turn implements GameState {
    constructor() {}
}



class Player {    
    score: number;

    proceed(ctx: GameState): GameState {
        if(ctx instanceof Game) {
            console.log('Game!');
            return ctx;
        }
        else if(ctx instanceof Frame) {
            console.log('Frame!');
            return ctx;
        }

        throw new Error('Strange GameState provided!');
    }
}



function welcome() {    

    const player = new Player();

    player.proceed(new Frame());
    player.proceed(new Game());
    player.proceed(new Frame());
}

export { GameState, Game, Frame, Turn, Player }

export default welcome;
