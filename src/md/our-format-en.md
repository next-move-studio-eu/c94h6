## Why our format?

We believe that content should belong to the creator and the viewer – not the platform. We want to give creators modern tools that protect their audience from ads and algorithms nobody asked for.

*An hour of chess video? 20 MB – and you can style it at playback time, according to the platform and your own preferences.*

## 1. Specification

**Our format** is a very simple specification for educational content built on basic formats such as JSON and ZIP; the easiest way to see the result is to open the file in a file browser.

## 2. Extensibility

The format is **extensible**: you can introduce new block types (`type`). Readers that don’t recognise a type can ignore it or show fallback content. The specification stays simple while still allowing custom blocks.

## 3. Article package

**article.zip** contains **content.zip** with the article content. It may optionally include a **signature** part for **content** or any other data you need.
