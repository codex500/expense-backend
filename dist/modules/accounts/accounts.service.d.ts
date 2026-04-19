/**
 * Accounts service — manages bank/wallet/UPI accounts with balance safety.
 *
 * CRITICAL RULES:
 * 1. Balance can NEVER go negative — enforced at service + DB level.
 * 2. Transfers use SERIALIZABLE transactions with SELECT FOR UPDATE.
 * 3. All money is in integer paise.
 */
import { CreateAccountInput, UpdateAccountInput, TransferInput } from './accounts.validation';
export declare class AccountsService {
    create(userId: string, input: CreateAccountInput): Promise<{
        id: any;
        accountName: any;
        bankName: any;
        type: any;
        currentBalancePaise: number;
        icon: any;
        color: any;
        isDefault: any;
        isActive: any;
        createdAt: any;
        updatedAt: any;
    }>;
    update(userId: string, accountId: string, input: UpdateAccountInput): Promise<{
        id: any;
        accountName: any;
        bankName: any;
        type: any;
        currentBalancePaise: number;
        icon: any;
        color: any;
        isDefault: any;
        isActive: any;
        createdAt: any;
        updatedAt: any;
    }>;
    delete(userId: string, accountId: string): Promise<{
        message: string;
    }>;
    getAll(userId: string): Promise<{
        id: any;
        accountName: any;
        bankName: any;
        type: any;
        currentBalancePaise: number;
        icon: any;
        color: any;
        isDefault: any;
        isActive: any;
        createdAt: any;
        updatedAt: any;
    }[]>;
    getById(userId: string, accountId: string): Promise<{
        id: any;
        accountName: any;
        bankName: any;
        type: any;
        currentBalancePaise: number;
        icon: any;
        color: any;
        isDefault: any;
        isActive: any;
        createdAt: any;
        updatedAt: any;
    }>;
    getSummary(userId: string): Promise<{
        totalAccounts: number;
        totalBalancePaise: number;
        byType: {
            cash: number;
            bank_account: number;
            upi: number;
            credit_card: number;
            wallet: number;
        };
    }>;
    /**
     * Transfer money between accounts — the most critical operation.
     * Uses SERIALIZABLE isolation + SELECT FOR UPDATE to prevent race conditions.
     */
    transfer(userId: string, input: TransferInput): Promise<{
        transactionId: any;
        fromAccount: {
            id: string;
            newBalancePaise: number;
        };
        toAccount: {
            id: string;
            newBalancePaise: number;
        };
        amountPaise: number;
    }>;
    private formatAccount;
}
export declare const accountsService: AccountsService;
//# sourceMappingURL=accounts.service.d.ts.map