const { PDFDocument } = require('pdfkit');


async function generateWorkOrderPDF(workOrderData) {
    console.log("Generating PDF for work order:", workOrderData);
    const { customerName, projectName, workOrderId, startDate, endDate, lineItems } = workOrderData;
    await new Promise((resolve, reject) => {
    const doc = new PDFDocument({margin: 50});
    const chunks = [];
    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', err => reject(err));

    // Title
    doc.fontSize(20).text(`American Traffic Construction LLC - Work Assignment: ${workOrderId}`, { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(16).text(`Customer: ${customerName}`, { align: 'left' });
    doc.moveDown(0.5);
    doc.fontSize(16).text(`Project: ${projectName}`, { align: 'left' });
    doc.moveDown(0.5);
    doc.fontSize(16).text(`Start Date: ${startDate}`, { align: 'left' });
    doc.moveDown(0.5);
    doc.fontSize(16).text(`End Date: ${endDate}`, { align: 'left' });
    doc.moveDown(1);

    // Line Items Table Header
    doc.fontSize(14).text('Line Items:', { underline: true });
    doc.moveDown(0.5);


    // Table Headers
    doc.table({
        data: [
            ['Item', 'Description', 'Unit', 'Qty', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Material', 'Equipment'],
            lineItems.map(item => [
                item.item,
                item.description,
                item.unit,
                item.quantity,
                item.mon ? 'X' : '',
                item.tue ? 'X' : '',
                item.wed ? 'X' : '',
                item.thu ? 'X' : '',
                item.fri ? 'X' : '',
                item.material ? 'X' : '',
                item.equipment ? 'X' : ''
            ])
        ]
    });

    doc.end();

    });
}