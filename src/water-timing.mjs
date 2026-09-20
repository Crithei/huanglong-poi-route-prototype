// RAF timestamps describe the start of a frame and can predate performance.now().
export function frameDelta(now,last){
  if(last===null||!Number.isFinite(now)||!Number.isFinite(last))return 0;
  return Math.max(0,Math.min((now-last)/1000,.05));
}
