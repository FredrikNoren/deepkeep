### [[[icon-validate]]] Validating a network

You can also validate networks, which earns you a badge on the network package
page:

[[[validated-badge]]]

All you have to do is add which validators you want to run on it in the
`package.json`, together with the validation data you want to use.

```json
{
  "name": "xor",
  "version": "1.0",
  "validators": [
    {
      "name": "deepkeep/torch-validator",
      "packages": {
        "validation-data": "deepkeep/xor-validation-data"
      }
    }
  ]
}
```

This one is using the [torch validator](https://github.com/deepkeep/torch-validator).
