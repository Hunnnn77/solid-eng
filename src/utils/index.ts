function getYoutubeUrl(id: string) {
  return `https://www.youtube.com/watch?v=${id}`;
}

async function getCaptionsUrl(videoId: string) {
  const res = await fetch(`https://www.youtube.com/watch?v=${videoId}`);
  const html = await res.text();

  const match = html.match(/"captionTracks":(\[.*?\])/);
  if (!match) return null;

  const captionTracks = JSON.parse(match[1]);
  return captionTracks[0].baseUrl;
}

async function getTranscript(videoId: string) {
  const url = await getCaptionsUrl(videoId);
  if (!url) return null;

  const res = await fetch(url);
  const xml = await res.text();
  console.log(xml);

  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xml, "text/xml");

  const texts = [...xmlDoc.getElementsByTagName("text")];

  return texts.map((t) => ({
    text: t.textContent,
    start: t.getAttribute("start"),
    dur: t.getAttribute("dur"),
  }));
}

export { getYoutubeUrl, getTranscript };
