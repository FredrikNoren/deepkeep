
var React = require('react');
var Markdown = require('./Markdown.jsx');
var fs = require('fs');

var P = 'home'; // style class name prefix

var buildingAndPublishingDoc = fs.readFileSync('docs/building_and_publishing.md', 'utf8');
var usingDoc = fs.readFileSync('docs/using.md', 'utf8');

class Home extends React.Component {
  render() {

    var markdown = (doc) => doc.replace('[[[host]]]', this.props.host);

    return (
<section className={`${P}`}>
  <div className={`${P}-hero container`}>
    <div className="logo">deep<span className="logo-stack">keep</span></div>
    <div className={`${P}-subtitle`}>The Neural Networks Repository</div>
    <div className={`${P}-nprojects`}>
      <a href="/all">{this.props.nprojects} projects available so far</a>
    </div>
  </div>

  <div className={`${P}-tutorial`}>

    <svg width="1" height="1" style={{ width: '100%', height: 40}} preserveAspectRatio="none" viewBox="0 0 1 1">
      <path d="M0 1 L1 0 L1 1 Z" fill="#ffffff" />
    </svg>

    <div className={`${P}-tutorial-inner`}>
      <div className="container">
        <div className="row">
          <div className="six columns">
            <Markdown doc={markdown(buildingAndPublishingDoc)} />
          </div>

          <div className="six columns">
            <Markdown doc={markdown(usingDoc)} />
          </div>
        </div>

        <div className={`${P}-about`}>
          <h3>Developing DeepKeep</h3>
          <div className={`${P}-faces`}>
            <div>
              <img src="/static/noren.jpg" />
              <a href="http://github.com/FredrikNoren">Noren</a>
            </div>
            <div>
              <img src="/static/falcon.jpeg" />
              <a href="http://twitter.com/chedkid">Falcon</a>
            </div>
          </div>
        </div>
      </div>
    </div>

    <svg width="1" height="1" style={{ width: '100%', height: 10}} preserveAspectRatio="none" viewBox="0 0 1 1">
      <path d="M0 0 L1 0 L1 1 Z" fill="#ffffff" />
    </svg>

  </div>

</section>)
  }
}
Home.classPrefix = P;
Home.styles = `
.${P} {
  .${P}-hero {
    text-align: center;
    margin-bottom: 56px;
    margin-top: 57px;
    .logo {
      font-size: 60px;
      display: block;
    }
    .${P}-subtitle {
      display: block;
    }
    .${P}-nprojects {
      margin-top: 40px;
      display: block;
      text-align: center;
    }
  }
  .${P}-getting-started {
    max-width: 300px;
    margin-left: auto;
    margin-right: auto;
  }
  .${P}-column-title {
    color: #9B9B9B;
    font-size: 17px;
    margin-bottom: 14px;
    font-family: 'Open sans';
  }
  .${P}-tutorial {
    margin-bottom: 100px;
    .${P}-tutorial-inner {
      background: #ffffff;
      color: #222941;
      padding-top: 50px;
      padding-bottom: 50px;
      h4 {
        font-size: 20px;
        color: #252847;
        margin-top: 41px;
        margin-bottom: 5px;
      }
      .ace_editor {
        border: 1px solid #E0E0E0;
      }
    }
  }
}
.${P}-about {
  max-width: 500px;
  margin-left: auto;
  margin-right: auto;
  text-align: center;
  .${P}-faces {
    display: flex;
    justify-content: space-around;
    margin-bottom: 37px;
    margin-top: 45px;
    & > div {
      text-align: center;
    }
    img {
      display: block;
      width: 150px;
      height: 150px;
      border-radius: 100%;
    }
  }
}
`

module.exports = Home;
