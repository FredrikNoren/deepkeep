
var React = require('react');
var classnames = require('classnames');

var P = 'app'; // style class name prefix

class App extends React.Component {
  render() {
    var profileSection = null;
    if (this.props.profileImage) {
      profileSection = <div style={{ display: 'flex' }}>
        <a href="/projects/new" className="button">+ New project</a>
        <img src={this.props.profileImage} className="profile-image" style={{ margin: 10 }} />
      </div>
    } else {
      profileSection = <a href="/auth/facebook" className="button">Login with Facebook</a>
    }
    return (<div>
        <a style={{ position: 'fixed', right: 20, bottom: 20 }} href="/reset">Reset</a>

        <div className={`${P}-header`}>
          <div className="container">
            <div className={`${P}-right`}>
              <div className={`${P}-search-input`}>
                <input type="text" placeholder="Search" />
                <i className="fa fa-search"></i>
              </div>
              {profileSection}
            </div>
            <a href="/" className={classnames({ logo: true, muted: this.props.logoMuted })}>deep<span className="logo-stack">stack</span></a>
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
    display: flex;
  }
  .${P}-search-input {
    border-bottom: 1px solid #eee;
    margin-bottom: 8px;
    display: flex;
    align-items: center;
  }
}
`

module.exports = App;
