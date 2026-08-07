const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
    try {
        console.log("Starting PDF generation for Summary Report...");
        const browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        
        const htmlPath = path.join(__dirname, 'summary_report.html');
        const fileUrl = `file://${htmlPath.replace(/\\/g, '/')}`;
        console.log(`Loading file: ${fileUrl}`);
        
        await page.goto(fileUrl, { waitUntil: 'domcontentloaded' });
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const pdfPath = path.join(__dirname, '..', 'summary_report.pdf');
        
        await page.pdf({
            path: pdfPath,
            format: 'A4',
            printBackground: true,
            margin: {
                top: '0mm',
                right: '0mm',
                bottom: '0mm',
                left: '0mm'
            }
        });
        
        console.log(`PDF successfully generated at: ${pdfPath}`);
        await browser.close();
    } catch (err) {
        console.error("Error generating PDF:", err);
        process.exit(1);
    }
})();
