// 새 뒷면을 추가할 때 이 목록과 assets/card-backs/ 이미지만 수정하면 됩니다.
export const backs=[{id:'forest',name:'숲의 문양',url:'./assets/card-backs/forest.svg'},{id:'moon',name:'달의 문양',url:'./assets/card-backs/moon.svg'},{id:'sun',name:'태양의 문양',url:'./assets/card-backs/sun.svg'}];
export function randomBack(previousId=null){const pool=backs.length>1?backs.filter(b=>b.id!==previousId):backs;return pool[Math.floor(Math.random()*pool.length)];}
