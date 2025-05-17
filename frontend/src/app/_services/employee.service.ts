import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { switchMap, mergeMap } from 'rxjs/operators';
import { WorkflowTrackerService } from './workflow-tracker.service';
import { DepartmentService } from './department.service';
import { forkJoin } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class EmployeeService {
  constructor(
    private http: HttpClient,
    private workflowTrackerService: WorkflowTrackerService,
    private departmentService: DepartmentService
  ) { }

  getAll() {
    return this.http.get<any[]>(`${environment.apiUrl}/employees`);
  }

  getById(id: number) {
    return this.http.get<any>(`${environment.apiUrl}/employees/${id}`);
  }

  create(employee: any) {
    return this.http.post(`${environment.apiUrl}/employees`, employee);
  }

  update(id: number, employee: any) {
    // First get the current employee to check for department change
    return this.getById(id).pipe(
      switchMap(currentEmployee => {
        // If department has changed, create a workflow entry
        if (currentEmployee.departmentId !== employee.departmentId) {
          // Get both department names for the workflow record
          return forkJoin({
            oldDept: this.departmentService.getById(currentEmployee.departmentId),
            newDept: this.departmentService.getById(employee.departmentId)
          }).pipe(
            switchMap(depts => {
              // Track the department change with department names
              this.workflowTrackerService.trackDepartmentChange(
                id,
                currentEmployee.departmentId,
                employee.departmentId,
                depts.oldDept.name,
                depts.newDept.name
              ).subscribe({
                error: error => console.error('Error tracking department change:', error)
              });
              
              // Continue with the employee update
              return this.http.put(`${environment.apiUrl}/employees/${id}`, employee);
            })
          );
        } else {
          // No department change, just update the employee
          return this.http.put(`${environment.apiUrl}/employees/${id}`, employee);
        }
      })
    );
  }

  delete(id: number) {
    return this.http.delete(`${environment.apiUrl}/employees/${id}`);
  }
}