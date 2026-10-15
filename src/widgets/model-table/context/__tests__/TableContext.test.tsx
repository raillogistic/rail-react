import { describe, it, expect } from 'vitest';
import React, { act } from 'react';
import { renderHook } from '@testing-library/react';
import { TableProvider, useTable } from '../TableContext';

// Helper wrapper
const wrapper = ({ children }: { children: React.ReactNode }) => (
 <TableProvider>{children}</TableProvider>
);

describe('TableContext', () => {
 it('should initialize with default values', () => {
 const { result } = renderHook(() => useTable(), { wrapper });

 expect(result.current.pagination.page).toBe(1);
 expect(result.current.pagination.perPage).toBe(10);
 expect(result.current.quickSearch).toBe('');
 });

 it('should update pagination', () => {
 const { result } = renderHook(() => useTable(), { wrapper });

 act(() => {
 result.current.setPage(2);
 });
 expect(result.current.pagination.page).toBe(2);

 act(() => {
 result.current.setPerPage(50);
 });
 expect(result.current.pagination.perPage).toBe(50);
 expect(result.current.pagination.page).toBe(1); // Should reset to page 1
 });

 it('should update quick search and reset page', () => {
 const { result } = renderHook(() => useTable(), { wrapper });

 // Move to page 2
 act(() => {
 result.current.setPage(2);
 });

 // Apply search
 act(() => {
 result.current.setQuickSearch('test');
 });

 expect(result.current.quickSearch).toBe('test');
 expect(result.current.pagination.page).toBe(1); // Should reset to page 1
 });

 it('should update view settings', () => {
 const { result } = renderHook(() => useTable(), { wrapper });

 act(() => {
 result.current.setDensity('compact');
 result.current.setWrapCells(true);
 result.current.setColumnWidths({ username: 320 });
 });

 expect(result.current.density).toBe('compact');
 expect(result.current.wrapCells).toBe(true);
 expect(result.current.columnWidths).toEqual({ username: 320 });
 });
});
