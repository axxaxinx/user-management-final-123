import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { WorkflowService } from './workflow.service';
import { AccountService } from './account.service';

@Injectable({ providedIn: 'root' })
export class WorkflowTrackerService {
  constructor(
    private workflowService: WorkflowService,
    private accountService: AccountService
  ) { }

  /**
   * Track department change in workflow
   */
  trackDepartmentChange(employeeId: number, oldDepartmentId: number, newDepartmentId: number, oldDeptName: string, newDeptName: string) {
    const currentUser = this.accountService.accountValue;
    const changedBy = currentUser ? currentUser.email : 'System';
    const timestamp = new Date().toLocaleString();
    
    // Use plain text format instead of JSON
    const details = `Employee's department changed from ${oldDeptName} (ID: ${oldDepartmentId}) to ${newDeptName} (ID: ${newDepartmentId}) by ${changedBy} on ${timestamp}`;

    const workflow = {
      employeeId: employeeId,
      type: 'DepartmentChange',
      details: details
    };

    return this.workflowService.create(workflow);
  }

  /**
   * Track request submission in workflow
   */
  trackRequestSubmission(employeeId: number, requestId: number, requestType: string) {
    const currentUser = this.accountService.accountValue;
    const createdBy = currentUser ? currentUser.email : 'System';
    const timestamp = new Date().toLocaleString();
    
    // Use plain text format
    const details = `New ${requestType} request (ID: ${requestId}) created by ${createdBy} on ${timestamp}`;

    const workflow = {
      employeeId: employeeId,
      type: 'RequestSubmission',
      details: details
    };

    return this.workflowService.create(workflow);
  }

  /**
   * Track request status update in workflow
   */
  trackRequestStatusChange(employeeId: number, requestId: number, oldStatus: string, newStatus: string, requestType: string) {
    const currentUser = this.accountService.accountValue;
    const changedBy = currentUser ? currentUser.email : 'System';
    const timestamp = new Date().toLocaleString();
    
    // Use plain text format
    const details = `${requestType} request (ID: ${requestId}) status changed from ${oldStatus} to ${newStatus} by ${changedBy} on ${timestamp}`;

    const workflow = {
      employeeId: employeeId,
      type: 'RequestStatusChange',
      details: details
    };

    return this.workflowService.create(workflow);
  }
}