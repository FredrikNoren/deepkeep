
var React = require('react');

var P = 'user';

class User extends React.Component {
  render() {
    return (<section className={`${P} container`}>
      <b>Projects:</b>
      <ul>{this.props.projects.map(project => {
        return <li><a href={project.url}>{project.name}</a></li>
      })}</ul>
    </section>)
  }
}
User.classPrefix = P;

module.exports = User;
