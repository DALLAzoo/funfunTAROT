import {CONFIG as C,stageSize} from './config.js';
export async function prepareFront(data){
 if(!data.frontImage)return;
 await new Promise((resolve,reject)=>{const im=new Image();im.onload=async()=>{try{if(im.decode)await im.decode();resolve();}catch(e){reject(e);}};im.onerror=()=>reject(new Error('앞면 이미지 로딩 실패'));im.src=new URL(data.frontImage,document.baseURI).href;});
}
async function play(el,frames,duration){const a=el.animate(frames,{duration,easing:'cubic-bezier(.2,.7,.2,1)',fill:'forwards'});try{await a.finished;}catch{}a.cancel();}
export async function screenTransition(source,swapScene){
 // Rotate ONE physical DOM card, not two separate cards spliced at 90 degrees.
 // There is no fade, wipe, placeholder curtain or artificial front-face transition.
 const inner=source.querySelector('.card-inner');
 const zoom=C.reveal.zoom||1.18;
 await play(source,[{scale:'1'},{scale:String(zoom)}],C.reveal.approach);
 await play(inner,[{transform:'rotateY(0deg)'},{transform:'rotateY(90deg)'}],C.reveal.flip/2);
 inner.style.transform='rotateY(90deg)';
 swapScene();
 await play(inner,[{transform:'rotateY(90deg)'},{transform:'rotateY(180deg)'}],C.reveal.flip/2);
 inner.style.transform='rotateY(180deg)';
 source.querySelector('.card-front').setAttribute('aria-hidden','false');
 source.querySelector('.card-back').setAttribute('aria-hidden','true');
}
