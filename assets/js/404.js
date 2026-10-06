
document.getElementById('goBack').addEventListener('click', () => {
  if (history.length > 1) history.back();
  else location.href = 'index.html';
});