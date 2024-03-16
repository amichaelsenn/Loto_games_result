const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto('https://www.polla.cl/es/view/resultados/5271');

    // Esperar 5 segundos adicionales después de que la página esté cargada
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Wait for the table to load
    await page.waitForSelector('table.table.table-bordered.table-myaccount.table-results.mobileTable tbody');

    // Extract data from each row in the table
    const data = await page.evaluate(() => {
      const rows = document.querySelectorAll('table.table.table-bordered.table-myaccount.table-results.mobileTable tbody tr');

      const results = [];
      rows.forEach((row, index) => {
        try {
          // Seleccionar el texto dentro del atributo data-bind del elemento div
          const game = row.querySelector('td.text-left div.tinl[data-bind="text: gameSettings.name"]').textContent.trim();
          const drawNumber = row.querySelector('.text-center .tinl[data-bind="text: drawNumber"]').textContent.trim();
          const drawDateTime = row.querySelector('.text-center:nth-child(3) .tinl[data-bind^="dateFormat"]').textContent.trim();
          const winningNumbers = row.querySelector('.text-left:nth-child(4) .tinl[data-bind="text: $parent.getResultNumbersString(winningNumbers, supNumbers,$index())"]').textContent.trim();

          results.push({
            game,
            drawNumber,
            drawDateTime,
            winningNumbers
          });
        } catch (error) {
          console.error(`Error en la fila ${index + 1}:`, error.message);
          // Agregar un objeto vacío para mantener la consistencia en el array de resultados
          results.push({});
        }
      });

      return results;
    });

    console.log('Data:', data);

    // Write data to a JSON file
    fs.writeFileSync('polla_results.json', JSON.stringify(data, null, 2), 'utf8', err => {
      if (err) {
        console.error('Error writing file:', err);
      } else {
        console.log('Data written to polla_results.json successfully');
      }
    });

    await browser.close();
  } catch (error) {
    console.error('Error:', error);
  }
})();
