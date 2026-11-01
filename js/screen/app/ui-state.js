export function setStateUI(ctx,next,label){
 const {status,shuffleBtn,$}=ctx;
 ctx.state=next;status.textContent=label;
 const dropdown=$('#readingDropdown').closest('.reading-dropdown');
 const destination=next==='result'?$('.result-actions'):$('.controls .actions');
 if(dropdown.parentElement!==destination) destination.appendChild(dropdown);
 const inTransition=['preparing','shuffling','revealing','error'].includes(next);
 dropdown.hidden=inTransition;
 const trigger=$('#readingDropdown');
 trigger.disabled=inTransition;
 if(inTransition){$('#readingOptions').hidden=true;trigger.setAttribute('aria-expanded','false');}
 const again=$('#resultAgain');
 again.disabled=next!=='result';again.hidden=next!=='result';
 shuffleBtn.disabled=!['idle','selection','result'].includes(next);
 shuffleBtn.textContent=next==='selection'?'다시 섞기':'카드 섞기';
 $('#navigation').hidden=true;$('#selectBtn').disabled=next!=='selection';
}
export function refreshCounterUI($,pool,index){$('#counter').textContent=`${index+1} / ${pool.length}`;}
