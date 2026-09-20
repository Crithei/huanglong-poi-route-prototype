// Keep 44px touch targets apart even when the projected outlets cluster together.
export function layoutPins(points,width,height){
  const placed=[],clamp=(n,lo,hi)=>Math.max(lo,Math.min(hi,n));
  for(const p of points){
    const candidates=[[0,0],[0,-52],[0,52],[-52,0],[52,0],[-52,-52],[52,-52],[-52,52],[52,52],[0,-104],[0,104],[-104,0],[104,0]];
    let next;
    for(const [dx,dy] of candidates){const x=clamp(p.x+dx,26,width-26),y=clamp(p.y+dy,74,height-82);if(placed.every(q=>Math.abs(q.x-x)>=48||Math.abs(q.y-y)>=48)){next={x,y};break;}}
    if(!next){for(let y=74;y<=height-82&&!next;y+=52)for(let x=26;x<=width-26&&!next;x+=52)if(placed.every(q=>Math.abs(q.x-x)>=48||Math.abs(q.y-y)>=48))next={x,y};}
    placed.push({...next,sourceX:p.x,sourceY:p.y});
  }
  return placed;
}
