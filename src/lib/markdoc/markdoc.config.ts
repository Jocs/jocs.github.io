import Markdoc from "@markdoc/markdoc";
import type { Config } from "@markdoc/markdoc";

const { nodes, Tag } = Markdoc;

/*
  Markdoc is a great tool to author content in Markdown.
  It supports all default markdown syntax and allows you 
  to configure and use custom syntax to render your own
  components. 

  This is how it works —
  1. It takes a config (this file)
  2. It parses the content (markdown)
  3. It generates a tree-like data structure of content
  4. We render the tree in Astro pages using astro-markdoc-renderer package
*/

/* 
  Markdoc config goes here. 
  https://markdoc.dev/docs/config 
  
  - If you want to support a custom element, just 
    add it config.tags (Eg. youtube). Once added here,
    you can use the custom component syntax in markdown files.
    Once added here, you can add an Astro component for it in
    `Renderer.astro` file. Check `YouTubeEmbed` for an example.

  - By default, the default markdown tags are automatically rendered
    in default html elements. Eg. # is rendered in <h1>, and paragraphs
    are rendered in <p>. If you want to customize how default markdown 
    elements are rendered, add a config for the element to `config.nodes`.
    This is not easy but we have already done it for headings so
    you can copy paste the code from nodes.heading into whichever tag you
    want to customize (Eg. paragraph). Once added here, add an Astro component
    for it in `Renderer.astro` file. Check `heading` for an example.
*/
export const config: Config = {
  tags: {
    details: {
      render: "details",
      children: nodes.document.children,
    },
    summary: {
      render: "summary",
      children: nodes.document.children,
    },
    sup: {
      render: "sup",
      children: nodes.strong.children,
    },
    sub: {
      render: "sub",
      children: nodes.strong.children,
    },
    abbr: {
      render: "abbr",
      attributes: {
        title: { type: String },
      },
      children: nodes.strong.children,
    },
    kbd: {
      render: "kbd",
      children: nodes.strong.children,
    },
    mark: {
      render: "mark",
      children: nodes.strong.children,
    },
    youtube: {
      render: "YouTubeEmbed",
      attributes: {
        url: { type: String, required: true },
        label: { type: String, required: true },
      },
      selfClosing: true,
    },
    tweet: {
      render: "TweetEmbed",
      attributes: {
        url: { type: String, required: true },
      },
      selfClosing: true,
    },
    codepen: {
      render: "CodePenEmbed",
      attributes: {
        url: { type: String, required: true },
        title: { type: String, required: true },
      },
      selfClosing: true,
    },
    githubgist: {
      render: "GitHubGistEmbed",
      attributes: {
        id: { type: String, required: true },
      },
      selfClosing: true,
    },
  },
  nodes: {
    heading: {
      render: "Heading",
      attributes: {
        level: { type: Number, required: true },
      },
      transform(node, config) {
        const attributes = node.transformAttributes(config);
        const children = node.transformChildren(config);
        return new Tag(this.render, { ...attributes }, children);
      },
    },
    // if you want to customise default tags, this is where you'd do it
    // after adding the code here, add an Astro component for this node
    // in Renderer.astro component
    // paragraph: {
    //   render: "paragraph",
    //   transform(node, config) {
    //     const attributes = node.transformAttributes(config);
    //     const children = node.transformChildren(config);
    //     return new Tag(this.render, { ...attributes }, children);
    //   },
    // },
    fence: {
      render: "CodeBlock",
      attributes: {
        content: { type: String, render: false, required: true },
        language: { type: String, default: "typescript" },
        // process determines whether or not markdoc processes tags inside the content of the code block
        process: { type: Boolean, render: false, default: false },
      },
      transform(node, config) {
        const attributes = node.transformAttributes(config);
        const children = node.transformChildren(config);
        if (children.some((child) => typeof child !== "string")) {
          throw new Error(
            `unexpected non-string child of code block from ${
              node.location?.file ?? "(unknown file)"
            }:${node.location?.start.line ?? "(unknown line)"}`
          );
        }
        return new Tag(
          this.render,
          { ...attributes, content: children.join("") },
          []
        );
      },
    },
  },
};
