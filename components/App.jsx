
var React = require('react');
var classnames = require('classnames');

var P = 'app'; // style class name prefix

class App extends React.Component {
  render() {
    var profileSection = null;
    if (this.props.profileName) {
      profileSection = <div>
        <a href={this.props.profileLink}>{this.props.profileName}</a>
        <a href="/logout" className="button">Logout</a>
      </div>
    } else {
      profileSection = <a href="/login" className="button">Login</a>
    }
    return (<div>
        <a style={{ position: 'fixed', right: 20, bottom: 20 }} href="/reset">Reset</a>

        <div className={`${P}-header`}>
          <div className="container">
            <div className={`${P}-right`}>
              {profileSection}
            </div>
            <a href="/" className={classnames({ logo: true, muted: this.props.logoMuted })}>deep<span className="logo-stack">stack</span></a>
            <div className={`${P}-search-input`}>
              <input type="text" placeholder="Search" />
              <i className="fa fa-search"></i>
            </div>
            <span className="page-title">{this.props.pageTitle}</span>
          </div>
        </div>
        {this.props.children}
      </div>);
  }
}
App.classPrefix = P;
App.styles = `
.${P}-header {
  border-bottom: 1px solid rgba(238, 238, 238, 0.09);
  margin-bottom: 20px;

  .logo {
    position: relative;
    top: 12px;
  }

  .${P}-right {
    float: right;
  }
  .${P}-search-input {
    display: inline-block;
    margin-left: 22px;
  }
}
`

module.exports = App;
