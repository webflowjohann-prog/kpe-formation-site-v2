document.addEventListener('click', function(e) {
  var link = e.target.closest('a[href*="podia.com"]');
  if (!link) return;
  e.preventDefault();
  link.textContent = 'Redirection vers le paiement...';
  link.style.opacity = '0.7';
  fetch('/api/create-checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ product_type: 'online', payment_mode: 'one_time' })
  })
  .then(function(r) { return r.json(); })
  .then(function(d) { if (d.url) window.location.href = d.url; })
  .catch(function() { link.textContent = 'Erreur, réessayez'; link.style.opacity = '1'; });
});
