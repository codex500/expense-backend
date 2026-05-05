import { Router, Response, NextFunction } from 'express';
import { query } from '../../config/database';
import { sendSuccess } from '../../shared/utils/response';
import { authenticate } from '../../shared/middleware/authenticate';
import { AuthenticatedRequest } from '../../shared/types';
import PDFDocument from 'pdfkit';

class ReportsService {
    async getTransactionsForReport(userId: string, startDate?: string, endDate?: string) {
        let sql = `
            SELECT t.*, a.account_name, a.bank_name
            FROM transactions t
            JOIN accounts a ON t.account_id = a.id
            WHERE t.user_id = $1
        `;
        const params: any[] = [userId];

        if (startDate) {
            params.push(startDate);
            sql += ` AND t.transaction_date >= $${params.length}`;
        }
        if (endDate) {
            params.push(endDate);
            sql += ` AND t.transaction_date <= $${params.length}`;
        }

        sql += ' ORDER BY t.transaction_date DESC';

        const { rows } = await query(sql, params);
        return rows;
    }

    async generateCSV(userId: string, startDate?: string, endDate?: string): Promise<string> {
        const rows = await this.getTransactionsForReport(userId, startDate, endDate);
        
        let csv = 'Date,Type,Category,Amount,Account,Note\n';
        
        for (const row of rows) {
            const date = new Date(row.transaction_date).toISOString().split('T')[0];
            const amount = (Number(row.amount_paise) / 100).toFixed(2);
            // Escape note for CSV if it contains commas
            const note = row.note ? `"${row.note.replace(/"/g, '""')}"` : '';
            
            csv += `${date},${row.type},${row.category},${amount},${row.account_name},${note}\n`;
        }
        
        return csv;
    }

    generatePDF(res: Response, rows: any[], period: string) {
        const doc = new PDFDocument({ margin: 50 });
        doc.pipe(res);

        // Header
        doc.fontSize(20).text('Trackify Expense Report', { align: 'center' });
        doc.moveDown(0.5);
        doc.fontSize(12).text(`Period: ${period}`, { align: 'center' });
        doc.moveDown(2);

        // Table Header
        let y = doc.y;
        doc.fontSize(10).font('Helvetica-Bold');
        doc.text('Date', 50, y, { width: 80 });
        doc.text('Category', 130, y, { width: 100 });
        doc.text('Account', 230, y, { width: 100 });
        doc.text('Type', 330, y, { width: 80 });
        doc.text('Amount', 410, y, { width: 90, align: 'right' });
        
        doc.moveTo(50, y + 15).lineTo(500, y + 15).stroke();
        doc.moveDown(1);
        doc.font('Helvetica');

        let totalIncome = 0;
        let totalExpense = 0;

        for (const row of rows) {
            y = doc.y;
            if (y > 700) {
                doc.addPage();
                y = 50;
            }

            const amount = Number(row.amount_paise) / 100;
            if (row.type === 'income') totalIncome += amount;
            if (row.type === 'expense') totalExpense += amount;

            const dateStr = new Date(row.transaction_date).toLocaleDateString();

            doc.text(dateStr, 50, y, { width: 80 });
            doc.text(row.category, 130, y, { width: 100 });
            doc.text(row.account_name, 230, y, { width: 100 });
            doc.text(row.type, 330, y, { width: 80 });
            
            const color = row.type === 'income' ? 'green' : row.type === 'expense' ? 'red' : 'black';
            doc.fillColor(color).text(
                `${row.type === 'expense' ? '-' : ''}₹${amount.toFixed(2)}`,
                410, y, { width: 90, align: 'right' }
            );
            doc.fillColor('black');
            doc.moveDown(0.5);
        }

        doc.moveDown(2);
        doc.font('Helvetica-Bold');
        doc.text(`Total Income: ₹${totalIncome.toFixed(2)}`, 50);
        doc.text(`Total Expense: ₹${totalExpense.toFixed(2)}`);
        const balance = totalIncome - totalExpense;
        doc.text(`Net Balance: ₹${balance.toFixed(2)}`);

        doc.end();
    }
}

export const reportsService = new ReportsService();

class ReportsController {
    async exportPdf(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const { startDate, endDate } = req.query as any;
            const rows = await reportsService.getTransactionsForReport(req.user.id, startDate, endDate);
            
            const periodStr = startDate && endDate ? `${startDate} to ${endDate}` : 'All Time';
            const filename = `trackify_report_${new Date().toISOString().split('T')[0]}.pdf`;
            
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            
            reportsService.generatePDF(res, rows, periodStr);
        } catch (err) { next(err); }
    }

    async exportCsv(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const { startDate, endDate } = req.query as any;
            const csvData = await reportsService.generateCSV(req.user.id, startDate, endDate);
            
            const filename = `trackify_transactions_${new Date().toISOString().split('T')[0]}.csv`;
            
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            
            res.send(csvData);
        } catch (err) { next(err); }
    }
}

const reportsController = new ReportsController();
const router = Router();
router.use(authenticate as any);

router.get('/pdf', (req, res, next) => reportsController.exportPdf(req as any, res, next));
router.get('/csv', (req, res, next) => reportsController.exportCsv(req as any, res, next));

export default router;
