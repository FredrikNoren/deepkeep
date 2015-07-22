
var React = require('react');
var marked = require('marked');

var hljs = require('highlight.js/lib/highlight.js');

hljs.registerLanguage('bash', require('highlight.js/lib/languages/bash'));
hljs.registerLanguage('javascript', require('highlight.js/lib/languages/javascript'));
hljs.registerLanguage('json', require('highlight.js/lib/languages/json'));
hljs.registerLanguage('lua', require('highlight.js/lib/languages/lua'));
hljs.registerLanguage('markdown', require('highlight.js/lib/languages/markdown'));

marked.setOptions({
  highlight: function (code, lang) {
    if (lang === undefined) return code;
    else return hljs.highlight(lang, code).value;
  }
});

class Markdown extends React.Component {
  render() {
    var html =  marked(this.props.doc, { sanitize: true });
    if (this.props.custom) {
      Object.keys(this.props.custom).forEach(key => {
        html = html.replace('[[[' + key + ']]]', this.props.custom[key]);
      });
    }
    return <div dangerouslySetInnerHTML={{ __html: html }} />
  }
}

module.exports = Markdown;
