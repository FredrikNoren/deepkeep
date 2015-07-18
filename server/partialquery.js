
var merge = require('merge');

module.exports = PartialQuery;

function PartialQuery(sql, params) {
  this.sql = sql;
  this.params = params || {};
}
PartialQuery.prototype.bindParams = function(params) {
  return new PartialQuery(this.sql, merge(this.params, params));
}
PartialQuery.prototype.toQuery = function(params, values) {
  if (values === undefined) values = [];
  var localParams = merge(this.params, params);
  var sql = this.sql.replace(/\$\[.*\]/g, function(param) {
    param = param.substring(2, param.length - 1);
    var p = localParams[param];
    if (p instanceof PartialQuery) {
      return p.toQuery(params, values).text;
    } else {
      values.push(p);
      return '$' + values.length;
    }
  }.bind(this));
  return { text: sql, values: values };
}
