const fs = require("fs");
const { JSDOM } = require('jsdom');


// Download function 
const downloadImage = async (url, filename) => {
    const imageResponse = await fetch(url);
    const arrayBuffer = await imageResponse.arrayBuffer()

    fs.writeFileSync(filename, Buffer.from(arrayBuffer))
    console.log(`saved ${filename}`)
}


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

                return {
                    title: titleEl?.textContent.trim() || "Unknown",
                    year: yearEl?.textContent.trim() || "Unknown",
                    rating: ratingEl?.textContent.trim() || "Unknown",
                    imageUrl: imgEl?.getAttribute("src")
                }

            })
        console.log(source);

        // logs object data to json file (creates new json file per user)
        fs.writeFileSync(`yts-scrapped-data.json`, JSON.stringify(source, null, 4));

        // Checks if folder exists
        if (!fs.existsSync("./yts-images")) {
            fs.mkdirSync("./yts-images");
        }

        // Loop for downloading the images
        for (const movie of source) {
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
