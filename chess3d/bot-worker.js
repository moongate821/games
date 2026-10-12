import {chooseBotMove} from './ai.js';

self.onmessage=event=>{
  const {state,difficulty}=event.data;
  self.postMessage(chooseBotMove(state,difficulty));
};
