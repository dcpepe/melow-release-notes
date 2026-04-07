export interface Section {
  id: string;
  heading: string;
  body: string;
  media?: {
    type: "Video" | "Gif" | "Screenshot";
    src: string;
    caption?: string;
  };
  mediaSuggestion?: string;
  sourceUrl?: string;
}

let sectionCounter = 0;

function generateId(): string {
  return `s_${Date.now()}_${sectionCounter++}`;
}

export function parseSections(mdxContent: string): Section[] {
  const sections: Section[] = [];
  const lines = mdxContent.split("\n");

  let currentHeading = "";
  let currentBodyLines: string[] = [];
  let currentMedia: Section["media"] | undefined;
  let currentMediaSuggestion: string | undefined;
  let currentSourceUrl: string | undefined;

  function flush() {
    if (currentHeading || currentBodyLines.length > 0) {
      sections.push({
        id: generateId(),
        heading: currentHeading,
        body: currentBodyLines.join("\n").trim(),
        media: currentMedia,
        mediaSuggestion: currentMediaSuggestion,
        sourceUrl: currentSourceUrl,
      });
    }
    currentHeading = "";
    currentBodyLines = [];
    currentMedia = undefined;
    currentMediaSuggestion = undefined;
    currentSourceUrl = undefined;
  }

  for (const line of lines) {
    // Match ## headings
    const headingMatch = line.match(/^## (.+)$/);
    if (headingMatch) {
      flush();
      currentHeading = headingMatch[1];
      continue;
    }

    // Match media components
    const mediaMatch = line.match(
      /^<(Video|Gif|Screenshot)\s+src="([^"]+)"(?:\s+caption="([^"]*)")?\s*\/>/
    );
    if (mediaMatch) {
      currentMedia = {
        type: mediaMatch[1] as "Video" | "Gif" | "Screenshot",
        src: mediaMatch[2],
        caption: mediaMatch[3] || undefined,
      };
      continue;
    }

    // Match media suggestion comments
    const suggestionMatch = line.match(
      /^\{\/\*\s*Media suggestion:\s*(.+?)\s*\*\/\}$/
    );
    if (suggestionMatch) {
      currentMediaSuggestion = suggestionMatch[1];
      continue;
    }

    // Match source URL comments
    const sourceMatch = line.match(
      /^\{\/\*\s*Source:\s*(.+?)\s*\*\/\}$/
    );
    if (sourceMatch) {
      currentSourceUrl = sourceMatch[1];
      continue;
    }

    currentBodyLines.push(line);
  }

  flush();

  return sections;
}

export function serializeSections(sections: Section[]): string {
  const parts: string[] = [];

  for (const section of sections) {
    if (section.heading) {
      parts.push(`## ${section.heading}`);
      parts.push("");
    }

    if (section.body.trim()) {
      parts.push(section.body.trim());
      parts.push("");
    }

    if (section.media) {
      const captionAttr = section.media.caption
        ? ` caption="${section.media.caption}"`
        : "";
      parts.push(
        `<${section.media.type} src="${section.media.src}"${captionAttr} />`
      );
      parts.push("");
    }
  }

  return parts.join("\n").trim() + "\n";
}
