
var React = require('react');

var P = 'error';

class Error extends React.Component {
  render() {
    return (
      <section className={`${P} container`}>
        <h5>deepkeep hasn't learned about this page yet!</h5>
        <h5>{this.props.message}</h5>
      </section>
    )
  }
}
Error.classPrefix = P;
Error.styles = `
.${P} {
  text-align: center;
}
`

module.exports = Error;
