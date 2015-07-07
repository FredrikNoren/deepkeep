
var React = require('react');
var moment = require('moment');

var P = 'home'; // style class name prefix

class AceHighlight extends React.Component {
    componentDidMount() {
      var editor = ace.edit(React.findDOMNode(this.refs.editor));
      editor.setTheme('ace/theme/monokai');
      editor.setOptions({
          maxLines: Infinity
      });
      editor.getSession().setMode(this.props.mode);
      editor.getSession().setTabSize(2);
      //editor.setReadOnly(true);
      editor.setHighlightActiveLine(false);
      editor.setShowPrintMargin(false);
      editor.setValue(this.props.code, 1);
      editor.resize();
      editor.blur();
    }
    render() {
      return <div ref="editor" />;
    }
}

class Home extends React.Component {
  render() {
    return (
<section className={`${P}`}>
  <div className={`${P}-hero container`}>
    <div className="logo">deep<span className="logo-stack">stack</span></div>
    <div className={`${P}-subtitle`}>The Neural Network Package Manager</div>
  </div>

  <div className={`${P}-tutorial`}>

    <svg width="1" height="1" style={{ width: '100%', height: 40}} preserveAspectRatio="none" viewBox="0 0 1 1">
      <path d="M0 1 L1 0 L1 1 Z" fill="#ffffff" />
    </svg>

    <div className={`${P}-tutorial-inner`}>
      <div className="row container">
        <div className="six columns">
          <h4>Building and publishing a network</h4>
          We'll build a simple xor network as an example. Start with creating a file
          called train.lua and add this to it:
          <AceHighlight mode="ace/mode/lua" code={
`require 'torch'
require 'nn'
require 'nngraph'

-- First let's define our network
local node_x = nn.Linear(2, 3)()
local node_y = nn.Linear(3, 1)(nn.Tanh()(node_x))
local net = nn.gModule({ node_x }, { node_y })

-- Then some trainging data that we will use to train
-- this model
local trainingData = {
  { x = torch.Tensor({ 0, 0 }), y = torch.Tensor({1}) },
  { x = torch.Tensor({ 0, 1 }), y = torch.Tensor({0}) },
  { x = torch.Tensor({ 1, 0 }), y = torch.Tensor({0}) },
  { x = torch.Tensor({ 1, 1 }), y = torch.Tensor({1}) },
}
local criterion = nn.MSECriterion()

-- Ok, let's train it!
local err = 1
while err > 0.001 do
  err = 0
  for i, d in pairs(trainingData) do
    err = err + criterion:forward(net:forward(d.x), d.y)
    net:zeroGradParameters()
    net:backward(input,
      criterion:backward(net.output, d.y))
    net:updateParameters(0.01)
  end
  err = err / #trainingData
  print("Training... Current network error: " .. err)
end

-- And finally, we save it to disk
torch.save('trained-network', net)
`} />
          Run it with
          <pre className="shell" dangerouslySetInnerHTML={{__html:
          `th train.lua`
          }} />
          This will produce a file called "trained-network". You can now upload the
          trained network to deepstack with the following command:
          <pre className="shell" dangerouslySetInnerHTML={{__html:
          `curl -u USERNAME -F "network=@trained-network" localhost:8080/api/v1/upload`
          }} />
        </div>

        <div className="six columns">
          <h4>Use a published network</h4>
          Create a new directory, and start with downloading the trained network we
          published before:
          <pre className="shell" dangerouslySetInnerHTML={{__html:
          `curl -o net localhost:8080/FredrikNoren/xor/network`
          }} />
          Then create a file called "test.lua" and add the following to it:
          <AceHighlight mode="ace/mode/lua" code={
`require 'torch'
require 'nn'
require 'nngraph'

local net = torch.load('net')

local verificationData = {
  { x = torch.Tensor({ 0, 0 }), y = torch.Tensor({1}) },
  { x = torch.Tensor({ 0, 1 }), y = torch.Tensor({0}) },
  { x = torch.Tensor({ 1, 0 }), y = torch.Tensor({0}) },
  { x = torch.Tensor({ 1, 1 }), y = torch.Tensor({1}) },
}

for i, d in pairs(verificationData) do
  local x = torch.Tensor(d.x)
  local yp = net:forward(x)
  print(d.x[1] .. ' xor ' .. d.x[2] .. ' should be '
    .. d.y[1] .. ' and the network predicted ' .. yp[1])
end
`} />
        And finally run the program with
        <pre className="shell" dangerouslySetInnerHTML={{__html:
        `th test.lua`
        }} />
        If it all goes well you should see something like
        <pre className="shell" dangerouslySetInnerHTML={{__html:
`0 xor 0 should be 1 and the network predicted 0.98036088910045
0 xor 1 should be 0 and the network predicted 0.0224844273406
1 xor 0 should be 0 and the network predicted 0.034108989627501
1 xor 1 should be 1 and the network predicted 0.9622292930384`
        }} />
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
  h4 {
    font-size: 20px;
    color: #3F3F3F;
    margin-top: 41px;
    margin-bottom: 5px;
  }
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
      color: #3F3F3F;
    }
  }
}

pre.shell {
  background: #282828;
  padding: 10px;
  color: #E2E2E2;
}
`

module.exports = Home;
