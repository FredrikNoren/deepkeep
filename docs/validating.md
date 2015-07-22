### [[[icon-validate]]] Validating a network

You can also validate networks, which earns you a badge on the network package
page:

[[[validated-badge]]]

All you have to do is add which validators you want to run on it in the
`package.json`.

```json
{
  "name": "xor",
  "version": "1.0",
  "verifiers": [
    {
      "name": "deepkeep/xor-verify"
    }
  ]
}
```

You can also write your own verifiers. See
[xor validate](https://github.com/deepkeep/xor-validate) for an example.
