const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto('https://www.polla.cl/es/view/resultados/5271');

    let hasNextPage = true;
    let allData = []; // Almacenar todos los datos de todas las páginas

    while (hasNextPage) {
      await page.waitForSelector('table.table.table-bordered.table-myaccount.table-results.mobileTable tbody');

      const data = await page.evaluate(() => {
        const rows = document.querySelectorAll('table.table.table-bordered.table-myaccount.table-results.mobileTable tbody tr');

        const results = [];
        rows.forEach((row, index) => {
          try {
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
            results.push({});
          }
        });

        return results;
      });

      allData = allData.concat(data); // Agregar los datos de esta página al conjunto completo

      hasNextPage = await page.evaluate(() => {
        const nextPageButton = document.querySelector('li.nextPage a');
        if (nextPageButton && !nextPageButton.classList.contains('inactive')) {
          nextPageButton.click();
          return true;
        }
        return false;
      });

      await new Promise(resolve => setTimeout(resolve, 5000));// Esperar un momento antes de procesar la siguiente página
    }

    fs.writeFileSync('polla_results.json', JSON.stringify(allData, null, 2), 'utf8'); // Guardar todos los datos en el archivo

    console.log('Data written to polla_results.json successfully');

    await browser.close();
  } catch (error) {
    console.error('Error:', error);
  }
})();
