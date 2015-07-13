
var React = require('react');
var Markdown = require('./Markdown.jsx');

var P = 'home'; // style class name prefix

class Home extends React.Component {
  render() {

    var buildingAndPublishingDoc = `
### Building and publishing a network
We'll build a simple xor network as an example. Start with creating a file
called \`train.lua\` and add this to it:

\`\`\`lua
require 'torch'
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
torch.save('trained-network.t7', net)
\`\`\`

Run it with

\`\`\`bash
th train.lua
\`\`\`

This will produce a file called \`trained-network.t7\`. Next we create a
file called package.json, which contains information about this trained
model. Create a file called \`package.json\` and add the following to it:

\`\`\`json
{
"name": "xor",
"version": "1.0",
"model": "trained-network.t7"
}
\`\`\`

Let's also create a \`README.md\` file:

\`\`\`markdown
# xor

This package provides a network that can compute xor.

## Usage

__Add usage instructions here__
\`\`\`

Next we package the three files up together:

\`\`\`bash
zip package.1.0.zip package.json README.md trained-network.t7
\`\`\`

And finally we'll upload the package to deepkeep:

\`\`\`bash
curl -u USERNAME -F "package=@package.1.0.zip" \\
${this.props.host}/api/v1/upload
\`\`\`

Done!
`

var usingDoc = `
### Using a published network
Create a new directory, and start with downloading and extracting the trained network we
published before:

\`\`\`bash
curl -LO ${this.props.host}/FredrikNoren/xor/package.zip
unzip package.zip -d xor
rm package.zip
\`\`\`

Then create a file called \`test.lua\` and add the following to it:

\`\`\`lua
require 'torch'
require 'nn'
require 'nngraph'

local T = torch.Tensor
local net = torch.load('xor/trained-network.t7')

print('0 XOR 0 = ' .. net:forward(T({ 0, 0 }))[1])
print('0 XOR 1 = ' .. net:forward(T({ 0, 1 }))[1])
print('1 XOR 0 = ' .. net:forward(T({ 1, 0 }))[1])
print('1 XOR 1 = ' .. net:forward(T({ 1, 1 }))[1])
\`\`\`

And finally run the program with

\`\`\`bash
th test.lua
\`\`\`

If it all goes well you should see something like

\`\`\`bash
0 XOR 0 = 0.96583262167758
0 XOR 1 = 0.03089587853588
1 XOR 0 = 0.034721669536198
1 XOR 1 = 0.98168738186416
\`\`\`
`

    return (
<section className={`${P}`}>
  <div className={`${P}-hero container`}>
    <div className="logo">deep<span className="logo-stack">keep</span></div>
    <div className={`${P}-subtitle`}>The Neural Networks Repository</div>
    <a href="/all" className={`${P}-nprojects`}>{this.props.nprojects} projects available so far</a>
  </div>

  <div className={`${P}-tutorial`}>

    <svg width="1" height="1" style={{ width: '100%', height: 40}} preserveAspectRatio="none" viewBox="0 0 1 1">
      <path d="M0 1 L1 0 L1 1 Z" fill="#ffffff" />
    </svg>

    <div className={`${P}-tutorial-inner`}>
      <div className="row container">
        <div className="six columns">
          <Markdown doc={buildingAndPublishingDoc} />
        </div>

        <div className="six columns">
          <Markdown doc={usingDoc} />
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

pre.shell {
  background: #343434;
  padding: 10px;
  color: #E2E2E2;
  margin: 0px;
}
`

module.exports = Home;
