
var React = require('react');
var marked = require('marked');

marked.setOptions({
  highlight: function (code, lang) {
    if (lang === undefined) return code;
    else return require('highlight.js').highlight(lang, code).value;
  }
});

class Markdown extends React.Component {
  render() {
    return <div dangerouslySetInnerHTML={{ __html: marked(this.props.doc, { sanitize: true }) }} />
  }
}

module.exports = Markdown;
