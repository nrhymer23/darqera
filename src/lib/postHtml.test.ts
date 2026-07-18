import { describe, expect, it } from "vitest";
import { sanitizePostHtml } from "./postHtml";

describe("sanitizePostHtml", () => {
  it("preserves the editor's supported semantic HTML", () => {
    const input = '<h2 style="text-align:center">Signal</h2><p><strong>Bold</strong> <u>underlined</u></p><ul><li>One</li></ul><blockquote>Quote</blockquote>';
    expect(sanitizePostHtml(input)).toContain('<h2 style="text-align:center">Signal</h2>');
    expect(sanitizePostHtml(input)).toContain("<u>underlined</u>");
    expect(sanitizePostHtml(input)).toContain("<blockquote>Quote</blockquote>");
  });

  it("keeps safe links and accessible public images", () => {
    const input = '<p><a href="https://example.com" target="_blank">Source</a></p><img src="https://cdn.example.com/post.webp" alt="Quantum processor" />';
    const output = sanitizePostHtml(input);
    expect(output).toContain('href="https://example.com"');
    expect(output).toContain('rel="noopener noreferrer"');
    expect(output).toContain('alt="Quantum processor"');
  });

  it("removes scripts, handlers, embeds, unsafe URLs, and images without alt text", () => {
    const input = '<script>alert(1)</script><p onclick="steal()">Safe</p><iframe src="https://bad.test"></iframe><a href="javascript:alert(1)">Bad</a><img src="https://cdn.example.com/no-alt.png">';
    const output = sanitizePostHtml(input);
    expect(output).toBe("<p>Safe</p><a>Bad</a>");
  });
});
