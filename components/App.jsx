
var React = require('react');
var classnames = require('classnames');

var P = 'app'; // style class name prefix

class App extends React.Component {
  render() {
    var profileSection = null;
    if (this.props.profileName) {
      profileSection = <div>
        <a href={this.props.profileLink}>{this.props.profileName}</a>
        &nbsp;
        <a href="/logout" className="muted">Log out</a>
      </div>
    } else {
      profileSection = <div>
        <a href="/register" className="muted">Sign up</a>
        &nbsp;-&nbsp;
        <a href="/login" className="muted">Log in</a>
      </div>
    }
    return (<div>
        <div className={`${P}-header`}>
          <div className="container">
            <a href="/" className={classnames({ logo: true, muted: this.props.logoMuted })}>deep<span className="logo-stack">stack</span></a>
            <div className={`${P}-search`}>
              <i className="fa fa-search"></i>
              <form action='/search' method='GET'>
                <input type="text" placeholder="Search" name="q"/>
              </form>
            </div>
            <div className={`${P}-profile`}>
              {profileSection}
            </div>
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
  padding-bottom: 5px;

  form {
    margin-left: 10px;
    margin-bottom: 0;
    width: 176px;
    display: inline-block;
  }

  .logo {
    margin-right: 25px;
  }

  .${P}-search {
    display: inline-block;
    position: relative;
    width: 200px;
    input {
      width: 100%;
      padding: 0px;
      height: auto;
      font-size: 17px;
      background: transparent;
      border: 0px;
      border-radius: 0px;
      color: #fff;
    }
  }
  .${P}-profile {
    display: inline-block;
    position: absolute;
    bottom: 4px;
    right: 0px;
  }
}
`

module.exports = App;
