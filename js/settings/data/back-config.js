
 // 교체된 뒷면 20종. 한 덱은 무작위로 정해진 하나의 뒷면을 사용합니다.
export const backs = [
  {id:'back-01',name:'뒷면 1',url:'./assets/card-backs/back-01.webp'},
  {id:'back-02',name:'뒷면 2',url:'./assets/card-backs/back-02.webp'},
  {id:'back-03',name:'뒷면 3',url:'./assets/card-backs/back-03.webp'},
  {id:'back-04',name:'뒷면 4',url:'./assets/card-backs/back-04.webp'},
  {id:'back-05',name:'뒷면 5',url:'./assets/card-backs/back-05.webp'},
  {id:'back-06',name:'뒷면 6',url:'./assets/card-backs/back-06.webp'},
  {id:'back-07',name:'뒷면 7',url:'./assets/card-backs/back-07.webp'},
  {id:'back-08',name:'뒷면 8',url:'./assets/card-backs/back-08.webp'},
  {id:'back-1-1',name:'뒷면 9',url:'./assets/card-backs/back-1-1.webp'},
  {id:'back-1-2',name:'뒷면 10',url:'./assets/card-backs/back-1-2.webp'},
  {id:'back-1-3',name:'뒷면 11',url:'./assets/card-backs/back-1-3.webp'},
  {id:'back-1-4',name:'뒷면 12',url:'./assets/card-backs/back-1-4.webp'},
  {id:'back-1-5',name:'뒷면 13',url:'./assets/card-backs/back-1-5.webp'},
  {id:'back-1-6',name:'뒷면 14',url:'./assets/card-backs/back-1-6.webp'},
  {id:'back-1-7',name:'뒷면 15',url:'./assets/card-backs/back-1-7.webp'},
  {id:'back-1-8',name:'뒷면 16',url:'./assets/card-backs/back-1-8.webp'},
  {id:'back-1-9',name:'뒷면 17',url:'./assets/card-backs/back-1-9.webp'},
  {id:'back-1-10',name:'뒷면 18',url:'./assets/card-backs/back-1-10.webp'},
  {id:'back-1-11',name:'뒷면 19',url:'./assets/card-backs/back-1-11.webp'},
  {id:'back-1-12',name:'뒷면 20',url:'./assets/card-backs/back-1-12.webp'}
];

export function randomBack(previousId=null){
  const pool=backs.length>1?backs.filter(b=>b.id!==previousId):backs;
  return pool[Math.floor(Math.random()*pool.length)];
}
