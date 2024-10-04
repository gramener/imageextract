# Image Extract

Image Extract is an LLM-powered tool that extracts structured data from images across various industries and functions. It analyzes images to provide detailed, industry-specific information in a user-friendly format.

## Features

- Industry-specific image analysis
- Pre-selected image templates for demonstration
- Custom image upload functionality
- Structured data extraction
- JSON export of results
- Dark mode support

## Demo

[Live Demo](https://imageextract.straive.app/)

## Setup

```shell
git clone https://github.com/gramener/imageextract.git
```

Then run any HTTP server and open `index.html`.

## Add new images

1. Add images to `img/`
2. Update [`config.json`](config.json) to add a new entry for the oimage
3. Compress images to `.webp` (e.g. using [squoosh](https://squoosh.app/))
4. Commit and push the changes

## License

[MIT](https://spdx.org/licenses/MIT.html)

## Authors

- Jaishuk Reddy <jaishuk.reddy@straive.com>
- Prudhvi Krovvidi <prudhvi.krovvidi@straive.com>
