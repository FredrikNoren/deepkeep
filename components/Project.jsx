
var React = require('react');
var http = require('../client/http');

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
    return (<section className={`${P} container`}>
      <h1>{this.props.name}</h1>
      Upload new model: <input type="file" ref="file" onChange={this.fileChanged.bind(this)}/>{this.state.uploadState}
      <p>
        <a className="button" href={this.props.modelFilePath}>Download model</a>
      </p>
    </section>)
  }
}
Project.classPrefix = P;

module.exports = Project;
