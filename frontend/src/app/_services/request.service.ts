import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { tap, switchMap } from 'rxjs/operators';
import { WorkflowTrackerService } from './workflow-tracker.service';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class RequestService {
    constructor(
        private http: HttpClient,
        private workflowTrackerService: WorkflowTrackerService
    ) { }

    getAll() {
        return this.http.get<any[]>(`${environment.apiUrl}/requests`);
    }

    getById(id: number) {
        return this.http.get<any>(`${environment.apiUrl}/requests/${id}`);
    }

    create(request) {
        // Use the HTTP POST to create the request
        return this.http.post<any>(`${environment.apiUrl}/requests`, request).pipe(
            // After the request is created successfully, track it
            tap(createdRequest => {
                // Make sure we have the necessary data for tracking
                if (createdRequest && createdRequest.id && createdRequest.employeeId) {
                    // Create a workflow entry for the new request
                    this.workflowTrackerService.trackRequestSubmission(
                        createdRequest.employeeId,
                        createdRequest.id,
                        createdRequest.type
                    ).subscribe({
                        next: () => console.log('Workflow updated for new request'),
                        error: error => console.error('Error tracking request submission:', error)
                    });
                } else {
                    console.error('Cannot track request submission: Missing data in created request', createdRequest);
                }
            })
        );
    }

    update(id: number, request) {
        // First get the current request data to check for status changes
        return this.getById(id).pipe(
            switchMap(currentRequest => {
                // If status has changed, create a workflow entry
                if (currentRequest.status !== request.status) {
                    this.workflowTrackerService.trackRequestStatusChange(
                        request.employeeId,
                        id,
                        currentRequest.status,
                        request.status,
                        request.type
                    ).subscribe({
                        next: () => console.log('Workflow updated for status change'),
                        error: error => console.error('Error tracking status change:', error)
                    });
                }
                
                // Continue with the request update
                return this.http.put(`${environment.apiUrl}/requests/${id}`, request);
            })
        );
    }

    delete(id: number) {
        return this.http.delete(`${environment.apiUrl}/requests/${id}`);
    }
}