'use client';

import React from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  VisibilityState,
} from '@tanstack/react-table';

import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  horizontalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { SlidersHorizontal, ChevronUp, ChevronDown, ChevronsUpDown, GripVertical } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';

import { useDispatch } from 'react-redux';
import { AppDispatch } from '../../store';
import { saveTablePreference } from '../../store/action/table-preference.action';
import { cn } from '@/lib/utils';

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  tableName?: string;
  preferences?: Record<string, Record<string, boolean>>;
  onRowClick?: (row: TData) => void;
  defaultVisibility?: VisibilityState;
  /** Default sorting applied on first mount (before user interaction). */
  initialSorting?: SortingState;
  scrollContainerRef?: React.Ref<HTMLDivElement>;
  afterTableContent?: React.ReactNode;
  /** Sets a minimum height for the table scroll area (default 420px). */
  minHeightPx?: number;
  /** Optional max-height for the table scroll area (CSS value). */
  scrollMaxHeight?: string;
  getRowClassName?: (row: TData) => string;
}

// ─── Draggable Header Cell ────────────────────────────────────────────────────

interface DraggableHeaderProps {
  headerId: string;
  isActions: boolean;
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}
function toPascalCase(value: unknown): React.ReactNode {
  if (typeof value !== 'string') return value as React.ReactNode;
  return value
    .toLowerCase()
    .replace(/([a-z])([A-Z])/g, '$1 $2') // split camelCase → words
    .replace(/[_\-]+/g, ' ')             // replace _ and - with space
    .replace(/\w+/g, (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
}

function DraggableHeader({ headerId, isActions, children, style, className }: DraggableHeaderProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: headerId, disabled: isActions });

  const combinedStyle: React.CSSProperties = {
    ...style,
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 50 : style?.zIndex,
  };

  return (
    <TableHead ref={setNodeRef} style={combinedStyle} className={className}>
      <div className="flex items-center w-full h-full">
        {/* Drag handle — hidden for actions column */}
        {!isActions && (
          <span
            {...attributes}
            {...listeners}
            className="mr-1 cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 shrink-0"
            title="Drag to reorder column"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="w-3.5 h-3.5" />
          </span>
        )}
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </TableHead>
  );
}

// ─── Main DataTable ───────────────────────────────────────────────────────────

