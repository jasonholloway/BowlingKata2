import {gen, property} from 'testcheck';
import {check, install as mochaTestcheckInstall} from 'mocha-testcheck';
mochaTestcheckInstall();

import {expect, assert} from 'chai';
import {State, Game, GameResult, Frame, FrameResult, Turn, TurnResult, Player} from '../src/bowling';


function createPlayer(roll: (turn: Turn) => State) {
   return (state: State): State => {
      if(state instanceof Game) {
         return (state as Game).begin();
      }
      else if(state instanceof Frame) {
         return (state as Frame).begin();
      }   
      else if(state instanceof Turn) {
         return roll(state as Turn);
      }
      else if(state instanceof TurnResult) {
         return (state as TurnResult).continue();
      }
      else if(state instanceof FrameResult) {
         return (state as FrameResult).continue();
      }
      else if(state instanceof GameResult) {
         throw Error('Reached end of game!');
      }
   }
}

const playWithoutScoring = createPlayer(t => t.roll(0))


function cycle<T>(r: Array<T>): T {
   const item = r.shift();
   r.push(item);
   return item;
}

const genChance = gen.intWithin(0, 16384).then(i => 1 - (i / 16384));

const genPlayer = gen.array(genChance, { minSize: 1 })
                     .then(chances => {
                        return createPlayer(turn => turn.roll(Math.round(turn.pinsLeft * cycle(chances))));
                     });

const genGame = gen.array([gen.sPosInt, gen.sPosInt, gen.sPosInt])
                  .then(([frameCount, turnCount, frameSize]) => {
                     return new Game(frameCount, turnCount, frameSize);
                  });

const genFrame = gen.array([genGame, genChance, genPlayer])
                  .then(([game, progress, player]) => {
                     const maxFrameIndex = Math.round((game.frameCount - 1) * progress);

                     let state = game as State;

                     do {
                        if(state instanceof Frame && state.index == maxFrameIndex) return state;
                        state = player(state);
                     } while(true);
                  });

const genFirstTurn = genFrame.then(f => f.begin());

const genTurn = gen.array([genFrame, genChance, genPlayer])
                  .then(([frame, progress, player]) => {
                     const maxTurnIndex = Math.round((frame.turnCount - 1) * progress);

                     let state = frame as State;

                     while(true) {
                        if(state instanceof FrameResult) return <Turn>state.prev.prev;
                        if(state instanceof Turn && state.index == maxTurnIndex) return state;
                        state = player(state);
                     }
                  });

const genSuccessorTurn = genTurn.suchThat(t => t.index > 0);



function findPrev(state: State, pred: (s: State) => boolean): boolean|State {
   if(pred(state)) return state;
   else if(state.prev) return findPrev(state.prev, pred);
   else if(state.parent) return findPrev(state.parent, pred);
   else return false;
}


describe('Turn', () => {

   check.it('when first in frame, pinsLeft matches game.frameSize',
      genFirstTurn,
      (turn: Turn) => {
         const game = <Game>turn.parent.parent;         
         expect(turn.pinsLeft).to.equal(game.frameSize);
      });

   check.it('when successor, pinsLeft matches history of hits',
      genSuccessorTurn,
      (turn: Turn) => {
         const prevTurn = <Turn>turn.prev.prev;
         const prevResult = <TurnResult>turn.prev;
         expect(turn.pinsLeft).to.equal(prevTurn.pinsLeft - prevResult.hitCount);
      });

   check.it('when all pins hit, yields via TurnResult to FrameResult',
      genTurn, 
      (turn: Turn) => {
         const turnResult = turn.roll(turn.pinsLeft);
         const next = turnResult.continue();
         expect(next).to.be.instanceof(FrameResult);
      });

   

});



describe('Frame', () => {

   check.it('turnCount set to game.turnCount',
      genFrame,
      (frame: Frame) => {
         expect(frame.turnCount).to.equal(frame.game.turnCount);
      });

   check.it('allows so many low-scoring turns, before yielding a FrameResult', 
      genFrame, 
      (frame: Frame) => {
         let turnsPlayed = 0;
         let state = frame as State;

         while(true) {
            state = playWithoutScoring(state);
            if(state instanceof Turn) turnsPlayed++;
            if(state instanceof FrameResult) break;
         }

         expect(turnsPlayed).to.equal(frame.turnCount);
      });

});


describe('Game', () => {
   check.it('after so many frames, yields a GameResult', 
      genGame, genPlayer,
      (game: Game, player) => {
         let framesPlayed = 0;
         let state = game as State;

         while(true) {
            state = player(state);
            if(state instanceof FrameResult) framesPlayed++;
            if(state instanceof GameResult) break;
         }

         expect(framesPlayed).to.equal(game.frameCount);
      });
});


// describe('Player', () => {

//    it('rolls balls as instructed', () => {
//       const game = new Game(2, 2, 9);
//       const player = new Player(game);

//       player.play([ 1, 1, 1, 1 ]);

//       expect(player.score).to.equal(4);
//       expect(player.state).to.be.instanceof(GameResult);
//    });

// });



