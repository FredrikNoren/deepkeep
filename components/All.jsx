
var React = require('react');
var http = require('../client/http');
var marked = require('marked');

var P = 'all';

class All extends React.Component {
  render() {
    return <div className="container">
      <ul>{this.props.projects.map(project => {
        return <li><a href={project.url}>{project.username}/{project.projectname}</a></li>
      })}</ul>
    </div>
  }
}
All.classPrefix = P;
All.styles = `
`

module.exports = All;
