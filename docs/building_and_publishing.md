### Building and publishing a network
We'll build and publish a simple xor network as an example, using
[torch](http://torch.ch). Start with creating a file called `train.lua` and
add this to it:

```lua
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
{ x = torch.Tensor({ 0, 0 }), y = torch.Tensor({0}) },
{ x = torch.Tensor({ 0, 1 }), y = torch.Tensor({1}) },
{ x = torch.Tensor({ 1, 0 }), y = torch.Tensor({1}) },
{ x = torch.Tensor({ 1, 1 }), y = torch.Tensor({0}) },
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
```

Run it with

```bash
th train.lua
```

This will produce a file called `trained-network.t7`. Next we create a
file called package.json, which contains information about this trained
model. Create a file called `package.json` and add the following to it:

```json
{
"name": "xor",
"version": "1.0",
"model": "trained-network.t7"
}
```

Let's also create a `README.md` file:

```markdown
# xor

This package provides a network that can compute xor.

## Usage

__Add usage instructions here__
```

Next we package the three files up together:

```bash
zip package.1.0.zip package.json README.md trained-network.t7
```

And finally we'll upload the package to deepkeep:

```bash
curl -u USERNAME -F "package=@package.1.0.zip" \\
[[[host]]]/api/v1/upload
```

Done!
