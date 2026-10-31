export function setStateUI(ctx,next,label){
 const {status,shuffleBtn,$}=ctx;
ctx.state=next;status.textContent=label;$('#resultAgain').disabled=next!=='result';shuffleBtn.disabled=!['idle','selection','result'].includes(next);shuffleBtn.textContent=next==='selection'?'다시 섞기':'카드 섞기';$('#navigation').hidden=true;$('#selectBtn').disabled=next!=='selection';}
export function refreshCounterUI($,pool,index){$('#counter').textContent=`${index+1} / ${pool.length}`;}
