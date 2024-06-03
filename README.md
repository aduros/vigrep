# vigrep

`vigrep` is like `grep` but for images, filtering images using a query and [GPT-4o Vision](https://platform.openai.com/docs/guides/vision).

> Status: Alpha ⚡

## Features

- Visually scan for images using a natural language query.
- Simple grep-compatible interface. If you've ever used `grep -l`, you already know how to use `vigrep`.
- Low-ish cost. Uses about 180 tokens per image depending on the length of your query, costing about a dollar per 1100 images processed at the time of this writing.

## Installing

1. Run `npm install -g vigrep@latest` to install.
2. Make sure you have an `$OPENAI_API_KEY` environment variable which you can [generate
here](https://platform.openai.com/account/api-keys).

## Example

In this example we have a directory full of photos and we want to print the
files containing cats to stdout:

```shell
vigrep 'has a cat' *.jpg
```

Similar to grep, we can use `-L` to print only the files that do NOT match the
query. You can also do the usual piping tricks in combination with other
commands like `xargs`. For example, to delete all the files that don't contain
cats:

```shell
vigrep -L 'has a cat' *.jpg | xargs rm
```

...or more technically correct, handling any weird file names:

```shell
vigrep -L --null 'has a cat' -- *.jpg | xargs -0 rm
```

To see all options, run `vigrep --help`.

## Disclaimers

Vigrep sends all the files you pass it to OpenAI! Don't use it on sensitive images.

See OpenAI's documentation about [Vision limitations](https://platform.openai.com/docs/guides/vision/limitations).
