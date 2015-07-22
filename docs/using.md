### Using a published network
Create a new directory, and start with downloading and extracting the trained network we
published before:

```bash
curl -LO [[[host]]]/FredrikNoren/xor/package.zip
unzip package.zip -d xor
rm package.zip
```

Then create a file called `test.lua` and add the following to it:

```lua
require 'torch'
require 'nn'
require 'nngraph'

local T = torch.Tensor
local net = torch.load('xor/trained-network.t7')

print('0 XOR 0 = ' .. net:forward(T({ 0, 0 }))[1])
print('0 XOR 1 = ' .. net:forward(T({ 0, 1 }))[1])
print('1 XOR 0 = ' .. net:forward(T({ 1, 0 }))[1])
print('1 XOR 1 = ' .. net:forward(T({ 1, 1 }))[1])
```

And finally run the program with

```bash
th test.lua
```

If it all goes well you should see something like

```bash
0 XOR 0 = 0.022044937504424
0 XOR 1 = 0.97297107607815
1 XOR 0 = 0.97108330450396
1 XOR 1 = 0.038300505836698
```
