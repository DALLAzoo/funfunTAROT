import{MagicVFX}from'./magic-vfx.js';
import{SELECTION_COUNT}from'./shuffle-paths.js';
import{prepareBack}from'./back-loader.js';
import{shuffledDeck}from'./card-data.js';import{randomBack}from'./back-config.js';import{renderCards}from'./card-view.js';import{cardSize,floatLayout,cancelAll,shuffleMotion,fanMotion,fanLayout,revealMotion}from'./card-animation.js';
const stage=document.querySelector('#stage'),container=document.querySelector('#cards'),status=document.querySelector('#status'),backName=document.querySelector('#backName'),instruction=document.querySelector('#instruction'),shuffleBtn=document.querySelector('#shuffleBtn'),resetBtn=document.querySelector('#resetBtn');
const magic=new MagicVFX(stage);
let cards=[],selection=[],currentBack=null,state='idle',session=0;
function setState(next,label){state=next;status.textContent=label;shuffleBtn.disabled=next==='preparing'||next==='shuffling'||next==='revealing';shuffleBtn.textContent=next==='fan'?'다시 섞기':'카드 섞기';resetBtn.hidden=next!=='revealed';cards.forEach(c=>{c.classList.toggle('selectable',next==='fan'&&!c.hidden);c.disabled=next!=='fan'||c.hidden;});}
async function prepareDeck(token){
  const back=randomBack(currentBack?.id),previousState=state,previousInstruction=instruction.textContent;
  setState('preparing','카드 이미지를 준비하고 있어요…');
  try{await prepareBack(back);}catch(error){
    if(token!==session)return false;
    setState(previousState,'카드 이미지를 불러오지 못했어요. 다시 시도해 주세요.');
    instruction.textContent=previousInstruction;
    return false;
  }
  if(token!==session)return false;
  magic.stop();
  cancelAll(cards);
  currentBack=back;
  backName.textContent=`· ${currentBack.name}`;
  cardSize(stage);
  cards=renderCards(container,shuffledDeck(),currentBack);
  selection=cards.slice(0,SELECTION_COUNT); // shuffledDeck already randomizes all 22 unique cards.
  floatLayout(cards,stage);
  cards.forEach(c=>c.addEventListener('click',()=>choose(c)));
  return true;
}
async function start(){
  const token=++session;
  if(!await prepareDeck(token))return;
  setState('idle','새로운 덱이 준비됐어요');
  instruction.textContent='카드를 섞을 때마다 새로운 무늬가 나타납니다.';
}
async function shuffle(){
  if(state==='preparing'||state==='shuffling'||state==='revealing')return;
  const token=++session;
  if(!await prepareDeck(token))return;
  setState('shuffling','카드를 섞고 있어요…');
  instruction.textContent='잠시 기다려 주세요.';
  magic.start(cards);
  const completed=await shuffleMotion(cards,stage,name=>magic.phase(name));
  if(!completed){magic.stop();return;}
  if(token!==session){magic.stop();return;}
  cards.forEach(c=>{c.hidden=!selection.includes(c);});
  magic.phase("release");
  const opened=await fanMotion(selection,stage);
  if(!opened){magic.stop();return;}
  magic.finish();
  fanLayout(selection,stage);
  if(token!==session)return;
  setState('fan','끌리는 카드를 골라 주세요');
  instruction.textContent='마음에 드는 카드를 터치하거나 다시 섞어 보세요.';
}
async function choose(card){if(state!=='fan'||!selection.includes(card)||card.hidden)return;const token=++session;setState('revealing','카드를 공개하고 있어요…');instruction.textContent='선택한 카드가 모습을 드러냅니다.';const completed=await revealMotion(selection,card,stage);if(!completed)return;if(token!==session)return;setState('revealed','카드가 공개됐어요');instruction.textContent='앞면은 시연용 데이터입니다. 실제 타로 이미지와 리딩은 추후 연결합니다.';}
shuffleBtn.addEventListener('click',shuffle);resetBtn.addEventListener('click',start);window.addEventListener('resize',()=>{if(state==='idle'){cardSize(stage);floatLayout(cards,stage);}else if(state==='fan'){fanLayout(selection,stage);}});start();
