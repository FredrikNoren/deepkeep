
var React = require('react');
var Markdown = require('./Markdown.jsx');
var fs = require('fs');
var ValidatedBadge = require('./ValidatedBadge.jsx');

var P = 'home'; // style class name prefix

var gettingStartedDoc = fs.readFileSync('docs/getting-started.md', 'utf8');
var uploadingDoc = fs.readFileSync('docs/uploading.md', 'utf8');
var usingDoc = fs.readFileSync('docs/using.md', 'utf8');

class Home extends React.Component {
  render() {

    var badgeHtml = React.renderToStaticMarkup(<center><ValidatedBadge name="deepkeep/xor-validate" link="/deepkeep/xor-validate" score={0.65} /></center>);

    var markdownCustom = {
      'packages-host': this.props.packagesHost,
      'validated-badge': badgeHtml,
      'icon-getting-started': '<i class="fa fa-coffee"></i>',
      'icon-get': '<i class="fa fa-download"></i>',
      'icon-host': '<i class="fa fa-cubes"></i>',
      'icon-validate': '<i class="fa fa-check-circle-o"></i>',
    }

    return (
<section className={`${P}`}>
  <div className={`${P}-hero container`}>
    <div className="logo">deep<span className="logo-stack">keep</span></div>
    <div className={`${P}-subtitle`}>The Neural Networks Repository</div>
    <div className={`${P}-nprojects`}>
      <a href="/all">{this.props.npackages} packages available so far</a>
    </div>
  </div>

  <div className={`${P}-tutorial`}>

    <svg width="1" height="1" style={{ width: '100%', height: 40}} preserveAspectRatio="none" viewBox="0 0 1 1">
      <path d="M0 1 L1 0 L1 1 Z" fill="#ffffff" />
    </svg>

    <div className={`${P}-tutorial-inner`}>
      <div className="container">

        <div className={`${P}-docs`}>
            <Markdown doc={gettingStartedDoc} custom={markdownCustom} />
            <Markdown doc={usingDoc} custom={markdownCustom} />
            <Markdown doc={uploadingDoc} custom={markdownCustom} />
        </div>

      </div>
    </div>

    <svg width="1" height="1" style={{ width: '100%', height: 10}} preserveAspectRatio="none" viewBox="0 0 1 1">
      <path d="M0 0 L1 0 L1 1 Z" fill="#ffffff" />
    </svg>

    <div className={`${P}-about`}>
      <h3>Developing deepkeep</h3>
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
      <div><i>Chat with us on slack!</i></div>
      <script async="true" defer="true" src="http://slackin.deepkeep.co/slackin.js?large"></script>
    </div>

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
      font-size: 80px;
      display: block;
      @media (max-width: 500px) {
        & {
          font-size: 50px;
        }
      }
    }
    .${P}-subtitle {
      display: block;
      font-size: 20px;
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
  .${P}-docs {
    margin-top: 35px;
    -webkit-column-count: 2;
    -moz-column-count: 2;
    column-count: 2;
    .markdown {
      display: inline-block;
    }
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
  margin-top: 76px;
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
