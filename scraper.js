const fs = require("fs");
const { JSDOM } = require('jsdom');


const scraper = async (username) => {
    try {
        // username to repositories https
        const url = `https://github.com/${username}?tab=repositories`;

        const response = await fetch(url);
        const html = await response.text();

        const dom = new JSDOM(html);
        const doc = dom.window.document;

        // Select all repository list items
        const source = Array.from(
            doc.querySelectorAll("#user-repositories-list li")
        )
        // map list item to object
        .map(repo => {
            const nameEl = repo.querySelector("[itemprop='name codeRepository']");
            const langEl = repo.querySelector("[itemprop='programmingLanguage']");
            const updatedEl = repo.querySelector("relative-time");

            return {
                url: `https://github.com/${username}/${nameEl.textContent.trim()}`,
                name: nameEl.textContent.trim(),
                lang: langEl? langEl.textContent.trim() : "Unknown",
                updatedTime: updatedEl ? updatedEl.getAttribute("datetime") : null
            }
        })
        console.log(source);

        // logs object data to json file (creates new json file per user)
        fs.writeFileSync(`${username}-scrapped-data.json`, JSON.stringify(source, null, 4));
    }
    catch (err) {
        console.error(err)
    }
}

// Enter Username 
scraper("Yevan-0")

