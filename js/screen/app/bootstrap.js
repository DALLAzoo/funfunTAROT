import {CONFIG as C} from '../../settings/config/config.js';
import {applySettings} from '../../settings/config/apply-settings.js';
import {makeCatalog,validateConfig,randomOrder} from '../../motion/core/cinema-core.js';
import {backs,randomBack} from '../../settings/data/back-config.js';
import {prepareBack} from '../assets/back-loader.js';
import {renderCards} from '../cards/card-view.js';
import {cardSize,floatLayout} from '../../motion/animation/card-animation.js';

/** Prepare catalog, back artwork, deck DOM and initial app state. */
export async function initializeApp({ctx, $, stage, container, status, setState}) {
  try{applySettings(C);ctx.catalog=makeCatalog();const inventory=validateConfig(C,ctx.catalog);$('#inventory').textContent=`등록 데이터 ${inventory.records}장 · 앞면 이미지 ${inventory.registeredFrontImages}장 · 뒷면 ${backs.length}종`;
   $('#poolNotice').textContent=C.pool.mode==='trial-uniform-subset'?'선택 대상은 시험용 무작위 20장입니다. 최종 구성 방식은 미확정입니다.'.replace('20',C.counts.selection):'설정된 카드 ID 목록을 선택 대상으로 사용합니다.';
   ctx.back=randomBack();setState('preparing','카드 이미지를 준비하고 있어요…');
   try{await prepareBack(ctx.back);cardSize(stage);ctx.cards=renderCards(container,randomOrder(ctx.catalog).slice(0,C.counts.shuffle),ctx.back);ctx.cards.forEach(c=>{c.disabled=true;c.classList.add('shuffle-surface');});floatLayout(ctx.cards,stage);cardSize(stage,'selection');stage.classList.add('idle-stack');$('#backName').textContent='· '+ctx.back.name;setState('idle','새로운 덱이 준비됐어요');}
   catch(e){ctx.back=null;setState('idle','카드 이미지를 불러오지 못했어요. 카드 섞기를 눌러 다시 시도해 주세요.');}
  }catch(e){setState('error',e.message);status.setAttribute('role','alert');}
}
