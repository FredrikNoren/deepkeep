
var React = require('react');
var Markdown = require('./Markdown.jsx');
var fs = require('fs');
var ValidatedBadge = require('./ValidatedBadge.jsx');

var P = 'home'; // style class name prefix

var gettingStartedDoc = fs.readFileSync('docs/getting-started.md', 'utf8');
var uploadingDoc = fs.readFileSync('docs/uploading.md', 'utf8');
var usingDoc = fs.readFileSync('docs/using.md', 'utf8');
var validatingDoc = fs.readFileSync('docs/validating.md', 'utf8');

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
      <a href="/all">{this.props.nprojects} projects available so far</a>
    </div>
  </div>

  <div className={`${P}-tutorial`}>

    <svg width="1" height="1" style={{ width: '100%', height: 40}} preserveAspectRatio="none" viewBox="0 0 1 1">
      <path d="M0 1 L1 0 L1 1 Z" fill="#ffffff" />
    </svg>

    <div className={`${P}-tutorial-inner`}>
      <div className="container">
        <div className={`${P}-features`}>
          <div className="row">
            <div className={`${P}-feature four columns`}>
              <div className={`${P}-feature-icon`}><i className="fa fa-download"></i></div>
              <div className={`${P}-feature-title`}>Get</div>
              <div><div className={`${P}-feature-online`}><i className="fa fa-check"></i> Online</div></div>
              Download community supplied neural networks, trained and ready to be
              used in your application.
            </div>
            <div className={`${P}-feature four columns`}>
              <div className={`${P}-feature-icon`}><i className="fa fa-cubes"></i></div>
              <div className={`${P}-feature-title`}>Host</div>
              <div><div className={`${P}-feature-online`}><i className="fa fa-check"></i> Online</div></div>
              Package up and host your trained neural networks on deepkeep.
            </div>
            <div className={`${P}-feature four columns`}>
              <div className={`${P}-feature-icon`}><i className="fa fa-check-circle-o"></i></div>
              <div className={`${P}-feature-title`}>Validate</div>
              <div><div className={`${P}-feature-online`}><i className="fa fa-check"></i> Online</div></div>
              Validate your trained networks through community supplied
              independent validators.
            </div>
          </div>
          <div className="row">
            <div className={`${P}-feature four columns`}>
              <div className={`${P}-feature-icon`}><i className="fa fa-exchange"></i></div>
              <div className={`${P}-feature-title`}>Marketplace</div>
              <div><div className={`${P}-feature-in-progress`}><i className="fa fa-circle-o-notch"></i> In progress</div></div>
              Buy and sell trained neural networks.
            </div>
            <div className={`${P}-feature four columns`}>
              <div className={`${P}-feature-icon`}><i className="fa fa-code-fork"></i></div>
              <div className={`${P}-feature-title`}>Extend</div>
              <div><div className={`${P}-feature-in-progress`}><i className="fa fa-circle-o-notch"></i> In progress</div></div>
              Start off your training on a pre-trained network, or combine
              several trained networks for better performance.
            </div>
            <div className={`${P}-feature four columns`}>
              <div className={`${P}-feature-icon`}><i className="fa fa-database"></i></div>
              <div className={`${P}-feature-title`}>Datasets</div>
              <div><div className={`${P}-feature-in-progress`}><i className="fa fa-circle-o-notch"></i> In progress</div></div>
              Access and host large datasets for training and validation.
            </div>
          </div>
        </div>
        <div className={`${P}-docs`}>
            <Markdown doc={gettingStartedDoc} custom={markdownCustom} />
            <Markdown doc={usingDoc} custom={markdownCustom} />
            <Markdown doc={uploadingDoc} custom={markdownCustom} />
            <Markdown doc={validatingDoc} custom={markdownCustom} />
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
  .${P}-features {
    margin-bottom: 106px;
    margin-top: 37px;
    .${P}-feature {
      text-align: center;
      margin-top: 50px;
      margin-bottom: 50px;
      .${P}-feature-icon {
        font-size: 90px;
      }
      .${P}-feature-title {
        font-size: 20px;
      }
      .${P}-feature-online, .${P}-feature-in-progress {
        display: inline-block;
        color: #fff;
        padding: 3px;
        padding-left: 10px;
        padding-right: 10px;
        border-radius: 20px;
        font-size: 12px;
      }
      .${P}-feature-online {
        background: #85dd83;
      }
      .${P}-feature-in-progress {
        background: #C8C8C8;
      }
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
