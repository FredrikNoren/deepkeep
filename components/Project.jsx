
var React = require('react');

var P = 'project';

class Project extends React.Component {
  render() {
    return (<section className={`${P} container`}>
      <h1>{this.props.name}</h1>
      <form method="POST" action={'/' + this.props.username + '/' + this.props.project + '/newmodel'}>
        Model: <input type="file" name="model"/>
        <input type="submit" value="Upload model" />
      </form>
    </section>)
  }
}
Project.classPrefix = P;

module.exports = Project;
