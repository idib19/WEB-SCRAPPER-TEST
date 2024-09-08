import * as cheerio from 'cheerio';
import axios from 'axios';
import fs from 'fs';
const url = "https://docs.google.com/document/d/e/2PACX-1vSHesOf9hv2sPOntssYrEdubmMQm8lwjfwv6NPjjmIRYs_FOYXtqrYgjh85jBUebK9swPXh_a5TJ5Kl/pub"


export async function main(url) {

    // Scrap document and return Text content 
    const tableTextContent = await scrapDocument(url)

    // Remove titles and unuseful data : incomplete !!!
    const str = tableTextContent.slice(33, tableTextContent.length)

    // We parse the data to this format : [value, x, y]
    const gridData = parseData(str)


    console.log('Resultat', gridData);


    const htmlContent = generateHTML(gridData);

    fs.writeFile('output.html', htmlContent, (err) => {
        if (err) {
            console.error('Error writing file:', err);
        } else {
            console.log('HTML created successfully.');
        }
    });

    return gridData;
}








// Run Main
main(url)








// This Funtion scrap the document and return it's text data 
async function scrapDocument(url) {

    try {
        const response = await axios.get(url);

        const html = await response.data;

        const $ = cheerio.load(html);

        // Extract the content the table element using cheerio 
        const table = $('table').text();

        return table;

    } catch (error) {
        console.error('Error scraping document', error);
    }

}

// this function parses the string data from the document into this reusable format [value, x, y]
function parseData(rawString) {
    const resultat = [];
    const pattern = /(\d{1,2})([█░])(\d{1})/g; // Pattern to match x-coordinate, character, y-coordinate

    let match;
    while ((match = pattern.exec(rawString)) !== null) {
        const xCoordinate = parseInt(match[1], 10);  // First number / x-coordinate
        const character = match[2];                  // The character 
        const yCoordinate = parseInt(match[3], 10);  // Second number / y-coordinate

        // Store  the desired format
        resultat.push([character, xCoordinate, yCoordinate]);
    }

    return resultat;
}


// This function generate dynamicaly our html file bases on the data provided 
function generateHTML(gridData) {
    return `<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Konva Basic Stage</title>
    <script src="https://unpkg.com/konva/konva.min.js"></script>
    <style>
        body {
            margin: 0;
            padding: 0;
            overflow: hidden;
        }

        #container {
            width: 100%;
            height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
    </style>
</head>

<body>
    <div id="container"></div>

    <script>
        const gridSize = 20;
        const gridCount = 100;
        const stageWidth = gridSize * gridCount;
        const stageHeight = gridSize * gridCount;

        const gridData = ${JSON.stringify(gridData)};

        const stage = new Konva.Stage({
            container: 'container',
            width: window.innerWidth,
            height: 200,
        });

        const layer = new Konva.Layer();
        stage.add(layer);

        for (let i = 0; i < gridCount; i++) {
            layer.add(new Konva.Line({
                points: [i * gridSize, 0, i * gridSize, stageHeight],
                stroke: 'lightgray',
                strokeWidth: 1,
            }));

            layer.add(new Konva.Line({
                points: [0, i * gridSize, stageWidth, i * gridSize],
                stroke: 'lightgray',
                strokeWidth: 1,
            }));
        }

        const adjustY = stage.height() - 20;

        gridData.forEach(([char, x, y]) => {
            const text = new Konva.Text({
                x: (x * gridSize) + 20,
                y: (Math.abs((y * gridSize) - adjustY)) - 20,
                text: char,
                fontSize: 20,
                fontFamily: 'monospace',
                fill: 'black',
                align: 'center',
                verticalAlign: 'middle'
            });

            layer.add(text);

            var testPosition = text.absolutePosition();
            console.log(testPosition);
        });

        layer.draw();
    </script>
</body>

</html>`;
}



