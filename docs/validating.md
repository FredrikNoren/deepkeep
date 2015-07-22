### Validating your network
Ok, your network is built and published. The next step is to make sure people
know exactly how good it is. You can get a "validated by" badge on your network
page, that looks like this:

[[[validated-badge]]]

All you have to do is add which validators you want to run on it in the
`package.json`.

```json
{
  "name": "xor",
  "version": "1.0",
  "model": "trained-network.t7",
  "verifiers": [
    {
      "name": "FredrikNoren/xor-verify"
    }
  ]
}
```

The verifyer itself is a docker image, that gets run when you upload this
package. You can build your own verifiers and upload them to the system as
well. Let's get started with a "xor-verifier".

First thing to do is to create the lua script that is doing the validation.
Create a file called `validator.lua` and add this:

```lua
require 'torch'
require 'nn'
require 'nngraph'

-- The network is assumed to be found inside the package at ./network.t7
local net = torch.load('./package/network.t7')

-- Normally, validation data would be something the network hasn't seen before
local validationData = {
  { x = torch.Tensor({ 0, 0 }), y = torch.Tensor({0}) },
  { x = torch.Tensor({ 0, 1 }), y = torch.Tensor({1}) },
  { x = torch.Tensor({ 1, 0 }), y = torch.Tensor({1}) },
  { x = torch.Tensor({ 1, 1 }), y = torch.Tensor({0}) },
}
local criterion = nn.MSECriterion()

-- Let's run through the validation data and compute an average error
local err = 0
for i, d in pairs(validationData) do
  err = err + criterion:forward(net:forward(d.x), d.y)
end
err = err / #validationData

-- Finally output the score of this network. The system will parse this number
-- and display it on the networks page in deepkeep.
print("## SCORE: " .. err)
```

Next let's add a tiny script that unpackages a network and runs the validator
on it. Create a file called `run.sh` and add this:

```bash
#!/usr/bin/env bash

unzip -qq /project/package.zip -d package
th /validate.lua
```

This can now be used directly locally by downloading the package you built earlier
and running this validator on it. But we want to go further than that, we want
to upload this package to deepkeep and enable anyone that wants to validate
their xor networks to use this. Let's package it up into a docker container;
create a file called `Dockerfile` and add this to it:

```
FROM kaixhin/torch

RUN luarocks install nngraph

WORKDIR /
COPY validate.lua validate.lua
COPY run.sh run.sh

CMD ["/bin/bash", "run.sh"]
```

That's all the files we need. Let's build the image:

```bash
docker build -t docker.deepkeep.co/USERNAME/xor-validate .
```

And finally push it to the deepkeep docker repository:

```bash
docker push docker.deepkeep.co/USERNAME/xor-validate
```

And you're done! This validator is now useable by anyone that wants to validate
their own networks and score them.
