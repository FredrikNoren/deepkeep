
var React = require('react');

var P = 'list';

class List extends React.Component {
  render() {
    return <div className="container">
      <h5>{this.props.title}</h5>
      <ul>{this.props.packages.map(item => {
        return <li key={item.url}><a href={item.url}>{item.username}/{item.package}</a></li>
      })}</ul>
    </div>
  }
}
List.classPrefix = P;
List.styles = `
`

module.exports = List;
