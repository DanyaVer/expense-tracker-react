import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import * as dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Messages } from 'primereact/messages';

import axios from './../../Axios';
import { receiptApiEndpoints } from './../../API';

let messages;

const ReceiptDetails = (props) => {
  const { t } = useTranslation();
  const [receipt, setReceipt] = useState(null);

  useEffect(() => {
    axios
      .get(receiptApiEndpoints.receipt + '/' + props.match.params.receipt_id)
      .then(response => {
        setReceipt(response.data);
      })
      .catch(error => {
        console.error(error);
      });
  }, [props.match.params.receipt_id]);

  if (!receipt) {
    return <div>{t("Loading...")}</div>;
  }

  return (
    <div>
      <Helmet title={t("Receipt Details")} />
      <Messages ref={(el) => messages = el} />
      <Card className="rounded-border">
        <div className="p-card-title p-grid p-nogutter p-justify-between">{t("Receipt Details")}</div>
        <div className="p-card-subtitle">{t("Receipt")}: {receipt.receipt_number}</div>
        <div>
          <p><strong>{t("Date")}: </strong> {dayjs(receipt.date).format("YYYY-MM-DD")}</p>
          <p><strong>{t("Total")}: </strong> {receipt.total}</p>
          <p><strong>{t("Store")}: </strong> {receipt.store}</p>
        </div>
        <hr />
        <div className="p-card-title">{t("Expenses")}</div>
        { receipt.expenses && receipt.expenses.length > 0 ? (
          <DataTable value={receipt.expenses} responsive={true}>
            <Column field="id" header={t("ID")} sortable={true} />
            <Column field="spent_on" header={t("Spent On")} sortable={true} />
            <Column 
              field="amount" 
              header={t("Amount")} 
              body={(rowData) => rowData.amount.toLocaleString()} 
              sortable={true} 
            />
            <Column 
              field="transaction_date" 
              header={t("Date")} 
              body={(rowData) => dayjs(rowData.transaction_date).format("YYYY-MM-DD HH:mm")} 
              sortable={true} 
            />
            <Column field="remarks" header={t("Remarks")} />
            <Column 
              header={t("Action")}
              body={(rowData) => (
                <Button
                  label={t("Edit Expense")}
                  icon="pi pi-pencil"
                  onClick={() => props.history.push(`/expense/${rowData.id}/edit`)}
                  className="p-button-raised p-button-info  p-button-rounded"
                />
              )}
            />
          </DataTable>
        ) : (
          <p>{t("No expenses found for this receipt.")}</p>
        )}
      </Card>
    </div>
  );
};

export default ReceiptDetails;
