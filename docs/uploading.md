### [[[icon-host]]] Packaging & uploading a network

Let's package and upload a network that we've trained. We'll use
[torch](http://torch.ch) for this example again. Start by making sure you save
the network at the end of the training by adding this to your lua training script:

```lua
torch.save('deepkeep.xor.t7', net) -- net is a nn.gModule here
```

Once you've run the training, you will end up with a file called `network.t7`.
This is the trained network that we will package and upload to deepkeep:

```bash
deepkeep push deepkeep.xor.t7
```

And you're all done! See our
[xor example](https://github.com/deepkeep/xor) for a "full" example.
