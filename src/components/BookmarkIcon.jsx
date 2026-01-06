export const BookmarkIcon = ({ phase }) => {
  let colorClass = "text-slate-400";
  if (phase === 'Engage') colorClass = "text-purple-500";
  if (phase === 'Empower') colorClass = "text-blue-500";
  if (phase === 'Execute') colorClass = "text-green-500";
  if (phase === 'Elevate') colorClass = "text-yellow-500";
  
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className={colorClass} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>
    </svg>
  );
};
