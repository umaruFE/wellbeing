/* Functional prop pictograms. Unknown vocabulary uses a neutral speech mark. */
window.SpeakIcon = function(symbol){
 const drawings={
 '🍳':'<path d="M44 36l13 13" stroke="#3b2b52" stroke-width="9"/><circle cx="26" cy="25" r="21" fill="#a899d2"/><circle cx="26" cy="25" r="15" fill="#fff9eb"/><path d="M17 22q2-9 9-5q13-2 12 10q-2 9-11 7q-11 3-12-4z" fill="#fff" stroke-width="1.5"/><circle cx="27" cy="25" r="6" fill="#ffd75a"/>',
 '🍿':'<path d="M13 22h39l-6 36H19z" fill="#fff7e8"/><path d="M23 25l2 31m15-31l-2 31" stroke="#df827e" stroke-width="7"/><path d="M13 23q-5-12 5-12q-2-10 8-6q6-9 13-1q11-1 9 10q12 0 6 11z" fill="#ffe17e"/>',
 '♟️':'<circle cx="32" cy="13" r="9" fill="#9682c2"/><path d="M25 24h14l-3 10q-1 6 10 11H18q10-5 10-11z" fill="#b6a6d9"/><path d="M18 45h28l5 11H13z" fill="#9682c2"/>',
 '🥾':'<path d="M13 7h23l-1 24l17 10q6 4 5 13H9V34l5-9z" fill="#d9a77b"/><path d="M11 52h45v8H9z" fill="#9a7791"/><path d="M22 16h11m-12 8h12m1 12l-6 8m14-4l-5 8" fill="none" stroke="#fff3dc"/>',
 '🧺':'<path d="M11 28h44l-5 29H16z" fill="#e8b983"/><path d="M18 27V17q14-19 29 0v10" fill="none" stroke="#a58dba" stroke-width="6"/><path d="M11 37h41M15 47h36M24 30v25m15-25v25" fill="none" stroke="#be874e" stroke-width="2"/><path d="M7 27h50v6H7z" fill="#f8d5a0"/>',
 '⚽':'<circle cx="32" cy="32" r="26" fill="#fff8e9"/><path d="M32 20l12 9-5 14H25l-5-14zM11 16l12-9-2 12-11 7m43-9-11-10 1 13 11 7M12 48l15 7-6-12m30 5-15 7 7-12" fill="#9986c5"/>',
 '📚':'<path d="M9 13h45v41H9z" fill="#a9c6e8"/><path d="M13 10h36v40H13z" fill="#ffda83"/><path d="M14 46h39v9H14q-9-4 0-9Z" fill="#fff9ed"/><path d="M23 19h18m-18 8h18" stroke="#997f52"/>',
 '💃':'<path d="M26 13v31m0-28l26-6v27" fill="none" stroke="#9774c1" stroke-width="6"/><ellipse cx="18" cy="46" rx="10" ry="7" fill="#e39db2"/><ellipse cx="44" cy="39" rx="10" ry="7" fill="#e39db2"/>',
 '💬':'<path d="M8 10h48v35H29L16 56V45H8z" fill="#b7a3df"/><path d="M19 25h27M19 33h18" fill="none" stroke="#fff7e6" stroke-width="4"/>'
 };
 const content=drawings[symbol]||'<path d="M12 27v10m10-18v26m10-34v42m10-34v26m10-18v10" fill="none" stroke="#b879ab" stroke-width="5"/>';
 return '<svg class="prop-icon" viewBox="0 0 64 64" aria-hidden="true" focusable="false"><g stroke="#3b2b52" stroke-width="3" stroke-linejoin="round" stroke-linecap="round">'+content+'</g></svg>';
};
