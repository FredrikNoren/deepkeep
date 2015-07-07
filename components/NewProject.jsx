
var React = require('react');

var P = 'new-project';

class NewProject extends React.Component {
  render() {
    return (<section className={`${P} container`}>
      <form method="POST" action="/projects/new">
      <p>Project Name: <input type="text" name="name" /></p>
      <p><input type="submit" value="Create project" /></p>
      </form>
    </section>)
  }
}
NewProject.classPrefix = P;

module.exports = NewProject;
