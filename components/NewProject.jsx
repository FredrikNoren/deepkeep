
var React = require('react');

var P = 'new-project';

class User extends React.Component {
  render() {
    return (<section className={`${P} container`}>
      <form method="POST" action="/projects/new">
      <p>Project Name: <input type="text" name="name" /></p>
      <p><input type="submit" value="Create project" /></p>
      </form>
    </section>)
  }
}
User.classPrefix = P;

module.exports = User;
