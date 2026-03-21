import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Invoice, Client, CompanySettings } from '../types';
import { getLineTotal, getSubtotal, getDiscountAmount, getNetTotal, getGstAmount, getGrandTotal } from '../types';
import { format, parseISO } from 'date-fns';

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    // Only set crossOrigin for http(s) URLs; file:// and data: URLs fail with it
    if (url.startsWith('http://') || url.startsWith('https://')) {
      img.crossOrigin = 'anonymous';
    }
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

export async function generateInvoicePDF(
  invoice: Invoice,
  client: Client | undefined,
  settings: CompanySettings
): Promise<jsPDF> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Colors
  const primaryColor: [number, number, number] = [41, 65, 122]; // Dark blue
  const accentColor: [number, number, number] = [220, 53, 69]; // Red accent
  const grayColor: [number, number, number] = [100, 100, 100];

  // Header bar
  const headerHeight = 44;
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, headerHeight, 'F');

  // Logo in header (left side, with white background pad)
  const logoSrc = settings.logoUrl || './logo.png';
  try {
    const logoImg = await loadImage(logoSrc);
    const logoMaxH = 32;
    const logoMaxW = 70;
    const aspect = logoImg.naturalWidth / logoImg.naturalHeight;
    let logoW = logoMaxH * aspect;
    let logoH = logoMaxH;
    if (logoW > logoMaxW) {
      logoW = logoMaxW;
      logoH = logoW / aspect;
    }
    const logoX = 10;
    const logoY = (headerHeight - logoH) / 2;
    // White rounded background behind logo for contrast
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(logoX - 2, logoY - 2, logoW + 4, logoH + 4, 3, 3, 'F');
    doc.addImage(logoImg, 'PNG', logoX, logoY, logoW, logoH);
  } catch {
    // Fallback: just show company name if logo fails to load
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(settings.companyName, 15, 25);
  }

  // INVOICE title (right side)
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(26);
  doc.setFont('helvetica', 'bold');
  doc.text('INVOICE', pageWidth - 15, 17, { align: 'right' });

  // Invoice details in header (right side, below title)
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`#${invoice.invoiceNumber}  |  ${format(parseISO(invoice.invoiceDate), 'MMMM d, yyyy')}`, pageWidth - 15, 26, { align: 'right' });
  doc.text(`Payment Due: ${format(parseISO(invoice.dueDate), 'MMMM d, yyyy')}`, pageWidth - 15, 33, { align: 'right' });

  // Company info (FROM)
  let y = 58;
  doc.setTextColor(...primaryColor);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('FROM', 15, y);
  y += 6;
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(settings.companyName, 15, y);
  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(settings.address, 15, y);
  y += 4;
  doc.text(settings.cityProvince, 15, y);
  y += 4;
  if (settings.contactEmail) {
    doc.text(settings.contactEmail, 15, y);
    y += 4;
  }
  if (settings.phone) {
    doc.text(settings.phone, 15, y);
  }

  // Bill To
  y = 58;
  doc.setTextColor(...primaryColor);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('BILL TO', pageWidth / 2 + 10, y);
  y += 6;
  doc.setTextColor(0, 0, 0);

  if (client) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(client.name, pageWidth / 2 + 10, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    if (client.projectName) {
      doc.text(client.projectName, pageWidth / 2 + 10, y);
      y += 4;
    }
    if (client.projectAddress) {
      doc.text(client.projectAddress, pageWidth / 2 + 10, y);
      y += 4;
    }
    if (client.cityProvince) {
      doc.text(client.cityProvince, pageWidth / 2 + 10, y);
      y += 4;
    }
    if (client.attention) {
      doc.text(`Attn: ${client.attention}`, pageWidth / 2 + 10, y);
    }
  }

  // Line items table
  const tableStartY = 100;

  const tableData = invoice.lineItems
    .filter((item) => item.description || item.hours > 0)
    .map((item) => [
      item.hours.toString(),
      item.description,
      `$${item.unitPrice.toFixed(2)}`,
      `$${getLineTotal(item).toFixed(2)}`,
    ]);

  autoTable(doc, {
    startY: tableStartY,
    head: [['HOURS', 'DESCRIPTION', 'UNIT PRICE', 'LINE TOTAL']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [50, 50, 50],
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 25 },
      1: { cellWidth: 'auto' },
      2: { halign: 'right', cellWidth: 30 },
      3: { halign: 'right', cellWidth: 30 },
    },
    margin: { left: 15, right: 15 },
  });

  // Totals
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  const totalsX = pageWidth - 70;

  const subtotal = getSubtotal(invoice.lineItems);
  const discountAmt = getDiscountAmount(subtotal, invoice.discount, invoice.discountType);
  const netTotal = getNetTotal(invoice.lineItems, invoice.discount, invoice.discountType);
  const gstAmt = getGstAmount(netTotal, settings.gstRate);
  const grandTotal = getGrandTotal(invoice.lineItems, invoice.discount, invoice.discountType, settings.gstRate);

  doc.setFontSize(9);
  doc.setTextColor(...grayColor);

  let totalsY = finalY;
  doc.text('Subtotal:', totalsX, totalsY);
  doc.text(`$${subtotal.toFixed(2)}`, pageWidth - 15, totalsY, { align: 'right' });
  totalsY += 6;

  if (invoice.discount > 0) {
    const discountLabel = invoice.discountType === 'percentage'
      ? `Discount (${invoice.discount}%):`
      : 'Discount:';
    doc.text(discountLabel, totalsX, totalsY);
    doc.text(`-$${discountAmt.toFixed(2)}`, pageWidth - 15, totalsY, { align: 'right' });
    totalsY += 6;
  }

  doc.text('Net Total:', totalsX, totalsY);
  doc.text(`$${netTotal.toFixed(2)}`, pageWidth - 15, totalsY, { align: 'right' });
  totalsY += 6;

  doc.text(`GST (${settings.gstRate}%):`, totalsX, totalsY);
  doc.text(`$${gstAmt.toFixed(2)}`, pageWidth - 15, totalsY, { align: 'right' });
  totalsY += 8;

  // Grand total with highlight
  doc.setFillColor(...accentColor);
  doc.rect(totalsX - 5, totalsY - 5, pageWidth - totalsX + 5 - 10, 10, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL:', totalsX, totalsY + 1);
  doc.text(`$${grandTotal.toFixed(2)}`, pageWidth - 15, totalsY + 1, { align: 'right' });

  // Payment Details
  const paymentY = totalsY + 25;
  doc.setTextColor(...primaryColor);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('PAYMENT DETAILS', 15, paymentY);

  doc.setFontSize(8);
  doc.setTextColor(...grayColor);
  doc.setFont('helvetica', 'normal');
  let py = paymentY + 6;

  doc.text(`Beneficiary: ${settings.beneficiaryName}`, 15, py);
  py += 4;
  doc.text(`Cheque Payable to: ${settings.chequePayableTo}`, 15, py);
  py += 4;
  doc.text(`E-Transfer: ${settings.etransferEmail}`, 15, py);
  py += 4;
  doc.text(`Payment Reference: ${invoice.invoiceNumber}`, 15, py);
  py += 4;
  doc.text(`GST# ${settings.gstNumber}`, 15, py);

  // Status badge
  if (invoice.status === 'paid') {
    doc.setFillColor(40, 167, 69);
    doc.roundedRect(pageWidth - 50, paymentY - 5, 35, 12, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('PAID', pageWidth - 33, paymentY + 3, { align: 'center' });
  }

  // Notes
  if (invoice.notes) {
    const notesY = py + 10;
    doc.setTextColor(...primaryColor);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('NOTES', 15, notesY);

    doc.setTextColor(...grayColor);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    const splitNotes = doc.splitTextToSize(invoice.notes, pageWidth - 30);
    doc.text(splitNotes, 15, notesY + 6);
  }

  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 10;
  doc.setDrawColor(...primaryColor);
  doc.setLineWidth(0.5);
  doc.line(15, footerY - 5, pageWidth - 15, footerY - 5);
  doc.setTextColor(...grayColor);
  doc.setFontSize(7);
  doc.text('Thank you for your business!', pageWidth / 2, footerY, { align: 'center' });

  return doc;
}

export async function downloadInvoicePDF(
  invoice: Invoice,
  client: Client | undefined,
  settings: CompanySettings
) {
  const doc = await generateInvoicePDF(invoice, client, settings);
  const clientName = client?.name?.replace(/[^a-zA-Z0-9]/g, '_') || 'invoice';
  doc.save(`Invoice_${invoice.invoiceNumber}_${clientName}.pdf`);
}
