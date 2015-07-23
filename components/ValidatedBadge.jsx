
var React = require('react');

var P = 'validated-badge';

class ValidatedBadge extends React.Component {
  render() {
    return <div className={`${P}`}>
      <div className={`${P}-score`}><i className="fa fa-check-circle-o"></i> {Math.round(this.props.score*10)/10}</div>
      <a className={`${P}-name`} href={this.props.link}>{this.props.name}</a>
    </div>
  }
}
ValidatedBadge.classPrefix = P;
ValidatedBadge.styles = `
@${P}borderRadius: 25px;
.${P} {
  background: #57E878;
  border-radius: @${P}borderRadius;
  max-width: 200px;
  color: #fff;
  padding: 13px;
  .${P}-name {
    color: #fff;
    display: block;
    text-align: center;
  }
  .${P}-score {
    font-size: 42px;
    font-weight: 900;
    font-family: 'Quicksand';
    text-align: center;
  }
}
`

module.exports = ValidatedBadge;
