
var React = require('react');
var http = require('../client/http');
var marked = require('marked');

var P = 'project';

class Project extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      uploadState: null
    }
  }
  fileChanged() {
    this.setState({ uploadState: 'Uploading...' });
    var file = React.findDOMNode(this.refs.file).files[0];
    http.get('/' + encodeURIComponent(this.props.username) + '/' + encodeURIComponent(this.props.project) + '/newupload?file_type=' + encodeURIComponent(file.type))
      .then(res => {
        var headers = {};
        headers['x-amz-acl'] = 'public-read';
        return http.putRaw(res.signedRequest, file, { headers: headers }).then(() => {
          this.setState({ uploadState: 'Uploaded' });
        });
      });
  }
  render() {
    var readmeHtml = marked(this.props.readme);
    return (<section className={`${P} container`}>
      <div className={`${P}-header`}>
        <i className="fa fa-cube"></i>
        <a href={'/' + this.props.username} className={`${P}-username muted`}>{this.props.username}</a>
        /
        <a href={'/' + this.props.username + '/' + this.props.project} className={`${P}-project`}>{this.props.project}</a>
      </div>
      <div className="row">
        <div className="ten columns">
          <p>
            <a className="button" href={this.props.downloadPath}>Download model version {this.props.version}</a>
          </p>
          <div className={`${P}-readme-title`}>README</div>
          <div className={`${P}-readme`} dangerouslySetInnerHTML={{__html: readmeHtml }} />
        </div>
        <div className="two columns">
          <b>Versions</b>
          {this.props.versions.map(version => {
            var p = <a href={version.url}>{version.name}</a>;
            if (this.props.version == version.name) {
              p = <b>{p}</b>
            }
            return <div>{p}</div>
          })}
        </div>
      </div>
    </section>)
  }
}
Project.classPrefix = P;
Project.styles = `
.${P}-header {
  font-size: 20px;
  .${P}-username {
    margin-left: 10px;
    margin-right: 10px;
  }
  .${P}-project {
    margin-left: 10px;
  }
}
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
.${P}-readme {
  background: rgba(0, 0, 0, 0.06);
  padding: 10px;
  border: 1px solid rgba(255, 255, 255, 0.09);
  border-bottom-left-radius: 5px;
  border-bottom-right-radius: 5px;
}
`

module.exports = Project;
