(function () {
  // BookSuite embed loader. Drop-in script:
  //   <script src="https://booksuite.online/embed.js" data-user="USER_ID"></script>
  // Optionally place a <div id="booksuite-widget"></div> where you want it to render.
  // Otherwise the widget is inserted directly after the script tag.
  var scripts = document.getElementsByTagName('script');
  var self = null;
  for (var i = scripts.length - 1; i >= 0; i--) {
    var s = scripts[i];
    if (s.src && s.src.indexOf('/embed.js') !== -1) { self = s; break; }
  }
  if (!self) return;

  var userId = self.getAttribute('data-user');
  if (!userId) {
    console.error('[BookSuite] embed.js: missing data-user attribute');
    return;
  }

  var origin = self.src.replace(/\/embed\.js.*$/, '');
  var height = self.getAttribute('data-height') || '760';

  var iframe = document.createElement('iframe');
  iframe.src = origin + '/embed/' + encodeURIComponent(userId);
  iframe.title = 'Booking widget';
  iframe.style.border = 'none';
  iframe.style.width = '100%';
  iframe.style.maxWidth = '500px';
  iframe.style.height = height + 'px';
  iframe.style.background = 'transparent';
  iframe.setAttribute('loading', 'lazy');

  var target = document.getElementById('booksuite-widget');
  if (target) {
    target.appendChild(iframe);
  } else if (self.parentNode) {
    self.parentNode.insertBefore(iframe, self.nextSibling);
  }
})();
