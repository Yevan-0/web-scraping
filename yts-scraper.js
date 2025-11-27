const fs = require("fs");
const { JSDOM } = require('jsdom');


// Download function 
const downloadImage = async (url, filename) => {
    const imageResponse = await fetch(url);
    const arrayBuffer = await imageResponse.arrayBuffer()

    fs.writeFileSync(filename, Buffer.from(arrayBuffer))
    console.log(`saved ${filename}`)
}

// Subpage scraping function
const scrapeDetails = async (movieUrl) => {
    try {
        const movieResponse = await fetch(movieUrl);
        const html = await movieResponse.text();

        const dom = new JSDOM(html);
        const doc = dom.window.document;

        const descEl = doc.querySelector("#synopsis p");
        const actorsEl = doc.querySelector(".actors");

        return {
            description: descEl?.textContent.trim() || "Unknown",
            actors: actorsEl?.textContent
                .trim()
                .split(/[\n,;]+/)
                .slice(1)
                .map(a => a.trim())
                .filter(a => a.length > 0) || "Not listed"
        }
    }
    catch (err) {
        console.error(`Error scraping ${movieUrl}:`, err);
        return { description: "Unknown", actors: "Unknown" }
    }
}

// Scraping details
const scraper = async (url) => {
    try {
        const response = await fetch(url);
        const html = await response.text();

        const dom = new JSDOM(html);
        const doc = dom.window.document;

        // The parser
        const source = Array.from(
            doc.querySelectorAll(".browse-movie-wrap")
        )
            // map list item to object
            .map(repo => {
                const titleEl = repo.querySelector(".browse-movie-title");
                const yearEl = repo.querySelector(".browse-movie-year")
                const ratingEl = repo.querySelector(".rating");
                const imgEl = repo.querySelector(".img-responsive");
                const linkEl = repo.querySelector(".browse-movie-link");

                return {
                    title: titleEl?.textContent.trim() || "Unknown",
                    year: yearEl?.textContent.trim() || "Unknown",
                    rating: ratingEl?.textContent.trim() || "Unknown",
                    imageUrl: imgEl?.getAttribute("src"),
                    detailUrl: linkEl?.getAttribute("href") || "Unknown"
                }
            });

        // Array for finalizing and storing all the data
        const dataPool = [];
        for (const movie of source) {
            let details = { description: "Unknown", actors: "Unknown" };
            if (movie.detailUrl) {
                details = await scrapeDetails(movie.detailUrl);
            }
            dataPool.push({ ...movie, ...details });
        }
        console.log(dataPool)

        fs.writeFileSync(`yts-scrapped-data.json`, JSON.stringify(dataPool, null, 4));

        // Checks if folder exists
        if (!fs.existsSync("./yts-images")) {
            fs.mkdirSync("./yts-images");
        }

        // Loop for downloading the images
        for (let i = 0; i < 2; i++) {
            const movie = dataPool[i]
            if (movie.imageUrl) {
                const safeTitle = movie.title.replace(/[^\w\d-_]/g, "_");
                await downloadImage(movie.imageUrl, `./yts-images/${safeTitle}.jpg`);
            }
        }
    }
    catch (err) {
        console.error(err)
    }
}
// Enter url 
scraper("https://yts.lt/browse-movies/0/2160p/all/0/latest/0/all")
