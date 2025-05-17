import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { first } from 'rxjs/operators';
import { AlertService } from '../_services';
import { RequestService } from './request.service';

@Component({
  selector: 'app-requests-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="card">
      <h4 class="card-header">REQUESTS</h4>
      <div class="card-body">
        <div class="table-responsive">
          <table class="table table-striped">
            <thead>
              <tr>
                <th style="width: 15%">Type</th>
                <th style="width: 25%">Employee</th>
                <th style="width: 25%">Items</th>
                <th style="width: 15%">Status</th>
                <th style="width: 20%">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let request of requests">
                <td>{{ request.type }}</td>
                <td>{{ request.employee?.user?.email }}
                  <span *ngIf="request.employee?.user?.role === 'Admin'" class="text-danger">(Admin User)</span>
                  <span *ngIf="request.employee?.user?.role === 'User'" class="text-primary">(Normal User)</span>
                </td>
                <td>
                  <div *ngFor="let item of request.items">
                    {{ item.name }} (x{{ item.quantity }})
                  </div>
                  <div *ngIf="!request.items || request.items.length === 0">
                    -
                  </div>
                </td>
                <td>
                  <span class="badge" [ngClass]="{
                    'bg-warning': request.status === 'Pending',
                    'bg-success': request.status === 'Approved',
                    'bg-danger': request.status === 'Rejected'
                  }">{{ request.status }}</span>
                </td>
                <td>
                  <div class="btn-group">
                    <a routerLink="edit/{{request.id}}" class="btn btn-primary">Edit</a>
                    <button (click)="deleteRequest(request.id)" class="btn btn-danger" [disabled]="request.isDeleting">
                      <span *ngIf="request.isDeleting" class="spinner-border spinner-border-sm"></span>
                      <span *ngIf="!request.isDeleting">Delete</span>
                    </button>
                  </div>
                </td>
              </tr>
              <tr *ngIf="!requests || requests.length === 0">
                <td colspan="5" class="text-center">
                  <div *ngIf="loading" class="d-flex justify-content-center">
                    <span class="spinner-border spinner-border-lg"></span>
                  </div>
                  <div *ngIf="!loading">
                    No requests found
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="text-end mt-3">
          <a routerLink="add" class="btn btn-primary">Add Request</a>
        </div>
      </div>
    </div>
  `
})
export class RequestsListComponent implements OnInit {
  requests: any[] = [];
  loading = false;

  constructor(
    private requestService: RequestService,
    private alertService: AlertService
  ) { }

  ngOnInit() {
    this.loading = true;
    this.requestService.getAll()
      .pipe(first())
      .subscribe({
        next: requests => {
          this.requests = requests;
          this.loading = false;
        },
        error: error => {
          this.alertService.error(error);
          this.loading = false;
        }
      });
  }

  deleteRequest(id: number) {
    const request = this.requests.find(x => x.id === id);
    request.isDeleting = true;
    this.requestService.delete(id)
      .pipe(first())
      .subscribe({
        next: () => {
          this.requests = this.requests.filter(x => x.id !== id);
          this.alertService.success('Request deleted successfully');
        },
        error: error => {
          this.alertService.error(error);
          request.isDeleting = false;
        }
      });
  }
}