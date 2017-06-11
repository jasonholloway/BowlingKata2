import {gen, property} from 'testcheck';
import {check, install as mochaTestcheckInstall} from 'mocha-testcheck';
mochaTestcheckInstall();

import {expect, assert} from 'chai';
import {State, Game, GameResult, Frame, FrameResult, Turn, TurnResult, Player} from '../src/bowling';


function play(state: State): State {
   if(state instanceof Game) {
      return (state as Game).begin();
   }
   else if(state instanceof Frame) {
      return (state as Frame).begin();
   }   
   else if(state instanceof Turn) {
      return (state as Turn).roll(0);
   }
   else if(state instanceof TurnResult) {
      return (state as TurnResult).continue();
   }
   else if(state instanceof FrameResult) {
      return (state as FrameResult).continue();
   }
}

const genFrame = gen.array( [gen.intWithin(0, 8), gen.intWithin(1, 10)] )
                     .then(( [index, turnCount] ) => new Frame(null, null, index, turnCount));


describe('Frame', () => {
   check.it('allows so many turns before yielding a FrameResult', 
      genFrame,
      (frame: Frame) => {
         let turnsPlayed = 0;
         let state = frame as State;

         while(true) {
            state = play(state);
            if(state instanceof Turn) turnsPlayed++;
            if(state instanceof FrameResult) break;
         }

         expect(turnsPlayed).to.equal(frame.turnCount);
      });
});


const genGame = gen.array([gen.sPosInt.scale(s => s / 10), gen.sPosInt.scale(s => s / 100)])
                     .then(([frameCount, frameSize]) => new Game(frameCount, frameSize));

describe('Game', () => {
   check.it('allows so many frames before yielding a GameResult', 
      genGame,
      (game: Game) => {
         let framesPlayed = 0;
         let state = game as State;

         while(true) {
            state = play(state);
            if(state instanceof FrameResult) framesPlayed++;
            if(state instanceof GameResult) break;
         }

         expect(framesPlayed).to.equal(game.frameCount);
      });
});
