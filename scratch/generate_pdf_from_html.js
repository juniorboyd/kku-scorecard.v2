const puppeteer = require('puppeteer');
const path = require('path');

async function generatePDF() {
    console.log('Starting PDF generation with Puppeteer...');
    
    // Launch headless browser
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    
    // Resolve absolute path to presentation.html
    const htmlPath = path.resolve(__dirname, '../presentation.html');
    const fileUrl = `file://${htmlPath}`;
    console.log(`Loading file: ${fileUrl}`);
    
    // Open the local presentation.html file (waiting only for DOM to be loaded)
    await page.goto(fileUrl, { waitUntil: 'domcontentloaded' });
    
    // Give it a short 1 second sleep just to render fonts if any
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Generate PDF using print styles
    const pdfPath = path.resolve(__dirname, '../presentation.pdf');
    await page.pdf({
        path: pdfPath,
        width: '13.33in', // 16:9 widescreen standard dimensions in inches
        height: '7.5in',
        printBackground: true,
        margin: { top: '0px', right: '0px', bottom: '0px', left: '0px' }
    });
    
    await browser.close();
    console.log(`PDF successfully generated at: ${pdfPath}`);
}

generatePDF().catch(err => {
    console.error('Error generating PDF:', err);
});
