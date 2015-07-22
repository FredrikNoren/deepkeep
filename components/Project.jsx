
var React = require('react');
var http = require('../client/http');
var Markdown = require('./Markdown.jsx');
var ValidatedBadge = require('./ValidatedBadge.jsx');

var P = 'project';

class Project extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      uploadState: null
    }
  }
  copyInstall() {
    var copyTextarea = React.findDOMNode(this.refs.installInput);
    copyTextarea.select();
    try {
      document.execCommand('copy');
    } catch (err) {
    }
  }
  render() {
    return (<section className={`${P} container`}>
      <div className={`${P}-header`}>
        <i className="fa fa-cube"></i>
        <a href={'/' + this.props.username} className={`${P}-username muted`}>{this.props.username}</a>
        /
        <a href={'/' + this.props.username + '/' + this.props.project} className={`${P}-project`}>{this.props.project}</a>
      </div>
      <div className="row">
        <div className="nine columns">
          <div className={`${P}-readme`}>
            <div className={`${P}-readme-title`}>README</div>

            <div className={`${P}-readme-content invert-highlightjs`}>
              <Markdown doc={this.props.readme} />
            </div>
          </div>
        </div>
        <div className="three columns">
          <div className={`${P}-sidebar-item`}>
            <b>Install</b>
            <div className={`${P}-install`}>
              <input type="text" ref="installInput" value={`curl -LO ${this.props.host}/${this.props.username}/${this.props.project}/package.zip && unzip package.zip -d ${this.props.project} && rm package.zip`} readOnly/>
              <a className={`${P}-copy`} onClick={this.copyInstall.bind(this)}>
                <i className="fa fa-clipboard"/>
              </a>
            </div>
          </div>
          <div className={`${P}-sidebar-item`}>
            <b>Versions</b>
            {this.props.versions.map(version => {
              var p = <a href={version.url}>{version.name}</a>;
              if (this.props.version == version.name) {
                p = <b>{p}</b>
              }
              return <div key={version.name}>{p}</div>
            })}
          </div>
          <div className={`${P}-sidebar-item`}>
            <b>Download</b>
            <div><a href={this.props.downloadPath}><i className="fa fa-download"/> Download version {this.props.version}</a></div>
          </div>
          <div className={`${P}-sidebar-item`}>
            <b>Validated by</b>
              {this.props.validations.map(validation => {
                return <ValidatedBadge name={validation.verificationname}
                  link={'/' + validation.verificationname}
                  score={validation.status} />
              })}
          </div>
        </div>
      </div>
    </section>)
  }
}
Project.classPrefix = P;
Project.styles = `
.${P}-header {
  font-size: 20px;
  margin-bottom: 22px;
  .${P}-username {
    margin-left: 10px;
    margin-right: 10px;
  }
  .${P}-project {
    margin-left: 10px;
  }
}
.${P}-sidebar-item {
  margin-bottom: 10px;
}
.${P}-install {
  background: rgba(0, 0, 0, 0.17);
  position: relative;
  input {
    height: auto;
    width: 100%;
    background: transparent;
    border: 1px solid transparent;
    border-radius: 0;
    color: #eee;
    font-family: monospace;
    padding-right: 29px;
  }
  .${P}-copy {
    position: absolute;
    right: 7px;
    top: 6px;
  }
}
.${P}-readme {
  margin-bottom: 30px;
  .${P}-readme-title {
    background: rgba(0, 0, 0, 0.08);
    font-size: 11px;
    color: rgba(255, 255, 255, 0.18);
    padding: 5px;
    border: 1px solid rgba(255, 255, 255, 0.16);
    border-bottom: 0px;
    border-top-left-radius: 5px;
    border-top-right-radius: 5px;
  }
  .${P}-readme-content {
    background: rgba(0, 0, 0, 0.06);
    padding: 10px;
    border: 1px solid rgba(255, 255, 255, 0.09);
    border-bottom-left-radius: 5px;
    border-bottom-right-radius: 5px;
  }
}
`

module.exports = Project;
