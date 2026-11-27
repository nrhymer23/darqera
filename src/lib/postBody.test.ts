import { describe, expect, it } from "vitest";
import { wrapBeats } from "./postBody";

describe("wrapBeats", () => {
  it("numbers known beat headings in order", () => {
    const out = wrapBeats("<h2>What happened</h2><p>a</p><h2>What it means</h2><p>b</p>");
    expect(out).toContain('<h2 class="beat-h"><span class="beat-n">01</span> What happened</h2>');
    expect(out).toContain('<span class="beat-n">02</span> What it means');
  });

  it("matches curly apostrophes and entities", () => {
    expect(wrapBeats("<h2>What&rsquo;s happening</h2>")).toContain("beat-n");
    expect(wrapBeats("<h3>What’s happening</h3>")).toContain("beat-n");
  });

  it("wraps the Not confirmed yet section up to the next heading", () => {
    const out = wrapBeats("<h2>Not confirmed yet</h2><p>x</p><h2>What to watch</h2><p>y</p>");
    expect(out).toMatch(/<aside class="beat-unconfirmed"><p class="beat-h">Not confirmed yet<\/p><p>x<\/p><\/aside>/);
    expect(out).toContain('<span class="beat-n">01</span> What to watch');
  });

  it("leaves other headings and plain posts alone", () => {
    const html = "<h2>Some other heading</h2><p>z</p>";
    expect(wrapBeats(html)).toBe(html);
  });
});
