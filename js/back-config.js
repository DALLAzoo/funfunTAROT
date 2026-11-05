
 // 기존 뒷면 8종 + 신규 뒷면 12종. 한 덱은 하나의 뒷면을 사용합니다.
export const backs = [
  {id:'back-01',name:'뒷면 1',url:'./assets/card-backs/back-01.png'},
  {id:'back-02',name:'뒷면 2',url:'./assets/card-backs/back-02.png'},
  {id:'back-03',name:'뒷면 3',url:'./assets/card-backs/back-03.png'},
  {id:'back-04',name:'뒷면 4',url:'./assets/card-backs/back-04.png'},
  {id:'back-05',name:'뒷면 5',url:'./assets/card-backs/back-05.png'},
  {id:'back-06',name:'뒷면 6',url:'./assets/card-backs/back-06.png'},
  {id:'back-07',name:'뒷면 7',url:'./assets/card-backs/back-07.png'},
  {id:'back-08',name:'뒷면 8',url:'./assets/card-backs/back-08.png'},
  {id:'back-1-1',name:'뒷면 9',url:'./assets/card-backs/back-1-1.png'},
  {id:'back-1-2',name:'뒷면 10',url:'./assets/card-backs/back-1-2.png'},
  {id:'back-1-3',name:'뒷면 11',url:'./assets/card-backs/back-1-3.png'},
  {id:'back-1-4',name:'뒷면 12',url:'./assets/card-backs/back-1-4.png'},
  {id:'back-1-5',name:'뒷면 13',url:'./assets/card-backs/back-1-5.png'},
  {id:'back-1-6',name:'뒷면 14',url:'./assets/card-backs/back-1-6.png'},
  {id:'back-1-7',name:'뒷면 15',url:'./assets/card-backs/back-1-7.png'},
  {id:'back-1-8',name:'뒷면 16',url:'./assets/card-backs/back-1-8.png'},
  {id:'back-1-9',name:'뒷면 17',url:'./assets/card-backs/back-1-9.png'},
  {id:'back-1-10',name:'뒷면 18',url:'./assets/card-backs/back-1-10.png'},
  {id:'back-1-11',name:'뒷면 19',url:'./assets/card-backs/back-1-11.png'},
  {id:'back-1-12',name:'뒷면 20',url:'./assets/card-backs/back-1-12.png'}
];

export function randomBack(previousId=null){
  const pool=backs.length>1?backs.filter(b=>b.id!==previousId):backs;
  return pool[Math.floor(Math.random()*pool.length)];
}
