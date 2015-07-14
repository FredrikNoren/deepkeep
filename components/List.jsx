
var React = require('react');

var P = 'list';

class List extends React.Component {
  render() {
    return <div className="container">
      <h5>{this.props.title}</h5>
      <ul>{this.props.projects.map(project => {
        return <li key={project.url}><a href={project.url}>{project.username}/{project.projectname}</a></li>
      })}</ul>
    </div>
  }
}
List.classPrefix = P;
List.styles = `
`

module.exports = List;
