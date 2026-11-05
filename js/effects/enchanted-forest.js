/** Forest visual layer for the existing In-between Shift app.
 * No selection listeners: original Carousel owns mouse/touch/clicks.
 * No DOM changes to cards, buttons, headings, result, reading text.
 * Scene appears only when original shuffle-flow adds .selection-stage.
 */
const stage=document.querySelector('#stage.stage');
if(stage){
 const world=document.createElement('div');world.id='enchantedWorld';world.className='forest-world';world.setAttribute('aria-hidden','true');
 const make=(cls,style)=>{const el=document.createElement('i');el.className=cls;if(style)for(const [k,v] of Object.entries(style))el.style.setProperty(k,v);world.append(el);return el;};
 for(const cls of ['forest-art','forest-sky','forest-night','forest-sun','forest-moon','forest-water'])make(cls);
 const n=(seed)=>{const x=Math.sin(seed*127.1+39.5)*43758.5453123;return x-Math.floor(x);};
 // Tree sprigs appear at the edges; central card hit areas stay completely clear.
 for(let i=0;i<26;i++){
  const left=i%2===0;
  const x=left?(1+n(i+12)*21):(77+n(i+9)*21);
  make('forest-leaf',{'--x':`${x.toFixed(1)}%`,'--y':`${(7+n(i+33)*73).toFixed(1)}%`,
   '--s':`${(8+n(i+74)*15).toFixed(0)}px`,'--r':`${(-55+n(i+20)*110).toFixed(0)}deg`,
   '--delay':`${(250+n(i+56)*1800).toFixed(0)}ms`});
 }
 for(let i=0;i<34;i++){
  const side=i%3===0?true:i%3===1?false:null;
  const x=side===true?(1+n(i+51)*25):side===false?(73+n(i+61)*26):(10+n(i+41)*80);
  make('forest-grass',{'--x':`${x.toFixed(2)}%`,'--bottom':`${(4+n(i+12)*20).toFixed(0)}%`,
   '--h':`${(14+n(i+40)*28).toFixed(0)}px`,'--r':`${(-23+n(i+99)*47).toFixed(0)}deg`,
   '--delay':`${(250+n(i+77)*2200).toFixed(0)}ms`});
 }
 for(let i=0;i<14;i++){
  make('forest-flower',{'--x':`${(2+n(i+13)*96).toFixed(1)}%`,
   '--bottom':`${(7+n(i+19)*21).toFixed(1)}%`,'--s':`${(9+n(i+67)*14).toFixed(0)}px`,
   '--color':['#ffe1e4','#ffedb8','#f7ceff','#e8f3e8'][i%4],
   '--delay':`${(800+n(i+31)*2300).toFixed(0)}ms`});
 }
 for(let i=0;i<22;i++){
  make('forest-firefly',{'--x':`${(5+n(i+22)*90).toFixed(1)}%`,
   '--y':`${(11+n(i+80)*80).toFixed(1)}%`,'--s':`${(1.5+n(i+54)*2.1).toFixed(1)}px`,
   '--t':`${(2.5+n(i+59)*5.4).toFixed(2)}s`,'--delay':`${(-n(i+77)*8).toFixed(2)}s`});
 }
 for(let i=0;i<17;i++)make('forest-star',{'--x':`${(9+n(i+37)*82).toFixed(2)}%`,
  '--y':`${(3+n(i+31)*42).toFixed(2)}%`,'--delay':`${(-n(i+12)*4).toFixed(2)}s`});
 make('forest-focus');
 // Small animated animal silhouettes; detailed deer and rabbit also exist in the backdrop.
 const bunny=document.createElement('div');bunny.className='forest-rabbit';bunny.innerHTML=`<svg viewBox="0 0 54 50" xmlns="http://www.w3.org/2000/svg" fill="#ebddc5" aria-hidden="true"><ellipse cx="24" cy="36" rx="17" ry="10"/><circle cx="38" cy="28" r="8"/><ellipse cx="34" cy="14" rx="4" ry="14" transform="rotate(-12 34 14)"/><ellipse cx="43" cy="15" rx="3.5" ry="13" transform="rotate(13 43 15)"/><circle cx="45" cy="29" r="1.4" fill="#22211c"/><circle cx="10" cy="35" r="6"/><ellipse cx="15" cy="44" rx="10" ry="4"/></svg>`;
 const deer=document.createElement('div');deer.className='forest-deer';deer.innerHTML=`<svg viewBox="0 0 72 85" xmlns="http://www.w3.org/2000/svg" fill="#bd8e5a" aria-hidden="true"><ellipse cx="30" cy="41" rx="19" ry="11"/><path d="M41 37 L48 56 L54 56 L51 37 L46 26 L56 14 L61 17 L54 32 L55 45 L52 59 L43 60 L38 44Z"/><path d="M19 48 L15 80 L21 80 L28 50Z M34 50 L34 82 L40 82 L42 47Z"/><path d="M45 24 L45 10 L39 2 L41 1 L47 8 L52 2 L54 3 L48 14 L51 26Z"/><circle cx="57" cy="17" r="7"/><circle cx="61" cy="16" r="1.4" fill="#241915"/><path d="M16 37 Q4 32 3 26" stroke="#bd8e5a" stroke-width="3" fill="none"/></svg>`;
 world.append(bunny,deer);
 stage.insertBefore(world,stage.querySelector('.cards'));
 const cards=stage.querySelector('#cards');let updateQueued=false;
 function syncPicked(){updateQueued=false;
  const picked=cards?.querySelector('.tarot-card.is-picked');world.classList.toggle('is-picked',!!picked);
  if(picked){const b=picked.getBoundingClientRect(),s=stage.getBoundingClientRect();
    world.style.setProperty('--pick-x',`${((b.left+b.width/2-s.left)/s.width*100).toFixed(1)}%`);
    world.style.setProperty('--pick-y',`${((b.top+b.height/2-s.top)/s.height*100).toFixed(1)}%`);}
 }
 function scheduleUpdate(){if(!updateQueued){updateQueued=true;requestAnimationFrame(syncPicked)}}
 // Original selection and card DOM remain untouched; observe only.
 const mo=new MutationObserver(scheduleUpdate);
 if(cards)mo.observe(cards,{subtree:true,attributes:true,attributeFilter:['class']});
 stage.addEventListener('pointerup',scheduleUpdate,{passive:true});
 stage.addEventListener('click',scheduleUpdate,{passive:true});
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)scheduleUpdate()},{passive:true});
 scheduleUpdate();
}
