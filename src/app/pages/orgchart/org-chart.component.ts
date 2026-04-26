import { Component, computed, inject, OnInit, signal, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { MessageService, TreeNode } from 'primeng/api';
import { DragDropModule } from 'primeng/dragdrop';
import { Fluid } from "primeng/fluid";
import { InputText } from "primeng/inputtext";
import { forkJoin } from 'rxjs';

import { OrgChartService } from "../../services/orgchart.service";
import { OrgChartNode } from "../../models/orgchartNode.model";
import { OrgNodeComponent } from "./org-node.component";
import { ToastMessagesComponent } from "../../components/toast-messages/toast-messages.component";

@Component({
    selector: 'app-org-chart',
    standalone: true,
    imports: [
        CommonModule, DragDropModule, OrgNodeComponent,
        Fluid, ToastMessagesComponent, InputText, NgOptimizedImage
    ],
    templateUrl: './org-chart.component.html',
    providers: [MessageService]
})
export class OrgChartComponent implements OnInit {
    private readonly orgService = inject(OrgChartService);
    private readonly messageService = inject(MessageService);
    private readonly destroyRef = inject(DestroyRef); // สำหรับจัดการ Memory

    // Signals Management
    nodes = signal<TreeNode[]>([]);
    unassignedList = signal<OrgChartNode[]>([]);
    searchQuery = signal<string>('');
    draggedEmployee = signal<OrgChartNode | null>(null);

    // Computed Logic
    filteredUnassignedList = computed(() => {
        const query = this.searchQuery().toLowerCase().trim();
        const list = this.unassignedList();
        if (!query) return list;

        return list.filter(emp =>
            emp.name?.toLowerCase().includes(query) ||
            emp.code?.toLowerCase().includes(query)
        );
    });

    unassignedCount = computed(() => this.filteredUnassignedList().length);

    ngOnInit(): void {
        this.loadBoard();
    }

    loadBoard(): void {
        // ใช้ forkJoin เพื่อโหลดข้อมูลซ้าย-ขวา ให้เสร็จพร้อมกัน
        forkJoin({
            chart: this.orgService.getRoots(),
            unassigned: this.orgService.getUnassignedEmployees()
        })
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (res) => {
                    this.nodes.set(res.chart.map(n => this.mapToTreeNode(n)));
                    this.unassignedList.set(res.unassigned);
                },
                error: (err) => this.handleError('Load Data', err)
            });
    }

    onDragUnassigned(emp: OrgChartNode): void {
        this.draggedEmployee.set(emp);
    }

    onDragEnd(): void {
        this.draggedEmployee.set(null);
    }

    dropToPosition(targetManagerId: string): void {
        const emp = this.draggedEmployee();
        if (!emp || emp.id === targetManagerId) {
            this.draggedEmployee.set(null);
            return;
        }

        this.orgService.moveEmployee(emp.id, targetManagerId)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: () => this.refreshState(),
                error: (err) => this.handleError('Move Employee', err)
            });
    }

    dropToUnassigned(): void {
        const emp = this.draggedEmployee();
        if (!emp) return;

        const isAlreadyUnassigned = this.unassignedList().some(e => e.id === emp.id);
        if (isAlreadyUnassigned) {
            this.draggedEmployee.set(null);
            return;
        }

        this.orgService.unassignEmployee(emp.id)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: () => this.refreshState(),
                error: (err) => this.handleError('Unassign Employee', err)
            });
    }

    onSearch(event: Event): void {
        const value = (event.target as HTMLInputElement).value;
        this.searchQuery.set(value);
    }

    private refreshState(): void {
        this.draggedEmployee.set(null);
        this.loadBoard();
    }

    private handleError(summary: string, err: any): void {
        console.error(summary, err);
        this.messageService.add({
            severity: 'error',
            summary: `Error: ${summary}`,
            detail: err.statusText || err.message || 'Unknown error'
        });
        this.draggedEmployee.set(null);
    }

    private mapToTreeNode(n: OrgChartNode): TreeNode {
        return {
            label: n.name,
            data: n,
            children: n.children?.map(c => this.mapToTreeNode(c)) ?? []
        };
    }
}