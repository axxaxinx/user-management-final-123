import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { ReactiveFormsModule, UntypedFormBuilder, UntypedFormGroup, Validators, FormArray } from '@angular/forms';
import { first } from 'rxjs/operators';
import { AlertService } from '../_services';
import { EmployeeService } from '../_services/employee.service';
import { RequestService } from './request.service';

@Component({
  selector: 'app-requests-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="card">
      <h4 class="card-header">{{isAddMode ? 'ADD REQUEST' : 'EDIT REQUEST'}}</h4>
      <div class="card-body">
        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <!-- Type -->
          <div class="mb-3 row">
            <label class="col-sm-2 col-form-label">Type</label>
            <div class="col-sm-10">
              <select formControlName="type" class="form-select" [ngClass]="{ 'is-invalid': submitted && f.type.errors }">
                <option value=""></option>
                <option *ngFor="let type of requestTypes" [value]="type">{{type}}</option>
              </select>
              <div *ngIf="submitted && f.type.errors" class="invalid-feedback">
                <div *ngIf="f.type.errors.required">Type is required</div>
              </div>
            </div>
          </div>
          
          <!-- Employee -->
          <div class="mb-3 row">
            <label class="col-sm-2 col-form-label">Employee</label>
            <div class="col-sm-10">
              <select formControlName="employeeId" class="form-select" [ngClass]="{ 'is-invalid': submitted && f.employeeId.errors }">
                <option value=""></option>
                <option *ngFor="let employee of employees" [value]="employee.id">
                  {{employee.user?.email}} ({{employee.id}})
                </option>
              </select>
              <div *ngIf="submitted && f.employeeId.errors" class="invalid-feedback">
                <div *ngIf="f.employeeId.errors.required">Employee is required</div>
              </div>
            </div>
          </div>
          
          <!-- Status (Edit mode only) -->
          <div *ngIf="!isAddMode" class="mb-3 row">
            <label class="col-sm-2 col-form-label">Status</label>
            <div class="col-sm-10">
              <select formControlName="status" class="form-select" [ngClass]="{ 'is-invalid': submitted && f.status.errors }">
                <option *ngFor="let status of statusOptions" [value]="status">{{status}}</option>
              </select>
              <div *ngIf="submitted && f.status.errors" class="invalid-feedback">
                <div *ngIf="f.status.errors.required">Status is required</div>
              </div>
            </div>
          </div>
          
          <!-- Items (For Equipment and Resources types) -->
          <div class="mb-4" *ngIf="showItemsSection()">
            <label class="col-form-label">Items</label>
            
            <div class="table-responsive">
              <table class="table table-borderless">
                <thead>
                  <tr>
                    <th style="width: 45%">Name</th>
                    <th style="width: 45%">Quantity</th>
                    <th style="width: 10%"></th>
                  </tr>
                </thead>
                <tbody formArrayName="items">
                  <tr *ngFor="let itemForm of itemsArray.controls; let i = index" [formGroupName]="i">
                    <td>
                      <input type="text" formControlName="name" class="form-control" 
                        [ngClass]="{ 'is-invalid': submitted && itemForm.get('name').errors }" />
                      <div *ngIf="submitted && itemForm.get('name').errors" class="invalid-feedback">
                        <div *ngIf="itemForm.get('name').errors.required">Name is required</div>
                      </div>
                    </td>
                    <td>
                      <input type="number" formControlName="quantity" class="form-control" 
                        [ngClass]="{ 'is-invalid': submitted && itemForm.get('quantity').errors }" />
                      <div *ngIf="submitted && itemForm.get('quantity').errors" class="invalid-feedback">
                        <div *ngIf="itemForm.get('quantity').errors.required">Quantity is required</div>
                        <div *ngIf="itemForm.get('quantity').errors.min">Quantity must be at least 1</div>
                      </div>
                    </td>
                    <td class="text-center">
                      <button type="button" class="btn btn-danger" (click)="removeItem(i)">Remove</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <div class="d-flex justify-content-start mb-3">
              <button type="button" class="btn btn-secondary" (click)="addItem()">Add Item</button>
            </div>
          </div>
          
          <!-- Buttons -->
          <div class="d-flex justify-content-center mt-4">
            <button [disabled]="loading" class="btn btn-primary me-2">
              <span *ngIf="loading" class="spinner-border spinner-border-sm me-1"></span>
              Save
            </button>
            <button type="button" (click)="onCancel()" class="btn btn-secondary">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  `
})
export class RequestsFormComponent implements OnInit {
  form: UntypedFormGroup;
  id: string;
  isAddMode: boolean;
  loading = false;
  submitted = false;
  employees: any[] = [];
  requestTypes = ['Equipment', 'Resources', 'Leave']; // Removed Training and Other
  statusOptions = ['Pending', 'Approved', 'Rejected'];
  
  // Types that require items
  itemRequiredTypes = ['Equipment', 'Resources'];

  constructor(
    private formBuilder: UntypedFormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private requestService: RequestService,
    private employeeService: EmployeeService,
    private alertService: AlertService
  ) {}

  ngOnInit() {
    this.id = this.route.snapshot.params['id'];
    this.isAddMode = !this.id;
    
    // Load all employees
    this.employeeService.getAll()
      .pipe(first())
      .subscribe({
        next: employees => this.employees = employees,
        error: error => this.alertService.error(error)
      });
    
    // form with validation rules
    this.form = this.formBuilder.group({
      type: ['', Validators.required],
      employeeId: ['', Validators.required],
      status: [{ value: 'Pending', disabled: this.isAddMode }, Validators.required],
      items: this.formBuilder.array([])
    });

    // Add type change listener to clear/reset items when type changes
    this.form.get('type')?.valueChanges.subscribe(type => {
      // Clear items array when type doesn't require items
      if (!this.itemRequiredTypes.includes(type)) {
        this.itemsArray.clear();
      }
    });

    if (!this.isAddMode) {
      // Load request data in edit mode
      this.loading = true;
      this.requestService.getById(parseInt(this.id))
        .pipe(first())
        .subscribe({
          next: request => {
            this.form.patchValue({
              type: request.type,
              employeeId: request.employeeId,
              status: request.status
            });
            
            // Clear items array and populate with request items if type requires items
            this.itemsArray.clear();
            if (this.itemRequiredTypes.includes(request.type) && request.items) {
              request.items.forEach(item => {
                this.itemsArray.push(this.formBuilder.group({
                  name: [item.name, Validators.required],
                  quantity: [item.quantity, [Validators.required, Validators.min(1)]]
                }));
              });
            }
            
            this.loading = false;
          },
          error: error => {
            this.alertService.error(error);
            this.loading = false;
          }
        });
    }
  }

  // Helper method to check if items section should be shown
  showItemsSection(): boolean {
    const type = this.form.get('type')?.value;
    return this.itemRequiredTypes.includes(type);
  }

  // Getter for easy access to form controls
  get f() { return this.form.controls; }
  
  // Getter for items FormArray
  get itemsArray() { return this.form.get('items') as FormArray; }

  addItem() {
    const itemForm = this.formBuilder.group({
      name: ['', Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]]
    });
    this.itemsArray.push(itemForm);
  }

  removeItem(index: number) {
    this.itemsArray.removeAt(index);
  }

  onSubmit() {
    this.submitted = true;

    // Reset alerts on submit
    this.alertService.clear();

    // Stop here if form is invalid
    if (this.form.invalid) {
      return;
    }

    // Get current type
    const type = this.form.get('type')?.value;

    // Require at least one item if type requires items
    if (this.itemRequiredTypes.includes(type) && this.itemsArray.length === 0) {
      this.alertService.error(`Please add at least one item to the ${type.toLowerCase()} request`);
      return;
    }

    this.loading = true;
    
    if (this.isAddMode) {
      this.createRequest();
    } else {
      this.updateRequest();
    }
  }

  onCancel() {
    if (this.isAddMode) {
      this.router.navigate(['../'], { relativeTo: this.route });
    } else {
      this.router.navigate(['../../'], { relativeTo: this.route });
    }
  }

  private createRequest() {
    this.requestService.create(this.form.getRawValue())
      .pipe(first())
      .subscribe({
        next: () => {
          this.alertService.success('Request added successfully', { keepAfterRouteChange: true });
          this.router.navigate(['../'], { relativeTo: this.route });
        },
        error: error => {
          this.alertService.error(error);
          this.loading = false;
        }
      });
  }

  private updateRequest() {
    this.requestService.update(parseInt(this.id), this.form.getRawValue())
      .pipe(first())
      .subscribe({
        next: () => {
          this.alertService.success('Request updated successfully', { keepAfterRouteChange: true });
          this.router.navigate(['../../'], { relativeTo: this.route });
        },
        error: error => {
          this.alertService.error(error);
          this.loading = false;
        }
      });
  }
}