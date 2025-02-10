import React, { useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { Sidebar } from 'primereact/sidebar';
import { ListBox } from 'primereact/listbox';
import { ProgressSpinner } from 'primereact/progressspinner';

import { useTracked } from './../../Store';
import { currencyApiEndpoints } from './../../API';
import axios from './../../Axios';

const CurrencySidebar = (props) => {

  const [t] = useTranslation();
  
  const [state, setState] = useTracked();

  useEffect(() => {
    requestCurrencies();
  }, [state.currencies.length]);

  const requestCurrencies = useCallback(() => {
    if (state.currencies.length === 0) {
      axios.get(currencyApiEndpoints.currency, {})
        .then(response => {
          if (response.data.data.length > 0) {
            let currencyId = parseInt(state.user.currency_id, 10);
            let currency = response.data.data.find(el => el.id === currencyId);
            setState(prev => ({ ...prev, currencies: response.data.data, currentCurrency: currency }));
          }
        })
        .catch(error => {
          console.log(error);
        });
    }
  }, [state.currencies.length]);

  return (
    <Sidebar visible={props.visible} position="right" onHide={props.onHide} style={{ width: '345px' }}>
      <h1 className="p-card-title">{t('Currencies')}</h1>
      {
        state.currencies.length === 0 ?
          <div className="p-grid p-justify-center p-align-center" style={{ height: '86vh' }}>
            <ProgressSpinner style={{ height: '35px' }} strokeWidth={'4'} />
          </div>
          :
          <ListBox
            value={state.currentCurrency}
            filter={true}
            filterBy="currency_code,country"
            options={state.currencies}
            dataKey="currency_code"
            optionLabel="currency_code"
            onChange={(e) => {
              if (e.value)
                setState(prev => ({ ...prev, currentCurrency: e.value }));
            }}
            itemTemplate={(item) => {
              return (
                <div className="p-clearfix">
                  <span className="color-highlight text-bold">{item.currency_code}</span> 
                  {' '}
                  <span className="word-break" style={{ fontSize: '12px', fontWeight: 'bold' }}>{item.country}</span>
                </div>
              )
            }}
            listStyle={{ maxHeight: '86vh' }}
            style={{ width: '100%' }}
          />
      }
    </Sidebar>
  );
}

export default React.memo(CurrencySidebar);
