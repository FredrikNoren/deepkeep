
var http = {}
http.requestRaw = function(method, url, payload, options) {
  return new Promise(function(resolve, reject) {
    var httpRequest = new XMLHttpRequest();
    httpRequest.onreadystatechange = function() {
      if (httpRequest.readyState === 4) {
        resolve(httpRequest.responseText);
      }
    }
    httpRequest.open(method, url, true);
    if (options) {
      if (options.headers) {
        Object.keys(options.headers).forEach(function(key) {
          httpRequest.setRequestHeader(key, options.headers[key]);
        });
      }
    }
    httpRequest.send(payload);
  });
};
http.request = function(method, url, payload, options) {
  options = options || {};
  options.headers = options.headers || {};
  if (payload) {
    payload = JSON.stringify(payload, null, 2);
    options.headers['Content-Type'] = options.headers['Content-Type'] || 'application/json';
  }
  options.headers['Accept'] = options.headers['Accept'] || 'application/json';
  return http.requestRaw(method, url, payload, options).then(function(result) {
    return JSON.parse(result);
  })
}
http.get = function(url, payload, options) {
  return http.request('GET', url, payload, options);
}
http.putRaw = function(url, payload, options) {
  return http.requestRaw('PUT', url, payload, options);
}
module.exports = http;
