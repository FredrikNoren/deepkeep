### [[[icon-host]]] Packaging & uploading a network

Let's package and upload a network that we've trained. We'll use
[torch](http://torch.ch) for this example again. Start by making sure you save
the network at the end of the training by adding this to your lua training script:

```lua
torch.save('network.t7', net) -- net is a nn.gModule here
```

Once you've run the training, you will end up with a file called `network.t7`.
This is the trained network that we will package and upload to deepkeep.
Create a file called `package.json` and add the following content to it.

```json
{
  "name": "xor",
  "version": "1.0"
}
```

Then package the files together. If you have a `README.md` file you can include
that too, and it will be displayed on the package page. All you have to do
now is package and upload the network:

```bash
zip package.1.0.zip package.json README.md network.t7
curl -u USERNAME -F "package=@package.1.0.zip" \
[[[packages-host]]]/api/v1/upload
```

And you're all done! The package can now be found on the website under
http://www.deepkeep.co/USERNAME/PACKAGENAME . See our
[xor example](https://github.com/deepkeep/xor) for a "full" example.
