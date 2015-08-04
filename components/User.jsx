
var React = require('react');

var P = 'user';

class User extends React.Component {
  render() {
    return (<section className={`${P} container`}>
      <p className={`${P}-header`}>
        <i className="fa fa-user"></i>
        <a href={'/' + this.props.username} className={`${P}-username`}>{this.props.username}</a>
      </p>
      <b>Packages</b>
      <ul>{this.props.packages.map(item => {
        return <li><a href={item.url}>{item.package}</a></li>
      })}</ul>
    </section>)
  }
}
User.classPrefix = P;
User.styles = `
.${P}-header {
  font-size: 20px;
  .${P}-username {
    margin-left: 10px;
  }
}
`

module.exports = User;
