// 제공된 원본 뒷면 8종. 한 덱은 하나의 뒷면을 사용합니다.
export const backs=[
  {id:'back-01',name:'뒷면 1',url:'./assets/card-backs/back-01.webp'},
  {id:'back-02',name:'뒷면 2',url:'./assets/card-backs/back-02.webp'},
  {id:'back-03',name:'뒷면 3',url:'./assets/card-backs/back-03.webp'},
  {id:'back-04',name:'뒷면 4',url:'./assets/card-backs/back-04.webp'},
  {id:'back-05',name:'뒷면 5',url:'./assets/card-backs/back-05.webp'},
  {id:'back-06',name:'뒷면 6',url:'./assets/card-backs/back-06.webp'},
  {id:'back-07',name:'뒷면 7',url:'./assets/card-backs/back-07.webp'},
  {id:'back-08',name:'뒷면 8',url:'./assets/card-backs/back-08.webp'}
];
export function randomBack(previousId=null){const pool=backs.length>1?backs.filter(b=>b.id!==previousId):backs;return pool[Math.floor(Math.random()*pool.length)];}
