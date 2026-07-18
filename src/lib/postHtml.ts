import sanitizeHtml from "sanitize-html";

const allowedTags = [
  "p", "br", "h1", "h2", "h3", "strong", "b", "em", "i", "u", "s",
  "ul", "ol", "li", "blockquote", "a", "img",
];

export function sanitizePostHtml(input: string): string {
  return sanitizeHtml(input, {
    allowedTags,
    allowedAttributes: {
      a: ["href", "target", "rel"],
      img: ["src", "alt", "title"],
      p: ["style"], h1: ["style"], h2: ["style"], h3: ["style"],
    },
    allowedStyles: {
      "*": { "text-align": [/^left$/, /^center$/, /^right$/] },
    },
    allowedSchemes: ["http", "https"],
    allowedSchemesByTag: { img: ["https"], a: ["http", "https", "mailto"] },
    transformTags: {
      a: (_tag, attrs) => ({
        tagName: "a",
        attribs: {
          ...attrs,
          ...(attrs.target === "_blank" ? { rel: "noopener noreferrer" } : {}),
        },
      }),
    },
    exclusiveFilter: (frame) => frame.tag === "img" && !frame.attribs.alt?.trim(),
  });
}
