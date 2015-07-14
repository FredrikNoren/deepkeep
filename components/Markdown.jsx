
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
    return <div dangerouslySetInnerHTML={{ __html: marked(this.props.doc, { sanitize: true }) }} />
  }
}

module.exports = Markdown;
