import React from 'react';
import { Card } from 'primereact/card';
import * as dayjs from 'dayjs';

const ReceiptListItem = (props) => {
  const { itemDetail } = props;

  return (
    <Card>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: 16 }}>
          {itemDetail.receipt_number}
          <div className="color-title">{itemDetail.total.toLocaleString()}</div>
        </div>
        <div className="color-link" style={{ fontSize: 12 }}>
          {itemDetail.store}
        </div>
        <div className="color-title" style={{ fontSize: 12 }}>
          {dayjs(itemDetail.date).format('YYYY-MM-DD')}
        </div>
      </div>
    </Card>
  );
};

export default React.memo(ReceiptListItem);
