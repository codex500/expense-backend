/**
 * Transactions service — income/expense CRUD with balance safety.
 *
 * CRITICAL BALANCE RULES:
 * 1. Expense: subtract from account — FAIL if balance insufficient.
 * 2. Income: add to account.
 * 3. Edit: reverse old effect, apply new effect — all in one transaction.
 * 4. Delete: reverse the transaction's effect on the account.
 * 5. All operations use SERIALIZABLE isolation + SELECT FOR UPDATE.
 */
import { CreateTransactionInput, UpdateTransactionInput, TransactionQuery } from './transactions.validation';
import { PaginationMeta } from '../../shared/types';
export declare class TransactionsService {
    /**
     * Create a transaction and update account balance atomically.
     */
    create(userId: string, input: CreateTransactionInput): Promise<{
        id: any;
        userId: any;
        accountId: any;
        accountName: any;
        accountType: any;
        type: any;
        category: any;
        amountPaise: number;
        note: any;
        transactionDate: any;
        paymentMethod: any;
        tags: any;
        receiptUrl: any;
        isRecurring: any;
        recurringInterval: any;
        transferToAccountId: any;
        createdAt: any;
        updatedAt: any;
    }>;
    /**
     * Update a transaction — reverses old balance effect, applies new one.
     */
    update(userId: string, txnId: string, input: UpdateTransactionInput): Promise<{
        id: any;
        userId: any;
        accountId: any;
        accountName: any;
        accountType: any;
        type: any;
        category: any;
        amountPaise: number;
        note: any;
        transactionDate: any;
        paymentMethod: any;
        tags: any;
        receiptUrl: any;
        isRecurring: any;
        recurringInterval: any;
        transferToAccountId: any;
        createdAt: any;
        updatedAt: any;
    }>;
    /**
     * Delete a transaction — reverses its balance effect.
     */
    delete(userId: string, txnId: string): Promise<{
        message: string;
    }>;
    /**
     * Get transaction by ID.
     */
    getById(userId: string, txnId: string): Promise<{
        id: any;
        userId: any;
        accountId: any;
        accountName: any;
        accountType: any;
        type: any;
        category: any;
        amountPaise: number;
        note: any;
        transactionDate: any;
        paymentMethod: any;
        tags: any;
        receiptUrl: any;
        isRecurring: any;
        recurringInterval: any;
        transferToAccountId: any;
        createdAt: any;
        updatedAt: any;
    }>;
    /**
     * Get paginated, filtered, sorted transaction list.
     */
    list(userId: string, filters: TransactionQuery): Promise<{
        transactions: {
            id: any;
            userId: any;
            accountId: any;
            accountName: any;
            accountType: any;
            type: any;
            category: any;
            amountPaise: number;
            note: any;
            transactionDate: any;
            paymentMethod: any;
            tags: any;
            receiptUrl: any;
            isRecurring: any;
            recurringInterval: any;
            transferToAccountId: any;
            createdAt: any;
            updatedAt: any;
        }[];
        meta: PaginationMeta;
    }>;
    exportPdf(userId: string, res: any): Promise<void>;
    private formatTransaction;
}
export declare const transactionsService: TransactionsService;
//# sourceMappingURL=transactions.service.d.ts.map