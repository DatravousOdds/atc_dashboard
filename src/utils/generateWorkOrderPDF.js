const PDFDocument = require('pdfkit');

async function generateWorkOrderPDF(workOrderData) {
    console.log("Generating PDF for work order:", workOrderData);
    const { customerName, projectName, workOrderId, startDate, endDate, lineItems, bidItems } = workOrderData;

    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 50 });
        const chunks = [];
        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', err => reject(err));

        // Title
        doc.fontSize(20).text(`American Traffic Construction LLC - Work Assignment: ${workOrderId}`, { align: 'center' });
        doc.moveDown(0.5);
        doc.fontSize(14).text(`Customer: ${customerName ?? 'N/A'}`, { align: 'left' });
        doc.moveDown(0.5);
        doc.fontSize(14).text(`Project: ${projectName ?? 'N/A'}`, { align: 'left' });
        doc.moveDown(0.5);
        doc.fontSize(14).text(`Start Date: ${startDate}`, { align: 'left' });
        doc.moveDown(0.5);
        doc.fontSize(14).text(`End Date: ${endDate}`, { align: 'left' });
        doc.moveDown(1);

        // Line Items Table Header
        doc.fontSize(8).text('Line Items:', { underline: true });
        doc.moveDown(0.5);

        const bidItemMap = new Map(bidItems.map(bi => [bi.id, bi]));

        // Table
        doc.table({
            columnStyles: ["6%", "40%", "8%", "6%", "6%", "6%", "6%", "6%", "6%", "*", "*"],
            //              Item  Desc  Unit  Qty  Mon   Tue   Wed   Thu   Fri  Material Equipment
            data: [
                ['Item', 'Description', 'Unit', 'Qty', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Material', 'Equipment'],
                ...lineItems.map(item => {
                    const bi = bidItemMap.get(item.bidItemId) || {};
                    return [
                        bi.bid_item_no ?? '',
                        bi.description ?? '',
                        bi.unit_of_measure ?? '',
                        item.qtyAssigned ?? '',
                        item.mon || '',
                        item.tue || '',
                        item.wed || '',
                        item.thu || '',
                        item.fri || '',
                        item.material || '',
                        item.equipment || '',
                    ];
                }),
            ],
        });

        doc.end();
    });
}

module.exports = generateWorkOrderPDF;
