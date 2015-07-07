
var React = require('react');

var P = 'user';

class User extends React.Component {
  render() {
    return (<section className={`${P} container`}>
      {this.props.projects.map(project => {
        return <div>{project.name}</div>
      })}
    </section>)
  }
}
User.classPrefix = P;

module.exports = User;
