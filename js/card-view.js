export function renderCards(container,deck,back){
 container.replaceChildren();return deck.map((data,i)=>{
  const el=document.createElement('button');el.type='button';el.className='tarot-card';el.dataset.cardId=data.id;el.cardData=data;
  el.setAttribute('aria-label',`${i+1}번째 카드`);el.style.setProperty('--back-image',`url("${new URL(back.url,document.baseURI).href}")`);
  el.style.setProperty('--glow-mask',`url("${new URL(`./assets/glow-masks/${back.id}-gold-mask.png`,document.baseURI).href}")`);
  el.innerHTML='<span class="card-edge edge-1"></span><span class="card-edge edge-2"></span><span class="card-edge edge-3"></span><span class="card-inner"><span class="card-face card-back"></span><span class="card-face card-front" aria-hidden="true"><span class="front-symbol"></span><span class="front-name"></span><span class="front-sub"></span></span></span>';
  const front=el.querySelector('.card-front');
  if(data.frontImage){const image=document.createElement('img');image.src=new URL(data.frontImage,document.baseURI).href;image.alt=data.name;image.draggable=false;front.replaceChildren(image);front.classList.add('has-image');}
  else{front.querySelector('.front-symbol').textContent=data.symbol||'✧';front.querySelector('.front-name').textContent=data.name;front.querySelector('.front-sub').textContent='앞면 이미지 미등록 · 시연 데이터';}
  container.append(el);return el;
 });
}
