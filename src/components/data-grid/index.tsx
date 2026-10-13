import React from 'react';
import { DataGrid, GridColDef, GridRowParams, GridRowsProp } from '@mui/x-data-grid';

interface ReusableGridProps {
  rows: GridRowsProp;
  columns: GridColDef[];
  pageSize?: number;
  checkboxSelection?: boolean;
  onRowClick?: (params: GridRowParams) => void;
  className?: string;
  [key: string]: unknown;
}

const ReusableDataGrid: React.FC<ReusableGridProps> = ({
  rows,
  columns,
  pageSize = 5,
  checkboxSelection = false,
  
  onRowClick,
  className = '',
  ...otherProps
}) => {
  const [paginationModel, setPaginationModel] = React.useState({
    page: 0,
    pageSize,
  });

  return (
    <div style={{ height: '100%', width: '100%' }} className={className}>
      <DataGrid
        rows={rows}
        columns={columns}
        paginationModel={paginationModel}
        onPaginationModelChange={setPaginationModel}
        checkboxSelection={checkboxSelection}
        onRowClick={onRowClick}
        {...otherProps}
        getRowClassName={(params) =>
          params.indexRelativeToCurrentPage % 2 === 0 ? 'Mui-even' : 'Mui-odd'
        }
        sx={{
          '& .MuiDataGrid-columnHeader': {
            backgroundColor: '#e5e5e5!important',
            color: '#000!important',
            fontSize: '1.2vw',
            textTransform: 'capitalize',
            textAlign: 'center',
            borderRight: '1px solid #e5e5e5',
            height: '2.5rem !important',
          },
          '& .MuiDataGrid-row': {
            backgroundColor: '',
            height: 'auto!important',
          },
          '& .MuiDataGrid-columnHeaderTitle': {
            color: '#000',
          },
          '& .MuiDataGrid-sortIcon': {
            color: 'grey',
          },
          '& .MuiDataGrid-columnHeaderTitleContainer': {
            justifyContent: 'center',
          },
          '& .MuiDataGrid-cell': {
            textAlign: 'center',
            display: 'flex',
            justifyContent: 'center!important',
          },
          '& .Mui-even MuiDataGrid-row MuiDataGrid-row--firstVisible': {
            height: 'auto!important',
          },
          '& .css-h7cjts-MuiButtonBase-root-MuiIconButton-root': {
            // border: '1px solid #e5e5e5',
            // borderRadius: '5px',
          },
          '& .MuiTablePagination-root': {},
        }}
      />
    </div>
  );
};

export default ReusableDataGrid;
