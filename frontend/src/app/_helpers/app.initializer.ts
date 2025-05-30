import { AccountService } from '../_services';

export function appInitializer(accountService: AccountService) {
    return () => new Promise(resolve => {
        // attempt to refresh token on app start up to auto authenticate
        accountService.refreshToken()
            .subscribe({
                next: () => resolve(true),
                error: () => resolve(true)
            });
    });
}