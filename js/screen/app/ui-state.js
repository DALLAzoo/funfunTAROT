export function setStateUI(ctx,next,label){
 const {status,shuffleBtn,$}=ctx;
ctx.state=next;status.textContent=label;
 const dropdown=$('#readingDropdown').parentElement;
 const destination=(next==='revealing'||next==='result')?$('.result-actions'):$('.controls .actions');
 if(dropdown.parentElement!==destination) destination.appendChild(dropdown);
 dropdown.hidden=next==='revealing'||next==='preparing'||next==='error';
 if(dropdown.hidden){$('#readingOptions').hidden=true;$('#readingDropdown').setAttribute('aria-expanded','false');}
$('#resultAgain').disabled=next!=='result';$('#resultAgain').hidden=next!=='result';shuffleBtn.disabled=!['idle','selection','result'].includes(next);shuffleBtn.textContent=next==='selection'?'다시 섞기':'카드 섞기';$('#navigation').hidden=true;$('#selectBtn').disabled=next!=='selection';}
export function refreshCounterUI($,pool,index){$('#counter').textContent=`${index+1} / ${pool.length}`;}
