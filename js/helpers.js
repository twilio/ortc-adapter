function traceObj(obj) {
  function recurse(value) {
    switch (typeof value) {
      case 'object':
        var json = {};
        for (var key of value) {
          json[key] = recurse(obj[key]);
        }
        return json;
      default:
        return value;
    }
  }
  trace(recurse(obj));
}

function trace(msg) {
  var p = document.createElement('p');
  p.innerHTML = escapeHTML(msg);
  document.body.appendChild(p);
}

function escapeHTML(unsafe) {
  return unsafe
   .replace(/&/g, "&amp;")
   .replace(/</g, "&lt;")
   .replace(/>/g, "&gt;")
   .replace(/"/g, "&quot;")
   .replace(/'/g, "&#039;");
}
