import {CONFIG as C,stageSize} from './config.js';
import {coverScale} from './cinema-core.js';
export async function prepareFront(data){
 if(!data.frontImage)return;
 await new Promise((resolve,reject)=>{const im=new Image();im.onload=async()=>{try{if(im.decode)await im.decode();resolve()}catch(e){reject(e)}};im.onerror=()=>reject(new Error('선택 카드의 앞면 이미지를 불러오지 못했습니다.'));im.src=new URL(data.frontImage,document.baseURI).href;});
}
async function animate(el,frames,duration){const a=el.animate(frames,{duration,easing:'cubic-bezier(.18,.72,.12,1)',fill:'both'});try{await a.finished;}catch{return false;}Object.assign(el.style,frames.at(-1));a.cancel();return true;}
export async function screenTransition(source,resultCard,swapScene){
 const rect=source.getBoundingClientRect(),vw=document.documentElement.clientWidth,vh=innerHeight;
 const w=stageSize('transition',vw),h=w*C.aspect;
 const overlay=document.createElement('div');overlay.className='transition-overlay';overlay.setAttribute('aria-hidden','true');
 const clone=source.cloneNode(true);clone.removeAttribute('id');clone.classList.remove('selectable','is-center');clone.disabled=true;clone.tabIndex=-1;
 Object.assign(clone.style,{position:'absolute',left:'0',top:'0',width:w+'px',height:h+'px',zIndex:'1',margin:'0'});
 clone.querySelector('.card-inner').style.transform='rotateY(0deg)';overlay.append(clone);document.body.append(overlay);source.style.visibility='hidden';
 const at=(cx,cy,s)=>`translate(${cx-w/2}px,${cy-h/2}px) scale(${s})`;
 const first=at(rect.left+rect.width/2,rect.top+rect.height/2,rect.width/w);
 const full=()=>at(document.documentElement.clientWidth/2,innerHeight/2,coverScale(document.documentElement.clientWidth,innerHeight,w,h));
 clone.style.transform=first;
 try{
  if(!await animate(clone,[{transform:first},{transform:full()}],C.reveal.approach))throw new Error('전환이 중단되었습니다.');
  // Recalculate against the current viewport before exposing the next scene.
  clone.style.transform=full();
  const coverage=clone.getBoundingClientRect();
  if(coverage.left>0||coverage.top>0||coverage.right<document.documentElement.clientWidth||coverage.bottom<innerHeight)throw new Error('전체 화면 전환 크기를 확인하지 못했습니다.');
  resultCard.dataset.coverage=JSON.stringify({left:coverage.left,top:coverage.top,right:coverage.right,bottom:coverage.bottom,viewportWidth:document.documentElement.clientWidth,viewportHeight:innerHeight});
  swapScene();
  const target=resultCard.getBoundingClientRect(),end=at(target.left+target.width/2,target.top+target.height/2,target.width/w);
  let flipTask=Promise.resolve(true);
  if(C.reveal.mode==='front-on-arrival')flipTask=animate(clone.querySelector('.card-inner'),[{transform:'rotateY(0deg)'},{transform:'rotateY(180deg)'}],C.reveal.arrival);
  if(!await animate(clone,[{transform:full()},{transform:end}],C.reveal.arrival))throw new Error('전환이 중단되었습니다.');
  await flipTask;overlay.remove();resultCard.style.visibility='visible';
  if(C.reveal.mode==='flip-after-arrival')await animate(resultCard.querySelector('.card-inner'),[{transform:'rotateY(0deg)'},{transform:'rotateY(180deg)'}],C.reveal.flip);
  else resultCard.querySelector('.card-inner').style.transform='rotateY(180deg)';
  resultCard.querySelector('.card-front').setAttribute('aria-hidden','false');resultCard.querySelector('.card-back').setAttribute('aria-hidden','true');
 }finally{overlay.remove();source.style.visibility='';}
}
