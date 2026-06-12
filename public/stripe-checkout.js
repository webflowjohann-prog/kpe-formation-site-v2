document.addEventListener('click', function(e) {
  var link = e.target.closest('a[href*="podia.com"]');
  if (!link) return;
  e.preventDefault();
  window.location.href = '/achat';
});
