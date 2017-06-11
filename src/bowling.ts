
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
   frameSize: number;

   constructor(frameCount: number, frameSize: number) {
      super(undefined, undefined);
      this.frameCount = frameCount;
      this.frameSize = frameSize;
   }

   begin(): Frame {        
      return new Frame(this, undefined, 0, this.frameSize);
   }

   receive(frameResult: FrameResult): State {
      const frameIndex = frameResult.frame.index;

      if(frameIndex + 1 < this.frameCount) {
         return new Frame(this, frameResult, frameIndex + 1, this.frameSize);         
      }
      else {
         return new GameResult(this, frameResult);
      }
   }
}

class GameResult extends State {
   constructor(parent: Game, prev: State) {
      super(parent, prev);
   }
}


class Frame extends State {
   index: number;
   turnCount: number;

   constructor(parent: State, prev: State, index: number, turnCount: number) {
      super(parent, prev);
      this.index = index;
      this.turnCount = turnCount;
   }

   begin(): Turn {
      return new Turn(this, this, 0);
   }

   receive(turnResult: TurnResult): State {      
      const turnIndex = turnResult.turn.index;

      if(turnIndex + 1 < this.turnCount) {
         return new Turn(this, turnResult, turnIndex + 1);
      }
      else {
         return new FrameResult(this.parent, turnResult, this);
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

   constructor(parent: Frame, prev: State, index: number) {
      super(parent, prev);
      this.index = index;
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

   proceed(ctx: State): State {
      if(ctx instanceof Game) {
         return ctx;
      }
      else if(ctx instanceof Frame) {
         return ctx;
      }

      throw new Error('Strange State provided!');
   }
}


export { State, Game, GameResult, Frame, FrameResult, Turn, TurnResult, Player }
