import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import * as dayjs from 'dayjs';
import Swal from 'sweetalert2';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { Messages } from 'primereact/messages';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { ProgressSpinner } from 'primereact/progressspinner';

import axios from './../../Axios';
import { receiptApiEndpoints } from './../../API';

const StyledSwal = Swal.mixin({
  customClass: {
    container: 'container-class',
    popup: 'popup-class',
    header: 'header-class',
    title: 'p-card-title',
    content: 'content-class',
    closeButton: 'close-button-class',
    image: 'image-class',
    input: 'input-class',
    actions: 'actions-class',
    confirmButton: 'p-button p-button-raised p-button-danger p-button-text-icon-left',
    cancelButton: 'p-button p-button-raised p-button-info p-button-text-icon-left',
    footer: 'footer-class'
  },
  buttonsStyling: false
});

let messages;

const Receipt = (props) => {
  const { t } = useTranslation();
  
  const [datatable, setDatatable] = useState({
    sortField: 'id',
    sortOrder: -1,
    rowsPerPage: 5,
    currentPage: 1
  });
  
  const [receipts, setReceipts] = useState({
    receipts: {},
    fetching: true
  });

  useEffect(() => {
    requestReceipts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [datatable]);

  const requestReceipts = async () => {
    setReceipts(prev => ({ ...prev, fetching: true }));
    await axios.get(
      receiptApiEndpoints.receipt +
        '?page=' + datatable.currentPage +
        '&sort_col=' + datatable.sortField +
        '&per_page=' + datatable.rowsPerPage +
        '&sort_order=' + (datatable.sortOrder > 0 ? 'asc' : 'desc')
    )
    .then(response => {
      if (response.data.data) {
        setReceipts({
          receipts: response.data,
          fetching: false
        });
      } else {
        setReceipts({
          receipts: {},
          fetching: false
        });
      }
    })
    .catch(error => {
      console.error(error);
      setReceipts(prev => ({ ...prev, fetching: false }));
    });
  };

  const deleteReceipt = (receiptData) => {
    StyledSwal.fire({
      title: t('Are you sure?'),
      text: `${t("Confirm to delete receipt")} ${receiptData.receipt_number}.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: `<span class="pi pi-trash p-button-icon-left"></span><span class="p-button-text">${t("Delete")}</span>`,
      cancelButtonText: `<span class="pi pi-ban p-button-icon-left"></span><span class="p-button-text">${t("No")}</span>`,
      focusConfirm: false,
      focusCancel: true
    }).then((result) => {
      if (result.value) {
        axios.delete(receiptApiEndpoints.receipt + '/' + receiptData.id)
          .then(response => {
            if (response.status === 200) {
              requestReceipts();
              messages.show({
                severity: 'success',
                detail: t('Receipt') + ' ' + receiptData.receipt_number + ' ' + t('deleted successfully.'),
                sticky: false,
                closable: false,
                life: 5000
              });
            }
          })
          .catch(error => {
            if (error.response && error.response.status === 401) {
              messages.clear();
              messages.show({
                severity: 'error',
                detail: t('Something went wrong. Try again.'),
                sticky: true,
                closable: true,
                life: 5000
              });
            }
          });
      }
    });
  };

  return (
    <div>
      <Helmet title={t("Receipts")} />
      
      <div className="p-grid p-nogutter">
        <div className="p-col-12">
          <Messages ref={el => messages = el} />
        </div>
      </div>
      
      <Card className="rounded-border">
        <div className="p-grid">
          <div className="p-col-6">
            <div className="p-card-title">{t("Receipts")}</div>
            <div className="p-card-subtitle">{t("List of receipts with related expenses.")}</div>
          </div>
          <div className="p-col-6" style={{ textAlign: 'right' }}>
            <Link to="/receipt/create">
              <Button label={t("Add Receipt")} icon="pi pi-plus" className="p-button-raised" />
            </Link>
          </div>
        </div>
        <br />
        {receipts.fetching ? (
          <div style={{ textAlign: 'center' }}>
            <ProgressSpinner style={{ height: '25px', width: '25px' }} strokeWidth="4" />
          </div>
        ) : ''}
        <DataTable
          value={receipts.receipts.data}
          sortField={datatable.sortField}
          sortOrder={datatable.sortOrder}
          paginator={true}
          rows={datatable.rowsPerPage}
          rowsPerPageOptions={[5, 10, 20]}
          totalRecords={receipts.receipts.total}
          lazy={true}
          first={(receipts.receipts.from || 1) - 1}
          onPage={(e) => {
            setDatatable({
              ...datatable,
              currentPage: e.page + 1,
              rowsPerPage: e.rows,
            });
          }}
          onSort={(e) => {
            setDatatable({
              ...datatable,
              sortField: e.sortField,
              sortOrder: e.sortOrder,
            });
          }}
          className="text-center custom-table"
        >
          <Column field="id" header={t("Serial")} sortable={true} />
          <Column field="receipt_number" header={t("Receipt Number")} sortable={true} />
          <Column 
            field="date" 
            header={t("Date")} 
            sortable={true} 
            body={(rowData) => dayjs(rowData.date).format("YYYY-MM-DD")} 
          />
          <Column 
            field="total" 
            header={t("Total")} 
            sortable={true} 
            body={(rowData) => rowData.total.toLocaleString()} 
          />
          <Column field="store" header={t("Store")} sortable={true} />
          <Column field="payment_type" header={t("Payment")} sortable={true} />
          <Column 
            header={t("Action")}
            body={(rowData) => (
              <div style={{ display: 'flex', justifyContent: 'center', gap: 5, flexWrap: 'wrap' }}>
                <Link to={`/receipt/${rowData.id}`}>
                  <Button label={t("View")} icon="pi pi-eye" className="p-button-raised p-button-info p-button-rounded" />
                </Link>
                <Link to={`/receipt/${rowData.id}/edit`}>
                  <Button label={t("Edit")} icon="pi pi-pencil" className="p-button-raised p-button-warning p-button-rounded" />
                </Link>
                <Button 
                  label={t("Delete")} 
                  icon="pi pi-trash" 
                  className="p-button-raised p-button-danger p-button-rounded" 
                  onClick={() => deleteReceipt(rowData)}
                />
              </div>
            )}
            style={{ textAlign: 'center', width: 'auto' }}
          />
        </DataTable>
      </Card>
    </div>
  );
};

export default Receipt;
