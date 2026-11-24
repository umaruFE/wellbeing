/* Workbench content can be longer than the approved visual-study passage. */
(()=>{
  const text=document.querySelector('#line'),board=text?.closest('.line');
  if(!text||!board)return;
  const fitPassage=()=>{
    // Keep the approved 33px type when it fits; retain scrolling for very long input.
    board.style.paddingBottom='0px';
    text.style.fontSize='33px';
    const reserve=text.scrollHeight>board.clientHeight?24:0;
    board.style.paddingBottom=reserve+'px';
    for(let size=33;size>=22;size--){
      text.style.fontSize=size+'px';
      if(text.scrollHeight<=board.clientHeight-reserve&&text.scrollWidth<=board.clientWidth)break;
    }
  };
  fitPassage();
  document.fonts.ready.then(fitPassage);
  addEventListener('resize',fitPassage);
})();