export function DataTable<TData, TValue>({
  columns,
  data,
  tableName,
  preferences,
  onRowClick,
  defaultVisibility,
  initialSorting,
  scrollContainerRef,
  afterTableContent,
  minHeightPx = 420,
  scrollMaxHeight,
  getRowClassName,
}: DataTableProps<TData, TValue>) {

  const dispatch = useDispatch<AppDispatch>();

  const [sorting, setSorting] = React.useState<SortingState>(() => initialSorting ?? []);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [columnOrder, setColumnOrder] = React.useState<string[]>([]);
  const [search, setSearch] = React.useState('');
  const [isInitialized, setIsInitialized] = React.useState(false);
  const [dropdownOpen, setDropdownOpen] = React.useState(false);
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const hoverTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // LOAD PREF
  React.useEffect(() => {
    if (!tableName) return;
    const pref = preferences?.[tableName];
    if (pref && Object.keys(pref).length > 0) {
      setColumnVisibility(pref);
    } else if (!isInitialized && defaultVisibility) {
      setColumnVisibility(defaultVisibility);
    }
    setIsInitialized(true);
  }, [preferences, tableName]);

  // SAVE PREF
  const debounceRef = React.useRef<any>(null);
  React.useEffect(() => {
    if (!isInitialized || !tableName) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      dispatch(saveTablePreference({ tableName, columnConfig: columnVisibility }));
    }, 500);
    return () => clearTimeout(debounceRef.current);
  }, [columnVisibility, isInitialized, tableName, dispatch]);

  const table = useReactTable({
    data,
    columns,
    defaultColumn: { size: 150, minSize: 80, maxSize: 400 },
    state: { sorting, columnVisibility, columnOrder },
    onColumnVisibilityChange: setColumnVisibility,
    onSortingChange: setSorting,
    onColumnOrderChange: setColumnOrder,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    enableHiding: true,
    enableSorting: true,
    columnResizeMode: 'onChange',
  });

  // Init column order once columns are available
  React.useEffect(() => {
    if (columnOrder.length === 0 && columns.length > 0) {
      setColumnOrder(
        columns.map((c) => (c as any).id ?? (c as any).accessorKey ?? '')
      );
    }
  }, [columns]);

  // DnD sensors — require 8px movement to start drag (prevents accidental drags on click/sort)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setColumnOrder((prev) => {
      const oldIndex = prev.indexOf(String(active.id));
      const newIndex = prev.indexOf(String(over.id));
      if (oldIndex === -1 || newIndex === -1) return prev;
      return arrayMove(prev, oldIndex, newIndex);
    });
  };

  const allColumns = table.getAllColumns().filter(
    (col) => col.getCanHide() && !(col.columnDef as any).meta?.locked
  );
  const allVisible = allColumns.every((col) => col.getIsVisible());
  const toggleAllColumns = (value: boolean) =>
    allColumns.forEach((col) => col.toggleVisibility(value));
  const filteredColumns = allColumns.filter((col) =>
    col.id.toLowerCase().includes(search.toLowerCase())
  );

  // Hover handlers
  const handleTriggerMouseEnter = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setDropdownOpen(true);
  };
  const handleTriggerMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => setDropdownOpen(false), 150);
  };
  const handleContentMouseEnter = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
  };
  const handleContentMouseLeave = () => setDropdownOpen(false);

  if (!isInitialized) return <div className="p-4">Loading table...</div>;

  const resolvedMinHeightPx = Math.max(
    20,
    Number.isFinite(Number(minHeightPx)) ? Number(minHeightPx) : 420
  );

  return (
<div className="rounded-md border overflow-hidden [&_th]:normal-case [&_th]:font-bold [&_th]:text-slate-700 [&_th]:bg-slate-100 [&_th]:tracking-wide">
  <div
        ref={scrollContainerRef}
        className="overflow-auto max-h-[75vh] touch-pan-x touch-pan-y"
        style={{
          position: 'relative',
          minHeight: `${resolvedMinHeightPx}px`,
          maxHeight: scrollMaxHeight,
        }}
      >
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <Table
            className="overflow-visible"
            style={{ tableLayout: 'fixed', width: 'max-content', minWidth: '100%' }}
          >
            <TableHeader
              style={{ position: 'sticky', top: 0, zIndex: 30 }}
              className="bg-gray-100 normal-case"
            >
              {table.getHeaderGroups().map((headerGroup, groupIndex, headerGroups) => (
                <SortableContext
                  key={headerGroup.id}
                  items={headerGroup.headers.map((h) => h.id)}
                  strategy={horizontalListSortingStrategy}
                >
                  <TableRow key={headerGroup.id} className="bg-gray-100" style={{ height: '44px' }}>
                    {headerGroup.headers.map((header, index) => {
                      const isLast = index === headerGroup.headers.length - 1;
                      const isActions = header.column.id === 'actions';
                      const isLeafHeader = header.id === header.column.id;
                      const isLeafHeaderRow = groupIndex === headerGroups.length - 1;
                      const showColumnSettings =
                        isLeafHeaderRow && isActions && isLeafHeader && !header.isPlaceholder;
                      const actionsColWidth = 96;
                      const isHighlighted = (header.column.columnDef.meta as any)?.isHighlighted;
                      const headStyle: React.CSSProperties = {
                        height: '44px',
                        overflow: 'hidden',
                        width: isActions ? actionsColWidth : header.getSize(),
                        minWidth: isActions ? actionsColWidth : header.getSize(),
                        maxWidth: isActions ? actionsColWidth : undefined,
                        position: isActions ? 'sticky' : 'relative',
                        right: isActions ? 0 : undefined,
                        zIndex: isActions ? 30 : undefined,
                        background: isActions ? '#f3f4f6' : isHighlighted ? '#dbeafe' : undefined,
                        boxShadow: isActions ? '-8px 0 12px -12px rgba(0,0,0,0.35)' : undefined,
                      };

                      return (
                        <DraggableHeader
                          key={header.id}
                          headerId={header.id}
                          isActions={isActions}
                          style={headStyle}
                          className="relative h-[44px]"
                        >
                          {/* Resize handle */}
                          <div
                            role="separator"
                            aria-hidden
                            draggable={false}
                            onMouseDown={(e) => {
                              if (e.detail > 1) { e.preventDefault(); return; }
                              header.getResizeHandler()(e);
                            }}
                            onTouchStart={header.getResizeHandler()}
                            onDoubleClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              window.getSelection()?.removeAllRanges();
                            }}
                            className="absolute right-0 top-0 z-10 h-full flex items-center cursor-col-resize select-none"
                            style={{
                              width: '8px',
                              right: '-4px',
                              userSelect: 'none',
                              WebkitUserSelect: 'none',
                              MozUserSelect: 'none',
                              msUserSelect: 'none',
                            }}
                          >
                            <div
                              className={`w-[2px] h-4/5 rounded transition-all ${
                                header.column.getIsResizing()
                                  ? 'bg-blue-500'
                                  : 'bg-gray-300 group-hover:bg-gray-500'
                              }`}
                            />
                          </div>

                          {/* NORMAL (non-last) HEADER */}
                          {!isLast && (
                            header.isPlaceholder ? null : (
                              <div
                                className={`flex items-center gap-1 select-none ${
                                  header.column.getCanSort() ? 'cursor-pointer hover:text-gray-900' : ''
                                }`}
                                onClick={header.column.getToggleSortingHandler()}
                              >
                                {toPascalCase(flexRender(header.column.columnDef.header, header.getContext()))}
                                {header.column.getCanSort() && (
                                  header.column.getIsSorted() === 'asc' ? (
                                    <ChevronUp className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                                  ) : header.column.getIsSorted() === 'desc' ? (
                                    <ChevronDown className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                                  ) : (
                                    <ChevronsUpDown className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                  )
                                )}
                              </div>
                            )
                          )}

                          {/* LAST COLUMN = HEADER + FILTER ICON */}
                          {isLast && (
                            <div className="flex items-center justify-between w-full pr-1">
                              <div
                                className={`flex items-center gap-1 select-none ${
                                  header.column.getCanSort() ? 'cursor-pointer hover:text-gray-900' : ''
                                }`}
                                onClick={header.column.getToggleSortingHandler()}
                              >
                                {header.isPlaceholder
                                  ? null
                                  : toPascalCase(flexRender(header.column.columnDef.header, header.getContext()))}
                                {header.column.getCanSort() && (
                                  header.column.getIsSorted() === 'asc' ? (
                                    <ChevronUp className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                                  ) : header.column.getIsSorted() === 'desc' ? (
                                    <ChevronDown className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                                  ) : (
                                    <ChevronsUpDown className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                  )
                                )}
                              </div>

                              {showColumnSettings && (
                                <div className="ml-auto">
                                  <Popover modal={false} open={dropdownOpen} onOpenChange={setDropdownOpen}>
                                    <PopoverTrigger asChild>
                                      <button
                                        type="button"
                                        className="p-1 rounded hover:bg-gray-200 transition-colors"
                                        aria-label="Column visibility"
                                        onMouseEnter={handleTriggerMouseEnter}
                                        onMouseLeave={handleTriggerMouseLeave}
                                      >
                                        <SlidersHorizontal className="w-4 h-4 text-gray-600" />
                                      </button>
                                    </PopoverTrigger>
                                    <PopoverContent
                                      align="end"
                                      side="bottom"
                                      className="w-64 p-3"
                                      collisionPadding={8}
                                      onOpenAutoFocus={(e) => e.preventDefault()}
                                      onCloseAutoFocus={(e) => e.preventDefault()}
                                      onMouseEnter={handleContentMouseEnter}
                                      onMouseLeave={handleContentMouseLeave}
                                    >
                                      <input
                                        type="text"
                                        placeholder="Search columns..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="w-full border px-2 py-1 mb-2 rounded text-sm"
                                      />
                                      <label className="flex items-center gap-2 text-sm mb-2 cursor-pointer">
                                        <input
                                          type="checkbox"
                                          checked={allVisible}
                                          onChange={(e) => toggleAllColumns(e.target.checked)}
                                        />
                                        Select All
                                      </label>
                                      <div className="border-t my-2" />
                                      {filteredColumns.map((column) => (
                                        <label
                                          key={column.id}
                                          className="flex items-center gap-2 text-sm mb-1 cursor-pointer"
                                        >
                                          <input
                                            type="checkbox"
                                            checked={column.getIsVisible()}
                                            onChange={(e) => column.toggleVisibility(e.target.checked)}
                                          />
                                          {toPascalCase(column.columnDef.header as string)}
                                        </label>
                                      ))}
                                    </PopoverContent>
                                  </Popover>
                                </div>
                              )}
                            </div>
                          )}
                        </DraggableHeader>
                      );
                    })}
                  </TableRow>
                </SortableContext>
              ))}
            </TableHeader>

            <TableBody>
              {table.getRowModel().rows.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                      key={row.id}
                      style={{ height: '52px', maxHeight: '52px' }}
                      className={cn(
                        'transition cursor-pointer',
                        (row.original as any)?.id === 'total'
                          ? 'bg-[var(--brand2)] hover:bg-[var(--brand2)] font-semibold text-black border-t-2 border-gray-200'
                          : getRowClassName?.(row.original)   // ← custom class takes priority
                            ? getRowClassName(row.original)
                            : row.index % 2 === 0
                              ? 'bg-white hover:bg-blue-50'
                              : 'bg-slate-50 hover:bg-blue-50'
                      )}
                      onClick={() => onRowClick?.(row.original)}
                    >
                    {row.getVisibleCells().map((cell) => {
                      const isActions = cell.column.id === 'actions';
                      const isHighlighted = (cell.column.columnDef.meta as any)?.isHighlighted; // ← add this
                      const isTotal = (row.original as any)?.id === 'total';
                      const actionsColWidth = 96;
                      const isOverdue = !!getRowClassName?.(row.original)?.includes('overdue-row');
                      return (
                        <TableCell
                          key={cell.id}
                          style={{
                            height: '52px',
                            maxHeight: '52px',
                            overflow: 'hidden',
                            width: isActions ? actionsColWidth : cell.column.getSize(),
                            minWidth: isActions ? actionsColWidth : cell.column.getSize(),
                            maxWidth: isActions ? actionsColWidth : undefined,
                            position: isActions ? 'sticky' : undefined,
                            right: isActions ? 0 : undefined,
                            zIndex: isActions ? 20 : undefined,
                            background: isActions
                            ? isTotal
                              ? 'var(--brand2)'
                              : isOverdue
                                ? 'rgb(254,234,231)'   // ← updated
                                : row.index % 2 === 0 ? '#ffffff' : '#f8fafc'
                            : isHighlighted && !isTotal
                              ? '#eff6ff'
                              : undefined,
                            boxShadow: isActions ? '-8px 0 12px -12px rgba(0,0,0,0.35)' : undefined,
                          }}
                          className="truncate overflow-hidden whitespace-nowrap"
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="text-center py-6">
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          {afterTableContent}

          {/* Ghost overlay shown while dragging */}
          <DragOverlay dropAnimation={null}>
            {activeId ? (
              <div className="px-3 py-1.5 bg-white border border-blue-400 rounded shadow-lg text-sm font-medium text-blue-700 opacity-90 pointer-events-none whitespace-nowrap">
                ⠿ {activeId}
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
}