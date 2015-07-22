
var React = require('react');

var P = 'validated-badge';

class ValidatedBadge extends React.Component {
  render() {
    return <div className={`${P}`}>
      <a className={`${P}-name`} href={this.props.link}>{this.props.name}</a>
      <div className={`${P}-score`}>{Math.round(this.props.score*10)/10}</div>
    </div>
  }
}
ValidatedBadge.classPrefix = P;
ValidatedBadge.styles = `
.${P} {
  border: 1px solid rgba(0, 0, 0, 0.19);
  margin-bottom: 21px;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 5px;
  margin-top: 12px;
  .${P}-name {
    color: #A3A3A3;
    display: block;
    background: rgba(0, 0, 0, 0.07);
    border-top-left-radius: 5px;
    border-top-right-radius: 5px;
    padding: 5px;
  }
  .${P}-score {
    font-size: 27px;
    font-family: 'Quicksand';
    letter-spacing: 4px;
    color: #fff;
    text-align: center;
    padding: 9px;
  }
}
`

module.exports = ValidatedBadge;
