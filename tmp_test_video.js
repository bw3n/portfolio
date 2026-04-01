
function convertVideoUrl(url) {
    let embedUrl = url.trim();
    // Auto-convert Google Drive viewer links to embeddable preview links
    if (embedUrl.includes("drive.google.com/file/d/") && embedUrl.includes("/view")) {
        embedUrl = embedUrl.replace(/\/view.*$/, "/preview");
    }
    // Auto-convert standard YouTube watch URLs to embed URLs
    else if (embedUrl.includes("youtube.com/watch?v=")) {
        const videoId = embedUrl.split("v=")[1].split("&")[0];
        embedUrl = `https://www.youtube.com/embed/${videoId}`;
    }
    return embedUrl;
}

const urls = [
    "https://www.youtube.com/watch?v=VhiYcOHkPQg",
    "https://www.youtube.com/watch?v=VhiYcOHkPQg&t=10s",
    "https://youtu.be/VhiYcOHkPQg",
    "https://vimeo.com/76979871",
    "https://www.youtube.com/embed/VhiYcOHkPQg"
];

urls.forEach(url => {
    console.log(`Original: ${url}`);
    console.log(`Embed:    ${convertVideoUrl(url)}`);
    console.log('---');
});
