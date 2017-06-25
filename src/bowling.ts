
abstract class State {
   parent: State;
   prev: State;

   constructor(parent: State, prev: State) {
      this.parent = parent;
      this.prev = prev;
   }

   receive(state: State): State {
      throw new Error('Can\'t receive state here!');
   }
}


class Game extends State {
   frameCount: number;
   turnCount: number;
   frameSize: number;

   constructor(frameCount: number, turnCount: number, frameSize: number) {
      super(undefined, undefined);
      this.frameCount = frameCount;
      this.turnCount = turnCount;
      this.frameSize = frameSize;
   }

   begin(): Frame {        
      return new Frame(this, this, 0);
   }

   receive(frameResult: FrameResult): State {
      const nextIndex = frameResult.frame.index + 1;

      if(nextIndex >= this.frameCount) {
         return new GameResult(this, frameResult);
      }
      else {
         return new Frame(this, frameResult, nextIndex);  
      }
   }
}

class GameResult extends State {
   constructor(parent: Game, prev: State) {
      super(parent, prev);
   }
}


class Frame extends State {
   game: Game;
   index: number;
   turnCount: number;

   constructor(game: Game, prev: State, index: number) {
      super(game, prev);
      this.game = game;
      this.index = index;
      this.turnCount = game.turnCount;
   }

   begin(): Turn {
      return new Turn(this, this, 0, this.game.frameSize);
   }

   receive(result: TurnResult): State {      
      const nextIndex = result.turn.index + 1;

      if(result.hitCount >= result.turn.pinsLeft) {
         return new FrameResult(this.game, result, this);
      }
      else if(nextIndex >= this.turnCount) {
         return new FrameResult(this.game, result, this);
      }
      else {
         return new Turn(this, result, nextIndex, result.turn.pinsLeft - result.hitCount);
      }
   }

}

class FrameResult extends State {
   frame: Frame;

   constructor(parent: State, prev: State, frame: Frame) {
      super(parent, prev);
      this.frame = frame;
   }

   continue(): State {
      return this.parent.receive(this);
   } 
}


class Turn extends State {
   index: number;
   pinsLeft: number;

   constructor(parent: Frame, prev: State, index: number, pinsLeft: number) {
      super(parent, prev);
      this.index = index;
      this.pinsLeft = pinsLeft;
   }

   roll(hitCount: number): TurnResult {
      return new TurnResult(this.parent, this, hitCount);
   }
   
   receive(result: TurnResult): State {
      return this.parent.receive(result);
   }
}

class TurnResult extends State {
   turn: Turn;
   hitCount: number;

   constructor(parent: State, prev: Turn, hitCount: number) {
      super(parent, prev);
      this.turn = prev;
      this.hitCount = hitCount;
   }

   continue(): State {
      return this.parent.receive(this);
   }
}



class Player {    
   score: number;
   state: State;

   constructor(state: State) {
      this.state = state;
      this.score = 0;
   }

   play(hits: number[]) {
      while(true) {
         const curr = this.state;

         if(curr instanceof Game) {
            this.state = curr.begin();
         }
         else if(curr instanceof Frame) {
            this.state = curr.begin();
         }
         else if(curr instanceof Turn) {
            if(hits.length == 0) return;
            this.state = curr.roll(hits.shift());
         }
         else if(curr instanceof TurnResult) {
            this.score += curr.hitCount; 
            this.state = curr.continue();
         }
         else if(curr instanceof FrameResult) {
            this.state = curr.continue();
         }
         else if(curr instanceof GameResult) {
            return;
         }
         else {
            throw new Error('unexpected state encountered!');
         }
      }
   }


}


export { State, Game, GameResult, Frame, FrameResult, Turn, TurnResult, Player }
