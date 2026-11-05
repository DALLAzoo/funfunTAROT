// A usable low-GPU fallback: card drag, touch, reveal and original reading.
// Only activated when WebGL2 is not available on the user's PC/browser.
window.startTarotFallback=function(){
 'use strict';
 const $=s=>document.getElementById(s),stage=$('stageWrap'),deck=$('fallbackDeck');
 $('unavailable').hidden=true;$('view').hidden=true;deck.hidden=false;
 const root='https://dallazoo.github.io/funfunTAROT/';
 const ids=[...Array.from({length:22},(_,i)=>`major-${String(i).padStart(2,'0')}`),
 'cups-page','wands-page','swords-page','pentacles-page','swords-knight','wands-knight','cups-knight','pentacles-knight'];
 const readingPromise=fetch(root+'js/screen/app/reveal-flow.js',{cache:'force-cache'})
 .then(r=>{if(!r.ok)throw Error('원문 연결 실패');return r.text();})
 .then(source=>{
  const found=new Map();for(const m of source.matchAll(/chosen\.cardData\.id\s*===\s*'([^']+)'\s*\?\s*`([\s\S]*?)`\s*:/g))found.set(m[1],m[2]);
  return found;
 }).catch(e=>{console.warn(e);return new Map();});
 let cards=[],focus=3,picked=-1,phase='idle',gesture=null,currentBack='back-01.webp',token=0;
 const mod=x=>(x%22+22)%22;
 function sequence(){const list=ids.slice();for(let i=list.length-1;i>0;i--){const k=Math.floor(Math.random()*(i+1));[list[k],list[i]]=[list[i],list[k]];}return list.slice(0,22);}
 function position(){const w=stage.clientWidth,mob=w<650,step=mob?Math.min(w*.26,92):Math.min(w*.17,144);
  cards.forEach((entry,i)=>{
   const card=entry.el,d=mod(i-focus+11)-11,visible=Math.abs(d)<3.6;
   card.hidden=!visible;
   if(phase==='result')return;
   card.style.zIndex=String(50-Math.round(Math.abs(d)*5));
   card.style.opacity=visible?'1':'0';
   card.style.transform=`translate(-50%,-50%) translate3d(${d*step}px,${Math.abs(d)*11-(picked===i?20:0)}px,0) rotateZ(${d*7}deg)`;
   card.classList.toggle('is-picked',picked===i);
  });
 }
 function preload(id){const img=new Image();img.decoding='async';img.src=root+'assets/card-fronts/'+id+'.png';}
 function choose(i){if(phase!=='selection')return;
  if(i!==focus){focus=i;picked=-1;position();preload(cards[focus].id);return;}
  if(picked===i){reveal(i);return;}
  picked=i;position();preload(cards[focus].id);
 }
 function resetResult(){
  $('resultView').hidden=true;$('resultReading').textContent='';$('resultSelectionTitle').textContent='마음이 끌리는 카드를 선택하세요';
  $('resultAgain').hidden=true;$('shuffle').hidden=false;$('readingDropdown').hidden=false;
 }
 function begin(initialOnly=false){token++;const n=token;resetResult();phase='shuffling';deck.replaceChildren();cards=[];focus=3;picked=-1;
  currentBack='back-0'+(1+Math.floor(Math.random()*8))+'.webp';
  const cardIds=sequence();cardIds.forEach((id,i)=>{
   const el=document.createElement('button');el.type='button';el.className='fallback-card';el.setAttribute('aria-label',`${i+1}번째 카드`);
   const back=document.createElement('span');back.className='fallback-card-back';back.style.backgroundImage=`url('${root}assets/card-backs/${currentBack}')`;
   const front=document.createElement('span');front.className='fallback-card-front';const art=document.createElement('img');art.alt=id;front.append(art);el.append(back,front);deck.append(el);
   cards.push({el,id,art});
   el.addEventListener('click',e=>{if(Date.now()-lastSwipeAt<350)return;choose(i);});
  });
  if(initialOnly===true){
   phase='idle';$('shuffle').disabled=false;
   cards.forEach((c,i)=>{c.el.hidden=i!==0;c.el.style.zIndex='10';c.el.style.transform='translate(-50%,-50%)';});
   return;
  }
  $('shuffle').disabled=true;
  // Coherent fallback animation, not a complete reproduction of WebGL lighting.
  for(let i=0;i<cards.length;i++){const c=cards[i].el;c.style.transform='translate(-50%,-50%) scale(.85)';c.hidden=false;}
  requestAnimationFrame(()=>{cards.forEach((c,i)=>{const side=i%2?-1:1,dx=side*(i%5+1)*11;
   c.el.style.transform=`translate(-50%,-50%) translate(${dx}px,${-15-i*.7}px) rotateZ(${side*7}deg)`;});});
  setTimeout(()=>{if(n!==token)return;phase='selection';$('shuffle').disabled=false;$('shuffle').textContent='다시 섞기';position();preload(cards[focus].id);},1750);
 }
 async function reveal(i){if(phase!=='selection')return;
  phase='revealing';const n=token;const entry=cards[i],el=entry.el;
  $('shuffle').hidden=true;$('readingDropdown').hidden=true;
  cards.forEach((c,j)=>{if(i!==j)c.el.hidden=true;});
  const img=entry.art;
  img.src=root+'assets/card-fronts/'+entry.id+'.png';
  const reading=readingPromise.then(map=>map.get(entry.id)||'');
  el.style.zIndex='100';el.style.transform='translate(-50%,-50%) translate3d(0px,0px,40px) scale(1.36)';
  await new Promise(res=>setTimeout(res,250));if(n!==token)return;
  el.classList.add('is-revealed');
  const original=await reading;if(n!==token)return;
  if(original){$('resultReading').textContent=original;$('resultView').hidden=false;}
  $('resultSelectionTitle').textContent='조언 - 당신을 위한';$('resultAgain').hidden=false;
  phase='result';
 }
 let lastSwipeAt=0;
 deck.addEventListener('pointerdown',e=>{if(phase!=='selection'||e.button!==undefined&&e.button!==0)return;gesture={x:e.clientX,y:e.clientY,id:e.pointerId};},{passive:true});
 deck.addEventListener('pointerup',e=>{if(!gesture||gesture.id!==e.pointerId)return;
  const dx=e.clientX-gesture.x;gesture=null;
  if(Math.abs(dx)>24){lastSwipeAt=Date.now();focus=mod(focus+(dx<0?Math.max(1,Math.round(-dx/65)):-Math.max(1,Math.round(dx/65))));picked=-1;position();preload(cards[focus].id);}
 });
 deck.addEventListener('pointercancel',()=>gesture=null);
 stage.addEventListener('keydown',e=>{
  if(phase!=='selection')return;
  if(e.key==='ArrowRight'){focus=mod(focus+1);picked=-1;position();e.preventDefault();}
  if(e.key==='ArrowLeft'){focus=mod(focus-1);picked=-1;position();e.preventDefault();}
  if(e.key==='Enter'){choose(focus);e.preventDefault();}
 });
 stage.tabIndex=0;
 $('shuffle').addEventListener('click',()=>begin());$('resultAgain').addEventListener('click',()=>begin());
 $('readingDropdown').addEventListener('click',()=>{$('readingOptions').hidden=!$('readingOptions').hidden;});
 $('readingOptions').querySelector('button')?.addEventListener('click',()=>{$('readingOptions').hidden=true;});
 window.addEventListener('resize',()=>{if(phase==='selection')position();});
 begin(true);
};
