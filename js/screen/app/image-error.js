/** Visible, retryable image errors without changing existing card layouts. */
export function createImageError(){
 const root=document.createElement('div');
 root.className='ad1-image-error';root.hidden=true;root.setAttribute('role','alert');
 root.innerHTML='<span class="ad1-image-error-message"></span><button class="ad1-image-error-retry" type="button">다시 시도</button>';
 document.body.append(root);
 const message=root.querySelector('.ad1-image-error-message');
 const retry=root.querySelector('.ad1-image-error-retry');
 let callback=null;
 retry.addEventListener('click',()=>{
  const run=callback;hide();
  if(run) run();
 });
 function hide(){root.hidden=true;message.textContent='';callback=null;}
 function show(text,again){message.textContent=text || '카드 이미지를 불러오지 못했어요.';callback=again;retry.hidden=!again;root.hidden=false;}
 return {show,hide};
}
