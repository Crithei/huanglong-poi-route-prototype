// Shared SVG composition: the editor and exported page use exactly the same layout.
window.HuanglongPassportArt=(()=>{
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const papers={ivory:{bg:'#f7efdc',ink:'#2c5147',line:'#cfbb8d'},mineral:{bg:'#e6efe7',ink:'#28564c',line:'#a4bcad'},night:{bg:'#243f3c',ink:'#f3e6c6',line:'#657f6d'}};
  function lines(value,width){const out=[];for(const paragraph of String(value).split('\n')){let line='',n=0;for(const char of Array.from(paragraph)){const cost=/[\u0000-\u00ff]/.test(char)? .55:1;if(n+cost>width){out.push(line);line='';n=0;}line+=char;n+=cost;}out.push(line);}return out;}
  function notebook(page,profile,inventory,selected='',images={}){
    const p=papers[page.paper]||papers.ivory;
    const items=page.items.map(i=>{const art=inventory.find(a=>a.id===i.art);if(!art)return '';const size=i.size*6.4;return `<g data-notebook-item="${esc(i.id)}" tabindex="0" role="button" aria-label="${esc(art.title)}，方向键移动" aria-pressed="${selected===i.id}" class="notebook-item ${selected===i.id?'selected':''}" transform="translate(${40+i.x*6.4} ${190+i.y*4.8}) rotate(${i.rotation})"><rect x="${-size/2-3}" y="${-size/2-3}" width="${size+6}" height="${size+6}" rx="12" fill="transparent" stroke="${selected===i.id?'#b29454':'none'}" stroke-width="2" stroke-dasharray="5 4"/><image href="${esc(images[art.id]||art.src)}" x="${-size/2}" y="${-size/2}" width="${size}" height="${size}" preserveAspectRatio="xMidYMid meet" pointer-events="none"/></g>`;}).join('');
    const title=lines((page.title||'我的黄龙手账').replace(/\s+/g,' '),15).slice(0,3),note=lines(page.note||'今天，哪一个细节让你停了下来？',36),height=Math.max(1040,810+note.length*21);
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 ${height}" width="720" height="${height}" role="img" aria-label="${esc(page.title)}手账预览" id="notebookCanvas"><rect width="720" height="${height}" fill="${p.bg}"/><rect x="20" y="20" width="680" height="${height-40}" rx="3" fill="none" stroke="${p.line}"/><g fill="${p.ink}" font-family="'Microsoft YaHei',sans-serif"><text x="48" y="64" font-size="12" letter-spacing="3">HUANGLONG / FIELD NOTES</text>${title.map((t,i)=>`<text x="46" y="${110+i*30}" font-size="27" font-weight="600">${esc(t)}</text>`).join('')}<text x="48" y="183" font-size="14">${esc(page.date)} · ${esc(profile.name||'山水旅人')}</text></g><path d="M48 200H672M48 693H672" stroke="${p.line}" stroke-width="1"/><g opacity=".28" fill="none" stroke="${p.line}" stroke-width="1">${Array.from({length:9},(_,i)=>`<path d="M48 ${228+i*51}H672" stroke-dasharray="2 10"/>`).join('')}</g>${items}<g fill="${p.ink}" font-family="'Microsoft YaHei',sans-serif" font-size="17">${note.map((t,i)=>`<text x="48" y="${730+i*21}">${esc(t)}</text>`).join('')}</g><text x="48" y="${height-47}" font-family="sans-serif" font-size="11" letter-spacing="2" fill="${p.ink}" opacity=".6">山水护照 · 手动到达记录 · 数字旅行纪念</text></svg>`;
  }
  function experiment(id,v){
    const base=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 270" role="img" aria-label="${esc(v.caption)}"><rect width="420" height="270" rx="18" fill="#e5eddf"/><path d="M0 91L81 42L141 86L227 26L315 83L363 55L420 97V270H0Z" fill="#b3c8b5" opacity=".4"/>`;
    let art='';
    if(id==='color'){
      const top=111,bottom=150+v.depth*73,fill=`hsl(${163+v.depth*24} ${30+v.clarity*15}% ${67-v.depth*26}%)`;
      art=`<path d="M37 99L92 ${bottom+12}H326L383 99Z" fill="#d6ba7d" stroke="#9e8a57" stroke-width="2"/><path d="M51 100L99 ${bottom}H319L369 100Z" fill="#f7e5b4"/><path d="M57 ${top}H363L319 ${bottom}H99Z" fill="${fill}"/><path d="M113 ${bottom-6}Q172 ${bottom-15} 224 ${bottom-8}T308 ${bottom-8}" fill="none" stroke="#f7edbd" stroke-width="4" opacity="${v.clarity*(1-v.depth*.85)}"/><path class="lab-glint" d="M114 ${top+7}h48m30 5h66m24-5h29" fill="none" stroke="#e5f6e6" stroke-width="2"/><path d="M59 ${top+4}H361L319 ${bottom}H99Z" fill="#b6b7a0" opacity="${(1-v.clarity)*.8}"/><g fill="#6b8376" opacity="${1-v.clarity}">${Array.from({length:19},(_,i)=>`<circle cx="${111+(i*37)%190}" cy="${top+14+(i*19)%Math.max(5,bottom-top-24)}" r="2"/>`).join('')}</g><text x="210" y="259" text-anchor="middle" fill="#627769" font-size="11">明亮池底 / 同一视角的示意剖面</text>`;
    }else if(id==='flow'){
      const y=130-v.slope*74,bottom=178+v.slope*28,d=`M44 ${y}C154 ${y} 220 ${bottom} 368 ${bottom}`;
      art=`<path d="${d}V242H44Z" fill="#d1b27a"/><path d="${d}" fill="none" stroke="#f7e6af" stroke-width="16"/><path d="M51 ${y+25}Q213 ${bottom+27} 370 ${bottom+23}" stroke="#af905b" fill="none" stroke-width="2"/><path class="lab-waterline" d="${d}" fill="none" stroke="#6eaea2" stroke-width="${v.supply*13+1}" opacity="${v.supply? .85:0}"/><path class="lab-running" d="${d}" fill="none" stroke="#f5f7df" stroke-width="2" stroke-dasharray="12 20" opacity="${v.supply?1:0}"/><path d="M23 ${y-20}v-12h35v12" fill="none" stroke="#466e60" stroke-width="4"/><text x="211" y="262" text-anchor="middle" fill="#627769" font-size="11">来水 → 坡面 → 下游</text>`;
    }else{
      const g=v.growth;
      art=`<path d="M40 157Q200 187 382 144V202Q197 240 40 210Z" fill="#72b4ad"/><path d="M40 202Q197 237 382 191V247H40Z" fill="#b19b6e"/><path d="M40 202Q197 237 382 191" fill="none" stroke="#f6e9c1" stroke-width="${2+g*24}"/>${Array.from({length:5},(_,i)=>`<path d="M45 ${203+i*g*4}Q197 ${238+i*g*4} 376 ${192+i*g*4}" fill="none" stroke="#cbbc89" opacity="${g}" stroke-width="1"/>`).join('')}<g class="lab-gas" fill="none" stroke="#6a9f8c" stroke-width="2" opacity="${v.gas}">${Array.from({length:8},(_,i)=>`<circle cx="${80+i*35}" cy="${132-(i%3)*28}" r="${3+i%3}"/>`).join('')}</g><text x="213" y="76" text-anchor="middle" fill="#49705e" font-size="13">CO₂ ${v.gas>.5?'↑ 逐渐逸出':'留在水中较多'}</text><text x="215" y="264" text-anchor="middle" fill="#627769" font-size="11">浅色薄层 = 析出的碳酸钙</text>`;
    }
    return base+art+'</svg>';
  }
  const dataUrl=svg=>'data:image/svg+xml;base64,'+btoa(Array.from(new TextEncoder().encode(svg),n=>String.fromCharCode(n)).join(''));
  async function exportPage(page,profile,inventory){
    const images={};await Promise.all(page.items.map(async i=>{const art=inventory.find(a=>a.id===i.art);if(!art||images[art.id])return;const res=await fetch(art.src);if(!res.ok)throw Error('纪念章素材未加载完成，请联网后重试');images[art.id]=dataUrl(await res.text());}));
    const svg=notebook(page,profile,inventory,'',images),src=dataUrl(svg),img=new Image();
    await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=()=>reject(Error('当前浏览器未能生成图片，可尝试使用系统浏览器'));img.src=src;});
    const canvas=document.createElement('canvas');canvas.width=1440;canvas.height=img.naturalHeight*2;const ctx=canvas.getContext('2d');if(!ctx)throw Error('当前浏览器不支持图片导出');ctx.drawImage(img,0,0,canvas.width,canvas.height);
    return {png:canvas.toDataURL('image/png'),svg:src};
  }
  return {esc,papers,notebook,experiment,exportPage};
})();
