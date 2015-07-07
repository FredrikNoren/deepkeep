
var React = require('react');

var P = 'project';

class Project extends React.Component {
  render() {
    return (<section className={`${P} container`}>
      <h1>{this.props.name}</h1>
    </section>)
  }
}
Project.classPrefix = P;

module.exports = Project;
