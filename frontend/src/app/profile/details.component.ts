import { Component } from '@angular/core';
import { Account } from '@app/_models';
import { AccountService } from '@app/_services';

@Component({
    templateUrl: 'details.component.html',
    standalone: false
})
export class DetailsComponent {
    get account(): Account | null {
        return this.accountService.accountValue;
    }

    constructor(private accountService: AccountService) { }
}