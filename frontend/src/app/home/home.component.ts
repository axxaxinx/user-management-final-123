import { Component } from '@angular/core';
import { Account } from '@app/_models';
import { AccountService } from '@app/_services';

@Component({
    templateUrl: 'home.component.html',
    standalone: false
})
export class HomeComponent {
    get account(): Account | null {
        return this.accountService.accountValue;
    }

    constructor(private accountService: AccountService) { }
}